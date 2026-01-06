const { getLogger } = require("../../services/log.service");
const response = require("../../services/response.service");
const jiraWebhookService = require("./jiraWebhook.service");

const log = getLogger(__filename);

async function handleWebhook(req, res, next) {
    const { txnId } = req;
    log.info("handleWebhook", "Received Jira webhook", {
        txnId,
        event: req.body.webhookEvent,
        issueKey: req.body.issue?.key,
    });

    try {
        const result = await jiraWebhookService.processWebhook(req.body, txnId);

        log.info("handleWebhook", "Webhook processed", {
            txnId,
            processed: result.processed,
        });

        return response.success(res, "Webhook received", result);
    } catch (error) {
        log.error("handleWebhook", "Failed to process webhook", {
            txnId,
            error: error.message,
        });
        next(error);
    }
}

module.exports = {
    handleWebhook,
};
