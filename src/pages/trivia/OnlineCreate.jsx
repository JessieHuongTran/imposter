import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSB, generateId, generateCode } from "../../contexts/SupabaseContext.jsx";
import { playFlipOpen } from "../../utils/sound.js";

export default function TriviaOnlineCreate() {
  const navigate = useNavigate();
  const sb = useSB();
  const [name, setName] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter your name");

    setCreating(true);
    setError("");
    playFlipOpen();

    try {
      const hostId = generateId();
      const code = generateCode();

      const roomData = {
        host: { id: hostId, name: trimmed },
        players: [],
        status: "lobby",
        buzzState: "LOCKED",
        buzzer: null,
        questionNum: 0,
        totalQuestions,
      };

      const { error: insertError } = await sb
        .from("trivia_rooms")
        .insert({ code, data: roomData });

      if (insertError) {
        setError("Failed to create room: " + insertError.message);
        setCreating(false);
        return;
      }

      navigate("/trivia/lobby", {
        state: { code, isHost: true, hostId },
      });
    } catch (err) {
      setError(err.message || "Could not create room");
      setCreating(false);
    }
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/trivia" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Back
      </Link>

      <h1 className="font-heading text-lime text-sm glow-lime mb-6 text-center leading-relaxed">
        HOST GAME
      </h1>

      <p className="text-gray-300 font-body text-base mb-6">Enter your name</p>

      <input
        type="text"
        value={name}
        onChange={(e) => { setError(""); setName(e.target.value); }}
        placeholder="Host name"
        maxLength={16}
        className="w-64 h-14 bg-bg border-2 border-lime rounded-xl text-center text-white font-body text-lg outline-none focus:box-glow-lime mb-6"
      />

      <p className="text-gray-300 font-body text-sm mb-2">Number of questions</p>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setTotalQuestions((v) => Math.max(1, v - 5))}
          className="w-10 h-10 rounded-lg border-2 border-gray-600 text-gray-400 font-heading text-sm flex items-center justify-center"
        >
          -
        </button>
        <span className="font-heading text-xl text-yellow glow-yellow w-12 text-center">
          {totalQuestions}
        </span>
        <button
          onClick={() => setTotalQuestions((v) => Math.min(50, v + 5))}
          className="w-10 h-10 rounded-lg border-2 border-gray-600 text-gray-400 font-heading text-sm flex items-center justify-center"
        >
          +
        </button>
      </div>

      {error && <p className="text-pink font-body text-sm mb-4">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="neon-btn bg-bg text-yellow border-yellow box-glow-yellow text-lg w-full max-w-xs disabled:opacity-50"
      >
        {creating ? "Creating..." : "CREATE ROOM"}
      </button>
    </div>
  );
}
