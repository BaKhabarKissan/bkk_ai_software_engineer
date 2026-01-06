const { getLogger } = require("../../services/log.service");
const response = require("../../services/response.service");
const chatService = require("./chat.service");

const log = getLogger(__filename);

async function sendMessage(req, res, next) {
    const { txnId } = req;
    log.info("sendMessage", "Handling send message request", { txnId });

    try {
        const { message } = req.body;
        const result = await chatService.sendMessage(message, txnId);

        log.info("sendMessage", "Message sent successfully", { txnId });
        return response.success(res, "Message sent successfully", result, 201);
    } catch (error) {
        log.error("sendMessage", "Failed to send message", { txnId, error: error.message });
        next(error);
    }
}

async function getMessages(req, res, next) {
    const { txnId } = req;
    log.info("getMessages", "Handling get messages request", { txnId });

    try {
        const messages = await chatService.getMessages(txnId);

        log.info("getMessages", "Messages retrieved successfully", { txnId });
        return response.success(res, "Messages retrieved successfully", { messages });
    } catch (error) {
        log.error("getMessages", "Failed to get messages", { txnId, error: error.message });
        next(error);
    }
}

module.exports = {
    sendMessage,
    getMessages,
};
