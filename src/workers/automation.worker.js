const { logger } = require("../services/log.service");
const queueService = require("../services/queue.service");
const claudeCodeService = require("../services/claudeCode.service");

async function processTask(task, txnId) {
    logger.info(`[${txnId}] automation.worker.js [processTask] Processing automation task - issueKey: ${task.issueKey}`);

    const { issueKey, issue } = task;

    // Log task details
    logger.info(`[${txnId}] automation.worker.js [processTask] Issue summary: ${issue.summary}`);
    logger.debug(issue, `[${txnId}] automation.worker.js [processTask] Full issue data`);

    // Step 1: Validate repository URLs
    if (!issue.repositoryUrls || issue.repositoryUrls.length === 0) {
        const errorMsg = "No repository URLs found in issue. Please add repository URL to 'Repository URLs' field.";
        logger.error(`[${txnId}] automation.worker.js [processTask] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    // For now, process only the first repository URL
    const repoUrl = issue.repositoryUrls[0];
    logger.info(`[${txnId}] automation.worker.js [processTask] Using repository: ${repoUrl}`);

    // Step 2: Run Claude Code to handle everything (clone, branch, implement, commit, push, PR)
    logger.info(`[${txnId}] automation.worker.js [processTask] Running Claude Code for full automation`);

    const result = await claudeCodeService.runClaudeCode(issue, repoUrl, txnId);

    logger.info(`[${txnId}] automation.worker.js [processTask] Claude Code completed`);
    logger.debug(result, `[${txnId}] automation.worker.js [processTask] Claude Code result`);

    if (result.prUrl) {
        logger.info(`[${txnId}] automation.worker.js [processTask] PR created: ${result.prUrl}`);
    }

    // TODO: Step 3: Update Jira ticket status (future implementation)

    logger.info(`[${txnId}] automation.worker.js [processTask] Task completed successfully - issueKey: ${issueKey}`);

    return {
        success: true,
        issueKey,
        branchName: result.branchName,
        prUrl: result.prUrl,
    };
}

async function startWorker() {
    logger.info("automation.worker.js [startWorker] Starting automation worker");

    try {
        await queueService.consumeTasks(processTask);
        logger.info("automation.worker.js [startWorker] Automation worker started successfully");
    } catch (error) {
        logger.error(`automation.worker.js [startWorker] Failed to start worker: ${error.message}`);
        process.exit(1);
    }
}

// Start the worker
startWorker();
