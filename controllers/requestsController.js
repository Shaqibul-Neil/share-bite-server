const { db } = require("../utils/db");
const { ObjectId } = require("mongodb");
const requestCollection = db.collection("requests");
const foodsCollection = db.collection("foods");
const rankingsCollection = db.collection("userRankings");

// Get all requests
const getAllRequests = async (req, res) => {
  const result = await requestCollection.find().toArray();
  res.send(result);
};

// Get requests for specific food
const getRequestsForFood = async (req, res) => {
  const foodId = req.params.foodID;
  const result = await requestCollection.find({ foodId }).toArray();
  res.send(result);
};

// Get my requests
const getMyRequests = async (req, res) => {
  const email = req.query.email;
  if (email !== req.token_email)
    return res.status(403).send({ message: "Forbidden Access" });

  const result = await requestCollection
    .find({ requestor_email: email })
    .toArray();
  res.send(result);
};

// Get latest 3 requests for a user
const getLatestRequests = async (req, res) => {
  try {
    const email = req.query.email;

    if (email !== req.token_email) {
      return res.status(403).send({ message: "Forbidden Access" });
    }

    const latestRequests = await requestCollection
      .find({ requestor_email: email })
      .sort({ donationDate: -1, donationTime: -1 }) // newest first
      .limit(3)
      .toArray();
    console.log(latestRequests);
    res.send(latestRequests);
  } catch (error) {
    console.error("Error fetching latest requests:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Post a request
const addRequest = async (req, res) => {
  const newRequest = {
    ...req.body,
    donationDate: new Date().toISOString().split("T")[0],
    donationTime: new Date().toLocaleTimeString(),
    createdAt: new Date(),
  };
  if (newRequest?.requestor_email !== req.token_email)
    return res.status(403).send({ message: "Forbidden: Invalid requestor" });

  const result = await requestCollection.insertOne(newRequest);
  // Update food stats
  await foodsCollection.updateOne(
    { _id: new ObjectId(newRequest.foodId) },
    { $inc: { "request_stats.Pending": 1 } } // increment pending count
  );
  // score update for request
  await rankingsCollection.updateOne(
    { email: newRequest.requestor_email },
    {
      $inc: { shareBiteScore: 5 },
      $set: { lastUpdated: new Date() },
    },
    { upsert: true }
  );
  res.send({ success: true, result });
};

// Delete a request
const deleteRequest = async (req, res) => {
  const id = req.params.id;
  const requestor = await requestCollection.findOne({ _id: new ObjectId(id) });

  if (requestor?.requestor_email !== req.token_email)
    return res
      .status(403)
      .send({ message: "Forbidden: Cannot delete this request" });

  const result = await requestCollection.deleteOne({ _id: new ObjectId(id) });
  res.send({ success: true, result });
};

// Accept request
const acceptRequest = async (req, res) => {
  const id = req.params.id;
  const { foodId } = req.body;
  const food = await foodsCollection.findOne({ _id: new ObjectId(foodId) });

  if (food?.donator?.email !== req.token_email)
    return res
      .status(403)
      .send({ message: "Forbidden: Only donator can accept" });

  const reqResult = await requestCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "Accepted" } }
  );
  // Update food stats
  await foodsCollection.updateOne(
    { _id: new ObjectId(foodId) },
    {
      $inc: { "request_stats.Pending": -1, "request_stats.Accepted": 1 },
      $set: { food_status: "Donated" },
    }
  );

  const foodResult = await foodsCollection.updateOne(
    { _id: new ObjectId(foodId) },
    { $set: { food_status: "Donated" } }
  );

  res.send({ success: true, reqResult, foodResult });
};

// Reject request
const rejectRequest = async (req, res) => {
  const id = req.params.id;
  const { foodId } = req.body;
  const food = await foodsCollection.findOne({ _id: new ObjectId(foodId) });

  if (food?.donator?.email !== req.token_email)
    return res
      .status(403)
      .send({ message: "Forbidden: Only donator can reject" });

  const result = await requestCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "Rejected" } }
  );
  await foodsCollection.updateOne(
    { _id: new ObjectId(foodId) },
    { $inc: { "request_stats.Pending": -1, "request_stats.Rejected": 1 } }
  );

  res.send({ success: true, result });
};

const getUserRequestStats = async (email) => {
  const stats = await requestCollection
    .aggregate([
      { $match: { requestor_email: email } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])
    .toArray();

  return stats; // [{ _id: "Pending", count: 3 }, ...]
};

module.exports = {
  getAllRequests,
  getRequestsForFood,
  getMyRequests,
  addRequest,
  deleteRequest,
  acceptRequest,
  rejectRequest,
  getUserRequestStats,
  getLatestRequests,
};
