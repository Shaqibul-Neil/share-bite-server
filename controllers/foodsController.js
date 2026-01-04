const { db } = require("../utils/db");
const { ObjectId } = require("mongodb");
const foodsCollection = db.collection("foods");
const rankingsCollection = db.collection("userRankings");
const requestCollection = db.collection("requests");

// Get all foods
const getAllFoods = async (req, res) => {
  const result = await foodsCollection.find().toArray();
  res.send(result);
};

// Get top 8 by quantity
const getFoodByQuantity = async (req, res) => {
  const result = await foodsCollection
    .find()
    .sort({ food_quantity: -1 })
    .limit(8)
    .toArray();
  res.send(result);
};

// Get available foods
const getAvailableFoods = async (req, res) => {
  const search = req.query.search || "";
  const limit = parseInt(req.query.limit) || 8;
  const skip = parseInt(req.query.skip) || 0;

  const query = {
    food_status: "Available",
    food_name: { $regex: search, $options: "i" }, // case-insensitive search
  };

  const total = await foodsCollection.countDocuments(query);
  const foods = await foodsCollection
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();

  res.send({ foods, total });
};

// Get food details
const getFoodDetails = async (req, res) => {
  const id = req.params.id;
  const result = await foodsCollection.findOne({ _id: new ObjectId(id) });
  res.send({ success: true, result });
};

// Get my foods
const getMyFoods = async (req, res) => {
  const email = req.query.email;
  if (email !== req.token_email)
    return res.status(403).send({ message: "Forbidden Access" });

  const result = await foodsCollection
    .find({ "donator.email": email })
    .toArray();
  //console.log("my foods", result);
  res.send(result);
};

// Get last 6 food donations of logged-in donor
const getMyFoodChartData = async (req, res) => {
  const email = req.query.email;
  if (email !== req.token_email)
    return res.status(403).send({ message: "Forbidden Access" });

  try {
    const foods = await foodsCollection
      .find({ "donator.email": email })
      .sort({ createdAt: -1 }) // latest first
      .limit(6)
      .toArray();

    res.send({ success: true, foods });
  } catch (err) {
    res.status(500).send({ success: false });
  }
};

//add food
const addFood = async (req, res) => {
  try {
    const email = req.token_email;
    const newFood = {
      ...req.body,
      donator: {
        ...req.body.donator,
        email: email,
      },
      donationDate: new Date().toISOString().split("T")[0], // "YYYY-MM-DD"
      donationTime: new Date().toLocaleTimeString(),
      createdAt: new Date(),
    };

    const result = await foodsCollection.insertOne(newFood);

    // Calculate impact score
    await rankingsCollection.updateOne(
      { email },
      {
        $inc: { shareBiteScore: 100 },
        $set: {
          email,
          name: req.body?.donator?.name,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );
    res.send({ success: true, result, shareBiteScore });
  } catch (err) {
    //console.error(err);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

// Get only this user's shareBiteScore
const getMyScore = async (req, res) => {
  try {
    const email = req.token_email;
    const userScore = await rankingsCollection.findOne({ email });
    res.send({ success: true, shareBiteScore: userScore?.shareBiteScore || 0 });
  } catch (err) {
    //console.error(err);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

// Update food
const updateFood = async (req, res) => {
  const id = req.params.id;
  const updateFood = req.body;

  if (updateFood?.donator?.email !== req.token_email)
    return res
      .status(403)
      .send({ message: "Forbidden: Cannot update this food" });

  const result = await foodsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateFood }
  );

  res.send({ success: true, result });
};

// Delete food
const deleteFood = async (req, res) => {
  const id = req.params.id;
  const food = await foodsCollection.findOne({ _id: new ObjectId(id) });

  if (food?.donator?.email !== req.token_email)
    return res
      .status(403)
      .send({ message: "Forbidden: Cannot delete this food" });

  const result = await foodsCollection.deleteOne({ _id: new ObjectId(id) });
  res.send({ success: true, result });
};

const getMyFoodStats = async (req, res) => {
  const email = req.query.email;
  if (email !== req.token_email)
    return res.status(403).send({ message: "Forbidden Access" });

  try {
    // MongoDB aggregation
    const stats = await foodsCollection
      .aggregate([
        { $match: { "donator.email": email } }, // only my foods
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 }, // total food items
            totalServings: { $sum: "$food_quantity" }, // sum of quantity
          },
        },
      ])
      .toArray();

    // Previously No Food
    const result = stats[0] || { totalDonations: 0, totalServings: 0 };
    res.send({ success: true, stats: result });
  } catch (err) {
    //console.error(err);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

module.exports = {
  getAllFoods,
  getFoodByQuantity,
  getAvailableFoods,
  getFoodDetails,
  getMyFoods,
  addFood,
  updateFood,
  deleteFood,
  getMyFoodStats,
  getMyScore,
  getMyFoodChartData,
};
