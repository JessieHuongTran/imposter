import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { playFlipOpen, playStartGame, playHigher, playLower, playCorrect, playTap } from "../../utils/sound.js";

export default function LocalPlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { p1SecretNumber, p2SecretNumber } = location.state || {};

  const [currentTurn, setCurrentTurn] = useState("p1");
  const [guessInput, setGuessInput] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [winner, setWinner] = useState(null);
  const [lastResult, setLastResult] = useState(null); // show result briefly before switching
  const [error, setError] = useState("");
  const historyRef = useRef(null);

  // Scroll history to bottom when new guess added
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [guesses]);

  if (!p1SecretNumber || !p2SecretNumber) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">Missing game data.</p>
        <Link to="/numguess" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">
          ← Start Over
        </Link>
      </div>
    );
  }

  const opponent = currentTurn === "p1" ? "p2" : "p1";
  const targetSecret = currentTurn === "p1" ? p2SecretNumber : p1SecretNumber;

  const turnColor = currentTurn === "p1"
    ? { text: "text-cyan", glow: "glow-cyan", border: "border-cyan", boxGlow: "box-glow-cyan", label: "P1" }
    : { text: "text-pink", glow: "glow-pink", border: "border-pink", boxGlow: "box-glow-pink", label: "P2" };

  // Win screen
  if (winner) {
    const winColor = winner === "p1"
      ? { text: "text-cyan", glow: "glow-cyan", label: "P1" }
      : { text: "text-pink", glow: "glow-pink", label: "P2" };

    return (
      <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
        <h1 className="font-heading text-pink text-sm glow-pink mb-4 text-center leading-relaxed">
          NUMBER GUESS
        </h1>

        <span className="text-5xl mb-2 pulse-glow">🎉</span>
        <p className={`font-heading text-lg ${winColor.text} ${winColor.glow} mb-6`}>
          {winColor.label} WINS!
        </p>

        {/* Reveal numbers */}
        <div className="flex gap-4 mb-6">
          <div className="rounded-lg border-2 border-yellow box-glow-yellow bg-bg px-4 py-3 text-center">
            <p className="font-body text-xs text-gray-400 mb-1">P1's number</p>
            <p className="font-heading text-lg text-yellow glow-yellow">{p1SecretNumber}</p>
          </div>
          <div className="rounded-lg border-2 border-yellow box-glow-yellow bg-bg px-4 py-3 text-center">
            <p className="font-body text-xs text-gray-400 mb-1">P2's number</p>
            <p className="font-heading text-lg text-yellow glow-yellow">{p2SecretNumber}</p>
          </div>
        </div>

        {/* Guess timeline */}
        <GuessTimeline guesses={guesses} />

        <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
          <button
            onClick={() => navigate("/numguess/local/setup")}
            className="neon-btn bg-bg text-orange border-orange box-glow-orange text-base"
          >
            PLAY AGAIN
          </button>
          <Link to="/" className="neon-btn bg-bg text-pink border-pink text-sm text-center no-underline">
            HOME
          </Link>
        </div>
      </div>
    );
  }

  // Show result screen briefly after a guess
  if (lastResult) {
    const rColor = lastResult.result === "correct"
      ? "text-lime glow-lime"
      : lastResult.result === "higher"
      ? "text-cyan glow-cyan"
      : "text-pink glow-pink";
    const rIcon = lastResult.result === "correct" ? "✅" : lastResult.result === "higher" ? "⬆️" : "⬇️";
    const rLabel = lastResult.result === "correct" ? "CORRECT!" : lastResult.result === "higher" ? "HIGHER" : "LOWER";

    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <div className={`rounded-full px-4 py-1 border-2 ${turnColor.border}`}>
          <span className={`font-heading text-[10px] ${turnColor.text} ${turnColor.glow}`}>
            🎮 {turnColor.label} GUESSED {lastResult.value}
          </span>
        </div>

        <span className="text-6xl mt-4">{rIcon}</span>
        <p className={`font-heading text-xl ${rColor}`}>{rLabel}</p>

        {lastResult.result !== "correct" && (
          <button
            onClick={() => {
              setLastResult(null);
              setCurrentTurn(opponent);
              setGuessInput("");
            }}
            className={`neon-btn bg-bg ${opponent === "p1" ? "text-cyan border-cyan box-glow-cyan" : "text-pink border-pink box-glow-pink"} text-base mt-4`}
          >
            Pass to {opponent.toUpperCase()} →
          </button>
        )}
      </div>
    );
  }

  function handleSubmitGuess() {
    const value = parseInt(guessInput, 10);
    if (isNaN(value) || value < 1 || value > 100) {
      setError("Enter a number between 1 and 100");
      return;
    }
    setError("");

    // Auto-validate against opponent's secret
    let result;
    if (value === targetSecret) {
      result = "correct";
    } else if (targetSecret > value) {
      result = "higher";
    } else {
      result = "lower";
    }

    const entry = { guesser: currentTurn, value, result };
    const newGuesses = [...guesses, entry];
    setGuesses(newGuesses);

    if (result === "correct") {
      playCorrect();
      setWinner(currentTurn);
    } else {
      if (result === "higher") playHigher(); else playLower();
      setLastResult(entry);
    }
  }

  // P1 and P2 guess histories
  const p1Guesses = guesses.filter((g) => g.guesser === "p1");
  const p2Guesses = guesses.filter((g) => g.guesser === "p2");

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <h1 className="font-heading text-pink text-sm glow-pink mb-4 text-center leading-relaxed">
        NUMBER GUESS
      </h1>

      <div className={`rounded-full px-4 py-1 border-2 ${turnColor.border} mb-6`}>
        <span className={`font-heading text-[10px] ${turnColor.text} ${turnColor.glow}`}>
          🎮 {turnColor.label}'S TURN TO GUESS
        </span>
      </div>

      {/* Number input */}
      <input
        type="number"
        inputMode="numeric"
        min="1"
        max="100"
        value={guessInput}
        onChange={(e) => {
          setError("");
          setGuessInput(e.target.value);
        }}
        placeholder="?"
        className={`w-44 h-20 bg-bg border-2 ${turnColor.border} rounded-xl text-center text-yellow font-heading text-3xl outline-none focus:${turnColor.boxGlow} mb-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
      <p className="text-gray-600 font-body text-xs mb-4">1 – 100</p>

      {error && <p className="text-pink font-body text-sm mb-3">{error}</p>}

      <button
        onClick={handleSubmitGuess}
        className={`neon-btn bg-bg ${turnColor.text} ${turnColor.border} ${turnColor.boxGlow} text-lg w-full max-w-xs mb-6`}
      >
        SUBMIT GUESS
      </button>

      {/* Both players' guess history side by side */}
      {guesses.length > 0 && (
        <div className="w-full max-w-sm grid grid-cols-2 gap-3" ref={historyRef}>
          {/* P1 history */}
          <div className="rounded-lg border-2 border-cyan bg-bg p-3 max-h-48 overflow-y-auto">
            <p className="font-heading text-[9px] text-cyan glow-cyan mb-2">P1</p>
            {p1Guesses.length === 0 ? (
              <p className="text-gray-700 font-body text-xs">No guesses yet</p>
            ) : (
              p1Guesses.map((g, i) => {
                const rColor = g.result === "correct" ? "text-lime" : g.result === "higher" ? "text-cyan" : "text-pink";
                const rIcon = g.result === "correct" ? "✅" : g.result === "higher" ? "⬆" : "⬇";
                return (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-gray-800 last:border-0">
                    <span className="font-body text-white text-sm">{g.value}</span>
                    <span className={`font-body text-xs ${rColor}`}>{rIcon}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* P2 history */}
          <div className="rounded-lg border-2 border-pink bg-bg p-3 max-h-48 overflow-y-auto">
            <p className="font-heading text-[9px] text-pink glow-pink mb-2">P2</p>
            {p2Guesses.length === 0 ? (
              <p className="text-gray-700 font-body text-xs">No guesses yet</p>
            ) : (
              p2Guesses.map((g, i) => {
                const rColor = g.result === "correct" ? "text-lime" : g.result === "higher" ? "text-cyan" : "text-pink";
                const rIcon = g.result === "correct" ? "✅" : g.result === "higher" ? "⬆" : "⬇";
                return (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-gray-800 last:border-0">
                    <span className="font-body text-white text-sm">{g.value}</span>
                    <span className={`font-body text-xs ${rColor}`}>{rIcon}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GuessTimeline({ guesses }) {
  return (
    <div className="w-full max-w-sm rounded-lg border-2 border-gray-700 bg-bg p-3 max-h-60 overflow-y-auto">
      <p className="font-body text-gray-500 text-xs mb-2">Guess Timeline</p>
      {guesses.map((g, i) => {
        const gColor = g.guesser === "p1" ? "text-cyan" : "text-pink";
        const rColor = g.result === "correct" ? "text-lime" : g.result === "higher" ? "text-cyan" : "text-pink";
        const rIcon = g.result === "correct" ? "✅" : g.result === "higher" ? "⬆" : "⬇";
        const rLabel = g.result === "correct" ? "Correct!" : g.result === "higher" ? "Higher" : "Lower";
        return (
          <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-800 last:border-0">
            <span className={`font-heading text-[9px] ${gColor} w-6`}>{g.guesser.toUpperCase()}</span>
            <span className="font-body text-white text-sm">{g.value}</span>
            <span className={`font-body text-xs ${rColor} ml-auto`}>{rIcon} {rLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
