const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const admin = require("firebase-admin");
const serviceAccount = require("./share-bite-f380a-firebase-adminsdk.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//middleware
app.use(cors());
app.use(express.json());

//firebase middleware
const verifyFirebaseToken = async (req, res, next) => {
  if (!req.headers.authorization)
    return res.status(401).send({ message: "Unauthorized Access" });
  const token = req.headers.authorization.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .send({ message: "Unauthorized Access : No token Found" });

  //verify token
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.token_email = userInfo.email;
  } catch {
    return res
      .status(401)
      .send({ message: "Unauthorized Access : Token Not Verified" });
  }
  next();
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clustersharebite.si3xkac.mongodb.net/?appName=ClusterShareBite`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //database creation
    const db = client.db("shareBiteDB");
    const foodsCollection = db.collection("foods");
    const requestCollection = db.collection("requests");

    //***************All Apis***************
    //***********Foods Related Api***********
    //************get all foods**************
    app.get("/foods", async (req, res) => {
      const cursor = foodsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    //************get food on quantity**************
    app.get("/food-quantity", async (req, res) => {
      const cursor = foodsCollection
        .find()
        .sort({ food_quantity: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    //************get available foods**************
    app.get("/available-foods", async (req, res) => {
      const result = await foodsCollection
        .find({ food_status: "Available" })
        .toArray();
      res.send(result);
    });
    //**************get food details**************
    app.get("/food/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send({ success: true, result });
    });
    //************get my foods**************
    app.get("/my-foods", verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      if (email !== req.token_email)
        return res.status(403).send({ message: "Forbidden Access" });
      const result = await foodsCollection
        .find({ "donator.email": email })
        .toArray();
      res.send(result);
    });
    //**************post a food**************
    app.post("/foods", verifyFirebaseToken, async (req, res) => {
      const newFood = req.body;
      const result = await foodsCollection.insertOne(newFood);
      res.send({ success: true, result });
    });
    //**************update a food**************
    app.put("/update-food/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const updateFood = req.body;
      if (updateFood?.donator?.email !== req.token_email)
        return res
          .status(403)
          .send({ message: "Forbidden: You cannot update this food" });
      console.log(updateFood.donator.email);
      const query = { _id: new ObjectId(id) };
      const options = {};
      const update = { $set: updateFood };
      const result = await foodsCollection.updateOne(query, update, options);
      res.send({ success: true, result });
    });
    //**************delete a food**************
    app.delete("/my-foods/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      //checking if the donator email is same or not
      const food = await foodsCollection.findOne({ _id: new ObjectId(id) });
      if (food?.donator?.email !== req.token_email)
        return res
          .status(403)
          .send({ message: "Forbidden: You cannot delete this food" });
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      res.send({ success: true, result });
    });
    //**************Request Food Api**************
    //************get all request**************
    app.get("/requests", async (req, res) => {
      const cursor = requestCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    //************get request on food**************
    app.get("/requests/food/:foodID", async (req, res) => {
      const foodId = req.params.foodID;
      const query = { foodId: foodId };
      const cursor = requestCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    //************get my request**************
    app.get("/my-requests", verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      if (email !== req.token_email)
        return res.status(403).send({ message: "Forbidden Access" });
      const result = await requestCollection
        .find({ requestor_email: email })
        .toArray();
      res.send(result);
    });
    //************post a request**************
    app.post("/requests", verifyFirebaseToken, async (req, res) => {
      const newRequest = req.body;
      if (newRequest?.requestor_email !== req.token_email)
        return res
          .status(403)
          .send({ message: "Forbidden: Invalid requestor" });
      const result = await requestCollection.insertOne(newRequest);
      res.send({ success: true, result });
    });

    //**************delete a request**************
    app.delete("/my-requests/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      //check if the requestor is same
      const requestor = await requestCollection.findOne(query);
      if (requestor?.requestor_email !== req.token_email)
        return res
          .status(403)
          .send({ message: "Forbidden: You cannot delete this request" });
      const result = await requestCollection.deleteOne(query);
      res.send({ success: true, result });
    });
    //**************accept a request**************
    app.patch("/requests/accept/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const { foodId } = req.body;
      //checking if the donor is same
      const food = await foodsCollection.findOne({ _id: new ObjectId(foodId) });
      if (food?.donator?.email !== req.token_email)
        return res
          .status(403)
          .send({ message: "Forbidden: Only donator can accept" });
      //update request status
      const reqResult = await requestCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "Accepted" } }
      );
      //update food status
      const foodResult = await foodsCollection.updateOne(
        { _id: new ObjectId(foodId) },
        { $set: { food_status: "Donated" } }
      );
      res.send({ success: true, reqResult, foodResult });
    });

    //**************reject a request**************
    app.patch("/requests/reject/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const { foodId } = req.body;
      //checking if the donor is same
      const food = await foodsCollection.findOne({ _id: new ObjectId(foodId) });
      if (food?.donator?.email !== req.token_email)
        return res
          .status(403)
          .send({ message: "Forbidden: Only donator can reject" });
      const result = await requestCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "Rejected" } }
      );
      res.send({ success: true, result });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

//server created
app.get("/", (req, res) => {
  res.send("ShareBite Server Created Successfully");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
