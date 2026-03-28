import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext.jsx";
import { playFlipOpen } from "../../utils/sound.js";

export default function NumGuessOnlineCreate() {
  const navigate = useNavigate();
  const { ensureConnected } = useSocket();
  const [secretInput, setSecretInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    const num = parseInt(secretInput, 10);
    if (isNaN(num) || num < 1 || num > 100) {
      return setError("Enter a number between 1 and 100");
    }

    setCreating(true);
    setError("");
    playFlipOpen();

    try {
      const socket = await ensureConnected();
      socket.emit("ng_create_room", { secretNumber: num }, (res) => {
        if (res.success) {
          navigate("/numguess/online/lobby", {
            state: { code: res.code, isHost: true },
          });
        } else {
          setError("Failed to create room");
          setCreating(false);
        }
      });
    } catch {
      setError("Could not connect to server");
      setCreating(false);
    }
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/numguess/online" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Back
      </Link>

      <h1 className="font-heading text-lime text-sm glow-lime mb-6 text-center leading-relaxed">
        HOST GAME
      </h1>

      <p className="text-gray-300 font-body text-base mb-2">Pick your secret number</p>
      <p className="text-gray-600 font-body text-xs mb-6">1 – 100</p>

      <input
        type="number"
        inputMode="numeric"
        min="1"
        max="100"
        value={secretInput}
        onChange={(e) => { setError(""); setSecretInput(e.target.value); }}
        placeholder="1 – 100"
        className="w-44 h-20 bg-bg border-2 border-orange rounded-xl text-center text-yellow font-heading text-3xl outline-none focus:box-glow-orange mb-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      {error && <p className="text-pink font-body text-sm mb-4">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="neon-btn bg-bg text-yellow border-yellow box-glow-yellow text-lg w-full max-w-xs disabled:opacity-50"
      >
        {creating ? "Creating..." : "LOCK IN & CREATE 🔒"}
      </button>
    </div>
  );
}
