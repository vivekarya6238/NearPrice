const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["user", "vendor", "admin"],
            default: "user",
        },
        location: {
            type: {
                type: String,
                default: "Point",
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },
        priceAlerts: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                targetPrice: Number,
            },
        ],
        isBanned: {
            type: Boolean,
            default: false,
        },
        favourites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        // track which vendors this user has rated
        ratedVendors: [
            {
                vendorId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Vendor",
                },
                rating: Number,
            },
        ],
    },
    { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
