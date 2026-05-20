const User = require("../models/User");
const Product = require("../models/Product");

// set price alert for a product
const setPriceAlert = async (req, res) => {
    try {
        const { productId, targetPrice } = req.body;

        // productId ya targetPrice missing ho toh reject karo
        if (!productId || !targetPrice) {
            return res.status(400).json({ msg: "productId and targetPrice required" });
        }

        const user = await User.findById(req.user.id);

        // safely check — null productId pe toString() crash na ho
        const exists = user.priceAlerts.find(
            (a) => a.productId && a.productId.toString() === productId
        );

        if (exists) {
            exists.targetPrice = targetPrice;
        } else {
            user.priceAlerts.push({ productId, targetPrice });
        }

        await user.save();
        res.status(200).json({ msg: "Alert set!", priceAlerts: user.priceAlerts });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// get alerts with product details
const getMyAlerts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password")
            .populate(
                "priceAlerts.productId",
                // isAvailable bhi fetch karo — dashboard pe badge ke liye
                "name currentPrice image category unit isAvailable"
            );

        const validAlerts = user.priceAlerts.filter((a) => a.productId !== null);
        res.status(200).json(validAlerts);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// update profile
const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name },
            { new: true }
        ).select("-password");
        res.status(200).json({ msg: "Profile updated!", user });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// add or remove from favourites
const toggleFavourite = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const productId = req.params.id;

        const index = user.favourites.indexOf(productId);
        if (index === -1) {
            user.favourites.push(productId);
        } else {
            user.favourites.splice(index, 1);
        }

        await user.save();
        res.status(200).json({
            msg: index === -1 ? "Added to favourites!" : "Removed from favourites!",
            favourites: user.favourites,
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// get all favourites with product + vendor details
const getFavourites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: "favourites",
                populate: {
                    path: "vendorId",
                    select: "shopName shopAddress rating verificationBadge"
                },
            });
        res.status(200).json(user.favourites);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// user rated vendors list
const getMyRatings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("ratedVendors");
        res.status(200).json(user.ratedVendors);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// User reported products list
const getMyReports = async (req, res) => {
    try {
        const products = await Product.find({
            "reports.userId": req.user.id,
        })
        .populate("vendorId", "shopName")
        .select("name image category reports vendorId");

        const myReports = [];
        products.forEach((product) => {
            product.reports.forEach((report) => {
                if (report.userId.toString() === req.user.id) {
                    myReports.push({
                        productId: {
                            _id: product._id,
                            name: product.name,
                            image: product.image,
                            category: product.category,
                            vendorId: product.vendorId,
                        },
                        reason: report.reason,
                        reportedAt: report.reportedAt,
                    });
                }
            });
        });

        res.status(200).json(myReports);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

module.exports = {
    setPriceAlert,
    getMyAlerts,
    toggleFavourite,
    getFavourites,
    updateProfile,
    getMyRatings,
    getMyReports,
};