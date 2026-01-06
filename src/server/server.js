const express = require("express");
const { logger } = require("../services/log.service");
const response = require("../services/response.service");
const {
    txnIdMiddleware,
    requestLoggerMiddleware,
    errorHandlerMiddleware,
} = require("../middlewares");
const chatRoutes = require("../routes/chat");
const jiraWebhookRoutes = require("../routes/jiraWebhook");

function createServer() {
    logger.info("server.js [createServer] Initializing Express application");

    const app = express();

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(txnIdMiddleware);
    app.use(requestLoggerMiddleware);

    // Routes
    app.use("/api/chat", chatRoutes);
    app.use("/api/jira/webhook", jiraWebhookRoutes);

    // Health check
    app.get("/health", (req, res) => {
        return response.success(res, "Service is healthy", { status: "ok" });
    });

    // Error handling middleware (must be last)
    app.use(errorHandlerMiddleware);

    logger.info("server.js [createServer] Express application initialized");

    return app;
}

module.exports = { createServer };
