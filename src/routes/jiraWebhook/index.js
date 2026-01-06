const express = require("express");
const { validateRequest } = require("../../services/validation.service");
const jiraWebhookController = require("./jiraWebhook.controller");
const { webhookSchema } = require("./jiraWebhook.validation");

const router = express.Router();

router.post("/", validateRequest(webhookSchema), jiraWebhookController.handleWebhook);

module.exports = router;
