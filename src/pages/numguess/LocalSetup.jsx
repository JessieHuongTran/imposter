import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { playFlipOpen } from "../../utils/sound.js";

export default function LocalSetup() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("p1"); // "p1" | "pass" | "p2"
  const [p1Input, setP1Input] = useState("");
  const [p2Input, setP2Input] = useState("");
  const [error, setError] = useState("");

  function parseNumber(val) {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1 || n > 100) return null;
    return n;
  }

  function handleLockP1() {
    const num = parseNumber(p1Input);
    if (!num) return setError("Enter a number between 1 and 100");
    playFlipOpen();
    setError("");
    setPhase("pass");
  }

  function handlePassToP2() {
    setPhase("p2");
  }

  function handleLockP2() {
    const num = parseNumber(p2Input);
    if (!num) return setError("Enter a number between 1 and 100");
    playFlipOpen();
    navigate("/numguess/local/play", {
      state: { p1SecretNumber: parseNumber(p1Input), p2SecretNumber: num },
    });
  }

  if (phase === "pass") {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
        <span className="text-5xl">🔒</span>
        <p className="font-heading text-cyan text-xs glow-cyan">P1 LOCKED IN</p>
        <p className="text-gray-400 font-body text-lg text-center">
          Pass the phone to Player 2
        </p>
        <button
          onClick={handlePassToP2}
          className="neon-btn bg-bg text-pink border-pink box-glow-pink text-lg"
        >
          I'm P2 — Ready
        </button>
      </div>
    );
  }

  const isP1 = phase === "p1";
  const inputValue = isP1 ? p1Input : p2Input;
  const setInputValue = isP1 ? setP1Input : setP2Input;
  const colorClasses = isP1
    ? { text: "text-cyan", glow: "glow-cyan", border: "border-cyan", boxGlow: "box-glow-cyan" }
    : { text: "text-pink", glow: "glow-pink", border: "border-pink", boxGlow: "box-glow-pink" };

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/numguess" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Back
      </Link>

      <h1 className="font-heading text-pink text-sm glow-pink mb-6 text-center leading-relaxed">
        NUMBER GUESS
      </h1>

      <div className={`rounded-full px-4 py-1 border-2 ${colorClasses.border} mb-6`}>
        <span className={`font-heading text-[10px] ${colorClasses.text} ${colorClasses.glow}`}>
          {isP1 ? "🎮 P1'S TURN" : "🎮 P2'S TURN"}
        </span>
      </div>

      <p className="text-gray-300 font-body text-base mb-2">Pick your secret number</p>
      <p className="text-gray-500 font-body text-xs mb-8">Don't let the other player see!</p>

      {/* Number input */}
      <input
        type="number"
        inputMode="numeric"
        min="1"
        max="100"
        value={inputValue}
        onChange={(e) => {
          setError("");
          setInputValue(e.target.value);
        }}
        placeholder="1 – 100"
        className={`w-44 h-20 bg-bg border-2 ${colorClasses.border} rounded-xl text-center text-yellow font-heading text-3xl outline-none focus:${colorClasses.boxGlow} mb-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
      <p className="text-gray-600 font-body text-xs mb-8">1 – 100</p>

      {error && <p className="text-pink font-body text-sm mb-4">{error}</p>}

      <button
        onClick={isP1 ? handleLockP1 : handleLockP2}
        className="neon-btn bg-bg text-yellow border-yellow box-glow-yellow text-lg w-full max-w-xs"
      >
        LOCK IN 🔒
      </button>
    </div>
  );
}
