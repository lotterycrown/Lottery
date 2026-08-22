# Release Candidate Checklist (Step 10)

- [x] Repository audit completed for current codebase scope
- [x] Production build executed and passing (`npm run build`)
- [x] Type-check executed and passing (`npx tsc --noEmit`)
- [x] Dependency security audit executed and passing (`npm audit`)
- [x] Confirmed build/type/security issues fixed and re-verified
- [ ] Lint gate passing (`npm run lint`) — **MANUAL ACTION REQUIRED** (script missing)
- [ ] Test gate passing (`npm test`) — **MANUAL ACTION REQUIRED** (script missing)
- [ ] Prisma schema validation (`npx prisma validate`) — **MANUAL ACTION REQUIRED** (schema missing)
- [ ] Prisma migration validation (`npx prisma migrate status`) — **MANUAL ACTION REQUIRED** (schema missing)
- [ ] Full auth/taps/XP/levels/crowns/tasks/rewards/referrals/admin/API E2E — **NOT VERIFIED** (backend systems not present in this repository)
- [ ] Telegram WebView production validation — **MANUAL ACTION REQUIRED**
- [ ] Ads provider callback verification — **MANUAL ACTION REQUIRED**
- [ ] Referral backend qualification/reward integrity verification — **MANUAL ACTION REQUIRED**
- [ ] Admin role/permissions/audit-log verification — **MANUAL ACTION REQUIRED**
- [ ] Database migration/constraint/concurrency verification — **MANUAL ACTION REQUIRED**
- [ ] Performance/load test sign-off — **MANUAL ACTION REQUIRED**
- [ ] Security regression suite sign-off (Step 8 full backend scope) — **MANUAL ACTION REQUIRED**

## Sign-off
- Engineering: [ ]
- QA: [ ]
- Security: [ ]
- Product/Release Owner: [ ]
