const express = require("express");
const router = express.Router();
const {
    getStats,
    getAllUsers,
    banUser,
    unbanUser,
    getAllVendors,
    verifyVendor,
    unverifyVendor,
    banVendor,
    unbanVendor,
    getVendorActivity,
    getReportedProducts,
    deleteProduct,
    overridePrice,
    getAllProducts,
    promoteToAdmin,
    demoteToUser,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

// platform stats
router.get("/stats", protect, adminOnly, getStats);

// user management
router.get("/users", protect, adminOnly, getAllUsers);
router.put("/ban-user/:id", protect, adminOnly, banUser);
router.put("/unban-user/:id", protect, adminOnly, unbanUser);

// vendor management
router.get("/vendors", protect, adminOnly, getAllVendors);
router.get("/vendor-activity/:id", protect, adminOnly, getVendorActivity);
router.put("/verify-vendor/:id", protect, adminOnly, verifyVendor);
router.put("/unverify-vendor/:id", protect, adminOnly, unverifyVendor);
router.put("/ban-vendor/:id", protect, adminOnly, banVendor);
router.put("/unban-vendor/:id", protect, adminOnly, unbanVendor);

// product management
router.get("/products", protect, adminOnly, getAllProducts);
router.delete("/product/:id", protect, adminOnly, deleteProduct);
router.put("/product-price/:id", protect, adminOnly, overridePrice);

// reported products
router.get("/reported-products", protect, adminOnly, getReportedProducts);

//make admin 
router.put("/promote/:id", protect, adminOnly, promoteToAdmin);

// demote admin to user
router.put("/demote/:id", protect, adminOnly, demoteToUser);

module.exports = router;