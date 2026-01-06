const { logger } = require("../../services/log.service");

async function sendMessage(message, txnId) {
    logger.info(`[${txnId}] chat.service.js [sendMessage] Processing message`);
    logger.debug({ message }, `[${txnId}] chat.service.js [sendMessage] Message content`);

    // Business logic here
    const response = {
        id: Date.now(),
        message,
        timestamp: new Date().toISOString(),
    };

    logger.info(`[${txnId}] chat.service.js [sendMessage] Message processed successfully`);
    return response;
}

async function getMessages(txnId) {
    logger.info(`[${txnId}] chat.service.js [getMessages] Fetching messages`);

    // Business logic here
    const messages = [];

    logger.info(`[${txnId}] chat.service.js [getMessages] Messages fetched successfully`);
    return messages;
}

module.exports = {
    sendMessage,
    getMessages,
};
