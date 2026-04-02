import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSB, generateId, generateCode } from "../../contexts/SupabaseContext.jsx";
import { playFlipOpen } from "../../utils/sound.js";

export default function MafiaOnlineCreate() {
  const navigate = useNavigate();
  const sb = useSB();
  const [name, setName] = useState("");
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
        phase: null,
        round: 0,
        nightResult: null,
        seerReveal: null,
        voteResult: null,
        winner: null,
        log: [],
      };

      const { error: insertError } = await sb
        .from("mafia_rooms")
        .insert({ code, data: roomData });

      if (insertError) {
        setError("Failed to create room: " + insertError.message);
        setCreating(false);
        return;
      }

      navigate("/mafia/lobby", {
        state: { code, isHost: true, hostId },
      });
    } catch (err) {
      setError(err.message || "Could not create room");
      setCreating(false);
    }
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/mafia" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
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
        className="w-64 h-14 bg-bg border-2 border-lime rounded-xl text-center text-white font-body text-lg outline-none focus:box-glow-lime mb-8"
      />

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
