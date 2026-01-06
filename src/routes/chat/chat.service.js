const { getLogger } = require("../../services/log.service");

const log = getLogger(__filename);

async function sendMessage(message, txnId) {
    log.info("sendMessage", "Processing message", { txnId, message });

    // Business logic here
    const response = {
        id: Date.now(),
        message,
        timestamp: new Date().toISOString(),
    };

    log.info("sendMessage", "Message processed successfully", { txnId });
    return response;
}

async function getMessages(txnId) {
    log.info("getMessages", "Fetching messages", { txnId });

    // Business logic here
    const messages = [];

    log.info("getMessages", "Messages fetched successfully", { txnId });
    return messages;
}

module.exports = {
    sendMessage,
    getMessages,
};
