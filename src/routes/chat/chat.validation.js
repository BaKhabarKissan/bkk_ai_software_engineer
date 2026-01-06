const { getLogger } = require("../../services/log.service");

const log = getLogger(__filename);

function validateSendMessage(req, res, next) {
    const { txnId } = req;
    log.info("validateSendMessage", "Validating request", { txnId });

    const { message } = req.body;

    if (!message || typeof message !== "string") {
        log.warn("validateSendMessage", "Validation failed: message is required", { txnId });
        return res.status(400).json({
            error: { message: "message is required and must be a string" },
        });
    }

    if (message.trim().length === 0) {
        log.warn("validateSendMessage", "Validation failed: message is empty", { txnId });
        return res.status(400).json({
            error: { message: "message cannot be empty" },
        });
    }

    log.info("validateSendMessage", "Validation passed", { txnId });
    next();
}

module.exports = {
    validateSendMessage,
};
