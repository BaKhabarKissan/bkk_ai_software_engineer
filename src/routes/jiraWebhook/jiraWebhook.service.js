const { logger } = require("../../services/log.service");
const jiraService = require("../../services/jira.service");
const queueService = require("../../services/queue.service");

const { JIRA_TRIGGER_LABEL } = process.env;

const supportedEvents = [
    "jira:issue_created",
    "jira:issue_updated",
];

async function processWebhook(payload, txnId) {
    logger.info(`[${txnId}] jiraWebhook.service.js [processWebhook] Processing Jira webhook - event: ${payload.webhookEvent}, issueKey: ${payload.issue?.key}`);

    const { webhookEvent, issue, changelog } = payload;

    if (!supportedEvents.includes(webhookEvent)) {
        logger.info(`[${txnId}] jiraWebhook.service.js [processWebhook] Ignoring unsupported event: ${webhookEvent}`);
        return { processed: false, reason: "Unsupported event type" };
    }

    const issueData = extractIssueData(issue);
    const hasTriggerLabel = issueData.labels.includes(JIRA_TRIGGER_LABEL);

    // For issue_created: only proceed if it already has the trigger label
    if (webhookEvent === "jira:issue_created") {
        if (!hasTriggerLabel) {
            logger.info(`[${txnId}] jiraWebhook.service.js [processWebhook] Issue missing "${JIRA_TRIGGER_LABEL}" label, skipping - issueKey: ${issue.key}`);
            return { processed: false, reason: `Missing "${JIRA_TRIGGER_LABEL}" label` };
        }
        return await handleTrigger(issueData, txnId);
    }

    // For issue_updated: only proceed if the trigger label was just added
    if (webhookEvent === "jira:issue_updated") {
        const labelAdded = wasLabelAdded(changelog, JIRA_TRIGGER_LABEL);

        if (!labelAdded) {
            logger.info(`[${txnId}] jiraWebhook.service.js [processWebhook] "${JIRA_TRIGGER_LABEL}" label not added in this update, skipping - issueKey: ${issue.key}`);
            return { processed: false, reason: `"${JIRA_TRIGGER_LABEL}" label not added` };
        }
        return await handleTrigger(issueData, txnId);
    }

    return { processed: false, reason: "No handler matched" };
}

async function handleTrigger(issueData, txnId) {
    logger.info(`[${txnId}] jiraWebhook.service.js [handleTrigger] Triggering automation - issueKey: ${issueData.key}, summary: ${issueData.summary}`);

    // Fetch complete issue details from Jira API
    let completeIssue;
    try {
        completeIssue = await jiraService.getIssue(issueData.key, txnId);
        logger.info(`[${txnId}] jiraWebhook.service.js [handleTrigger] Complete issue fetched - issueKey: ${issueData.key}`);
        logger.debug(completeIssue, `[${txnId}] jiraWebhook.service.js [handleTrigger] Complete issue data`);
    } catch (error) {
        logger.error(`[${txnId}] jiraWebhook.service.js [handleTrigger] Failed to fetch complete issue: ${error.message}`);
        throw error;
    }

    // Publish task to queue for async processing
    const task = {
        issueKey: issueData.key,
        issue: completeIssue,
        timestamp: Date.now(),
    };

    try {
        await queueService.publishTask(task, txnId);
        logger.info(`[${txnId}] jiraWebhook.service.js [handleTrigger] Task published to queue - issueKey: ${issueData.key}`);
    } catch (error) {
        logger.error(`[${txnId}] jiraWebhook.service.js [handleTrigger] Failed to publish task: ${error.message}`);
        throw error;
    }

    return {
        processed: true,
        issueKey: issueData.key,
        action: "queued_for_automation",
    };
}

function wasLabelAdded(changelog, labelName) {
    if (!changelog?.items) {
        return false;
    }

    const labelChange = changelog.items.find(item => item.field === "labels");
    if (!labelChange) {
        return false;
    }

    // Check if the label appears in "toString" (added labels)
    const addedLabels = labelChange.toString || "";
    return addedLabels.split(" ").includes(labelName);
}

function extractIssueData(issue) {
    const fields = issue.fields || {};

    return {
        id: issue.id,
        key: issue.key,
        summary: fields.summary || "",
        description: fields.description || "",
        assignee: fields.assignee ? {
            accountId: fields.assignee.accountId,
            displayName: fields.assignee.displayName,
            email: fields.assignee.emailAddress,
        } : null,
        labels: fields.labels || [],
        status: fields.status?.name || "",
        project: {
            key: fields.project?.key || "",
            name: fields.project?.name || "",
        },
        issueType: fields.issuetype?.name || "",
    };
}

module.exports = {
    processWebhook,
};
