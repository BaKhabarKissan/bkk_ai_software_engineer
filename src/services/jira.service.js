const { Version3Client } = require("jira.js");
const { logger } = require("./log.service");

const { JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

let jiraClient = null;

function getClient() {
    if (!jiraClient) {
        if (!JIRA_HOST || !JIRA_EMAIL || !JIRA_API_TOKEN) {
            throw new Error("Missing Jira configuration: JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN are required");
        }

        jiraClient = new Version3Client({
            host: JIRA_HOST,
            authentication: {
                basic: {
                    email: JIRA_EMAIL,
                    apiToken: JIRA_API_TOKEN,
                },
            },
        });
    }
    return jiraClient;
}

async function getIssue(issueKey, txnId) {
    logger.info(`[${txnId}] jira.service.js [getIssue] Fetching issue - issueKey: ${issueKey}`);

    const client = getClient();

    const issue = await client.issues.getIssue({
        issueIdOrKey: issueKey,
        expand: ["renderedFields", "names", "changelog"],
        fields: [
            "summary",
            "description",
            "status",
            "priority",
            "assignee",
            "reporter",
            "labels",
            "components",
            "fixVersions",
            "created",
            "updated",
            "duedate",
            "project",
            "issuetype",
            "parent",
            "subtasks",
            "issuelinks",
            "attachment",
            "comment",
            "worklog",
            "timetracking",
            "customfield_*",
        ],
    });

    logger.info(`[${txnId}] jira.service.js [getIssue] Issue fetched successfully - issueKey: ${issueKey}`);

    return formatIssueData(issue, txnId);
}

function formatIssueData(issue, txnId) {
    logger.debug(`[${txnId}] jira.service.js [formatIssueData] Formatting issue data - issueKey: ${issue.key}`);

    const fields = issue.fields || {};
    const renderedFields = issue.renderedFields || {};

    return {
        id: issue.id,
        key: issue.key,
        self: issue.self,
        summary: fields.summary || "",
        description: {
            raw: fields.description,
            rendered: renderedFields.description || "",
            text: extractTextFromDescription(fields.description),
        },
        status: {
            id: fields.status?.id,
            name: fields.status?.name || "",
            category: fields.status?.statusCategory?.name || "",
        },
        priority: {
            id: fields.priority?.id,
            name: fields.priority?.name || "",
        },
        assignee: fields.assignee ? {
            accountId: fields.assignee.accountId,
            displayName: fields.assignee.displayName,
            email: fields.assignee.emailAddress,
            avatarUrl: fields.assignee.avatarUrls?.["48x48"],
        } : null,
        reporter: fields.reporter ? {
            accountId: fields.reporter.accountId,
            displayName: fields.reporter.displayName,
            email: fields.reporter.emailAddress,
        } : null,
        labels: fields.labels || [],
        components: (fields.components || []).map(c => ({
            id: c.id,
            name: c.name,
        })),
        fixVersions: (fields.fixVersions || []).map(v => ({
            id: v.id,
            name: v.name,
            released: v.released,
        })),
        project: {
            id: fields.project?.id,
            key: fields.project?.key || "",
            name: fields.project?.name || "",
        },
        issueType: {
            id: fields.issuetype?.id,
            name: fields.issuetype?.name || "",
            subtask: fields.issuetype?.subtask || false,
        },
        parent: fields.parent ? {
            id: fields.parent.id,
            key: fields.parent.key,
            summary: fields.parent.fields?.summary || "",
        } : null,
        subtasks: (fields.subtasks || []).map(s => ({
            id: s.id,
            key: s.key,
            summary: s.fields?.summary || "",
            status: s.fields?.status?.name || "",
        })),
        issueLinks: (fields.issuelinks || []).map(link => ({
            id: link.id,
            type: link.type?.name || "",
            inward: link.type?.inward || "",
            outward: link.type?.outward || "",
            linkedIssue: link.inwardIssue ? {
                key: link.inwardIssue.key,
                summary: link.inwardIssue.fields?.summary || "",
                status: link.inwardIssue.fields?.status?.name || "",
                direction: "inward",
            } : link.outwardIssue ? {
                key: link.outwardIssue.key,
                summary: link.outwardIssue.fields?.summary || "",
                status: link.outwardIssue.fields?.status?.name || "",
                direction: "outward",
            } : null,
        })),
        attachments: (fields.attachment || []).map(a => ({
            id: a.id,
            filename: a.filename,
            mimeType: a.mimeType,
            size: a.size,
            content: a.content,
            created: a.created,
        })),
        comments: (fields.comment?.comments || []).map(c => ({
            id: c.id,
            author: c.author?.displayName || "",
            body: {
                raw: c.body,
                text: extractTextFromDescription(c.body),
            },
            created: c.created,
            updated: c.updated,
        })),
        timeTracking: fields.timetracking ? {
            originalEstimate: fields.timetracking.originalEstimate,
            remainingEstimate: fields.timetracking.remainingEstimate,
            timeSpent: fields.timetracking.timeSpent,
        } : null,
        dates: {
            created: fields.created,
            updated: fields.updated,
            dueDate: fields.duedate,
        },
    };
}

function extractTextFromDescription(description) {
    if (!description) {
        return "";
    }

    // If it's a plain string, return as-is
    if (typeof description === "string") {
        return description;
    }

    // Handle Atlassian Document Format (ADF)
    if (description.type === "doc" && Array.isArray(description.content)) {
        return extractTextFromAdf(description.content);
    }

    return "";
}

function extractTextFromAdf(content) {
    let text = "";

    for (const node of content) {
        if (node.type === "text") {
            text += node.text || "";
        } else if (node.type === "hardBreak") {
            text += "\n";
        } else if (node.type === "paragraph") {
            if (text && !text.endsWith("\n")) {
                text += "\n";
            }
            text += extractTextFromAdf(node.content || []);
            text += "\n";
        } else if (node.type === "heading") {
            if (text && !text.endsWith("\n")) {
                text += "\n";
            }
            text += extractTextFromAdf(node.content || []);
            text += "\n";
        } else if (node.type === "bulletList" || node.type === "orderedList") {
            text += extractTextFromAdf(node.content || []);
        } else if (node.type === "listItem") {
            text += "- " + extractTextFromAdf(node.content || []).trim() + "\n";
        } else if (node.type === "codeBlock") {
            text += "```\n" + extractTextFromAdf(node.content || []) + "```\n";
        } else if (node.type === "blockquote") {
            const quoteText = extractTextFromAdf(node.content || []);
            text += quoteText.split("\n").map(line => "> " + line).join("\n") + "\n";
        } else if (node.type === "inlineCard" || node.type === "blockCard") {
            text += node.attrs?.url || "";
        } else if (node.content) {
            text += extractTextFromAdf(node.content);
        }
    }

    return text;
}

module.exports = {
    getIssue,
};
