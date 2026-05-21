const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            enum: ["vegetables", "fruits", "grocery", "electronics", "clothing", "medicine", "home", "automotive", "books", "food", "other"],
        },
        description: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },
        currentPrice: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            default: "kg",
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
        reports: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                reason: String,
                reportedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        tags: [String],
    },
    { timestamps: true }
);

// search fast ho iske liye
productSchema.index({ name: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
