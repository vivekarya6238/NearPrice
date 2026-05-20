const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sanitizeHtml = require("sanitize-html");

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// sanitize string input — XSS protection
const clean = (value) => {
    if (typeof value !== "string") return value;
    return sanitizeHtml(value.trim(), { allowedTags: [], allowedAttributes: {} });
};

const register = async (req, res) => {
    try {
        const name = clean(req.body.name);
        const email = clean(req.body.email);
        const password = req.body.password;
        const role = clean(req.body.role);

        if (!name || !email || !password) {
            return res.status(400).json({ msg: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "user",
        });

        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const email = clean(req.body.email);
        const password = req.body.password;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        if (user.isBanned) {
            return res.status(403).json({ msg: "Your account has been banned" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const token = generateToken(user);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: "Both fields are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ msg: "Password must be at least 8 characters" });
        }

        const hasUppercase = /[A-Z]/.test(newPassword);
        const hasNumber = /\d/.test(newPassword);

        if (!hasUppercase || !hasNumber) {
            return res.status(400).json({ msg: "Password must have at least 1 uppercase letter and 1 number" });
        }

        const user = await User.findById(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ msg: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

module.exports = { register, login, getMe, changePassword };