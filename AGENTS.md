# Crown Tap Game — Agent Notes

## Architecture
- React 18 + Vite + zustand frontend (root `src/`), Express + Prisma (PostgreSQL) + TypeScript backend (`backend/`).
- Backend is ESM (`"type": "module"`) with `module`/`moduleResolution: "NodeNext"` — all relative imports in `backend/src` MUST use `.js` extensions.
- Root tsconfig is Vite-style (`moduleResolution: "Bundler"`, `noEmit: true`) and type-checks the frontend only.

## Build / Test
- `yarn --cwd backend build` → `prisma generate && tsc -p tsconfig.build.json` (tests excluded from production emit) → `backend/dist/`.
- `yarn build` (root) → backend build + frontend `tsc` type-check + `vite build` → root `dist/`.
- Backend tests: `yarn --cwd backend test:run` (vitest). Requires `DATABASE_URL` pointing at a migrated Postgres (reward.test.ts hits the real DB).
- Lint: `yarn --cwd backend lint` (eslint 8, legacy `.eslintrc.cjs`).

## Deploy (Render)
- `render.yaml` blueprint: web service rooted at `backend/`, build `yarn install && yarn build && yarn prisma:migrate:prod`, start `yarn start` (`node dist/server.js`).
- Server binds `0.0.0.0` on `process.env.PORT`; health check at `/health`.
- Env: `DATABASE_URL`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `NODE_ENV=production`.

## Render deployment
- Render installs with NODE_ENV=production which SKIPS devDependencies — everything needed at build time must be in `dependencies`: typescript, tsx, @types/*, prisma CLI, @types/node.
- Verified by simulating a production-only install (`yarn install --production`) + build in a clean checkout.

## Gotchas
- pino v8 + NodeNext: use `import { pino } from 'pino'` (default import is not callable).
- `@types/uuid` must stay at ^9 (v10+ is an empty stub that breaks `tsc`).
- Prisma BigInt fields: serialize API responses with `backend/src/utils/serialize.ts` (`serializeBigInt`) — `res.json()` throws on raw BigInt.
- `@types/jsonwebtoken`, `@types/cors`, `@types/pino-pretty` were added as backend devDeps; keep them.
