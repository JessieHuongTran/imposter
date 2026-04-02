import { useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSB, generateId } from "../../contexts/SupabaseContext.jsx";

export default function OnlineJoin() {
  const navigate = useNavigate();
  const sb = useSB();
  const [searchParams] = useSearchParams();
  const prefill = (searchParams.get("code") || "").toUpperCase().slice(0, 4);
  const [code, setCode] = useState(() =>
    prefill.length === 4 ? prefill.split("") : ["", "", "", ""]
  );
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  function handleCodeInput(index, value) {
    const char = value.toUpperCase().replace(/[^A-Z]/g, "");
    if (!char && value === "") {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      if (index > 0) inputRefs[index - 1].current?.focus();
      return;
    }
    if (!char) return;

    const newCode = [...code];
    newCode[index] = char[0];
    setCode(newCode);
    if (index < 3) inputRefs[index + 1].current?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  async function handleJoin() {
    const roomCode = code.join("");
    if (roomCode.length < 4) return setError("Enter the full room code");
    if (!name.trim()) return setError("Enter your name");

    setJoining(true);
    setError("");

    try {
      // Fetch the room
      const { data: room, error: fetchError } = await sb
        .from("imposter_rooms")
        .select("*")
        .eq("code", roomCode)
        .single();

      if (fetchError || !room) {
        setError("Room not found");
        setJoining(false);
        return;
      }

      const roomData = room.data;

      if (roomData.status !== "lobby") {
        setError("Game already in progress");
        setJoining(false);
        return;
      }

      if (roomData.players.length >= roomData.maxPlayers) {
        setError("Room is full");
        setJoining(false);
        return;
      }

      const playerId = generateId();
      const updatedPlayers = [...roomData.players, { id: playerId, name: name.trim() }];

      const { error: updateError } = await sb
        .from("imposter_rooms")
        .update({ data: { ...roomData, players: updatedPlayers } })
        .eq("code", roomCode);

      if (updateError) {
        setError("Failed to join room");
        setJoining(false);
        return;
      }

      navigate("/imposter/online/lobby", {
        state: { code: roomCode, isHost: false, playerId },
      });
    } catch (err) {
      setError(err.message || "Could not join room");
      setJoining(false);
    }
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/imposter/online" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Back
      </Link>

      <h1 className="font-heading text-pink text-sm glow-pink mb-8 text-center leading-relaxed">
        JOIN GAME
      </h1>

      {/* Room code input */}
      <p className="text-gray-400 font-body text-sm mb-3">Room Code</p>
      <div className="flex gap-3 mb-8">
        {code.map((char, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            maxLength={1}
            value={char}
            onChange={(e) => handleCodeInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-14 h-16 bg-bg border-2 border-pink rounded-lg text-center text-white font-heading text-xl outline-none focus:box-glow-pink"
          />
        ))}
      </div>

      {/* Name input */}
      <div className="w-full max-w-sm mb-8">
        <label className="font-body text-gray-400 text-sm mb-2 block">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={12}
          className="w-full bg-bg border-2 border-pink rounded-lg px-4 py-3 text-white font-body text-base outline-none focus:box-glow-pink"
        />
      </div>

      {error && <p className="text-pink font-body text-sm mb-4">{error}</p>}

      <button
        onClick={handleJoin}
        disabled={joining}
        className="neon-btn bg-bg text-pink border-pink box-glow-pink text-lg w-full max-w-sm disabled:opacity-50"
      >
        {joining ? "Joining..." : "Join Room 🎟️"}
      </button>
    </div>
  );
}
