const express = require("express");
const router = express.Router();
const { getTopRankings } = require("../controllers/rankingsController");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

// GET top users
router.get("/top", verifyFirebaseToken, getTopRankings);

module.exports = router;
