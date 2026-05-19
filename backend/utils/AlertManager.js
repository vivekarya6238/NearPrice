const User = require("../models/User");

const checkPriceAlerts = async (io, productId, newPrice) => {
    try {
        // find users who set alert for this product
        const users = await User.find({
            "priceAlerts.productId": productId,
        });

        users.forEach((user) => {
            user.priceAlerts.forEach((alert) => {
                if (
                    alert.productId.toString() === productId.toString() &&
                    newPrice <= alert.targetPrice
                ) {
                    // socket se notify karo
                    io.emit(`alert_${user._id}`, {
                        msg: "Price dropped!",
                        productId,
                        newPrice,
                        targetPrice: alert.targetPrice,
                    });
                }
            });
        });
    } catch (err) {
        console.error("Alert check failed:", err.message);
    }
};

module.exports = checkPriceAlerts;