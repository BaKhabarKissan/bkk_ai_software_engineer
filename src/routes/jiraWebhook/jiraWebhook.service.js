const { logger } = require("../../services/log.service");

const SUPPORTED_EVENTS = [
    "jira:issue_created",
    "jira:issue_updated",
];

async function processWebhook(payload, txnId) {
    logger.info(`[${txnId}] jiraWebhook.service.js [processWebhook] Processing Jira webhook - event: ${payload.webhookEvent}, issueKey: ${payload.issue?.key}`);

    const { webhookEvent, issue, changelog } = payload;

    if (!SUPPORTED_EVENTS.includes(webhookEvent)) {
        logger.info(`[${txnId}] jiraWebhook.service.js [processWebhook] Ignoring unsupported event: ${webhookEvent}`);
        return { processed: false, reason: "Unsupported event type" };
    }

    if (webhookEvent === "jira:issue_created") {
        return await handleIssueCreated(issue, txnId);
    }

    if (webhookEvent === "jira:issue_updated") {
        return await handleIssueUpdated(issue, changelog, txnId);
    }

    return { processed: false, reason: "No handler matched" };
}

async function handleIssueCreated(issue, txnId) {
    logger.info(`[${txnId}] jiraWebhook.service.js [handleIssueCreated] Handling issue created event - issueKey: ${issue.key}, summary: ${issue.fields?.summary}`);

    const issueData = extractIssueData(issue);

    // Check if issue has assignee or relevant labels
    if (!issueData.assignee && issueData.labels.length === 0) {
        logger.info(`[${txnId}] jiraWebhook.service.js [handleIssueCreated] Issue has no assignee or labels, skipping - issueKey: ${issue.key}`);
        return { processed: false, reason: "No assignee or labels" };
    }

    // TODO: Trigger automation workflow
    // 1. Fetch repository details
    // 2. Create branch with naming template
    // 3. Claude Code implements the task
    // 4. Create PR for the branch

    logger.info(`[${txnId}] jiraWebhook.service.js [handleIssueCreated] Issue queued for processing - issueKey: ${issue.key}`);

    return {
        processed: true,
        issueKey: issue.key,
        action: "queued_for_automation",
        data: issueData,
    };
}

async function handleIssueUpdated(issue, changelog, txnId) {
    logger.info(`[${txnId}] jiraWebhook.service.js [handleIssueUpdated] Handling issue updated event - issueKey: ${issue.key}`);

    const issueData = extractIssueData(issue);
    const relevantChanges = extractRelevantChanges(changelog);

    if (relevantChanges.length === 0) {
        logger.info(`[${txnId}] jiraWebhook.service.js [handleIssueUpdated] No relevant changes detected, skipping - issueKey: ${issue.key}`);
        return { processed: false, reason: "No relevant changes" };
    }

    logger.info(`[${txnId}] jiraWebhook.service.js [handleIssueUpdated] Relevant changes detected - issueKey: ${issue.key}`);
    logger.debug({ changes: relevantChanges }, `[${txnId}] jiraWebhook.service.js [handleIssueUpdated] Changes`);

    // TODO: Trigger automation based on changes
    // - If assignee added: start automation
    // - If label added: check if it's an automation trigger label

    return {
        processed: true,
        issueKey: issue.key,
        action: "changes_detected",
        changes: relevantChanges,
        data: issueData,
    };
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

function extractRelevantChanges(changelog) {
    if (!changelog?.items) {
        return [];
    }

    const relevantFields = ["assignee", "labels", "status"];

    return changelog.items
        .filter(item => relevantFields.includes(item.field))
        .map(item => ({
            field: item.field,
            from: item.fromString,
            to: item.toString,
        }));
}

module.exports = {
    processWebhook,
};
