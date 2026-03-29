import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext.jsx";

export default function OnlineJoin() {
  const navigate = useNavigate();
  const { ensureConnected } = useSocket();
  const [code, setCode] = useState(["", "", "", ""]);
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
      const socket = await ensureConnected();
      socket.emit("join_room", { code: roomCode, name: name.trim() }, (res) => {
        if (res.success) {
          navigate("/imposter/online/lobby", {
            state: { code: roomCode, isHost: false },
          });
        } else {
          setError(res.error || "Could not join");
          setJoining(false);
        }
      });
    } catch (err) {
      setError(err.message || "Could not connect to server");
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
