
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { initSocket } = require("./socket");
const photoRoutes = require("./routes/photoRoutes");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");

const commentRoutes = require("./routes/commentRoutes");
dotenv.config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// ==========================================
// HEALTH CHECK
// GET /api/health
// ==========================================
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Alzikrayat MERN API is running!"
    });
});

// ==========================================
// AUTH ROUTES
// ==========================================
app.use("/api/auth", authRoutes);

// ==========================================
// PHOTO ROUTES
// ==========================================
app.use("/api/photos", photoRoutes);


// COMMENT ROUTES
app.use("/api/photos", commentRoutes);


// ==========================================
// 404 NOT FOUND
// ==========================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        // Socket.io needs a raw HTTP server that Express and Socket.io share
        const httpServer = http.createServer(app);
        initSocket(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
