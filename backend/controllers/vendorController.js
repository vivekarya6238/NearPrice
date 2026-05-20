const Vendor = require("../models/Vendor");
const User = require("../models/User");
const Product = require("../models/Product");

const registerVendor = async (req, res) => {
    try {
        const existing = await Vendor.findOne({ userId: req.user.id });
        if (existing) return res.status(400).json({ msg: "Vendor already registered" });

        const { shopName, shopAddress, phone, coordinates } = req.body;

        const vendor = await Vendor.create({
            userId: req.user.id,
            shopName,
            shopAddress,
            phone,
            location: {
                type: "Point",
                coordinates: coordinates || [0, 0],
            },
        });

        await User.findByIdAndUpdate(req.user.id, { role: "vendor" });

        res.status(201).json(vendor);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getMyVendorProfile = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user.id });
        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });
        res.status(200).json(vendor);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getNearbyVendors = async (req, res) => {
    try {
        const { longitude, latitude, distance = 5000 } = req.query;

        const vendors = await Vendor.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                    $maxDistance: parseInt(distance),
                },
            },
            isActive: true,
        });

        res.status(200).json(vendors);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const toggleProductAvailability = async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user.id });
        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        if (product.vendorId.toString() !== vendor._id.toString()) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        product.isAvailable = !product.isAvailable;
        await product.save();

        res.status(200).json({
            msg: product.isAvailable ? "Product is now In Stock!" : "Product marked Out of Stock!",
            isAvailable: product.isAvailable,
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// user vendor ko rate kare — ek baar hi
const rateVendor = async (req, res) => {
    try {
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: "Rating must be between 1 and 5" });
        }

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

        const user = await User.findById(req.user.id);

        // check if already rated
        const alreadyRated = user.ratedVendors.find(
            (r) => r.vendorId && r.vendorId.toString() === req.params.id
        );

        if (alreadyRated) {
            // old rating hatao, naya lagao
            const oldRating = alreadyRated.rating;
            const totalRatingSum = vendor.rating.average * vendor.rating.totalReviews;
            const newSum = totalRatingSum - oldRating + rating;
            vendor.rating.average = parseFloat((newSum / vendor.rating.totalReviews).toFixed(1));

            alreadyRated.rating = rating;
        } else {
            // naya rating add karo
            const totalRatingSum = vendor.rating.average * vendor.rating.totalReviews;
            vendor.rating.totalReviews += 1;
            vendor.rating.average = parseFloat(
                ((totalRatingSum + rating) / vendor.rating.totalReviews).toFixed(1)
            );

            user.ratedVendors.push({ vendorId: vendor._id, rating });
        }

        await vendor.save();
        await user.save();

        res.status(200).json({
            msg: alreadyRated ? "Rating updated!" : "Rating submitted!",
            rating: vendor.rating,
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

module.exports = {
    registerVendor,
    getMyVendorProfile,
    getNearbyVendors,
    toggleProductAvailability,
    rateVendor,
};