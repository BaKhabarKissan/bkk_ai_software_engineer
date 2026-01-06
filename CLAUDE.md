# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agentic AI Backend for Jira Task Automation**

Express.js 5.x web application (CommonJS modules) with Pino logging.

### Purpose

Automate Jira tasks using AI. When a Jira ticket is created and assigned/labeled, this system automatically implements the task using Claude Code.

### Workflow

```
1. Jira ticket created → assigned or labeled
2. Jira webhook triggers this backend
3. Backend processes the trigger:
   - Fetches repository details
   - Creates branch with naming template
   - Claude Code implements the task
   - Creates PR for the branch
```

### Planned Integrations

- **Jira** - Webhook receiver, ticket details
- **GitHub/Git** - Clone repo, create branch, push, create PR
- **Claude Code** - AI agent to implement the task

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start with nodemon (auto-reload)
npm start         # Start production server
npm run lint      # Check for linting errors
npm run lint:fix  # Auto-fix linting errors
```

No tests configured yet.

## Code Style

ESLint enforced rules:
- 4-space indentation
- Double quotes
- Semicolons required
- Trailing newline required

Run `npm run lint:fix` before committing.

## Architecture

```
src/
  index.js                 # Entry point, loads dotenv and starts server
  server/server.js         # Express app configuration, routes
  middlewares/             # Express middlewares
    index.js               # Middleware exports
    txnId.middleware.js    # Transaction ID generator
    requestLogger.middleware.js  # Request logging
    errorHandler.middleware.js   # Global error handler
  services/                # Shared services
    log.service.js         # Logger service
    response.service.js    # Response utility (success/failure)
    validation.service.js  # Joi validation middleware
  utils/
    logger.js              # Pino logger with txnId support
  routes/<feature>/        # Feature-based route modules
    index.js               # Router definition with validation middleware
    <feature>.controller.js
    <feature>.service.js
    <feature>.validation.js  # Joi schemas only
  envs/
    .env.local             # Local environment variables
```

## Feature Module Pattern

### routes/index.js
```javascript
const express = require("express");
const { validateRequest } = require("../../services/validation.service");
const controller = require("./feature.controller");
const { schema } = require("./feature.validation");

const router = express.Router();

router.get("/", controller.list);
router.post("/", validateRequest(schema), controller.create);

module.exports = router;
```

### validation.js (Joi schemas only)
```javascript
const Joi = require("joi");

const createSchema = Joi.object({
    name: Joi.string().trim().min(1).required(),
});

module.exports = { createSchema };
```

### controller.js
```javascript
const { getLogger } = require("../../services/log.service");
const response = require("../../services/response.service");
const service = require("./feature.service");

const log = getLogger(__filename);

async function create(req, res, next) {
    const { txnId } = req;
    log.info("create", "Handling request", { txnId });

    try {
        const result = await service.create(req.body, txnId);
        log.info("create", "Success", { txnId });
        return response.success(res, "Created successfully", result, 201);
    } catch (error) {
        log.error("create", "Failed", { txnId, error: error.message });
        next(error);
    }
}

module.exports = { create };
```

### service.js
```javascript
const { getLogger } = require("../../services/log.service");

const log = getLogger(__filename);

async function create(data, txnId) {
    log.info("create", "Processing", { txnId });
    // Business logic here
    return result;
}

module.exports = { create };
```

## Response Service

Handles `res.json()` internally with consistent structure:

```javascript
const response = require("../../services/response.service");

// Success (default status 200)
response.success(res, "Message", data);
response.success(res, "Created", data, 201);

// Failure (default status 400)
response.failure(res, "Error message");
response.failure(res, "Not found", {}, 404);
response.failure(res, "Server error", {}, 500);
```

**Response structure:**
```json
{
    "success": true,
    "message": "Message",
    "data": { ... }
}
```

## Validation Service

Middleware factory using Joi schemas:

```javascript
const { validateRequest } = require("../../services/validation.service");

// Validate body (default)
router.post("/", validateRequest(schema), controller.create);

// Validate query params
router.get("/", validateRequest(querySchema, "query"), controller.list);

// Validate URL params
router.get("/:id", validateRequest(paramsSchema, "params"), controller.get);
```

## Logging

Log format: `[txnId] [file] [function] message`

```javascript
const { getLogger } = require("../../services/log.service");
const log = getLogger(__filename);

log.info("functionName", "message", { txnId });
log.error("functionName", "error", { txnId, error: err.message });
log.warn("functionName", "warning", { txnId });
log.debug("functionName", "debug info", { txnId });
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| LOG_LEVEL | Pino log level (trace/debug/info/warn/error) | info |
| GITHUB_ACCESS_TOKEN | GitHub API access token | - |
| JIRA_API_TOKEN | Atlassian Jira API token | - |

### Env File Style

Always use table-aligned format with double-quoted values:

```
KEY_NAME                                            ="value"
```

Example:
```
# Server Configuration
PORT                                                ="5000"
LOG_LEVEL                                           ="info"

# GitHub Configuration
GITHUB_ACCESS_TOKEN                                 ="ghp_xxx..."
```

Files: `src/envs/.env.local`, `src/envs/.env.stg`, `src/envs/.env.prod`
