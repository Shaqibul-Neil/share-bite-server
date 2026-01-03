const { db } = require("../utils/db");
const rankingsCollection = db.collection("userRankings");

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

module.exports = { getTopRankings };
