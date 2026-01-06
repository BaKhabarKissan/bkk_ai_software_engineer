const { getLogger } = require("./log.service");
const response = require("./response.service");

const log = getLogger(__filename);

/**
 * Middleware factory for request validation using Joi schemas
 * @param {object} schema - Joi schema to validate against
 * @param {string} source - Request property to validate: "body", "query", "params"
 * @returns {function} Express middleware
 */
function validateRequest(schema, source = "body") {
    return (req, res, next) => {
        const { txnId } = req;
        const data = req[source];

        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessage = error.details.map((d) => d.message).join(", ");
            log.warn("validateRequest", `Validation failed: ${errorMessage}`, { txnId });
            return response.failure(res, errorMessage);
        }

        req[source] = value;
        next();
    };
}

module.exports = {
    validateRequest,
};
