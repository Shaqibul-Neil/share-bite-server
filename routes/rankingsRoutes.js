const express = require("express");
const router = express.Router();
const {
  getTopRankings,
  getMyScore,
  getTopDonorWithMeals,
  getImpactStats,
} = require("../controllers/rankingsController");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

// GET top users
router.get("/top", verifyFirebaseToken, getTopRankings);
router.get("/my-score", verifyFirebaseToken, getMyScore);
router.get("/top-donor", getTopDonorWithMeals);
router.get("/area-impact", getImpactStats);

module.exports = router;
