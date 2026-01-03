const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { client } = require("./utils/db");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// Routes
const foodsRoutes = require("./routes/foodsRoutes");
const requestsRoutes = require("./routes/requestsRoutes");
const rankingsRoutes = require("./routes/rankingsRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/users", userRoutes);
app.use("/foods", foodsRoutes);
app.use("/requests", requestsRoutes);
app.use("/rankings", rankingsRoutes);

app.get("/", (req, res) => {
  res.send("ShareBite Server Created Successfully");
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    //await client.connect();
    console.log("Connected to MongoDB");
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error(err);
  }
}

startServer();
