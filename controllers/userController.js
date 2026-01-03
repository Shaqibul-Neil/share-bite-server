const { db } = require("../utils/db");
const { ObjectId } = require("mongodb");

const usersCollection = db.collection("users");

// Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, image } = req.body;
    if (!email || !name) {
      return res
        .status(400)
        .send({ success: false, message: "Name and email are required" });
    }
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.send({
        success: true,
        message: "User already exists",
        user: existingUser,
      });
    }

    const newUser = {
      name,
      email,
      image: image || "",
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    res.send({ success: true, user: newUser });
  } catch (err) {
    //console.error(err);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

// Update user info
const updateUser = async (req, res) => {
  const { name, image, email } = req.body;
  if (email !== req.token_email)
    return res.status(403).send({ message: "Forbidden Access" });

  try {
    const result = await usersCollection.updateOne(
      { email }, // filter by email
      { $set: { name, image, lastUpdated: new Date() } } // update name & image only
    );

    res.send({ success: true, ...result });
  } catch (err) {
    //console.error(err);
    res.status(500).send({ success: false, message: "Failed to update user" });
  }
};

module.exports = {
  createUser,
  updateUser,
};
