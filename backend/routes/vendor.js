const express = require("express");
const router = express.Router();
const {
    registerVendor,
    getMyVendorProfile,
    getNearbyVendors,
    toggleProductAvailability,
    rateVendor,
} = require("../controllers/vendorController");
const { protect, vendorOnly } = require("../middleware/auth");

router.post("/register", protect, registerVendor);
router.get("/me", protect, vendorOnly, getMyVendorProfile);
router.get("/nearby", getNearbyVendors);
router.put("/product/:id/toggle", protect, vendorOnly, toggleProductAvailability);

// user vendor ko rate kare
router.post("/:id/rate", protect, rateVendor);

module.exports = router;