const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

// Create new user
router.post("/", userController.createUser);

// Update user info by email
router.patch("/email", verifyFirebaseToken, userController.updateUser);

module.exports = router;
