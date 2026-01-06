/**
 * Send success response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function success(res, message, data = {}, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

/**
 * Send failure response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {object} data - Additional error data
 * @param {number} statusCode - HTTP status code (default: 400)
 */
function failure(res, message, data = {}, statusCode = 400) {
    return res.status(statusCode).json({
        success: false,
        message,
        data,
    });
}

module.exports = {
    success,
    failure,
};
