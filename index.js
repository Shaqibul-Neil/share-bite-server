const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//firebase
//firebase middleware

//server created
app.get("/", (req, res) => {
  res.send("ShareBite Server Created Successfully");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
