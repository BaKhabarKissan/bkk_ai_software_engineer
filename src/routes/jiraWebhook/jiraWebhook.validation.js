const Joi = require("joi");

const webhookSchema = Joi.object({
    webhookEvent: Joi.string().required().messages({
        "string.base": "webhookEvent must be a string",
        "any.required": "webhookEvent is required",
    }),
    issue: Joi.object({
        id: Joi.string().required(),
        key: Joi.string().required(),
        fields: Joi.object({
            summary: Joi.string().allow("", null),
            description: Joi.any(),
            assignee: Joi.object({
                accountId: Joi.string(),
                displayName: Joi.string(),
                emailAddress: Joi.string(),
            }).allow(null),
            labels: Joi.array().items(Joi.string()),
            status: Joi.object({
                name: Joi.string(),
            }),
            project: Joi.object({
                key: Joi.string(),
                name: Joi.string(),
            }),
            issuetype: Joi.object({
                name: Joi.string(),
            }),
        }).unknown(true),
    }).unknown(true).required().messages({
        "any.required": "issue is required",
    }),
    user: Joi.object({
        accountId: Joi.string(),
        displayName: Joi.string(),
    }).unknown(true),
    changelog: Joi.object({
        items: Joi.array().items(Joi.object({
            field: Joi.string(),
            fromString: Joi.string().allow("", null),
            toString: Joi.string().allow("", null),
        }).unknown(true)),
    }),
    timestamp: Joi.number(),
}).unknown(true);

module.exports = {
    webhookSchema,
};
