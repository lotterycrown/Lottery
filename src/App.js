import { useState } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";

import Crash from "./games/Crash";
import Mines from "./games/Mines";
import Poker from "./games/Poker";
import Plinko from "./games/Plinko";
import Wheel from "./games/Wheel";

const games = [
  { id: "crash", name: "Crash", icon: "🚀" },
  { id: "mines", name: "Mines", icon: "💎" },
  { id: "poker", name: "Poker", icon: "🃏" },
  { id: "plinko", name: "Plinko", icon: "🔮" },
  { id: "wheel", name: "Lucky Wheel", icon: "🎡" },
];

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [tokens, setTokens] = useState(
    Number(localStorage.getItem("tokens") || 1000)
  );

  const addTokens = (amount) => {
    setTokens((current) => {
      const next = current + amount;
      localStorage.setItem("tokens", String(next));
      return next;
    });
  };

  const renderGame = () => {
    const props = { onReward: addTokens };

    switch (activeGame) {
      case "crash":
        return <Crash {...props} />;
      case "mines":
        return <Mines {...props} />;
      case "poker":
        return <Poker {...props} />;
      case "plinko":
        return <Plinko {...props} />;
      case "wheel":
        return <Wheel {...props} />;
      default:
        return null;
    }
  };

  if (activeGame) {
    return (
      <div className="app">
        <Header tokens={tokens} />

        <main className="game-page">
          <button
            className="back-button"
            onClick={() => setActiveGame(null)}
          >
            ← Back
          </button>

          {renderGame()}
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header tokens={tokens} />

      <main className="home">
        <section className="hero">
          <div>
            <span className="eyebrow">ARCADE</span>
            <h1>Play. Win. Level Up.</h1>
            <p>
              Play mini-games and earn virtual tokens.
            </p>
          </div>

          <div className="hero-orb">✦</div>
        </section>

        <section>
          <div className="section-title">
            <h2>Games</h2>
            <span>{games.length} games</span>
          </div>

          <div className="game-grid">
            {games.map((game) => (
              <button
                className="game-card"
                key={game.id}
                onClick={() => setActiveGame(game.id)}
              >
                <div className="game-icon">{game.icon}</div>
                <div>
                  <strong>{game.name}</strong>
                  <small>Play now</small>
                </div>
                <span className="arrow">›</span>
              </button>
            ))}
          </div>
        </section>

        <section className="daily-card">
          <div>
            <span className="eyebrow">DAILY REWARD</span>
            <h3>Come back tomorrow</h3>
            <p>Keep your streak alive and earn more XP.</p>
          </div>

          <button onClick={() => addTokens(100)}>+100</button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
