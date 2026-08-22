# Crown Tap Game - Backend API

Full-stack backend for the Crown Telegram Mini App.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

1. Install dependencies
```bash
cd backend
npm install
```

2. Configure environment
```bash
cp .env.example .env
# Edit .env with your database URL and Telegram credentials
```

3. Setup database
```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

4. Start development server
```bash
npm run dev
```

Server will start on `http://localhost:3001`

## Environment Variables

See `.env.example` for all available variables.

**Required for production:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `TELEGRAM_BOT_TOKEN` - Telegram Bot API token
- `TELEGRAM_BOT_USERNAME` - Telegram Bot username
- `TELEGRAM_MINI_APP_URL` - Production Mini App URL
- `FRONTEND_URL` - Frontend application URL

## API Documentation

### Authentication

**POST /auth/login**
```json
{
  "initData": "<Telegram Mini App initData>"
}
```

Returns JWT token for subsequent requests.

### Gameplay

**POST /taps**
```json
{
  "idempotencyKey": "uuid",
  "clientTimestamp": 1692374400000
}
```

**GET /tasks**

List all available tasks for the user.

**POST /tasks/:taskId/claim**
```json
{
  "idempotencyKey": "uuid"
}
```

### Rewards & Balance

**GET /auth/me**

Get current user balance and progression.

**GET /taps/history**

Get transaction history.

### Referrals

**GET /referrals**

Get referral code and stats.

**POST /referrals/:referralCode/accept**

Accept a referral.

### Admin

**PATCH /admin/config**
```json
{
  "key": "tapReward",
  "value": 1500,
  "reason": "Adjusted for Q3"
}
```

**GET /admin/audit-logs**

**GET /admin/users**

**GET /admin/analytics**

### System

**GET /health**

Health check endpoint.

## Architecture

### Database (Prisma + PostgreSQL)
- User accounts with Telegram authentication
- Immutable transaction ledger
- Task and referral tracking
- Admin configuration and audit logs

### Security
- JWT authentication
- Server-authoritative reward processing
- Idempotency keys prevent duplicate rewards
- Rate limiting on all endpoints
- Telegram signature verification
- Admin role-based access control
- Helmet for security headers

### Key Features
- ✅ Telegram Mini App integration
- ✅ Server-authoritative balance
- ✅ Immutable reward ledger
- ✅ Level progression system
- ✅ Crown tier progression (Bronze → Silver → Gold)
- ✅ Task system
- ✅ Referral system
- ✅ Admin panel
- ✅ Configurable reward economics
- ✅ Analytics
- ✅ Audit logging

## Testing

```bash
npm run test
```

Tests for:
- Reward processing and idempotency
- Telegram authentication
- Rate limiting
- XP calculation
- Crown tier progression

## Deployment

See `DEPLOYMENT_RUNBOOK.md` for production deployment steps.

## License

MIT
