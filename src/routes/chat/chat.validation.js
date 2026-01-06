const Joi = require("joi");

const sendMessageSchema = Joi.object({
    message: Joi.string().trim().min(1).required().messages({
        "string.base": "message must be a string",
        "string.empty": "message cannot be empty",
        "any.required": "message is required",
    }),
});

module.exports = {
    sendMessageSchema,
};
