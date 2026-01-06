const express = require("express");
const { getLogger } = require("../services/log.service");
const response = require("../services/response.service");
const {
    txnIdMiddleware,
    requestLoggerMiddleware,
    errorHandlerMiddleware,
} = require("../middlewares");

const log = getLogger(__filename);

function createServer() {
    log.info("createServer", "Initializing Express application");

    const app = express();

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(txnIdMiddleware);
    app.use(requestLoggerMiddleware);

    // Routes
    const chatRoutes = require("../routes/chat");
    app.use("/api/chat", chatRoutes);

    // Health check
    app.get("/health", (req, res) => {
        return response.success(res, "Service is healthy", { status: "ok" });
    });

    // Error handling middleware (must be last)
    app.use(errorHandlerMiddleware);

    log.info("createServer", "Express application initialized");

    return app;
}

module.exports = { createServer };
