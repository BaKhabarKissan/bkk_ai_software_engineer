const { logger } = require("../services/log.service");

/**
 * Middleware to log incoming requests
 */
function requestLoggerMiddleware(req, res, next) {
    logger.info(`[${req.txnId}] requestLogger.middleware.js [requestLogger] ${req.method} ${req.url}`);
    next();
}

module.exports = requestLoggerMiddleware;
