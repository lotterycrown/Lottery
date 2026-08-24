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
- backend build uses scripts/build.sh (POSIX sh) — inline ${VAR:-default} in package.json scripts fails in dash/sh on Render.
- prisma and @prisma/client are pinned to EXACT 5.22.0 (no ^) — npx/caret resolves to Prisma 7 which breaks the schema.
- Do NOT use npx in build scripts; it can fetch latest from registry instead of local node_modules.
- All build-time tooling (typescript, @types/*, prisma CLI) is in dependencies because Render skips devDependencies with NODE_ENV=production.
- Root build is self-contained: installs backend deps, builds backend, then frontend. Works whether Render builds from root or backend/.
- Verified with clean-room production-only install + build + migrate + server start simulation.

- prisma and @prisma/client are pinned to EXACT 5.22.0 (no ^) — npx/caret resolves to Prisma 7 which breaks the schema (datasource url removed in v7).
- Do NOT use npx in build scripts; it can fetch latest from registry instead of local node_modules.
- All build-time tooling (typescript, @types/*, prisma CLI) is in dependencies because Render skips devDependencies with NODE_ENV=production.
- Verified with clean-room production-only install + build + migrate + server start simulation.

- Render installs with NODE_ENV=production which SKIPS devDependencies — everything needed at build time must be in `dependencies`: typescript, tsx, @types/*, prisma CLI, @types/node.
- Verified by simulating a production-only install (`yarn install --production`) + build in a clean checkout.

## Gotchas
- pino v8 + NodeNext: use `import { pino } from 'pino'` (default import is not callable).
- `@types/uuid` must stay at ^9 (v10+ is an empty stub that breaks `tsc`).
- Prisma BigInt fields: serialize API responses with `backend/src/utils/serialize.ts` (`serializeBigInt`) — `res.json()` throws on raw BigInt.
- `@types/jsonwebtoken`, `@types/cors`, `@types/pino-pretty` were added as backend devDeps; keep them.
