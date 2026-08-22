# Release Candidate Notes (Step 10 QA)

## Scope
- Final QA and release-candidate preparation for the current repository state.
- No gameplay changes and no new player-facing features.

## Confirmed Bugs Fixed
1. **Build failure from stale JS module shadowing TS module**  
   - Reproduction: `npm run build` failed with `loadPlayerState is not exported by src/utils/storage.js`.
   - Severity: **High** (production build blocked).
   - Fix: Removed stale `src/utils/storage.js` so `src/utils/storage.ts` is used.
   - Verification: `npm run build` passes.

2. **Build failure from stale App.js shadowing App.tsx**  
   - Reproduction: `npm run build` failed with parse error in `src/App.js`.
   - Severity: **High** (production build blocked).
   - Fix: Removed stale `src/App.js`.
   - Verification: `npm run build` passes.

3. **Type-check failure in TS configuration/runtime imports**  
   - Reproduction: `npx tsc --noEmit` failed (missing JSX setting, import extension issue, strict warnings).
   - Severity: **Medium** (release validation blocked).
   - Fixes:
     - Added `"jsx": "react-jsx"` in `tsconfig.json`
     - Updated `src/main.tsx` import to `./App`
     - Removed/used unused symbols in `App.tsx`, `Crown.tsx`, `TapReward.tsx`
     - Tightened Telegram WebApp initialization null-safety in `src/utils/telegram.ts`
   - Verification: `npx tsc --noEmit` passes.

4. **Dependency audit vulnerabilities (Vite/esbuild chain)**  
   - Reproduction: `npm audit` reported 1 high + 1 moderate vulnerability.
   - Severity: **High** (security gate failed).
   - Fix: Upgraded dev dependencies:
     - `vite` → `^8.2.2`
     - `@vitejs/plugin-react` → `^6.1.0`
   - Verification: `npm audit` reports 0 vulnerabilities.

## Security Improvements
- Removed stale JS artifacts causing unexpected module resolution paths.
- Upgraded vulnerable toolchain dependencies in audited dependency tree.
- Improved strict type-safety around Telegram adapter initialization.

## Validation Summary (Executed)
- ✅ `npm run build`
- ✅ `npx tsc --noEmit`
- ✅ `npm audit`
- ❌ `npm run lint` (script not defined in repository)
- ❌ `npm test` (script not defined in repository)
- ❌ `npx prisma validate` (no Prisma schema in repository)
- ❌ `npx prisma migrate status` (no Prisma schema/migrations in repository)

## Known Limitations
- Repository currently contains a frontend-only implementation and does not include backend/API/admin/database systems required for full end-to-end checks in the Step 10 checklist.
- Telegram production WebView validation, ads provider callbacks, referrals, admin RBAC, and database migration integrity cannot be fully verified from this codebase state alone.

## Manual Actions Required
- Add/enable CI lint and test scripts (`npm run lint`, `npm test`) and associated tooling.
- Provide backend/API/DB services and Prisma schema for full production QA gates.
- Perform Telegram in-app device validation with production bot/domain configuration.
- Perform external-service verification (ads/referrals/admin backend) in staging/production environment.
