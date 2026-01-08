const moment = require("moment-timezone");
const { logger } = require("./log.service");
const rabbitmqService = require("./rabbitmq.service");

const { RABBITMQ_QUEUE_AUTOMATION, RABBITMQ_QUEUE_DLX } = process.env;

const DLX_EXCHANGE = "dlx-exchange";

async function assertQueues() {
    const channel = await rabbitmqService.getChannel();

    const automationQueue = RABBITMQ_QUEUE_AUTOMATION || "jira-automation-tasks";
    const dlxQueue = RABBITMQ_QUEUE_DLX || "jira-automation-dlx";

    logger.info("queue.service.js [assertQueues] Asserting queues and exchanges");

    // Assert dead letter exchange
    await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });

    // Assert dead letter queue
    await channel.assertQueue(dlxQueue, {
        durable: true,
    });

    // Bind DLX queue to DLX exchange
    await channel.bindQueue(dlxQueue, DLX_EXCHANGE, automationQueue);

    // Assert main automation queue with DLX configuration
    await channel.assertQueue(automationQueue, {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": DLX_EXCHANGE,
            "x-dead-letter-routing-key": automationQueue,
        },
    });

    logger.info(`queue.service.js [assertQueues] Queues asserted - automation: ${automationQueue}, dlx: ${dlxQueue}`);

    return { automationQueue, dlxQueue };
}

async function publishTask(task, txnId) {
    logger.info(`[${txnId}] queue.service.js [publishTask] Publishing task - issueKey: ${task.issueKey}`);

    const channel = await rabbitmqService.getChannel();
    const { automationQueue } = await assertQueues();

    const message = {
        ...task,
        txnId,
        publishedAt: moment().toISOString(),
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));

    const published = channel.sendToQueue(automationQueue, messageBuffer, {
        persistent: true, // deliveryMode: 2
        contentType: "application/json",
    });

    if (!published) {
        logger.error(`[${txnId}] queue.service.js [publishTask] Failed to publish task - issueKey: ${task.issueKey}`);
        throw new Error("Failed to publish task to queue");
    }

    logger.info(`[${txnId}] queue.service.js [publishTask] Task published successfully - issueKey: ${task.issueKey}`);

    return { published: true, queue: automationQueue };
}

async function consumeTasks(handler) {
    logger.info("queue.service.js [consumeTasks] Starting task consumer");

    const channel = await rabbitmqService.getChannel();
    const { automationQueue } = await assertQueues();

    await channel.consume(automationQueue, async (msg) => {
        if (!msg) {
            return;
        }

        let task;
        try {
            task = JSON.parse(msg.content.toString());
        } catch (parseError) {
            logger.error(`queue.service.js [consumeTasks] Failed to parse message: ${parseError.message}`);
            channel.reject(msg, false); // Don't requeue malformed messages
            return;
        }

        const taskTxnId = task.txnId || generateTxnId();

        logger.info(`[${taskTxnId}] queue.service.js [consumeTasks] Processing task - issueKey: ${task.issueKey}`);

        try {
            await handler(task, taskTxnId);
            channel.ack(msg);
            logger.info(`[${taskTxnId}] queue.service.js [consumeTasks] Task completed - issueKey: ${task.issueKey}`);
        } catch (error) {
            logger.error(`[${taskTxnId}] queue.service.js [consumeTasks] Task failed - issueKey: ${task.issueKey}, error: ${error.message}`);
            // Reject and send to DLX
            channel.reject(msg, false);
        }
    }, { noAck: false });

    logger.info(`queue.service.js [consumeTasks] Consumer started on queue: ${automationQueue}`);
}

function generateTxnId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    publishTask,
    consumeTasks,
    assertQueues,
};
