# Crown Tap Game - Full Stack Implementation

## Architecture Overview

### Frontend (React + TypeScript + Vite)
- Telegram Mini App integration
- Real-time game UI with animations
- Zustand state management
- Tailwind CSS styling
- Mobile-optimized responsive design

### Backend (Node.js + Express + TypeScript)
- RESTful API with JWT authentication
- PostgreSQL database with Prisma ORM
- Server-authoritative reward processing
- Telegram Mini App signature verification
- Admin dashboard with role-based access
- Comprehensive audit logging
- Analytics and monitoring

### Key Features Implemented

✅ **Authentication**
- Telegram Mini App login
- JWT token-based sessions
- Server-side user verification

✅ **Gameplay**
- Tap mechanics with server-validated rewards
- XP and leveling system (1-50+)
- Crown progression: Bronze → Silver → Gold
- Rate limiting and cooldowns
- Idempotent tap processing

✅ **Rewards System**
- Immutable transaction ledger
- Configurable reward values (micro-units)
- Admin-controlled economics
- Audit logging of all changes

✅ **Tasks**
- Dynamic task list
- Progress tracking
- Reward claiming with idempotency
- Task cooldowns

✅ **Referral System**
- Unique referral codes per user
- Telegram startapp deep links
- Referral qualification tracking
- Automatic reward distribution
- Self-referral protection

✅ **Admin Panel**
- Configuration management
- User management
- Analytics dashboard
- Audit log viewing
- Secure admin authentication

✅ **Analytics**
- Daily user metrics
- Engagement tracking
- Reward statistics
- Date-range filtering

## Project Structure

```
lottery/
├── src/                          # Frontend (React)
│   ├── components/
│   │   ├── Crown.tsx            # Main game element
│   │   ├── Header.tsx           # User info display
│   │   ├── Balance.tsx          # Balance display
│   │   ├── CoinParticles.tsx    # Particle effects
│   │   ├── TapReward.tsx        # Floating reward text
│   │   └── BottomNavigation.tsx # Tab navigation
│   ├── pages/
│   │   └── Home.tsx             # Main game screen
│   ├── hooks/
│   │   ├── useGameState.ts      # Local game state (deprecated)
│   │   ├── useGameStore.ts      # Zustand game store (NEW)
│   │   ├── useAuthStore.ts      # Zustand auth store (NEW)
│   │   ├── useTapEffect.ts      # Tap animation state
│   │   └── useTelegramAuth.ts   # Telegram login (NEW)
│   ├── services/
│   │   └── api.ts              # Backend API client (NEW)
│   ├── utils/
│   │   ├── telegram.ts         # Telegram integration
│   │   ├── particle.ts         # Particle system
│   │   └── storage.ts          # Local storage (for cache)
│   ├── styles/
│   │   └── globals.css         # Global styles
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── config/                 # App configuration
│
├── backend/                      # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts         # Authentication endpoints
│   │   │   ├── taps.ts         # Tap gameplay endpoints
│   │   │   ├── tasks.ts        # Task endpoints
│   │   │   ├── referrals.ts    # Referral endpoints
│   │   │   ├── ads.ts          # Ad reward endpoints
│   │   │   ├── admin.ts        # Admin endpoints
│   │   │   └── health.ts       # Health check
│   │   ├── services/
│   │   │   ├── user.service.ts        # User operations
│   │   │   └── reward.service.ts      # Reward processing
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT authentication
│   │   │   ├── validation.ts   # Request validation
│   │   │   └── errorHandler.ts # Error handling
│   │   ├── utils/
│   │   │   ├── logger.ts       # Logging utility
│   │   │   ├── jwt.ts          # JWT token management
│   │   │   ├── telegram.ts     # Telegram verification
│   │   │   ├── errors.ts       # Custom error classes
│   │   │   └── idempotency.ts  # Idempotency utilities
│   │   ├── db/
│   │   │   ├── index.ts        # Prisma client
│   │   │   └── seed.ts         # Database seeding
│   │   ├── config/
│   │   │   └── constants.ts    # Game constants
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces
│   │   ├── __tests__/
│   │   │   ├── reward.test.ts  # Reward system tests
│   │   │   └── telegram.test.ts # Telegram auth tests
│   │   └── server.ts           # Main server file
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── seed.ts             # Seed script
│   │   └── migrations/
│   │       └── 001_init/
│   │           └── migration.sql # Initial migration
│   ├── .env.example            # Environment template
│   ├── .eslintrc.json          # ESLint configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── vitest.config.ts        # Test configuration
│   ├── package.json            # Backend dependencies
│   ├── README.md               # Backend documentation
│   ├── DEPLOYMENT_RUNBOOK.md   # Deployment guide
│   └── ENVIRONMENT_VARIABLES.md # Environment documentation
│
├── index.html                   # HTML entry point
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # Frontend TypeScript config
├── vite.config.ts               # Vite configuration
├── package.json                 # Frontend dependencies
└── README.md                    # Project documentation
```

## Data Flow

### Authentication Flow
```
1. Frontend: User opens Mini App in Telegram
2. Frontend: Telegram WebApp provides initData
3. Frontend: Call POST /auth/login with initData
4. Backend: Verify Telegram signature
5. Backend: Find or create user in database
6. Backend: Return JWT token
7. Frontend: Store token in localStorage
8. Frontend: Include token in all subsequent requests
```

### Tap Flow
```
1. Frontend: User taps Crown
2. Frontend: Generate idempotency key (UUID)
3. Frontend: Call POST /taps with key + timestamp
4. Backend: Check if key exists (prevent duplicates)
5. Backend: Validate rate limiting (max taps/hour)
6. Backend: Create Tap record
7. Backend: Load current game config
8. Backend: Process reward in database transaction:
   a. Get user's current balance
   b. Add tap reward to balance
   c. Add XP to user
   d. Create immutable Transaction record
   e. Update user balance and XP
9. Backend: Check if user leveled up
10. Backend: Update Crown tier if needed
11. Backend: Return new balance, level, XP
12. Frontend: Update local state with server values
13. Frontend: Show visual feedback (particles, text, animation)
```

### Referral Flow
```
1. Referrer: Get referral code from GET /referrals
2. Referrer: Share Telegram deep link: t.me/bot?startapp=CODE
3. Referred User: Opens link, Mini App loads with startapp param
4. Referred User: Login via /auth/login
5. Referred User: Link referrer via POST /referrals/:code/accept
6. Backend: Create Referral record
7. Referred User: Plays game, earns balance
8. Backend: Daily job checks if referred >= threshold
9. Backend: If qualified, set status='qualified'
10. Backend: Award referral bonus to referrer
11. Referrer: Can claim reward via POST /referrals/claim-reward
```

### Reward Processing (Server-Authoritative)
```
Client Request:
  {
    idempotencyKey: "<UUID>",
    clientTimestamp: 1692374400000
  }

Server Processing:
  1. Check if idempotencyKey already in Transaction table
  2. If yes, return cached result (idempotent)
  3. If no, start database transaction:
     - Lock user row
     - Get current balance
     - Load game config (reward values)
     - Validate reward amount (never trust client)
     - Calculate new balance
     - Add XP
     - Create immutable Transaction record
     - Update User balance/XP
     - Commit transaction
  4. Return new state with transaction ID

Server Response:
  {
    success: true,
    data: {
      transactionId: "<UUID>",
      reward: "1000",        // Micro-units
      xp: 1,
      newBalance: "50000",   // From server
      newLevel: 2,           // From server
      leveledUp: false
    }
  }

Frontend:
  1. Receive server response
  2. Update local state with server values
  3. Never calculate rewards locally
  4. If duplicate request (idempotencyKey), server returns same result
```

## Security Architecture

### Authentication & Authorization
- Telegram signature verification on every login
- JWT tokens with 7-day expiry
- Secure password hashing (bcrypt) for admin accounts
- Role-based access control (RBAC) for admin endpoints
- Session management in database

### Reward Integrity
- All reward calculations server-side only
- Client sends: idempotency key, timestamp, action
- Client NEVER sends reward amount
- Server loads reward value from GameConfig
- Immutable transaction ledger (append-only)
- Database transactions for consistency
- Idempotency keys prevent duplicate rewards

### Rate Limiting
- Global rate limit: 100 req/15min per IP
- Auth endpoints: 5 attempts/15min per IP
- Tap cooldown: 100ms between taps (client-side validation)
- Max taps per hour: 3600 (server-side validation)
- Ad view rate limit: 5 seconds between ads

### Input Validation
- All inputs validated with Zod schemas
- Telegram initData verified cryptographically
- Admin changes logged with audit trail
- Previous/new values recorded
- Admin IP address logged

### Data Protection
- No secrets in logs
- No sensitive data in API responses (beyond what user owns)
- Environment variables for all configuration
- CORS restricted to frontend domain
- HTTPS only in production
- Security headers via Helmet
- SQL injection prevention via Prisma ORM
- XSS prevention via React escaping

## Database Schema Highlights

### User Table
- Unique Telegram ID
- Server-authoritative balance (BigInt micro-units)
- XP and level progression
- Crown tier (computed from level)
- Referral code (unique per user)
- Referrer link (self-referral protection)
- Admin role flag

### Transaction Table (Immutable Ledger)
- Idempotency key (unique, prevents duplicates)
- Type (tap, task_claim, ad_view, referral_reward, admin_adjustment)
- Amount (BigInt, can be negative)
- Balance before/after
- Reference to source (tap_id, task_claim_id, etc.)
- Metadata (JSON for extensibility)
- Timestamp

### Tap Table
- Links to User
- Reward amount (from GameConfig at tap time)
- XP reward
- Idempotency key
- Client timestamp + server timestamp (for debugging)
- IP address, user agent (for analytics)

### Referral Table
- Referrer + Referred user relationship
- Status: pending → qualified → rewarded
- Qualification threshold (configurable)
- Timestamps for each status change
- Idempotency key for reward claim

### GameConfig Table
- Single "default" row
- All reward values (BigInt micro-units)
- All XP values
- Rate limiting parameters
- Level thresholds (JSON)
- Crown progression (JSON)
- Updated timestamp + admin who changed it

### AuditLog Table
- Admin ID (who made change)
- Action (config_update, user_adjustment, etc.)
- Resource type + ID (what was changed)
- Previous value + new value (JSON)
- Reason (admin's justification)
- IP address, user agent
- Timestamp

## Environment Variables

See `backend/ENVIRONMENT_VARIABLES.md` for complete list.

**Critical for launching:**
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing key
- `TELEGRAM_BOT_TOKEN` - From @BotFather
- `API_URL` / `FRONTEND_URL` - CORS and redirects

## Deployment

See `backend/DEPLOYMENT_RUNBOOK.md` for:
- Database setup
- Backend deployment (PM2, Docker, Heroku, Railway, AWS)
- Reverse proxy configuration (Nginx)
- SSL/TLS setup (Let's Encrypt)
- Monitoring and backups
- Scaling strategies
- Rollback procedures

## Testing

### Backend Tests
```bash
cd backend
npm run test
```

Tests cover:
- Reward processing and idempotency
- Telegram signature verification
- Rate limiting
- XP calculation
- Crown tier progression

### Manual Testing
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Open http://localhost:3000 in Telegram Mini App
4. Test login, tap, progression
5. Check backend logs and database

## Production Checklist

- [ ] Database: PostgreSQL running, migrations applied, seeded
- [ ] Backend: Deployed, health endpoint returning 200
- [ ] Frontend: Built, deployed to production domain
- [ ] Telegram: Bot created, Mini App URL configured
- [ ] SSL/TLS: HTTPS working on all domains
- [ ] Environment: All variables set correctly
- [ ] Backups: Database backup script configured
- [ ] Monitoring: Logs aggregated, alerts configured
- [ ] Referrals: Deep links tested in Telegram
- [ ] Admin: Admin account created with strong password
- [ ] Analytics: Data collection verified
- [ ] Security: Headers set, CORS configured, rate limiting active

## Performance Notes

### Frontend
- React 18 with concurrent rendering
- Zustand for lightweight state management
- Framer Motion for smooth 60 FPS animations
- Tailwind CSS for optimized styling
- Mobile-first responsive design
- Respects prefers-reduced-motion accessibility

### Backend
- Prisma ORM with connection pooling
- Database indexes on frequently-queried columns
- Transaction-based reward processing
- Immutable ledger prevents expensive joins
- Configurable rate limiting
- Structured logging for observability

## Future Enhancements

- [ ] In-app notifications (via WebSocket)
- [ ] Leaderboards (global, friends)
- [ ] Achievements/badges system
- [ ] Daily login streaks
- [ ] Battle Pass progression
- [ ] In-app rewards shop
- [ ] Telegram channel integration
- [ ] Real ad provider integration (AdMob, AppLovin, Unity Ads)
- [ ] Push notifications
- [ ] Mobile app wrapper (React Native)
- [ ] Multi-language support
- [ ] Dark/light theme toggle

## License

MIT
