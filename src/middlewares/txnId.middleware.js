const { generateTxnId } = require("../services/log.service");

/**
 * Middleware to attach a 6-digit transaction ID to each request
 */
function txnIdMiddleware(req, res, next) {
    req.txnId = generateTxnId();
    next();
}

module.exports = txnIdMiddleware;
