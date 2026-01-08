const { Version3Client } = require("jira.js");
const { logger } = require("./log.service");

const { JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

let jiraClient = null;
let fieldNameToIdMap = null;

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

async function getFieldMapping(txnId) {
    if (fieldNameToIdMap) {
        return fieldNameToIdMap;
    }

    logger.info(`[${txnId}] jira.service.js [getFieldMapping] Fetching all fields from Jira`);

    const client = getClient();
    const fields = await client.issueFields.getFields();

    fieldNameToIdMap = {};
    for (const field of fields) {
        // Store both exact name and lowercase for case-insensitive lookup
        fieldNameToIdMap[field.name] = field.id;
        fieldNameToIdMap[field.name.toLowerCase()] = field.id;
    }

    logger.info(`[${txnId}] jira.service.js [getFieldMapping] Cached ${fields.length} field mappings`);

    return fieldNameToIdMap;
}

async function getIssue(issueKey, txnId) {
    logger.info(`[${txnId}] jira.service.js [getIssue] Fetching issue - issueKey: ${issueKey}`);

    const client = getClient();

    // Fetch field mapping first (cached after first call)
    const fieldMapping = await getFieldMapping(txnId);

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
            "*all",
        ],
    });

    logger.info(`[${txnId}] jira.service.js [getIssue] Issue fetched successfully - issueKey: ${issueKey}`);

    return formatIssueData(issue, fieldMapping, txnId);
}

function findCustomFieldByName(issue, fieldName, fieldMapping, txnId) {
    const fields = issue.fields || {};

    // Method 1: Use cached field mapping (most reliable)
    const fieldId = fieldMapping[fieldName] || fieldMapping[fieldName.toLowerCase()];
    if (fieldId && fields[fieldId] !== undefined) {
        logger.debug(`[${txnId}] jira.service.js [findCustomFieldByName] Found field via mapping: ${fieldId} = ${fieldName}`);
        return { fieldId, value: fields[fieldId] };
    }

    // Method 2: Try using names expansion from issue response (case-insensitive)
    const names = issue.names || {};
    const fieldNameLower = fieldName.toLowerCase();
    for (const [fId, name] of Object.entries(names)) {
        if (name && name.toLowerCase() === fieldNameLower) {
            logger.debug(`[${txnId}] jira.service.js [findCustomFieldByName] Found field via names: ${fId} = ${name}`);
            return { fieldId: fId, value: fields[fId] };
        }
    }

    // Method 3: Search all custom fields for GitHub URLs (fallback)
    logger.debug(`[${txnId}] jira.service.js [findCustomFieldByName] Field mapping failed, searching custom fields for GitHub URLs`);
    for (const [fId, value] of Object.entries(fields)) {
        if (fId.startsWith("customfield_") && value) {
            const textValue = extractTextFromFieldValue(value);
            if (textValue && textValue.includes("github.com")) {
                logger.debug(`[${txnId}] jira.service.js [findCustomFieldByName] Found GitHub URL in field: ${fId}`);
                return { fieldId: fId, value };
            }
        }
    }

    return { fieldId: null, value: null };
}

function extractTextFromFieldValue(value) {
    if (!value) return "";

    // Plain string
    if (typeof value === "string") {
        return value;
    }

    // ADF format
    if (value.type === "doc" && Array.isArray(value.content)) {
        return extractTextFromAdf(value.content);
    }

    // Try JSON stringify as last resort
    try {
        return JSON.stringify(value);
    } catch {
        return "";
    }
}

function extractRepositoryUrls(issue, fieldMapping, txnId) {
    const { fieldId, value } = findCustomFieldByName(issue, "Repository URLs", fieldMapping, txnId);

    if (!fieldId) {
        logger.warn(`[${txnId}] jira.service.js [extractRepositoryUrls] No field with GitHub URLs found`);
        return [];
    }

    if (!value) {
        logger.debug(`[${txnId}] jira.service.js [extractRepositoryUrls] Repository URLs field is empty`);
        return [];
    }

    logger.debug(`[${txnId}] jira.service.js [extractRepositoryUrls] Field ${fieldId} value type: ${typeof value}`);

    // Extract text from the field (could be ADF, wiki markup, or plain text)
    const text = extractTextFromFieldValue(value);

    // Extract GitHub URLs from text using regex
    // Handle various formats: plain URLs, wiki markup [url|text|smart-link], ADF
    const urlRegex = /https?:\/\/github\.com\/[^\s<>"'|\]\[]+/gi;
    const urls = text.match(urlRegex) || [];

    // Clean up URLs (remove trailing punctuation and .git suffix if present)
    const cleanedUrls = urls.map(url => {
        let cleaned = url.replace(/[.,;:!?)]+$/, "");
        // Normalize: remove .git suffix for consistency
        cleaned = cleaned.replace(/\.git$/, "");
        return cleaned;
    });

    logger.info(`[${txnId}] jira.service.js [extractRepositoryUrls] Found ${cleanedUrls.length} repository URLs from field ${fieldId}`);

    return [...new Set(cleanedUrls)]; // Remove duplicates
}

function formatIssueData(issue, fieldMapping, txnId) {
    logger.debug(`[${txnId}] jira.service.js [formatIssueData] Formatting issue data - issueKey: ${issue.key}`);

    const fields = issue.fields || {};
    const renderedFields = issue.renderedFields || {};
    const repositoryUrls = extractRepositoryUrls(issue, fieldMapping, txnId);

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
        repositoryUrls,
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
