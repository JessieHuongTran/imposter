import { useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import categories from "../../data/categories.js";
import { playFlipOpen, playFlipClose, playStartGame } from "../../utils/sound.js";

const cardStyles = [
  { border: "border-pink", glow: "box-glow-pink", text: "text-pink", textGlow: "glow-pink" },
  { border: "border-cyan", glow: "box-glow-cyan", text: "text-cyan", textGlow: "glow-cyan" },
  { border: "border-yellow", glow: "box-glow-yellow", text: "text-yellow", textGlow: "glow-yellow" },
  { border: "border-lime", glow: "box-glow-lime", text: "text-lime", textGlow: "glow-lime" },
  { border: "border-orange", glow: "box-glow-orange", text: "text-orange", textGlow: "glow-orange" },
];

function getCardStyle(index) {
  return cardStyles[index % cardStyles.length];
}

export default function CardReveal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { category, playerCount } = location.state || {};
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewedCount, setViewedCount] = useState(0);

  const gameData = useMemo(() => {
    if (!category || !playerCount) return null;

    const cat = categories[category];
    const wordIndex = Math.floor(Math.random() * cat.words.length);
    const word = cat.words[wordIndex];
    const hint = cat.hints[wordIndex];

    const imposterCount = Math.max(1, Math.floor(playerCount / 2) - 1);

    // Fisher-Yates shuffle to pick imposters
    const indices = Array.from({ length: playerCount }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const imposterSet = new Set(indices.slice(0, imposterCount));

    const players = Array.from({ length: playerCount }, (_, i) => ({
      label: `Player ${i + 1}`,
      isImposter: imposterSet.has(i),
      word: imposterSet.has(i) ? hint : word,
      role: imposterSet.has(i) ? "IMPOSTER" : "NORMAL",
    }));

    // Pick a random NON-imposter to go first
    const nonImposters = players
      .map((p, i) => ({ ...p, index: i }))
      .filter((p) => !p.isImposter);
    const firstPlayer = nonImposters[Math.floor(Math.random() * nonImposters.length)].index + 1;

    return { players, word, hint, firstPlayer };
  }, [category, playerCount]);

  const handleFlip = useCallback(() => {
    if (isFlipped) return;
    setIsFlipped(true);
    playFlipOpen();
  }, [isFlipped]);

  const handleClose = useCallback(() => {
    playFlipClose();
    setIsFlipped(false);
    const nextViewed = viewedCount + 1;
    setViewedCount(nextViewed);

    // Move to next player after a brief delay for the flip animation
    setTimeout(() => {
      setCurrentPlayer((prev) => prev + 1);
    }, 400);
  }, [viewedCount]);

  const handleStartGame = useCallback(() => {
    playStartGame();
    navigate("/imposter/start", {
      state: { playerCount, firstPlayer: gameData.firstPlayer },
    });
  }, [navigate, playerCount, gameData]);

  if (!gameData) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">Missing game data.</p>
        <Link to="/imposter" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">
          ← Start Over
        </Link>
      </div>
    );
  }

  const allViewed = viewedCount >= gameData.players.length;
  const player = gameData.players[currentPlayer];
  const style = getCardStyle(currentPlayer);

  // All cards dealt — show start button
  if (allViewed) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-8">
        <h1 className="font-heading text-pink text-sm glow-pink text-center leading-relaxed">
          IMPOSTER
        </h1>
        <p className="text-yellow font-heading text-[10px] glow-yellow">{category}</p>

        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">✅</span>
          <p className="text-gray-300 font-body text-lg">All cards dealt!</p>
        </div>

        <button
          onClick={handleStartGame}
          className="neon-btn bg-bg text-lime border-lime box-glow-lime text-lg w-full max-w-xs pulse-glow"
        >
          Start Game 🎮
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <h1 className="font-heading text-pink text-sm glow-pink mb-1 text-center leading-relaxed">
        IMPOSTER
      </h1>
      <p className="text-yellow font-heading text-[10px] glow-yellow mb-4">{category}</p>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {gameData.players.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < viewedCount
                ? "bg-lime"
                : i === currentPlayer
                ? "bg-yellow box-glow-yellow"
                : "bg-gray-700"
            }`}
          />
        ))}
      </div>

      <p className="text-gray-400 font-body text-sm mb-2">
        {isFlipped ? "Tap below to close & pass" : `Hand the phone to ${player.label}`}
      </p>
      <p className="font-heading text-xs text-white mb-6">{player.label}</p>

      {/* Single card */}
      <div className="perspective-[800px] w-full max-w-[240px] mb-8" onClick={!isFlipped ? handleFlip : undefined}>
        <div className={`card-inner relative w-full aspect-[3/4] cursor-pointer ${isFlipped ? "flipped" : ""}`}>
          {/* Front (face-down) */}
          <div
            className={`card-face absolute inset-0 rounded-xl border-2 bg-bg ${style.border} ${style.glow} flex flex-col items-center justify-center gap-3`}
          >
            <span className="text-5xl">🃏</span>
            <span className={`font-heading text-xs ${style.text} ${style.textGlow}`}>
              TAP TO REVEAL
            </span>
          </div>

          {/* Back (face-up — word revealed) */}
          <div
            className={`card-face card-back absolute inset-0 rounded-xl border-2 bg-bg ${style.border} ${style.glow} flex flex-col items-center justify-center gap-4 px-4`}
          >
            <span
              className={`font-heading text-[10px] ${
                player.isImposter ? "text-pink glow-pink" : "text-lime glow-lime"
              }`}
            >
              {player.role}
            </span>
            <span className="font-body text-2xl font-bold text-white text-center">
              {player.word}
            </span>
            {player.isImposter && (
              <span className="text-xs text-gray-500 font-body">(hint only)</span>
            )}
          </div>
        </div>
      </div>

      {/* Close button — only when flipped */}
      {isFlipped && (
        <button
          onClick={handleClose}
          className="neon-btn bg-bg text-orange border-orange box-glow-orange text-base w-full max-w-[240px]"
        >
          Got it — close & pass →
        </button>
      )}
    </div>
  );
}
