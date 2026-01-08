# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agentic AI Backend for Jira Task Automation**

Express.js 5.x web application (CommonJS modules) with Pino logging.

### Purpose

Automate Jira tasks using AI. When a Jira ticket is created and assigned/labeled, this system automatically implements the task using Claude Code.

### Workflow

```
1. Jira ticket created → labeled with "claude-code"
2. Jira webhook triggers POST /api/jira/webhook
3. Backend processes the trigger:
   - Validates webhook payload
   - Extracts issue data (key, summary, description, labels)
   - Fetches complete issue details via Jira API
   - Publishes task to RabbitMQ queue
4. Worker consumes task from queue:
   - TODO: Fetches repository details
   - TODO: Creates branch with naming template
   - TODO: Claude Code implements the task
   - TODO: Creates PR for the branch
```

### Current Integrations

- **Jira Webhook** - ✅ Implemented (`/api/jira/webhook`)
  - Handles `jira:issue_created` and `jira:issue_updated` events
  - Filters by assignee and labels
  - Detects changes to assignee, labels, status
- **Jira API** - ✅ Implemented (`src/services/jira.service.js`)
  - Fetches complete issue details including comments, attachments, links
  - Handles Atlassian Document Format (ADF) for descriptions
  - Uses `jira.js` library with basic auth
- **RabbitMQ** - ✅ Implemented (`src/services/rabbitmq.service.js`, `src/services/queue.service.js`)
  - Message queue for async task processing
  - Durable queues with persistent messages
  - Dead letter exchange for failed tasks
  - Worker consumer (`src/workers/automation.worker.js`)

### Planned Integrations

- **GitHub/Git** - Clone repo, create branch, push, create PR
- **Claude Code** - AI agent to implement the task

## Commands

```bash
npm install          # Install dependencies
npm run start:local  # Start server with local env (nodemon)
npm run start:stg    # Start server with staging env
npm run start:prod   # Start server with production env
npm run worker:local # Start worker with local env
npm run worker:stg   # Start worker with staging env
npm run worker:prod  # Start worker with production env
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting errors
```

No tests configured yet.

## Code Style

ESLint enforced rules:
- 4-space indentation
- Double quotes
- Semicolons required
- Trailing newline required
- **camelCase** for folder and file names in routes
- **camelCase** for variables (not SCREAMING_SNAKE_CASE)
- **Destructure env vars** at the top below imports: `const { PORT } = process.env;`

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
    log.service.js         # Logger service (exports native Pino logger)
    response.service.js    # Response utility (success/failure)
    validation.service.js  # Joi validation middleware
    jira.service.js        # Jira API client
    rabbitmq.service.js    # RabbitMQ connection management
    queue.service.js       # Queue operations (publish/consume)
  workers/                 # Background workers
    automation.worker.js   # Task consumer for automation queue
  utils/
    logger.utils.js        # Pino logger configuration
  routes/<featureName>/    # Feature-based route modules (camelCase)
    index.js               # Router definition with validation middleware
    <featureName>.controller.js
    <featureName>.service.js
    <featureName>.validation.js  # Joi schemas only
  envs/
    .env.local             # Local environment variables
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Route folders | camelCase | `jiraWebhook/` |
| Route files | camelCase.type.js | `jiraWebhook.controller.js` |
| Utils files | name.utils.js | `logger.utils.js` |
| Middleware files | name.middleware.js | `txnId.middleware.js` |
| Service files | name.service.js | `log.service.js` |

## Feature Module Pattern

### routes/featureName/index.js
```javascript
const express = require("express");
const { validateRequest } = require("../../services/validation.service");
const controller = require("./featureName.controller");
const { schema } = require("./featureName.validation");

const router = express.Router();

router.get("/", controller.list);
router.post("/", validateRequest(schema), controller.create);

module.exports = router;
```

### featureName.validation.js (Joi schemas only)
```javascript
const Joi = require("joi");

const createSchema = Joi.object({
    name: Joi.string().trim().min(1).required(),
});

module.exports = { createSchema };
```

### featureName.controller.js
```javascript
const { logger } = require("../../services/log.service");
const response = require("../../services/response.service");
const service = require("./featureName.service");

async function create(req, res, next) {
    const { txnId } = req;
    logger.info(`[${txnId}] featureName.controller.js [create] Handling request`);

    try {
        const result = await service.create(req.body, txnId);
        logger.info(`[${txnId}] featureName.controller.js [create] Success`);
        return response.success(res, "Created successfully", result, 201);
    } catch (error) {
        logger.error(`[${txnId}] featureName.controller.js [create] Failed: ${error.message}`);
        next(error);
    }
}

module.exports = { create };
```

### featureName.service.js
```javascript
const { logger } = require("../../services/log.service");

async function create(data, txnId) {
    logger.info(`[${txnId}] featureName.service.js [create] Processing`);
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

**Native Pino syntax** with Unix-style output (single line).

```javascript
const { logger } = require("../../services/log.service");

// Simple message
logger.info("file.js [functionName] Message here");

// With txnId (in request context)
logger.info(`[${txnId}] file.js [functionName] Message here`);

// With data object (data first, message second)
logger.debug(dataObject, `[${txnId}] file.js [functionName] Debug info`);

// Error logging
logger.error(`[${txnId}] file.js [functionName] Error: ${error.message}`);
```

**Log levels:** trace, debug, info, warn, error, fatal

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| LOG_LEVEL | Pino log level (trace/debug/info/warn/error) | info |
| GITHUB_ACCESS_TOKEN | GitHub API access token | - |
| JIRA_HOST | Jira Cloud instance URL (e.g., https://your-domain.atlassian.net) | - |
| JIRA_EMAIL | Email for Jira API authentication | - |
| JIRA_API_TOKEN | Atlassian Jira API token | - |
| JIRA_TRIGGER_LABEL | Label that triggers automation | claude-code |
| RABBITMQ_URL | RabbitMQ connection URL | amqp://guest:guest@localhost:5672 |
| RABBITMQ_QUEUE_AUTOMATION | Queue name for automation tasks | jira-automation-tasks |
| RABBITMQ_QUEUE_DLX | Dead letter queue name | jira-automation-dlx |

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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/jira/webhook | Jira webhook receiver |
| GET | /api/chat | Get messages |
| POST | /api/chat | Send message |

## Jira Webhook

**Trigger label:** `claude-code`

**Supported events:**
- `jira:issue_created` - Only if issue has `claude-code` label
- `jira:issue_updated` - Only if `claude-code` label was just added

**Webhook URL:** `https://<your-domain>/api/jira/webhook`

For local testing with ngrok:
```bash
ngrok http 5000
# Use: https://<ngrok-url>/api/jira/webhook
```
