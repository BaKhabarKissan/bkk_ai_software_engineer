const { logger } = require("../services/log.service");
const queueService = require("../services/queue.service");

async function processTask(task, txnId) {
    logger.info(`[${txnId}] automation.worker.js [processTask] Processing automation task - issueKey: ${task.issueKey}`);

    const { issueKey, issue } = task;

    // Log task details
    logger.info(`[${txnId}] automation.worker.js [processTask] Issue summary: ${issue.summary}`);
    logger.debug(issue, `[${txnId}] automation.worker.js [processTask] Full issue data`);

    // TODO: Implement automation workflow
    // 1. Extract repository URL from issue description
    // 2. Clone repository
    // 3. Create branch with naming template (e.g., feature/{issueKey}-{summary})
    // 4. Run Claude Code to implement the task
    // 5. Commit changes
    // 6. Push branch
    // 7. Create PR
    // 8. Update Jira ticket status

    logger.info(`[${txnId}] automation.worker.js [processTask] Task processed - issueKey: ${issueKey}`);

    return { success: true, issueKey };
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
