const { db } = require("../utils/db");
const rankingsCollection = db.collection("userRankings");
const foodsCollection = db.collection("foods");
const usersCollection = db.collection("users");

// Get top N users by shareBiteScore
const getTopRankings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3; // default top 3
    const topUsers = await rankingsCollection
      .find({})
      .sort({ shareBiteScore: -1 }) // descending order
      .limit(limit)
      .toArray();

    // Optional: only send necessary fields
    const result = topUsers.map((user) => ({
      name: user.name,
      email: user.email,
      shareBiteScore: user.shareBiteScore || 0,
    }));

    res.send({ success: true, topUsers: result });
  } catch (err) {
    //console.error(err);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};
//users score
const getMyScore = async (req, res) => {
  try {
    const email = req.token_email;

    const user = await rankingsCollection.findOne(
      { email },
      { projection: { _id: 0, shareBiteScore: 1 } }
    );

    res.send({
      success: true,
      shareBiteScore: user?.shareBiteScore || 0,
    });
  } catch {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

//monthly top donor
const getTopDonorWithMeals = async (req, res) => {
  try {
    // Current month start & end
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Aggregate foods this month by donator
    const mealsAgg = await foodsCollection
      .aggregate([
        {
          $match: {
            donationDate: {
              $gte: startOfMonth.toISOString().split("T")[0],
              $lt: endOfMonth.toISOString().split("T")[0],
            },
          },
        },
        {
          $group: {
            _id: "$donator.email",
            totalMeals: { $sum: "$food_quantity" },
          },
        },
        { $sort: { totalMeals: -1 } }, // descending
        { $limit: 1 }, // top donor
      ])
      .toArray();

    if (!mealsAgg.length) return res.send({ success: true, donor: null });

    const topDonorEmail = mealsAgg[0]._id;

    // Fetch user profile
    const userProfile = await usersCollection.findOne(
      { email: topDonorEmail },
      { projection: { _id: 0, image: 1, name: 1 } }
    );

    res.send({
      success: true,
      donor: {
        name: userProfile?.name || "Top Donor",
        image: userProfile?.image || null,
        totalMeals: mealsAgg[0]?.totalMeals || 0,
      },
    });
  } catch (err) {
    console.error("Top donor this month error:", err);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

//area wise ranking
const getImpactStats = async (req, res) => {
  try {
    const stats = await foodsCollection
      .aggregate([
        {
          $group: {
            _id: null,
            totalMeals: { $sum: "$food_quantity" }, // Add total meals
            areasReached: { $addToSet: "$pickup_location" }, // unique area list
          },
        },
        {
          $project: {
            _id: 0,
            totalMeals: 1,
            totalAreas: { $size: "$areasReached" }, // unique area count
          },
        },
      ])
      .toArray();

    res.send({
      success: true,
      stats: stats[0] || { totalMeals: 0, totalAreas: 0 },
    });
  } catch (err) {
    console.error("Error fetching impact stats:", err);
    res.status(500).send({ success: false, message: "Server Error" });
  }
};

module.exports = {
  getTopRankings,
  getMyScore,
  getTopDonorWithMeals,
  getImpactStats,
};
