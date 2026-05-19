const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const PriceHistory = require("../models/PriceHistory");
const predictPrice = require("../utils/pricePredictor");
const checkPriceAlerts = require("../utils/alertManager");
const cloudinary = require("../config/cloudinary");

// report thresholds — change karna ho to yahan se karo
const REPORT_WARNING_THRESHOLD = 3;
const REPORT_FLAG_THRESHOLD = 5;

// Sanitize HTML input for XSS protection
const sanitizeHtml = require("sanitize-html");
const clean = (value) => {
    if (typeof value !== "string") return value;
    return sanitizeHtml(value.trim(), { allowedTags: [], allowedAttributes: {} });
};

const addProduct = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user.id });
        if (!vendor) return res.status(404).json({ msg: "Vendor profile not found" });

        const name = clean(req.body.name);
        const category = clean(req.body.category);
        const description = clean(req.body.description);
        const unit = clean(req.body.unit);
        const currentPrice = req.body.currentPrice;
        const tags = req.body.tags;

        let imageUrl = "";

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: "nearprice/products" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(req.file.buffer);
            });
            imageUrl = result.secure_url;
        }

        const product = await Product.create({
            name,
            category,
            description,
            currentPrice,
            unit,
            tags: tags ? tags.split(",").map((t) => t.trim()) : [],
            vendorId: vendor._id,
            image: imageUrl,
        });

        await PriceHistory.create({
            productId: product._id,
            vendorId: vendor._id,
            price: currentPrice,
        });

        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const updatePrice = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user.id });
        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        if (product.vendorId.toString() !== vendor._id.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        product.currentPrice = req.body.currentPrice;
        await product.save();

        await PriceHistory.create({
            productId: product._id,
            vendorId: vendor._id,
            price: req.body.currentPrice,
        });

        await checkPriceAlerts(global.io, product._id, req.body.currentPrice);

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const searchProducts = async (req, res) => {
    try {
        const { query, minPrice, maxPrice, showAll } = req.query;

        let filter = showAll === "true" ? {} : { isAvailable: true };

        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: "i" } },
                { tags: { $regex: query, $options: "i" } },
            ];
        }

        if (minPrice || maxPrice) {
            filter.currentPrice = {};
            if (minPrice) filter.currentPrice.$gte = parseFloat(minPrice);
            if (maxPrice) filter.currentPrice.$lte = parseFloat(maxPrice);
        }

        const products = await Product.find(filter)
            .populate("vendorId", "shopName shopAddress location rating isVerified verificationBadge")
            .populate("reports.userId", "name")
            .sort({ currentPrice: 1 });

        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getSearchSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) return res.status(200).json([]);

        const products = await Product.find({
            isAvailable: true,
            $or: [
                { name: { $regex: query, $options: "i" } },
                { tags: { $regex: query, $options: "i" } },
            ],
        })
        .select("name category image")
        .limit(20);

        // same name ke duplicates hata do
        const seen = new Set();
        const unique = products.filter((p) => {
            const key = p.name.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        res.status(200).json(unique.slice(0, 6));
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getLatestProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate("vendorId", "shopName shopAddress rating isVerified verificationBadge")
            .sort({ createdAt: -1 })
            .limit(20);
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getNearbyProducts = async (req, res) => {
    try {
        const { longitude, latitude, distance = 5000 } = req.query;

        const vendors = await Vendor.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                    $maxDistance: parseInt(distance),
                },
            },
            isActive: true,
        });

        const vendorIds = vendors.map((v) => v._id);

        const products = await Product.find({
            vendorId: { $in: vendorIds },
        })
            .populate("vendorId", "shopName shopAddress location rating isVerified verificationBadge")
            .sort({ currentPrice: 1 });

        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getTrendingProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate("vendorId", "shopName shopAddress rating isVerified verificationBadge")
            .sort({ viewCount: -1 })
            .limit(10);
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("vendorId", "shopName shopAddress phone rating isVerified verificationBadge flagStatus");
        if (!product) return res.status(404).json({ msg: "Product not found" });

        await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getPriceHistory = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const history = await PriceHistory.find({
            productId: req.params.id,
            date: { $gte: sevenDaysAgo },
        }).sort({ date: 1 });

        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// smart report system — warning at 3, flagged at 5
const reportFakePrice = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        // ek user ek product pe sirf ek baar report kar sake
        const alreadyReported = product.reports.find(
            (r) => r.userId.toString() === req.user.id
        );
        if (alreadyReported) {
            return res.status(400).json({ msg: "You have already reported this product" });
        }

        if (!req.body.reason || !req.body.reason.trim()) {
            return res.status(400).json({ msg: "Reason is required" });
        }

        product.reports.push({
            userId: req.user.id,
            reason: req.body.reason,
        });

        await product.save();

        // vendor ke saare products ke reports count karo
        const vendorProducts = await Product.find({ vendorId: product.vendorId });
        const totalVendorReports = vendorProducts.reduce(
            (sum, p) => sum + p.reports.length, 0
        );

        // vendor flag status update karo
        const vendor = await Vendor.findById(product.vendorId);
        if (vendor) {
            vendor.totalReportsReceived = totalVendorReports;

            if (totalVendorReports >= REPORT_FLAG_THRESHOLD) {
                vendor.flagStatus = "flagged";
            } else if (totalVendorReports >= REPORT_WARNING_THRESHOLD) {
                vendor.flagStatus = "warning";
            }

            await vendor.save();
        }

        res.status(200).json({
            msg: "Report submitted successfully",
            vendorFlagStatus: vendor?.flagStatus,
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getPricePrediction = async (req, res) => {
    try {
        const result = await predictPrice(req.params.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user.id });
        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        if (product.vendorId.toString() !== vendor._id.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ msg: "Product deleted!" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// market price insight — same name products ka avg/min/max
const getMarketInsight = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || name.length < 2) {
            return res.status(200).json(null);
        }

        const products = await Product.find({
            name: { $regex: `^${name}`, $options: "i" },
            isAvailable: true,
        }).select("currentPrice name");

        if (products.length === 0) {
            return res.status(200).json(null);
        }

        const prices = products.map((p) => p.currentPrice);
        const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        const min = Math.min(...prices);
        const max = Math.max(...prices);

        res.status(200).json({ avg, min, max, count: products.length });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

module.exports = {
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
};