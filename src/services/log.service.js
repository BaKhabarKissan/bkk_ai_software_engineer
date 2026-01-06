const { createLogger, generateTxnId } = require("../utils/logger");

function getLogger(filename) {
    return createLogger(filename);
}

module.exports = { getLogger, generateTxnId };
