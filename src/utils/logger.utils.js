const pino = require("pino");

const { LOG_LEVEL } = process.env;

const logger = pino({
    level: LOG_LEVEL || "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
            messageFormat: "{msg}",
            singleLine: true,
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
