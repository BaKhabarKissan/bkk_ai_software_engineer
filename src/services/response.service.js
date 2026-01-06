/**
 * Create success response payload
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @returns {object} Response payload
 */
function success(message, data = {}) {
    return {
        success: true,
        message,
        data,
    };
}

/**
 * Create failure response payload
 * @param {string} message - Error message
 * @param {object} data - Additional error data
 * @returns {object} Response payload
 */
function failure(message, data = {}) {
    return {
        success: false,
        message,
        data,
    };
}

module.exports = {
    success,
    failure,
};
