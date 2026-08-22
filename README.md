# Crown Tap Game - Step 3

A premium dark tap game built for Telegram Mini Apps.

## Features

✨ **Step 3 Complete:**
- Bronze crown with metallic 3D visuals
- Smooth tap mechanics with instant feedback
- Coin particles burst effect
- Floating reward text animation
- Local storage persistence
- Telegram Mini App ready
- Mobile-first responsive design
- Accessibility support
- TypeScript + React + Vite
- Task system with unlocks, progress, and claiming
- Tasks page with premium matte-black UI
- Config-driven task/reward architecture
- Micro-unit reward precision utilities

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
│   └── taskConfig.ts        # Task/reward configuration
├── hooks/           # React hooks
│   ├── useGameState.ts      # State management
│   └── useTapEffect.ts      # Tap animations
├── utils/           # Utilities
│   ├── storage.ts           # localStorage + migration
│   ├── storageTypes.ts      # Persisted game state types
│   ├── money.ts             # Micro-unit money helpers
│   ├── telegram.ts          # Telegram adapter
│   └── particle.ts          # Particle system
├── pages/           # Pages
│   ├── Home.tsx             # Crown page
│   ├── Tasks.tsx            # Tasks page
│   └── Profile.tsx          # Placeholder
├── services/
│   └── repositories.ts      # Repository pattern + TaskManager
├── styles/          # Global styles
│   └── globals.css          # Tailwind + custom
├── App.tsx          # Root component
└── main.tsx         # Entry point
```

## Tap Mechanics

### How it Works

1. **Tap Detection**: Click/touch the crown → `useTapEffect` triggers
2. **Particle Creation**: 12 particles spawn at tap location
3. **Animation**: 
   - Crown scales down to 0.96, bounces back
   - Particles burst outward with gravity
   - Reward text (+0.001) floats up
4. **State Update**: `useGameState` adds coins and tap count
5. **Task Progress**: tap tasks and unlock counter update per valid tap
6. **Persistence**: `localStorage` saves player/task state after updates

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

## Task System Notes

- Task statuses: `locked`, `available`, `in_progress`, `completed`, `claimed`
- Unlock cadence is configurable with `TASK_CONFIG.tapsRequiredToUnlock`
- Rewards are configuration-driven via `REWARD_CONFIG`
- Claiming is explicit (no auto-reward) and double-claim protected
- Storage migration preserves old Step 1/2 player saves

## License

MIT
