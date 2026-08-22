# Backend Production Deployment Guide

> This repository currently contains the Telegram Mini App frontend.  
> The following backend checklist is the production deployment contract for the API service.

## Production Commands

```bash
npm run build
NODE_ENV=production npm start
```

## Recommended API Scripts

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "ts-node prisma/seed.ts",
    "prisma:generate": "prisma generate",
    "prisma:validate": "prisma validate",
    "pre-deployment-check": "npm run type-check && npm run lint && npm run test && npm run build && npm run prisma:validate"
  }
}
```

## Startup Validation Requirements

- Validate required environment variables before server start.
- Verify database connection before listening on API port.
- Exit with non-zero status if validation fails.

## Graceful Shutdown Requirements

- Handle `SIGTERM` and stop accepting new connections.
- Close HTTP server first.
- Disconnect database clients.
- Force exit if shutdown exceeds 30 seconds.

## Health Endpoints

- `GET /api/health`: basic uptime/status.
- `GET /api/health/detailed`: admin-protected detailed service checks, including DB ping.

## Database Connection Handling

- Run a startup DB probe (`SELECT 1`) before serving traffic.
- Fail fast if the DB is unavailable.
