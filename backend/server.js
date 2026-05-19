const express = require("express");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

// io ko global banaya taaki controllers use kar sakein
global.io = io;

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
    res.send("NearPrice API is running!");
});

// routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

//vendor routes
const vendorRoutes = require("./routes/vendor");
app.use("/api/vendor", vendorRoutes);

//product routes
const productRoutes = require("./routes/product");
app.use("/api/product", productRoutes);

// admin routes - manage users, vendors, reports
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

// user routes - alerts, profile
const userRoutes = require("./routes/user");
app.use("/api/user", userRoutes);

// socket connection
io.on("connection", (socket) => {
    console.log("user connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("user disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});