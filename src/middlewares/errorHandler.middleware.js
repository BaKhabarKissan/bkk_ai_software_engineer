const { getLogger } = require("../services/log.service");
const response = require("../services/response.service");

const log = getLogger(__filename);

/**
 * Global error handling middleware
 */
function errorHandlerMiddleware(err, req, res, next) {
    log.error("errorHandler", err.message, { txnId: req.txnId, stack: err.stack });
    return response.failure(res, err.message || "Internal Server Error", {}, err.status || 500);
}

module.exports = errorHandlerMiddleware;
