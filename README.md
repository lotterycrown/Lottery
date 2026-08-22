# Crown - Step 4 Full Stack

This repository now includes a production-oriented architecture for the Telegram Mini App game:

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL + Prisma
- **Shared**: TypeScript game/progression/API types

## Security Model

- Backend is authoritative for rewards, XP, level, crown tier, balance, and task state.
- Telegram `initData` is validated on the backend before issuing an auth token.
- Tap idempotency enforced by `(userId, requestId)` uniqueness in `TapRequest`.
- Reward ledger is immutable in `RewardTransaction`.
- Coins are stored in integer micro-units (`coinsMicro`).

## Environment

Copy `.env.example` to `.env` and fill in values:

- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `API_PORT`
- `CLIENT_URL`
- `NODE_ENV`

## Commands

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev         # frontend
npm run dev:server  # backend
npm run lint
npm run test
npm run build
```

## Docker

```bash
docker-compose up
```

## API Endpoints

- `POST /api/auth/telegram`
- `GET /api/me`
- `GET /api/health`
- `GET /api/game/state`
- `GET /api/game/config`
- `POST /api/game/tap`
- `GET /api/tasks`
- `POST /api/tasks/:taskId/claim`

All responses use:

```json
{ "success": true, "data": {} }
```

or

```json
{ "success": false, "error": { "code": "...", "message": "..." } }
```

## Notes

- In development, the frontend uses a `dev:<telegramId>:<username>` initData fallback when Telegram WebApp data is unavailable.
- Legacy Step 1-3 localStorage values are migrated once through authenticated backend flow with capped limits.
