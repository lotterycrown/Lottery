# Crown Tap Game - Rewarded Ads Architecture

A premium dark tap game built for Telegram Mini Apps.

## Features

✨ **Core Gameplay:**
- Bronze crown with metallic 3D visuals
- Smooth tap mechanics with instant feedback
- Coin particles burst effect
- Floating reward text animation
- Local storage persistence
- Telegram Mini App ready
- Mobile-first responsive design
- Accessibility support
- TypeScript + React + Vite

🆕 **Build Step 5 — Rewarded Ads:**
- Provider abstraction (`AdProvider`) with factory (`mock` / `telegram`)
- `AdManager` service to orchestrate session → watch → verify flow
- Ads UI card with reward amount, daily counters, cooldown state
- Backend ad API architecture (`/api/ads/config|session|reward|status`)
- Prisma data models/migration for `AdConfig`, `AdSession`, `AdDailyUsage`, `AdEvent`, and `RewardTransaction` ad source tracking
- Per-user rate limits for session/reward endpoints
- Development-safe `MockAdProvider` blocked in production

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The game will open at `http://localhost:3000`

### Production Build

```bash
npm run build
```

### Rewarded Ads Backend (new)

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run server:dev
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # React components
│   ├── Crown.tsx            # 3D metallic crown
│   ├── CoinParticles.tsx    # Particle effects
│   ├── Header.tsx           # Top UI
│   ├── Balance.tsx          # Coin display
│   ├── TapReward.tsx        # Floating text
│   └── BottomNavigation.tsx # Nav bar
├── game/            # Game logic
│   ├── gameConfig.ts        # Configuration
│   ├── playerState.ts       # Data structures
│   └── tapEngine.ts         # (Placeholder)
├── hooks/           # React hooks
│   ├── useGameState.ts      # State management
│   └── useTapEffect.ts      # Tap animations
├── utils/           # Utilities
│   ├── storage.ts           # localStorage wrapper
│   ├── telegram.ts          # Telegram adapter
│   └── particle.ts          # Particle system
├── pages/           # Pages
│   └── Home.tsx             # Main screen
├── styles/          # Global styles
│   └── globals.css          # Tailwind + custom
├── App.tsx          # Root component
└── main.tsx         # Entry point

src/ads/
├── types.ts
├── AdManager.ts
├── api/AdApiClient.ts
└── providers/
    ├── MockAdProvider.ts
    ├── TelegramAdProvider.ts
    └── factory.ts

server/src/
├── app.ts
├── server.ts
├── config/adConfig.ts
├── controllers/AdController.ts
├── middleware/{auth,rateLimit}.ts
├── routes/adRoutes.ts
└── services/{AdService,RewardService,VerificationService}.ts

prisma/
├── schema.prisma
├── seed.ts
└── migrations/20260822130000_add_rewarded_ads/migration.sql
```

## Rewarded Ads Architecture Diagram (Text)

```
AdCard (UI) -> useAdRewards -> AdManager
                            -> AdApiClient -> POST /api/ads/session
                            -> AdProvider.showRewardedAd()
                            -> POST /api/ads/reward
Server AdController -> AdService -> VerificationService -> RewardService -> Prisma
```

## Provider Switching Guide

1. Set `AD_PROVIDER=mock` for local/dev only.
2. Set `AD_PROVIDER=telegram` for Telegram flow once server verification is officially supported.
3. Keep `AD_ENABLED=true` and adjust reward/limit env vars.
4. In production, `mock` provider is explicitly blocked by backend checks.

## Server-side Verification Requirements

- Client only sends `adSessionId`, `provider`, and verification token/transaction id.
- Reward values are read from server `AdConfig`.
- Server validates ownership, expiry, cooldown, daily limits, and idempotency before rewarding.
- One `RewardTransaction` per `adSessionId` (`sourceId` unique).

## Reward Calculation Logic

- Rewards are stored as integer micro-units.
- Default reward: `AD_REWARD_MICRO=1000` (= `0.001 CROWN`) and `AD_REWARD_XP=10`.
- UI converts micro-units to display value; backend remains authoritative.

## Rate Limiting Strategy

- `POST /api/ads/session`: max 1 request / 5 seconds / user
- `POST /api/ads/reward`: max 1 request / 30 seconds / user

## Tap Mechanics

### How it Works

1. **Tap Detection**: Click/touch the crown → `useTapEffect` triggers
2. **Particle Creation**: 12 particles spawn at tap location
3. **Animation**: 
   - Crown scales down to 0.96, bounces back
   - Particles burst outward with gravity
   - Reward text (+0.001) floats up
4. **State Update**: `useGameState` adds coins and tap count
5. **Persistence**: `localStorage` saves after every tap

### Performance

- Particles capped at 80 max (configurable)
- requestAnimationFrame for smooth 60 FPS
- Respects `prefers-reduced-motion` setting
- Efficient React re-renders via hooks

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **localStorage** - State persistence

## Configuration

Edit `src/game/gameConfig.ts` to customize:

```typescript
export const GAME_CONFIG = {
  tapReward: 0.001,          // Coins per tap
  maxParticles: 80,          // Particle limit
  particleLifetime: 1000,    // Duration (ms)
  particleGravity: 0.005,    // Physics
  crownTapDuration: 300,     // Animation speed
  // ... more config
};
```

## Telegram Integration

The game works:
- ✅ In Telegram Mini Apps
- ✅ In regular browsers
- ✅ On desktop and mobile

See `src/utils/telegram.ts` for the adapter.

## Storage

Player state stored in `localStorage` with key: `crown_tap_game_player_state`

**Note**: This is temporary/demo data. Backend will replace this in future steps.

## Accessibility

- ♿ Keyboard support (Tab to crown, Enter/Space to tap)
- 🎨 Focus rings for visibility
- 🤸 Respects `prefers-reduced-motion`
- 📝 ARIA labels

## Next Steps

Future implementation:
- Backend integration
- Database persistence
- Level system
- Tasks system
- Wallet & withdrawals
- Admin panel
- NFT rewards

## License

MIT
