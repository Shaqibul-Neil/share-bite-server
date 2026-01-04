const express = require("express");
const router = express.Router();
const {
  getTopRankings,
  getMyScore,
} = require("../controllers/rankingsController");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

// GET top users
router.get("/top", verifyFirebaseToken, getTopRankings);
router.get("/my-score", verifyFirebaseToken, getMyScore);

module.exports = router;
