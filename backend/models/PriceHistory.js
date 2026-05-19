const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// 7 days ka data fast fetch ho iske liye
priceHistorySchema.index({ productId: 1, date: -1 });

module.exports = mongoose.model("PriceHistory", priceHistorySchema);