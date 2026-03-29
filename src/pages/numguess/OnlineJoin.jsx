import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSB, generateId } from "../../contexts/SupabaseContext.jsx";
import { playFlipOpen } from "../../utils/sound.js";

export default function NumGuessOnlineJoin() {
  const navigate = useNavigate();
  const sb = useSB();
  const [code, setCode] = useState(["", "", "", ""]);
  const [secretInput, setSecretInput] = useState("");
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
    const num = parseInt(secretInput, 10);
    if (isNaN(num) || num < 1 || num > 100) return setError("Enter a number between 1 and 100");

    setJoining(true);
    setError("");
    playFlipOpen();

    try {
      const { data: room, error: fetchError } = await sb
        .from("numguess_rooms")
        .select("*")
        .eq("code", roomCode)
        .single();

      if (fetchError || !room) {
        setError("Room not found");
        setJoining(false);
        return;
      }

      const roomData = room.data;

      if (roomData.players.p2) {
        setError("Room is full");
        setJoining(false);
        return;
      }
      if (roomData.status !== "waiting") {
        setError("Game already started");
        setJoining(false);
        return;
      }

      const playerId = generateId();
      const updatedData = {
        ...roomData,
        players: {
          ...roomData.players,
          p2: { id: playerId, secretNumber: num },
        },
        status: "playing",
      };

      const { error: updateError } = await sb
        .from("numguess_rooms")
        .update({ data: updatedData })
        .eq("code", roomCode);

      if (updateError) {
        setError("Failed to join room");
        setJoining(false);
        return;
      }

      navigate("/numguess/online/play", { state: { code: roomCode, role: "p2", playerId } });
    } catch (err) {
      setError(err.message || "Could not join");
      setJoining(false);
    }
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/numguess/online" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Back
      </Link>

      <h1 className="font-heading text-pink text-sm glow-pink mb-6 text-center leading-relaxed">
        JOIN GAME
      </h1>

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

      <p className="text-gray-300 font-body text-base mb-2">Pick your secret number</p>
      <p className="text-gray-600 font-body text-xs mb-4">1 – 100</p>

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
        onClick={handleJoin}
        disabled={joining}
        className="neon-btn bg-bg text-yellow border-yellow box-glow-yellow text-lg w-full max-w-xs disabled:opacity-50"
      >
        {joining ? "Joining..." : "LOCK IN & JOIN 🔒"}
      </button>
    </div>
  );
}
