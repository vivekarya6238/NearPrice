const PriceHistory = require("../models/PriceHistory");

const predictPrice = async (productId) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const history = await PriceHistory.find({
            productId,
            date: { $gte: sevenDaysAgo },
        }).sort({ date: 1 });

        if (history.length < 2) {
            return { prediction: "not enough data", probability: 0, trend: "stable" };
        }

        const prices = history.map((h) => h.price);

        // simple trend check — last price vs first price
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const diff = lastPrice - firstPrice;

        // average change per day
        const avgChange = diff / prices.length;

        // next day predicted price
        const predictedPrice = lastPrice + avgChange;

        // probability calculate karo
        let probability = Math.min(Math.abs((diff / firstPrice) * 100), 95).toFixed(1);

        let trend = "stable";
        if (avgChange > 0) trend = "increasing";
        if (avgChange < 0) trend = "decreasing";

        return {
            currentPrice: lastPrice,
            predictedPrice: parseFloat(predictedPrice.toFixed(2)),
            trend,
            probability: parseFloat(probability),
            dataPoints: prices.length,
        };
    } catch (err) {
        return { error: err.message };
    }
};

module.exports = predictPrice;
