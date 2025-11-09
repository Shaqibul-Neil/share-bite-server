const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//firebase
//firebase middleware

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
    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send({ success: true, result });
    });
    //**************post a food**************
    app.post("/foods", async (req, res) => {
      const newFood = req.body;
      const result = await foodsCollection.insertOne(newFood);
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
    //************post a request**************
    app.post("/requests", async (req, res) => {
      const newRequest = req.body;
      const result = await requestCollection.insertOne(newRequest);
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
