const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ msg: "No token, access denied" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Invalid token" });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ msg: "Admin access only" });
    }
    next();
};

const vendorOnly = (req, res, next) => {
    if (req.user.role !== "vendor" && req.user.role !== "admin") {
        return res.status(403).json({ msg: "Vendor access only" });
    }
    next();
};

module.exports = { protect, adminOnly, vendorOnly };