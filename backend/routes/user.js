const express = require("express");
const router = express.Router();
const { setPriceAlert, getMyAlerts, toggleFavourite, getFavourites, updateProfile, getMyRatings, getMyReports } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.post("/set-alert", protect, setPriceAlert);
router.get("/my-alerts", protect, getMyAlerts);

// favourites
router.post("/favourite/:id", protect, toggleFavourite);
router.get("/favourites", protect, getFavourites);

router.put("/update-profile", protect, updateProfile);

router.get("/my-ratings", protect, getMyRatings);

router.get("/my-reports", protect, getMyReports);

module.exports = router;