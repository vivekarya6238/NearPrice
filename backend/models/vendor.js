const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        shopName: {
            type: String,
            required: true,
            trim: true,
        },
        shopAddress: {
            type: String,
            required: true,
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
        phone: {
            type: String,
            required: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationBadge: {
            type: Boolean,
            default: false,
        },
        rating: {
            average: {
                type: Number,
                default: 0,
            },
            totalReviews: {
                type: Number,
                default: 0,
            },
        },
        gallery: [
            {
                imageUrl: String,
                caption: String,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        // warning/flagged status for report system
        flagStatus: {
            type: String,
            enum: ["clean", "warning", "flagged"],
            default: "clean",
        },
        totalReportsReceived: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

vendorSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Vendor", vendorSchema);