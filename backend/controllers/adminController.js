const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const PriceHistory = require("../models/PriceHistory");

// platform stats
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalVendors = await Vendor.countDocuments();
        const totalProducts = await Product.countDocuments();
        const reportedProducts = await Product.countDocuments({ "reports.0": { $exists: true } });
        res.status(200).json({ totalUsers, totalVendors, totalProducts, reportedProducts });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({
            role: { $in: ["user", "admin"] },
            _id: { $ne: req.user.id }
        }).select("-password");
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// ban user
const banUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBanned: true },
            { new: true }
        ).select("-password");
        res.status(200).json({ msg: "User banned!", user });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// unban user
const unbanUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBanned: false },
            { new: true }
        ).select("-password");
        res.status(200).json({ msg: "User unbanned!", user });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// get all vendors
const getAllVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find().populate("userId", "name email");
        res.status(200).json(vendors);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// verify vendor
const verifyVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });
        vendor.isVerified = true;
        vendor.verificationBadge = true;
        await vendor.save();
        res.status(200).json({ msg: "Vendor verified!", vendor });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// unverify vendor
const unverifyVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });
        vendor.isVerified = false;
        vendor.verificationBadge = false;
        await vendor.save();
        res.status(200).json({ msg: "Vendor unverified!" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// ban vendor
const banVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });
        vendor.isActive = false;
        await vendor.save();
        await User.findByIdAndUpdate(vendor.userId, { isBanned: true });
        res.status(200).json({ msg: "Vendor banned!" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// unban vendor
const unbanVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });
        vendor.isActive = true;
        await vendor.save();
        await User.findByIdAndUpdate(vendor.userId, { isBanned: false });
        res.status(200).json({ msg: "Vendor unbanned!" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// get vendor activity with product reports detail including reporter info
const getVendorActivity = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id)
            .populate("userId", "name email createdAt");

        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

        const products = await Product.find({ vendorId: req.params.id })
            .populate("reports.userId", "name email");

        const totalReports = products.reduce(
            (acc, product) => acc + product.reports.length, 0
        );

        res.status(200).json({
            vendor,
            totalProducts: products.length,
            totalReports,
            products: products.map((p) => ({
                _id: p._id,
                name: p.name,
                currentPrice: p.currentPrice,
                unit: p.unit,
                isAvailable: p.isAvailable,
                reports: p.reports.map((r) => ({
                    reason: r.reason,
                    reportedAt: r.reportedAt,
                    reportedBy: r.userId?.name || "Unknown",
                    reportedEmail: r.userId?.email || "N/A",
                })),
            })),
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// get reported products with user details
const getReportedProducts = async (req, res) => {
    try {
        const products = await Product.find({ "reports.0": { $exists: true } })
            .populate("vendorId", "shopName")
            .populate("reports.userId", "name email");
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// delete product
const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ msg: "Product deleted!" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// promote user to admin
const promoteToAdmin = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role: "admin" },
            { new: true }
        ).select("-password");
        res.status(200).json({ msg: "User promoted to Admin!", user });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// demote admin to user
const demoteToUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role: "user" },
            { new: true }
        ).select("-password");
        res.status(200).json({ msg: "Admin demoted to User!", user });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// admin price override
const overridePrice = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        product.currentPrice = req.body.currentPrice;
        await product.save();

        await PriceHistory.create({
            productId: product._id,
            vendorId: product.vendorId,
            price: req.body.currentPrice,
        });

        res.status(200).json({ msg: "Price overridden!", product });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate("vendorId", "shopName");
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

module.exports = {
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
};