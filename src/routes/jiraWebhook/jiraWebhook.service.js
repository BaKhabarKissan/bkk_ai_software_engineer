const { getLogger } = require("../../services/log.service");

const log = getLogger(__filename);

const SUPPORTED_EVENTS = [
    "jira:issue_created",
    "jira:issue_updated",
];

async function processWebhook(payload, txnId) {
    log.info("processWebhook", "Processing Jira webhook", {
        txnId,
        event: payload.webhookEvent,
        issueKey: payload.issue?.key,
    });

    const { webhookEvent, issue, changelog } = payload;

    if (!SUPPORTED_EVENTS.includes(webhookEvent)) {
        log.info("processWebhook", "Ignoring unsupported event", {
            txnId,
            event: webhookEvent,
        });
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
    log.info("handleIssueCreated", "Handling issue created event", {
        txnId,
        issueKey: issue.key,
        summary: issue.fields?.summary,
    });

    const issueData = extractIssueData(issue);

    // Check if issue has assignee or relevant labels
    if (!issueData.assignee && issueData.labels.length === 0) {
        log.info("handleIssueCreated", "Issue has no assignee or labels, skipping", {
            txnId,
            issueKey: issue.key,
        });
        return { processed: false, reason: "No assignee or labels" };
    }

    // TODO: Trigger automation workflow
    // 1. Fetch repository details
    // 2. Create branch with naming template
    // 3. Claude Code implements the task
    // 4. Create PR for the branch

    log.info("handleIssueCreated", "Issue queued for processing", {
        txnId,
        issueKey: issue.key,
    });

    return {
        processed: true,
        issueKey: issue.key,
        action: "queued_for_automation",
        data: issueData,
    };
}

async function handleIssueUpdated(issue, changelog, txnId) {
    log.info("handleIssueUpdated", "Handling issue updated event", {
        txnId,
        issueKey: issue.key,
    });

    const issueData = extractIssueData(issue);
    const relevantChanges = extractRelevantChanges(changelog);

    if (relevantChanges.length === 0) {
        log.info("handleIssueUpdated", "No relevant changes detected, skipping", {
            txnId,
            issueKey: issue.key,
        });
        return { processed: false, reason: "No relevant changes" };
    }

    log.info("handleIssueUpdated", "Relevant changes detected", {
        txnId,
        issueKey: issue.key,
        changes: relevantChanges,
    });

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
