const pino = require("pino");

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
        },
    },
});

/**
 * Generates a 6-digit transaction ID
 * @returns {string} 6-digit transaction ID
 */
function generateTxnId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { logger, generateTxnId };
