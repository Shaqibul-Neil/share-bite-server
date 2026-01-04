const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const requestsController = require("../controllers/requestsController");

router.get("/", requestsController.getAllRequests);
router.get("/food/:foodID", requestsController.getRequestsForFood);
router.get(
  "/my-requests",
  verifyFirebaseToken,
  requestsController.getMyRequests
);
router.get("/my-stats", verifyFirebaseToken, async (req, res) => {
  try {
    const email = req.query.email;

    // Token email check
    if (email !== req.token_email)
      return res.status(403).send({ message: "Forbidden Access" });

    // Controller function call
    const stats = await requestsController.getUserRequestStats(email);

    // Array object convert
    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.send({ success: true, stats: formattedStats });
  } catch (err) {
    //console.error(err);
    res.status(500).send({ success: false, message: "Server Error" });
  }
});
router.get(
  "/latest",
  verifyFirebaseToken,
  requestsController.getLatestRequests
);
router.post("/", verifyFirebaseToken, requestsController.addRequest);
router.delete(
  "/my-requests/:id",
  verifyFirebaseToken,
  requestsController.deleteRequest
);
router.patch(
  "/accept/:id",
  verifyFirebaseToken,
  requestsController.acceptRequest
);
router.patch(
  "/reject/:id",
  verifyFirebaseToken,
  requestsController.rejectRequest
);

module.exports = router;
