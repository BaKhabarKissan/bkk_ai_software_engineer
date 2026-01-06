const { logger } = require("../../services/log.service");
const response = require("../../services/response.service");
const jiraWebhookService = require("./jiraWebhook.service");

async function handleWebhook(req, res, next) {
    const { txnId } = req;
    logger.info(`[${txnId}] jiraWebhook.controller.js [handleWebhook] Received Jira webhook - event: ${req.body.webhookEvent}, issueKey: ${req.body.issue?.key}`);
    logger.debug(req.body, `[${txnId}] jiraWebhook.controller.js [handleWebhook] Full payload`);

    try {
        const result = await jiraWebhookService.processWebhook(req.body, txnId);

        logger.info(`[${txnId}] jiraWebhook.controller.js [handleWebhook] Webhook processed - processed: ${result.processed}`);
        return response.success(res, "Webhook received", result);
    } catch (error) {
        logger.error(`[${txnId}] jiraWebhook.controller.js [handleWebhook] Failed to process webhook: ${error.message}`);
        next(error);
    }
}

module.exports = {
    handleWebhook,
};
