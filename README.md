# BKK AI Software Engineer

Express.js 5.x web application with Pino logging.

## Prerequisites

- Node.js 18+

## Installation

```bash
npm install
```

## Configuration

Copy and configure environment variables:

```bash
cp src/envs/.env.local.example src/envs/.env.local
```

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| LOG_LEVEL | Log level (trace/debug/info/warn/error) | info |

## Usage

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/chat | Get messages |
| POST | /api/chat | Send message |

## Project Structure

```
src/
  index.js              # Entry point
  server/server.js      # Express configuration
  services/             # Shared services
  utils/                # Utilities (logger)
  routes/<feature>/     # Feature modules
    index.js
    <feature>.controller.js
    <feature>.service.js
    <feature>.validation.js
  envs/                 # Environment files
```
