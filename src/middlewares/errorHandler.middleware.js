const { logger } = require("../services/log.service");
const response = require("../services/response.service");

/**
 * Global error handling middleware
 */
function errorHandlerMiddleware(err, req, res, next) {
    logger.error(`[${req.txnId}] errorHandler.middleware.js [errorHandler] ${err.message}`);
    logger.debug({ stack: err.stack }, `[${req.txnId}] errorHandler.middleware.js [errorHandler] ${err.message}`);
    return response.failure(res, err.message || "Internal Server Error", {}, err.status || 500);
}

module.exports = errorHandlerMiddleware;
