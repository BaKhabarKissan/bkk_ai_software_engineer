const { logger } = require("../../services/log.service");
const response = require("../../services/response.service");
const chatService = require("./chat.service");

async function sendMessage(req, res, next) {
    const { txnId } = req;
    logger.info(`[${txnId}] chat.controller.js [sendMessage] Handling send message request`);

    try {
        const { message } = req.body;
        const result = await chatService.sendMessage(message, txnId);

        logger.info(`[${txnId}] chat.controller.js [sendMessage] Message sent successfully`);
        return response.success(res, "Message sent successfully", result, 201);
    } catch (error) {
        logger.error(`[${txnId}] chat.controller.js [sendMessage] Failed to send message: ${error.message}`);
        next(error);
    }
}

async function getMessages(req, res, next) {
    const { txnId } = req;
    logger.info(`[${txnId}] chat.controller.js [getMessages] Handling get messages request`);

    try {
        const messages = await chatService.getMessages(txnId);

        logger.info(`[${txnId}] chat.controller.js [getMessages] Messages retrieved successfully`);
        return response.success(res, "Messages retrieved successfully", { messages });
    } catch (error) {
        logger.error(`[${txnId}] chat.controller.js [getMessages] Failed to get messages: ${error.message}`);
        next(error);
    }
}

module.exports = {
    sendMessage,
    getMessages,
};
