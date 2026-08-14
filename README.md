# 🎰 Lottery Arcade

A fun and interactive mini-games arcade application built with React and Vite. Play games, collect virtual tokens, and level up!

## 🎮 Features

- **5 Mini Games**: Crash, Mines, Poker, Plinko, and Lucky Wheel
- **Token System**: Earn and spend virtual tokens
- **Leveling System**: Gain XP and progress through levels
- **Leaderboard**: Compete with other players
- **Daily Rewards**: Claim free tokens every day
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Your progress is automatically saved

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lotterycrown/Lottery.git
cd Lottery
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

### Preview

Preview the production build:
```bash
npm run preview
```

## 📁 Project Structure

```
src/
  ├── App.js          # Main app component with all games and styling
  ├── main.jsx        # React entry point
  └── index.css       # Global styles

public/
  └── index.html      # HTML template

package.json          # Project dependencies and scripts
vite.config.js        # Vite configuration
.gitignore            # Git ignore rules
```

## 🎯 How It Works

1. **Home Page**: View your balance, level, and available games
2. **Play Games**: Click on any game card to start playing
3. **Earn Tokens**: Win virtual tokens by playing mini-games
4. **Level Up**: Earn XP to increase your level
5. **Profile**: Check your stats and leaderboard ranking
6. **Daily Reward**: Claim 100 free tokens every day

## 🎮 Games Overview

### Crash 🚀
Watch the multiplier rise and collect your virtual reward before it crashes!

### Mines 💎
Find all diamonds without hitting a mine. Complete all 10 to win a bonus!

### Poker 🃏
Deal cards and get rewarded based on hand quality.

### Plinko 🔮
Drop balls and watch them fall into reward slots. Each slot has a different prize!

### Lucky Wheel 🎡
Spin the lucky wheel to win variable token amounts (10-150 tokens).

## 💾 Data Persistence

All player data is stored in browser's localStorage:
- `lottery_tokens`: Your current token balance
- `lottery_xp`: Your accumulated experience points

Data persists across browser sessions automatically.

## 🛠 Technologies Used

- **React 18**: Modern UI framework
- **Vite**: Lightning-fast build tool and dev server
- **CSS-in-JS**: All styling is embedded in App.js for simplicity

## 📦 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🎓 Game Mechanics

### Token System
- Start with 1,000 tokens
- Earn tokens by playing games
- Higher difficulty = higher rewards
- Minimum starting bet: 10 tokens

### XP & Leveling
- Gain 1 XP per 10 tokens earned
- Level increases every 100 XP
- Higher levels unlock better games

### Daily Login Reward
- Claim 100 free tokens daily
- Reset automatically at midnight
- No limit on how many days you can claim

## 🐛 Known Limitations

This is a demo/prototype version with the following limitations:
- All games use random number generation
- No backend integration yet
- No user authentication
- No multiplayer features
- Data resets when browser cache is cleared

## 🚀 Future Enhancements

- Backend integration for persistent data
- Real-time multiplayer games
- User authentication and leaderboards
- Payment integration
- Mobile app version
- Advanced game mechanics
- Tournaments and competitions

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**lotterycrown**

---

**Ready to play? Start earning tokens now! 🎉**
