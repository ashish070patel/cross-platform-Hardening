const express = require("express");
const cors = require("cors");

const app = express();

// ================================
// Middleware
// ================================

app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ||
            "http://localhost:5173"
    })
);

app.use(express.json({ limit: "100kb" }));

// ================================
// API Routes
// ================================

const systemRoutes = require("../routes/systemRoutes");
const agentRoutes = require("../routes/agentRoutes");
const securityRoutes = require("../routes/securityRoutes");
const alertRoutes = require("../routes/alertRoutes");

app.use("/api/system", systemRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/alerts", alertRoutes);

// ================================
// Unknown Route Handler
// ================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// ================================
// Global Error Handler
// ================================

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    console.error("API error:", error.message);

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body."
        });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body is too large."
        });
    }

    return res.status(error.status || 500).json({
        success: false,
        message:
            error.status && error.status < 500
                ? error.message
                : "Internal server error."
    });
});

module.exports = app;