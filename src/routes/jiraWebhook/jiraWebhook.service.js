const { logger } = require("../../services/log.service");

const TRIGGER_LABEL = "claude-code";
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

    const issueData = extractIssueData(issue);
    const hasClaudeCodeLabel = issueData.labels.includes(TRIGGER_LABEL);

    // For issue_created: only proceed if it already has the trigger label
    if (webhookEvent === "jira:issue_created") {
        if (!hasClaudeCodeLabel) {
            logger.info(`[${txnId}] jiraWebhook.service.js [processWebhook] Issue missing "${TRIGGER_LABEL}" label, skipping - issueKey: ${issue.key}`);
            return { processed: false, reason: `Missing "${TRIGGER_LABEL}" label` };
        }
        return await handleTrigger(issueData, txnId);
    }

    // For issue_updated: only proceed if the trigger label was just added
    if (webhookEvent === "jira:issue_updated") {
        const labelAdded = wasLabelAdded(changelog, TRIGGER_LABEL);

        if (!labelAdded) {
            logger.info(`[${txnId}] jiraWebhook.service.js [processWebhook] "${TRIGGER_LABEL}" label not added in this update, skipping - issueKey: ${issue.key}`);
            return { processed: false, reason: `"${TRIGGER_LABEL}" label not added` };
        }
        return await handleTrigger(issueData, txnId);
    }

    return { processed: false, reason: "No handler matched" };
}

async function handleTrigger(issueData, txnId) {
    logger.info(`[${txnId}] jiraWebhook.service.js [handleTrigger] Triggering automation - issueKey: ${issueData.key}, summary: ${issueData.summary}`);

    // TODO: Trigger automation workflow
    // 1. Fetch repository details
    // 2. Create branch with naming template
    // 3. Claude Code implements the task
    // 4. Create PR for the branch

    logger.info(`[${txnId}] jiraWebhook.service.js [handleTrigger] Issue queued for processing - issueKey: ${issueData.key}`);

    return {
        processed: true,
        issueKey: issueData.key,
        action: "queued_for_automation",
        data: issueData,
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
