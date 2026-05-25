const express = require("express");
const router = express.Router();
const Vendor = require("../models/vendor");
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

router.get("/check-phone", async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ phone: req.query.phone });
        res.status(200).json({ exists: !!vendor });
    } catch (err) {
        res.status(500).json({ exists: false });
    }
});

// user vendor ko rate kare
router.post("/:id/rate", protect, rateVendor);

module.exports = router;