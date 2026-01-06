const express = require("express");
const { getLogger, generateTxnId } = require("../services/log.service");
const response = require("../services/response.service");

const log = getLogger(__filename);

function createServer() {
    log.info("createServer", "Initializing Express application");

    const app = express();

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Transaction ID middleware
    app.use((req, res, next) => {
        req.txnId = generateTxnId();
        next();
    });

    // Request logging middleware
    app.use((req, res, next) => {
        log.info("middleware", `${req.method} ${req.url}`, { txnId: req.txnId });
        next();
    });

    // Routes
    const chatRoutes = require("../routes/chat");
    app.use("/api/chat", chatRoutes);

    // Health check
    app.get("/health", (req, res) => {
        return response.success(res, "Service is healthy", { status: "ok" });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        log.error("errorHandler", err.message, { txnId: req.txnId, stack: err.stack });
        return response.failure(res, err.message || "Internal Server Error", {}, err.status || 500);
    });

    log.info("createServer", "Express application initialized");

    return app;
}

module.exports = { createServer };
