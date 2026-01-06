const { getLogger } = require("../services/log.service");

const log = getLogger(__filename);

/**
 * Middleware to log incoming requests
 */
function requestLoggerMiddleware(req, res, next) {
    log.info("requestLogger", `${req.method} ${req.url}`, { txnId: req.txnId });
    next();
}

module.exports = requestLoggerMiddleware;
