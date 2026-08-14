import React, { useEffect, useMemo, useState } from "react";

const GAMES = [
  { id: "crash", name: "Crash", icon: "🚀", color: "#755cff" },
  { id: "mines", name: "Mines", icon: "💎", color: "#00bfa6" },
  { id: "poker", name: "Poker", icon: "🃏", color: "#e84d8a" },
  { id: "plinko", name: "Plinko", icon: "🔮", color: "#ff9f43" },
  { id: "wheel", name: "Lucky Wheel", icon: "🎡", color: "#3b82f6" },
];

function App() {
  const [page, setPage] = useState("home");
  const [tokens, setTokens] = useState(() => {
    return Number(localStorage.getItem("lottery_tokens") || 1000);
  });

  const [xp, setXp] = useState(() => {
    return Number(localStorage.getItem("lottery_xp") || 0);
  });

  useEffect(() => {
    localStorage.setItem("lottery_tokens", tokens);
    localStorage.setItem("lottery_xp", xp);
  }, [tokens, xp]);

  const reward = (amount) => {
    setTokens((v) => v + amount);
    setXp((v) => v + Math.max(1, Math.floor(amount / 10)));
  };

  const resetDemo = () => {
    setTokens(1000);
    setXp(0);
  };

  return (
    <div className="app">
      <style>{CSS}</style>

      <header className="header">
        <div className="brand">
          <div className="brandIcon">✦</div>
          <div>
            <b>LOTTERY</b>
            <span>ARCADE</span>
          </div>
        </div>

        <div className="balance">
          <span>🪙</span>
          {tokens.toLocaleString()}
        </div>
      </header>

      {page === "home" && (
        <Home
          tokens={tokens}
          xp={xp}
          onGame={(game) => setPage(game)}
          onReward={reward}
          resetDemo={resetDemo}
        />
      )}

      {page === "profile" && (
        <Profile tokens={tokens} xp={xp} resetDemo={resetDemo} />
      )}

      {page === "crash" && (
        <GamePage title="Crash" icon="🚀" back={() => setPage("home")}>
          <Crash onReward={reward} />
        </GamePage>
      )}

      {page === "mines" && (
        <GamePage title="Mines" icon="💎" back={() => setPage("home")}>
          <Mines onReward={reward} />
        </GamePage>
      )}

      {page === "poker" && (
        <GamePage title="Poker" icon="🃏" back={() => setPage("home")}>
          <Poker onReward={reward} />
        </GamePage>
      )}

      {page === "plinko" && (
        <GamePage title="Plinko" icon="🔮" back={() => setPage("home")}>
          <Plinko onReward={reward} />
        </GamePage>
      )}

      {page === "wheel" && (
        <GamePage title="Lucky Wheel" icon="🎡" back={() => setPage("home")}>
          <Wheel onReward={reward} />
        </GamePage>
      )}

      <nav className="bottomNav">
        <button
          className={page === "home" ? "active" : ""}
          onClick={() => setPage("home")}
        >
          <span>⌂</span>
          Home
        </button>

        <button
          className={page === "profile" ? "active" : ""}
          onClick={() => setPage("profile")}
        >
          <span>◉</span>
          Profile
        </button>
      </nav>
    </div>
  );
}

/* ---------------- HOME ---------------- */

function Home({ tokens, xp, onGame, onReward, resetDemo }) {
  const level = Math.floor(xp / 100) + 1;

  return (
    <main className="content">
      <section className="hero">
        <div className="heroGlow" />

        <div className="heroText">
          <span className="label">WELCOME BACK</span>
          <h1>Play.<br />Earn.<br /><em>Level Up.</em></h1>
          <p>Play mini games and collect virtual tokens.</p>
        </div>

        <div className="heroOrb">✦</div>
      </section>

      <section className="stats">
        <div>
          <small>LEVEL</small>
          <strong>{level}</strong>
        </div>

        <div>
          <small>XP</small>
          <strong>{xp}</strong>
        </div>

        <div>
          <small>TOKENS</small>
          <strong>{tokens.toLocaleString()}</strong>
        </div>
      </section>

      <div className="sectionHead">
        <h2>Games</h2>
        <span>{GAMES.length} available</span>
      </div>

      <div className="gameGrid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className="gameCard"
            onClick={() => onGame(game.id)}
            style={{ "--gameColor": game.color }}
          >
            <div className="gameIcon">{game.icon}</div>

            <div className="gameInfo">
              <strong>{game.name}</strong>
              <span>Play now · Earn tokens</span>
            </div>

            <div className="gameArrow">›</div>
          </button>
        ))}
      </div>

      <section className="daily">
        <div>
          <span className="label">DAILY BONUS</span>
          <h3>Free 100 tokens</h3>
          <p>Claim your demo reward.</p>
        </div>

        <button onClick={() => onReward(100)}>CLAIM</button>
      </section>

      <button className="reset" onClick={resetDemo}>
        Reset demo account
      </button>
    </main>
  );
}

/* ---------------- PROFILE ---------------- */

function Profile({ tokens, xp, resetDemo }) {
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;

  return (
    <main className="content">
      <div className="profileHero">
        <div className="avatar">L</div>

        <div>
          <span className="label">PLAYER</span>
          <h1>Lottery Player</h1>
          <p>Level {level}</p>
        </div>
      </div>

      <div className="profileStats">
        <div>
          <small>TOKENS</small>
          <strong>🪙 {tokens.toLocaleString()}</strong>
        </div>

        <div>
          <small>XP</small>
          <strong>{xp}</strong>
        </div>
      </div>

      <div className="progressBox">
        <div className="progressTop">
          <span>Level {level}</span>
          <span>{progress}/100 XP</span>
        </div>

        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="leaderboard">
        <div className="sectionHead">
          <h2>Leaderboard</h2>
          <span>Weekly</span>
        </div>

        {[
          ["01", "Nova", "12,840"],
          ["02", "PixelFox", "10,420"],
          ["03", "Rocket", "9,870"],
          ["04", "You", tokens.toLocaleString()],
        ].map((item) => (
          <div className="leader" key={item[0]}>
            <b>{item[0]}</b>
            <span>{item[1]}</span>
            <strong>🪙 {item[2]}</strong>
          </div>
        ))}
      </div>

      <button className="reset" onClick={resetDemo}>
        Reset demo account
      </button>
    </main>
  );
}

/* ---------------- GAME PAGE ---------------- */

function GamePage({ title, icon, back, children }) {
  return (
    <main className="content">
      <button className="back" onClick={back}>
        ← Back
      </button>

      <div className="gameTitle">
        <div className="bigGameIcon">{icon}</div>

        <div>
          <span className="label">MINI GAME</span>
          <h1>{title}</h1>
        </div>
      </div>

      {children}
    </main>
  );
}

/* ---------------- CRASH ---------------- */

function Crash({ onReward }) {
  const [running, setRunning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [result, setResult] = useState("");

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setMultiplier((m) => {
        const next = +(m + 0.04 + Math.random() * 0.08).toFixed(2);

        if (next >= 8) {
          setRunning(false);
          setResult("Round ended");
          return 1;
        }

        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [running]);

  const start = () => {
    setMultiplier(1);
    setResult("");
    setRunning(true);
  };

  const collect = () => {
    if (!running) return;

    const reward = Math.max(10, Math.floor(multiplier * 20));
    onReward(reward);
    setRunning(false);
    setResult(`+${reward} tokens`);
  };

  return (
    <div className="gameBox">
      <div className="crashSky">
        <div
          className="rocket"
          style={{
            transform: `translate(
              ${Math.min(160, multiplier * 18)}px,
              ${Math.min(100, multiplier * 10)}px
            )`,
          }}
        >
          🚀
        </div>

        <div className="multiplier">
          {multiplier.toFixed(2)}x
        </div>
      </div>

      <p className="gameHint">
        Watch the multiplier rise and collect your virtual reward.
      </p>

      {!running ? (
        <button className="primary" onClick={start}>
          START ROUND
        </button>
      ) : (
        <button className="primary collect" onClick={collect}>
          COLLECT {Math.floor(multiplier * 20)} 🪙
        </button>
      )}

      {result && <div className="result">{result}</div>}
    </div>
  );
}

/* ---------------- MINES ---------------- */

function Mines({ onReward }) {
  const createBoard = () => {
    const mines = new Set();

    while (mines.size < 5) {
      mines.add(Math.floor(Math.random() * 25));
    }

    return Array.from({ length: 25 }, (_, i) => ({
      mine: mines.has(i),
      opened: false,
    }));
  };

  const [board, setBoard] = useState(createBoard);
  const [found, setFound] = useState(0);
  const [ended, setEnded] = useState(false);

  const openCell = (index) => {
    if (ended || board[index].opened) return;

    const next = [...board];
    next[index].opened = true;

    if (next[index].mine) {
      setBoard(next);
      setEnded(true);
      return;
    }

    const nextFound = found + 1;
    setFound(nextFound);
    setBoard(next);

    onReward(5);

    if (nextFound >= 10) {
      setEnded(true);
      onReward(100);
    }
  };

  const restart = () => {
    setBoard(createBoard());
    setFound(0);
    setEnded(false);
  };

  return (
    <div className="gameBox">
      <div className="minesTop">
        <span>Safe finds</span>
        <strong>{found}/10</strong>
      </div>

      <div className="mineGrid">
        {board.map((cell, index) => (
          <button
            key={index}
            className={`mineCell ${cell.opened ? "opened" : ""}`}
            onClick={() => openCell(index)}
          >
            {cell.opened ? (cell.mine ? "💥" : "💎") : "?"}
          </button>
        ))}
      </div>

      {ended && (
        <div className="result">
          {found >= 10
            ? "🏆 Level complete! +100 tokens"
            : "💥 Mine found. Try again!"}
        </div>
      )}

      <button className="secondary" onClick={restart}>
        NEW BOARD
      </button>
    </div>
  );
}

/* ---------------- POKER ---------------- */

function Poker({ onReward }) {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7"];

  const randomCard = () => ({
    rank: ranks[Math.floor(Math.random() * ranks.length)],
    suit: suits[Math.floor(Math.random() * suits.length)],
  });

  const [cards, setCards] = useState([]);
  const [message, setMessage] = useState("Deal a hand");

  const deal = () => {
    const hand = Array.from({ length: 5 }, randomCard);
    setCards(hand);

    const unique = new Set(hand.map((c) => c.rank)).size;

    if (unique <= 3) {
      setMessage("Nice hand! +50 tokens");
      onReward(50);
    } else {
      setMessage("Practice hand! +10 tokens");
      onReward(10);
    }
  };

  return (
    <div className="gameBox poker">
      <div className="cards">
        {cards.map((card, i) => (
          <div
            className={`playingCard ${
              card.suit === "♥" || card.suit === "♦"
                ? "redCard"
                : ""
            }`}
            key={i}
          >
            <strong>{card.rank}</strong>
            <span>{card.suit}</span>
          </div>
        ))}
      </div>

      <div className="result">{message}</div>

      <button className="primary" onClick={deal}>
        DEAL HAND
      </button>
    </div>
  );
}

/* ---------------- PLINKO ---------------- */

function Plinko({ onReward }) {
  const [balls, setBalls] = useState([]);
  const [lastReward, setLastReward] = useState(null);

  const drop = () => {
    const rewards = [10, 20, 30, 50, 100, 50, 30, 20, 10];
    const reward =
      rewards[Math.floor(Math.random() * rewards.length)];

    const id = Date.now();

    setBalls((items) => [
      ...items,
      {
        id,
        reward,
        left: 35 + Math.random() * 30,
      },
    ]);

    setTimeout(() => {
      setBalls((items) => items.filter((b) => b.id !== id));
    }, 1200);

    setTimeout(() => {
      onReward(reward);
      setLastReward(reward);
    }, 900);
  };

  return (
    <div className="gameBox">
      <div className="plinko">
        {Array.from({ length: 7 }).map((_, row) => (
          <div className="pegRow" key={row}>
            {Array.from({ length: row + 3 }).map((_, i) => (
              <span className="peg" key={i} />
            ))}
          </div>
        ))}

        {balls.map((ball) => (
          <div
            key={ball.id}
            className="plinkoBall"
            style={{ left: `${ball.left}%` }}
          >
            ●
          </div>
        ))}

        <div className="slots">
          {[10, 20, 30, 50, 100, 50, 30, 20, 10].map(
            (value, i) => (
              <span key={i}>{value}</span>
            )
          )}
        </div>
      </div>

      {lastReward !== null && (
        <div className="result">+{lastReward} tokens</div>
      )}

      <button className="primary" onClick={drop}>
        DROP BALL
      </button>
    </div>
  );
}

/* ---------------- WHEEL ---------------- */

function Wheel({ onReward }) {
  const rewards = [10, 20, 50, 100, 25, 75, 40, 150];

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult("");

    const index = Math.floor(Math.random() * rewards.length);
    const reward = rewards[index];

    const extra = 1440 + index * 45;

    setRotation((r) => r + extra);

    setTimeout(() => {
      setSpinning(false);
      setResult(`+${reward} tokens`);
      onReward(reward);
    }, 2200);
  };

  return (
    <div className="gameBox">
      <div className="wheelWrap">
        <div className="pointer">▼</div>

        <div
          className="wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {rewards.map((value, index) => (
            <div
              key={index}
              className="wheelLabel"
              style={{
                transform: `rotate(${index * 45}deg) translateY(-88px)`,
              }}
            >
              {value}
            </div>
          ))}
        </div>

        <div className="wheelCenter">✦</div>
      </div>

      {result && <div className="result">{result}</div>}

      <button className="primary" onClick={spin} disabled={spinning}>
        {spinning ? "SPINNING..." : "SPIN WHEEL"}
      </button>
    </div>
  );
}

/* ---------------- CSS ---------------- */

const CSS = `
* {
  box-sizing: border-box;
}

:root {
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #fff;
  background: #07080d;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
  background: #07080d;
}

body {
  min-width: 320px;
}

button {
  font: inherit;
}

button:disabled {
  opacity: .5;
}

.app {
  min-height: 100vh;
  max-width: 720px;
  margin: auto;
  padding-bottom: 95px;
  background:
    radial-gradient(
      circle at 50% -10%,
      rgba(102, 81, 255, .22),
      transparent 35%
    ),
    #07080d;
}

.header {
  height: 72px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(18px);
  background: rgba(7,8,13,.75);
  border-bottom: 1px solid rgba(255,255,255,.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brandIcon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 20px;
  background: linear-gradient(135deg,#755cff,#b35cff);
  box-shadow: 0 8px 30px rgba(117,92,255,.35);
}

.brand b {
  display: block;
  font-size: 13px;
  letter-spacing: 1.5px;
}

.brand span {
  display: block;
  font-size: 9px;
  opacity: .45;
  letter-spacing: 2px;
}

.balance {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 13px;
  border-radius: 14px;
  background: rgba(255,255,255,.06);
  font-size: 13px;
  font-weight: 800;
}

.content {
  padding: 18px;
}

.hero {
  position: relative;
  min-height: 285px;
  padding: 30px;
  border-radius: 30px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background:
    linear-gradient(
      135deg,
      #15172c,
      #29205d
    );
  border: 1px solid rgba(255,255,255,.07);
  box-shadow: 0 25px 80px rgba(0,0,0,.3);
}

.heroGlow {
  position: absolute;
  width: 260px;
  height: 260px;
  right: -80px;
  top: -80px;
  border-radius: 50%;
  background: rgba(118,88,255,.28);
  filter: blur(30px);
}

.heroText {
  position: relative;
  z-index: 1;
}

.label {
  font-size: 10px;
  letter-spacing: 2px;
  font-weight: 900;
  opacity: .5;
}

.hero h1 {
  font-size: 40px;
  line-height: .92;
  margin: 12px 0;
}

.hero h1 em {
  color: #9b8cff;
  font-style: normal;
}

.hero p {
  max-width: 220px;
  line-height: 1.5;
  font-size: 13px;
  opacity: .55;
}

.heroOrb {
  width: 105px;
  height: 105px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 42px;
  background: rgba(255,255,255,.07);
  box-shadow:
    0 0 80px rgba(130,100,255,.4),
    inset 0 0 30px rgba(255,255,255,.08);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  50% {
    transform: translateY(-10px) rotate(5deg);
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 8px;
  margin: 12px 0 28px;
}

.stats > div,
.profileStats > div {
  padding: 15px;
  border-radius: 18px;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.05);
}

.stats small,
.profileStats small {
  display: block;
  font-size: 9px;
  opacity: .4;
  letter-spacing: 1px;
}

.stats strong,
.profileStats strong {
  display: block;
  margin-top: 6px;
  font-size: 15px;
}

.sectionHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 3px 12px;
}

.sectionHead h2 {
  margin: 0;
  font-size: 20px;
}

.sectionHead span {
  font-size: 11px;
  opacity: .4;
}

.gameGrid {
  display: grid;
  gap: 10px;
}

.gameCard {
  width: 100%;
  border: 1px solid rgba(255,255,255,.055);
  color: white;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 21px;
  text-align: left;
  cursor: pointer;
  background:
    linear-gradient(
      110deg,
      rgba(255,255,255,.065),
      rgba(255,255,255,.025)
    );
  transition: transform .15s, background .15s;
}

.gameCard:hover {
  background: rgba(255,255,255,.09);
}

.gameCard:active {
  transform: scale(.98);
}

.gameIcon {
  width: 55px;
  height: 55px;
  border-radius: 17px;
  display: grid;
  place-items: center;
  font-size: 27px;
  background:
    radial-gradient(
      circle at 30% 20%,
      var(--gameColor),
      rgba(255,255,255,.06) 70%
    );
  box-shadow: 0 10px 35px color-mix(
    in srgb,
    var(--gameColor) 30%,
    transparent
  );
}

.gameInfo strong {
  display: block;
  font-size: 16px;
}

.gameInfo span {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  opacity: .4;
}

.gameArrow {
  margin-left: auto;
  font-size: 28px;
  opacity: .3;
}

.daily {
  margin-top: 18px;
  padding: 20px;
  border-radius: 23px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background:
    linear-gradient(
      135deg,
      rgba(117,92,255,.18),
      rgba(255,255,255,.035)
    );
  border: 1px solid rgba(117,92,255,.18);
}

.daily h3 {
  margin: 7px 0 3px;
}

.daily p {
  margin: 0;
  font-size: 12px;
  opacity: .45;
}

.daily button,
.primary {
  border: 0;
  color: white;
  padding: 13px 17px;
  border-radius: 15px;
  font-weight: 900;
  cursor: pointer;
  background: linear-gradient(135deg,#755cff,#a35cff);
  box-shadow: 0 10px 30px rgba(117,92,255,.25);
}

.reset {
  width: 100%;
  margin-top: 15px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,.07);
  color: white;
  background: transparent;
  border-radius: 14px;
  opacity: .5;
  cursor: pointer;
}

.bottomNav {
  position: fixed;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: min(680px, calc(100% - 28px));
  display: flex;
  padding: 7px;
  border-radius: 22px;
  background: rgba(20,20,28,.88);
  border: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(20px);
  z-index: 20;
}

.bottomNav button {
  flex: 1;
  padding: 9px;
  border: 0;
  color: white;
  background: transparent;
  border-radius: 16px;
  opacity: .45;
  cursor: pointer;
  font-size: 11px;
}

.bottomNav button span {
  display: block;
  font-size: 20px;
  margin-bottom: 2px;
}

.bottomNav button.active {
  opacity: 1;
  background: rgba(117,92,255,.18);
}

.back {
  border: 0;
  background: transparent;
  color: white;
  opacity: .55;
  cursor: pointer;
  margin-bottom: 18px;
}

.gameTitle {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.gameTitle h1,
.profileHero h1 {
  margin: 4px 0 0;
  font-size: 28px;
}

.bigGameIcon {
  width: 60px;
  height: 60px;
  border-radius: 19px;
  display: grid;
  place-items: center;
  font-size: 30px;
  background: rgba(255,255,255,.07);
}

.gameBox {
  padding: 18px;
  border-radius: 25px;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.06);
}

.gameHint {
  text-align: center;
  font-size: 12px;
  opacity: .45;
  line-height: 1.5;
}

.primary {
  width: 100%;
  margin-top: 14px;
}

.secondary {
  width: 100%;
  margin-top: 15px;
  padding: 13px;
  border: 1px solid rgba(255,255,255,.08);
  color: white;
  background: rgba(255,255,255,.05);
  border-radius: 15px;
  cursor: pointer;
}

.result {
  text-align: center;
  padding: 14px;
  margin-top: 14px;
  border-radius: 15px;
  background: rgba(117,92,255,.12);
  color: #bdb2ff;
  font-weight: 800;
}

.crashSky {
  height: 280px;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 100%,rgba(117,92,255,.3),transparent 45%),
    linear-gradient(#101322,#090a10);
}

.multiplier {
  font-size: 54px;
  font-weight: 900;
}

.rocket {
  position: absolute;
  left: 25%;
  top: 20%;
  font-size: 38px;
  transition: transform .12s linear;
}

.minesTop {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  opacity: .7;
}

.mineGrid {
  display: grid;
  grid-template-columns: repeat(5,1fr);
  gap: 8px;
}

.mineCell {
  aspect-ratio: 1;
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 13px;
  color: white;
  background: rgba(255,255,255,.055);
  cursor: pointer;
  font-size: 19px;
}

.mineCell.opened {
  background: rgba(117,92,255,.13);
}

.cards {
  display: flex;
  justify-content: center;
  gap: 7px;
  flex-wrap: wrap;
  min-height: 140px;
  align-items: center;
}

.playingCard {
  width: 58px;
  height: 82px;
  border-radius: 9px;
  background: #f4f4f5;
  color: #171717;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px;
  font-size: 18px;
}

.playingCard span {
  align-self: flex-end;
  font-size: 24px;
}

.redCard {
  color: #d82f55;
}

.plinko {
  height: 370px;
  position: relative;
  overflow: hidden;
  padding-top: 20px;
  background:
    radial-gradient(circle at 50% 0%,rgba(117,92,255,.18),transparent 45%),
    #0b0c13;
  border-radius: 20px;
}

.pegRow {
  height: 40px;
  display: flex;
  justify-content: center;
  gap: 22px;
}

.peg {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #aaa2ff;
  box-shadow: 0 0 10px rgba(117,92,255,.5);
}

.plinkoBall {
  position: absolute;
  top: 12px;
  color: #fff;
  font-size: 24px;
  animation: fall 1s ease-in forwards;
}

@keyframes fall {
  to {
    top: 280px;
    transform: translateX(30px);
  }
}

.slots {
  position: absolute;
  bottom: 12px;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(9,1fr);
  gap: 3px;
}

.slots span {
  padding: 7px 1px;
  text-align: center;
  font-size: 9px;
  border-radius: 7px;
  background: rgba(117,92,255,.15);
}

.wheelWrap {
  width: 290px;
  height: 290px;
  margin: 15px auto 25px;
  position: relative;
  display: grid;
  place-items: center;
}

.pointer {
  position: absolute;
  top: -9px;
  z-index: 4;
  color: #fff;
  font-size: 25px;
}

.wheel {
  width: 255px;
  height: 255px;
  border-radius: 50%;
  position: relative;
  transition: transform 2.2s cubic-bezier(.12,.7,.15,1);
  background:
    conic-gradient(
      #755cff 0deg 45deg,
      #252536 45deg 90deg,
      #00bfa6 90deg 135deg,
      #252536 135deg 180deg,
      #e84d8a 180deg 225deg,
      #252536 225deg 270deg,
      #ff9f43 270deg 315deg,
      #252536 315deg 360deg
    );
  box-shadow:
    0 0 50px rgba(117,92,255,.25),
    inset 0 0 0 7px rgba(255,255,255,.08);
}

.wheelLabel {
  position: absolute;
  left: 50%;
  top: 50%;
  font-size: 13px;
  font-weight: 900;
  transform-origin: 0 0;
}

.wheelCenter {
  position: absolute;
  width: 55px;
  height: 55px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #15151f;
  border: 4px solid rgba(255,255,255,.12);
  z-index: 3;
}

.profileHero {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 24px;
  border-radius: 25px;
  background: linear-gradient(135deg,#17182b,#241d4b);
}

.avatar {
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  font-size: 27px;
  font-weight: 900;
  background: linear-gradient(135deg,#755cff,#b15cff);
}

.profileHero p {
  margin: 4px 0 0;
  opacity: .5;
}

.profileStats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 12px 0;
}

.progressBox {
  padding: 18px;
  border-radius: 20px;
  background: rgba(255,255,255,.045);
}

.progressTop {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  opacity: .6;
  margin-bottom: 10px;
}

.progress {
  height: 8px;
  border-radius: 10px;
  background: rgba(255,255,255,.07);
  overflow: hidden;
}

.progress div {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg,#755cff,#b15cff);
  transition: width .4s ease;
}

.leaderboard {
  margin-top: 25px;
}

.leader {
  display: grid;
  grid-template-columns: 35px 1fr auto;
  align-items: center;
  padding: 15px;
  margin-bottom: 7px;
  border-radius: 15px;
  background: rgba(255,255,255,.04);
}

.leader b {
  opacity: .4;
}

.leader span {
  font-weight: 700;
}

.leader strong {
  font-size: 12px;
  color: #bdb2ff;
}

@media (max-width: 430px) {
  .hero {
    min-height: 250px;
    padding: 23px;
  }

  .hero h1 {
    font-size: 34px;
  }

  .heroOrb {
    width: 80px;
    height: 80px;
    font-size: 32px;
  }

  .gameIcon {
    width: 50px;
    height: 50px;
  }
}
`;

export default App;
