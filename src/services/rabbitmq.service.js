const amqp = require("amqplib");
const { logger } = require("./log.service");

const { RABBITMQ_URL } = process.env;

let connection = null;
let channel = null;

async function getConnection() {
    if (connection) {
        return connection;
    }

    if (!RABBITMQ_URL) {
        throw new Error("Missing RabbitMQ configuration: RABBITMQ_URL is required");
    }

    logger.info("rabbitmq.service.js [getConnection] Establishing RabbitMQ connection");

    connection = await amqp.connect(RABBITMQ_URL);

    connection.on("error", (err) => {
        logger.error(`rabbitmq.service.js [connection] Connection error: ${err.message}`);
        connection = null;
        channel = null;
    });

    connection.on("close", () => {
        logger.warn("rabbitmq.service.js [connection] Connection closed");
        connection = null;
        channel = null;
    });

    logger.info("rabbitmq.service.js [getConnection] RabbitMQ connection established");

    return connection;
}

async function getChannel() {
    if (channel) {
        return channel;
    }

    const conn = await getConnection();

    logger.info("rabbitmq.service.js [getChannel] Creating RabbitMQ channel");

    channel = await conn.createChannel();

    // Prefetch 1 message at a time for fair dispatch
    await channel.prefetch(1);

    channel.on("error", (err) => {
        logger.error(`rabbitmq.service.js [channel] Channel error: ${err.message}`);
        channel = null;
    });

    channel.on("close", () => {
        logger.warn("rabbitmq.service.js [channel] Channel closed");
        channel = null;
    });

    logger.info("rabbitmq.service.js [getChannel] RabbitMQ channel created");

    return channel;
}

async function closeConnection() {
    logger.info("rabbitmq.service.js [closeConnection] Closing RabbitMQ connection");

    if (channel) {
        await channel.close();
        channel = null;
    }

    if (connection) {
        await connection.close();
        connection = null;
    }

    logger.info("rabbitmq.service.js [closeConnection] RabbitMQ connection closed");
}

// Graceful shutdown
process.on("SIGINT", async () => {
    await closeConnection();
});

process.on("SIGTERM", async () => {
    await closeConnection();
});

module.exports = {
    getConnection,
    getChannel,
    closeConnection,
};
