import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext.jsx";
import { playFlipOpen, playFlipClose, playStartGame } from "../../utils/sound.js";

export default function NumGuessOnlinePlay() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { code, role } = location.state || {};

  const [currentTurn, setCurrentTurn] = useState("p1");
  const [guessInput, setGuessInput] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [waitingForResult, setWaitingForResult] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!socket || !code) return;

    function onGuessResult(data) {
      if (data.result === "correct") {
        playStartGame();
      } else {
        playFlipClose();
      }
      setGuesses((prev) => [...prev, data]);
      setWaitingForResult(false);
      setGuessInput("");

      if (data.result !== "correct") {
        setCurrentTurn(data.guesser === "p1" ? "p2" : "p1");
      }
    }

    function onGameOver(data) {
      navigate("/numguess/online/result", {
        state: { ...data, myRole: role, code },
      });
    }

    socket.on("ng_guess_result", onGuessResult);
    socket.on("ng_game_over", onGameOver);

    return () => {
      socket.off("ng_guess_result", onGuessResult);
      socket.off("ng_game_over", onGameOver);
    };
  }, [socket, code, role, navigate]);

  if (!code || !role) return null;

  const isMyTurn = currentTurn === role;
  const opponent = role === "p1" ? "p2" : "p1";
  const turnColor = currentTurn === "p1"
    ? { text: "text-cyan", glow: "glow-cyan", border: "border-cyan", boxGlow: "box-glow-cyan", label: "P1" }
    : { text: "text-pink", glow: "glow-pink", border: "border-pink", boxGlow: "box-glow-pink", label: "P2" };

  const p1Guesses = guesses.filter((g) => g.guesser === "p1");
  const p2Guesses = guesses.filter((g) => g.guesser === "p2");

  function handleSubmit() {
    const value = parseInt(guessInput, 10);
    if (isNaN(value) || value < 1 || value > 100) {
      return setError("Enter a number between 1 and 100");
    }
    setError("");
    playFlipOpen();
    setWaitingForResult(true);
    socket.emit("ng_submit_guess", { code, value });
  }

  // Waiting for opponent's turn
  if (!isMyTurn && !waitingForResult) {
    return (
      <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
        <h1 className="font-heading text-pink text-sm glow-pink mb-4 text-center leading-relaxed">
          NUMBER GUESS
        </h1>

        <div className={`rounded-full px-4 py-1 border-2 ${turnColor.border} mb-4`}>
          <span className={`font-heading text-[10px] ${turnColor.text} ${turnColor.glow}`}>
            🎮 {turnColor.label}'S TURN
          </span>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-body text-sm">Waiting for opponent...</p>
        </div>

        <BothHistories p1Guesses={p1Guesses} p2Guesses={p2Guesses} />
      </div>
    );
  }

  // Waiting for server result
  if (waitingForResult) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
        <h1 className="font-heading text-pink text-sm glow-pink text-center leading-relaxed">
          NUMBER GUESS
        </h1>
        <p className="text-gray-300 font-body text-lg">
          You guessed <span className="text-yellow font-bold">{guessInput}</span>
        </p>
        <div className="w-6 h-6 border-2 border-yellow border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-body text-sm">Checking...</p>
      </div>
    );
  }

  // My turn to guess
  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <h1 className="font-heading text-pink text-sm glow-pink mb-4 text-center leading-relaxed">
        NUMBER GUESS
      </h1>

      <div className={`rounded-full px-4 py-1 border-2 ${turnColor.border} mb-6`}>
        <span className={`font-heading text-[10px] ${turnColor.text} ${turnColor.glow}`}>
          🎮 YOUR TURN TO GUESS
        </span>
      </div>

      <input
        type="number"
        inputMode="numeric"
        min="1"
        max="100"
        value={guessInput}
        onChange={(e) => { setError(""); setGuessInput(e.target.value); }}
        placeholder="?"
        className={`w-44 h-20 bg-bg border-2 ${turnColor.border} rounded-xl text-center text-yellow font-heading text-3xl outline-none mb-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
      <p className="text-gray-600 font-body text-xs mb-4">1 – 100</p>

      {error && <p className="text-pink font-body text-sm mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        className={`neon-btn bg-bg ${turnColor.text} ${turnColor.border} ${turnColor.boxGlow} text-lg w-full max-w-xs mb-6`}
      >
        SUBMIT GUESS
      </button>

      <BothHistories p1Guesses={p1Guesses} p2Guesses={p2Guesses} />
    </div>
  );
}

function BothHistories({ p1Guesses, p2Guesses }) {
  if (p1Guesses.length === 0 && p2Guesses.length === 0) return null;

  return (
    <div className="w-full max-w-sm grid grid-cols-2 gap-3">
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
  );
}
