const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const foodsController = require("../controllers/foodsController");

router.get("/", foodsController.getAllFoods);
router.get("/food-quantity", foodsController.getFoodByQuantity);
router.get("/available-foods", foodsController.getAvailableFoods);
router.get("/my-foods", verifyFirebaseToken, foodsController.getMyFoods);
router.get(
  "/my-food-stats",
  verifyFirebaseToken,
  foodsController.getMyFoodStats
);
router.get(
  "/my-chart",
  verifyFirebaseToken,
  foodsController.getMyFoodChartData
);
router.get("/my-score", verifyFirebaseToken, foodsController.getMyScore);
router.post("/", verifyFirebaseToken, foodsController.addFood);
router.put("/update-food/:id", verifyFirebaseToken, foodsController.updateFood);
router.delete("/my-foods/:id", verifyFirebaseToken, foodsController.deleteFood);
router.get("/:id", foodsController.getFoodDetails);

module.exports = router;
