import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function PlayerCount() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category;
  const [count, setCount] = useState(4);

  if (!category) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">No category selected.</p>
        <Link to="/imposter/local" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">
          ← Pick Category
        </Link>
      </div>
    );
  }

  const imposterCount = Math.max(1, Math.floor(count / 2) - 1);

  function handleStart() {
    navigate("/imposter/cards", { state: { category, playerCount: count } });
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/imposter/local" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Back
      </Link>

      <h1 className="font-heading text-pink text-base glow-pink mb-1 text-center leading-relaxed">
        IMPOSTER
      </h1>
      <p className="text-yellow font-heading text-[10px] glow-yellow mb-8">{category}</p>

      <p className="text-gray-300 font-body text-lg mb-6">How many players?</p>

      <div className="flex items-center gap-6 mb-8">
        <button
          onClick={() => setCount((c) => Math.max(3, c - 1))}
          className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-2xl w-14 h-14 flex items-center justify-center p-0"
        >
          −
        </button>
        <span className="font-heading text-4xl text-white glow-cyan">{count}</span>
        <button
          onClick={() => setCount((c) => Math.min(8, c + 1))}
          className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-2xl w-14 h-14 flex items-center justify-center p-0"
        >
          +
        </button>
      </div>

      <div className="bg-bg border-2 border-dashed border-orange rounded-lg p-4 mb-10 w-full max-w-xs">
        <p className="font-body text-orange text-sm">
          🕵️ <span className="font-bold">{imposterCount}</span> imposter{imposterCount > 1 ? "s" : ""} among{" "}
          <span className="font-bold">{count}</span> players
        </p>
      </div>

      <button
        onClick={handleStart}
        className="neon-btn bg-bg text-lime border-lime box-glow-lime text-lg w-full max-w-xs"
      >
        Deal Cards →
      </button>
    </div>
  );
}
