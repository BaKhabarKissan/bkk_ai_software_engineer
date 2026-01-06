const pino = require("pino");
const path = require("path");

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

/**
 * Formats log message with optional transaction ID
 * @param {string} txnId - Transaction ID (optional)
 * @param {string} file - Filename
 * @param {string} fn - Function name
 * @param {string} message - Log message
 * @returns {string} Formatted log message
 */
function formatMessage(txnId, file, fn, message) {
    if (txnId) {
        return `[${txnId}] [${file}] [${fn}] ${message}`;
    }
    return `[${file}] [${fn}] ${message}`;
}

/**
 * Creates a logger with file and function context
 * Log format: "[txnId] [file] [function] message" or "[file] [function] message"
 * @param {string} filename - The filename (use __filename)
 * @returns {object} Logger methods with context
 */
function createLogger(filename) {
    const file = path.basename(filename);

    return {
        info: (fn, message, data = {}) => {
            const txnId = data.txnId;
            logger.info({ ...data }, formatMessage(txnId, file, fn, message));
        },
        error: (fn, message, data = {}) => {
            const txnId = data.txnId;
            logger.error({ ...data }, formatMessage(txnId, file, fn, message));
        },
        warn: (fn, message, data = {}) => {
            const txnId = data.txnId;
            logger.warn({ ...data }, formatMessage(txnId, file, fn, message));
        },
        debug: (fn, message, data = {}) => {
            const txnId = data.txnId;
            logger.debug({ ...data }, formatMessage(txnId, file, fn, message));
        },
    };
}

module.exports = { logger, createLogger, generateTxnId };
