# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Express.js 5.x web application (CommonJS modules) with Pino logging.

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
  server/server.js         # Express app configuration, middleware, routes
  services/                # Shared services
    log.service.js         # Logger service (wraps utils/logger)
  utils/
    logger.js              # Pino logger with txnId support
  routes/<feature>/        # Feature-based route modules
    index.js               # Router definition
    <feature>.controller.js
    <feature>.service.js
    <feature>.validation.js
  envs/
    .env.local             # Local environment variables
```

**Layered pattern per feature module:**
- `controller` - HTTP request/response handling
- `service` - Business logic
- `validation` - Request validation middleware

## Logging

Log format: `[txnId] [file] [function] message`

Each request gets a 6-digit transaction ID (`req.txnId`) for tracing. Pass `txnId` in the data object:

```javascript
const { getLogger } = require("../../services/log.service");
const log = getLogger(__filename);

log.info("functionName", "message", { txnId: req.txnId });
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| LOG_LEVEL | Pino log level (trace/debug/info/warn/error) | info |
