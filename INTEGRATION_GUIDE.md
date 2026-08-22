# Frontend and Backend Integration Guide

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Step 1: Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/crown_dev
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=your-token-from-botfather
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_MINI_APP_URL=http://localhost:3000/app
```

Setup database:
```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
```

Start backend:
```bash
npm run dev
```

Backend will start on `http://localhost:3001`

### Step 2: Frontend Setup

```bash
npm install
```

Create/edit `.env.local`:
```env
REACT_APP_API_URL=http://localhost:3001
```

Start frontend:
```bash
npm run dev
```

Frontend will start on `http://localhost:3000`

### Step 3: Test in Telegram

1. Create a Telegram bot via @BotFather:
   - `/newbot` - Create new bot
   - Get bot token
   - Set bot username

2. Create Mini App:
   - `/mybots` → Select your bot
   - "Bot Settings" → "Menu Button" → "Web App"
   - Set Web App URL to your frontend URL

3. Open bot in Telegram, press menu button

## API Integration

### Authentication

Frontend gets `initData` from Telegram WebApp:

```typescript
import { authApi } from '@/services/api';

const response = await authApi.login(initData);
if (response.success) {
  const { token, user } = response.data;
  // Token automatically saved to localStorage
  // All subsequent requests include token
}
```

### Game State Management

Frontend uses Zustand stores for state:

```typescript
import { useAuthStore } from '@/hooks/useAuthStore';
import { useGameStore } from '@/hooks/useGameStore';

const App = () => {
  const { user, token } = useAuthStore();
  const { balance, level, crownTier, tap } = useGameStore();
  
  const handleTap = async () => {
    await tap(); // Calls backend API
  };
  
  return (
    <div>
      {user && (
        <>
          <div>Level {level}</div>
          <div>Balance: {balance.toString()}</div>
          <button onClick={handleTap}>Tap</button>
        </>
      )}
    </div>
  );
};
```

### Server-Authoritative Balance

All balance updates come from backend:

```typescript
// Frontend NEVER calculates rewards
// Frontend sends: idempotencyKey + clientTimestamp
const response = await gameApi.tap(idempotencyKey, clientTimestamp);

// Backend returns:
// {
//   newBalance: "50000",        // String (BigInt)
//   newLevel: 2,
//   xp: 10,
//   leveledUp: false
// }

// Frontend updates local state with server values
setBalance(BigInt(response.data.newBalance));
```

### Idempotency

All mutable operations include idempotency key:

```typescript
// Generate client-side
const idempotencyKey = uuidv4();

// Send with request
await gameApi.tap(idempotencyKey, clientTimestamp);

// If network fails and user retries:
await gameApi.tap(idempotencyKey, clientTimestamp); // Same key!

// Backend detects duplicate via idempotencyKey
// Returns same result without processing again
```

## File Structure Changes

### New Frontend Files
- `src/services/api.ts` - API client with all endpoints
- `src/hooks/useAuthStore.ts` - Authentication state (Zustand)
- `src/hooks/useGameStore.ts` - Game state (Zustand)
- `src/hooks/useTelegramAuth.ts` - Telegram login hook

### Backend Files Structure
```
backend/
├── src/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utilities
│   ├── db/              # Database
│   ├── config/          # Constants
│   ├── types/           # TypeScript types
│   ├── __tests__/       # Tests
│   └── server.ts        # Main file
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # DB migrations
│   └── seed.ts          # Seed script
└── DEPLOYMENT_RUNBOOK.md
```

## Database Schema

See `backend/prisma/schema.prisma` for full schema.

Key tables:
- `User` - Player accounts
- `Transaction` - Immutable reward ledger
- `Tap` - Tap records with idempotency
- `Task` - Task definitions
- `TaskProgress` - Player task progress
- `Referral` - Referral relationships
- `AdView` - Ad watch records
- `GameConfig` - Configurable values
- `AuditLog` - Admin action log
- `DailyAnalytics` - Metrics

## API Endpoints

### Authentication
- `POST /auth/login` - Login with Telegram data
- `GET /auth/me` - Get current user

### Gameplay
- `POST /taps` - Record tap
- `GET /taps/history` - Get tap history
- `GET /tasks` - List tasks
- `POST /tasks/:taskId/claim` - Claim task reward

### Rewards & Balance
- `GET /ads/config` - Ad provider info
- `POST /ads/view` - Record ad view

### Referrals
- `GET /referrals` - Get referral info
- `POST /referrals/:code/accept` - Accept referral

### Admin
- `GET /admin/config` - Get game config
- `PATCH /admin/config` - Update config
- `GET /admin/audit-logs` - Get audit logs
- `GET /admin/users` - List users
- `GET /admin/analytics` - Get analytics

### Health
- `GET /health` - Health check

## Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Manual Testing Workflow

1. **Start services**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   npm run dev
   ```

2. **Test API directly**
   ```bash
   curl http://localhost:3001/health
   ```

3. **Test frontend**
   - Open http://localhost:3000 in browser
   - Or in Telegram Mini App

4. **Test specific flows**
   - Login
   - Tap and verify balance updates
   - Progress and level up
   - Accept referral
   - Claim task

## Common Issues

### "Cannot find module 'zustand'"
```bash
npm install zustand
```

### "Database connection failed"
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running
- Check database exists

### "Telegram verification failed"
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check bot token from @BotFather
- Ensure token hasn't expired

### "CORS error"
- Check `FRONTEND_URL` matches frontend domain
- Verify no trailing slashes
- Ensure both use HTTP or HTTPS consistently

### "Token is undefined"
- Check localStorage has auth_token
- Verify login succeeded
- Check token format (should be JWT)

## Production Deployment

See `backend/DEPLOYMENT_RUNBOOK.md` for:
- Database setup on production
- Backend deployment options
- Frontend build and hosting
- SSL/TLS configuration
- Monitoring and backups

## Performance Optimization

### Frontend
- Vite for fast builds and HMR
- React 18 concurrent rendering
- Code splitting via lazy loading
- Tailwind CSS purging for small bundle
- Minification in production build

### Backend
- Prisma connection pooling
- Database indexes on common queries
- Rate limiting to prevent abuse
- Efficient pagination
- Caching of game config

## Monitoring

### Backend
```bash
# Check logs
pm2 logs crown-api

# Health check
curl http://localhost:3001/health

# Database health
psql -c "SELECT 1"
```

### Frontend
- Browser console for errors
- Network tab for API calls
- React DevTools for state debugging

## Debugging

### Backend
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Check database directly
psql -d crown_dev -c "SELECT * FROM \"User\" LIMIT 5;"
```

### Frontend
```javascript
// In browser console
localStorage.getItem('auth_token')
localStorage.getItem('user_data')
```

## Next Steps

1. Customize game config values in `backend/prisma/schema.prisma` GameConfig defaults
2. Add more tasks in database seed
3. Configure Telegram bot settings
4. Set up production environment variables
5. Deploy backend (see DEPLOYMENT_RUNBOOK.md)
6. Deploy frontend (Vercel, Netlify, etc.)
7. Configure Telegram Mini App URL to production frontend
8. Test end-to-end in production Telegram
