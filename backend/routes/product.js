const express = require("express");
const router = express.Router();
const {
    addProduct,
    updatePrice,
    searchProducts,
    getSearchSuggestions,
    getLatestProducts,
    getTrendingProducts,
    getProductById,
    getPriceHistory,
    reportFakePrice,
    getPricePrediction,
    deleteProduct,
    getNearbyProducts,
    getMarketInsight,
} = require("../controllers/productController");
const { protect, vendorOnly } = require("../middleware/auth");
const upload = require("../utils/upload");

// vendor routes
router.post("/add", protect, vendorOnly, upload.single("image"), addProduct);
router.put("/update-price/:id", protect, vendorOnly, updatePrice);
router.delete("/:id", protect, vendorOnly, deleteProduct);

// public routes
router.get("/search", searchProducts);
router.get("/suggestions", getSearchSuggestions);
router.get("/latest", getLatestProducts);
router.get("/trending", getTrendingProducts);
router.get("/nearby", getNearbyProducts);
router.get("/market-insight", getMarketInsight);

// product specific routes
router.get("/:id", getProductById);
router.get("/:id/price-history", getPriceHistory);
router.get("/:id/predict", getPricePrediction);
router.post("/:id/report", protect, reportFakePrice);

module.exports = router;