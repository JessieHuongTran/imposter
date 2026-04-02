import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSB } from "../../contexts/SupabaseContext.jsx";
import { playBuzz, playCorrect, playWrong, playTap } from "../../utils/sound.js";

export default function TriviaHostBoard() {
  const sb = useSB();
  const location = useLocation();
  const { code, hostId } = location.state || {};
  const subRef = useRef(null);
  const broadcastRef = useRef(null);
  const buzzLockRef = useRef(false);

  const [roomData, setRoomData] = useState(null);

  // Fetch initial state
  useEffect(() => {
    if (!sb || !code) return;
    sb.from("trivia_rooms")
      .select("data")
      .eq("code", code)
      .single()
      .then(({ data }) => {
        if (data) setRoomData(data.data);
      });
  }, [sb, code]);

  // Subscribe to DB changes (for state sync)
  useEffect(() => {
    if (!sb || !code) return;

    const channel = sb
      .channel(`trivia-host-${code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trivia_rooms",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          setRoomData(payload.new.data);
        }
      )
      .subscribe();

    subRef.current = channel;
    return () => {
      if (subRef.current) sb.removeChannel(subRef.current);
    };
  }, [sb, code]);

  // Subscribe to broadcast buzz signals
  useEffect(() => {
    if (!sb || !code) return;

    const channel = sb
      .channel(`trivia-buzz-${code}`)
      .on("broadcast", { event: "buzz" }, async (payload) => {
        // Only accept first buzz — use ref to prevent race
        if (buzzLockRef.current) return;
        buzzLockRef.current = true;

        const { playerId, playerName } = payload.payload;
        playBuzz();

        // Read current state to make sure we're still OPEN
        const { data: room } = await sb
          .from("trivia_rooms")
          .select("data")
          .eq("code", code)
          .single();

        if (!room || room.data.buzzState !== "OPEN") {
          buzzLockRef.current = false;
          return;
        }

        const updatedData = {
          ...room.data,
          buzzState: "BUZZED",
          buzzer: { id: playerId, name: playerName },
        };

        await sb
          .from("trivia_rooms")
          .update({ data: updatedData })
          .eq("code", code);
      })
      .subscribe();

    broadcastRef.current = channel;
    return () => {
      if (broadcastRef.current) sb.removeChannel(broadcastRef.current);
    };
  }, [sb, code]);

  async function updateRoom(changes) {
    const { data: room } = await sb
      .from("trivia_rooms")
      .select("data")
      .eq("code", code)
      .single();

    if (!room) return;

    const updatedData = { ...room.data, ...changes };
    await sb
      .from("trivia_rooms")
      .update({ data: updatedData })
      .eq("code", code);
  }

  async function handleOpenBuzzer() {
    playTap();
    buzzLockRef.current = false;
    await updateRoom({ buzzState: "OPEN", buzzer: null });
  }

  async function handleCorrect() {
    playCorrect();
    if (!roomData?.buzzer) return;

    const { data: room } = await sb
      .from("trivia_rooms")
      .select("data")
      .eq("code", code)
      .single();

    if (!room) return;

    const players = room.data.players.map((p) =>
      p.id === room.data.buzzer.id ? { ...p, score: p.score + 1 } : p
    );

    const nextQ = room.data.questionNum + 1;
    const isFinished = nextQ > room.data.totalQuestions;

    const updatedData = {
      ...room.data,
      players,
      buzzState: "LOCKED",
      buzzer: null,
      questionNum: nextQ,
      ...(isFinished && { status: "finished" }),
    };

    buzzLockRef.current = false;
    await sb
      .from("trivia_rooms")
      .update({ data: updatedData })
      .eq("code", code);
  }

  async function handleIncorrect() {
    playWrong();
    buzzLockRef.current = false;
    await updateRoom({ buzzState: "OPEN", buzzer: null });
  }

  async function handleLock() {
    playTap();
    buzzLockRef.current = false;

    const nextQ = (roomData?.questionNum || 0) + 1;
    const isFinished = nextQ > (roomData?.totalQuestions || Infinity);

    await updateRoom({
      buzzState: "LOCKED",
      buzzer: null,
      questionNum: nextQ,
      ...(isFinished && { status: "finished" }),
    });
  }

  if (!code) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">No room found.</p>
        <Link to="/trivia" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">
          ← Back
        </Link>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5">
        <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { players, buzzState, buzzer, questionNum, totalQuestions, status } = roomData;
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const gameOver = status === "finished";

  // Game over screen
  if (gameOver) {
    return (
      <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
        <h1 className="font-heading text-yellow text-base glow-yellow mb-6 text-center leading-relaxed">
          GAME OVER
        </h1>

        <div className="w-full max-w-sm flex flex-col gap-3 mb-8">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between bg-bg border-2 rounded-xl px-5 py-4 ${
                i === 0 ? "border-yellow box-glow-yellow" : "border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-heading text-sm text-gray-500">{i === 0 ? "👑" : i + 1}</span>
                <span className="font-body text-white text-base">{p.name}</span>
              </div>
              <span className="font-heading text-lg text-yellow glow-yellow">{p.score}</span>
            </div>
          ))}
        </div>

        <Link to="/" className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-sm no-underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-6 min-h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm mb-4">
        <p className="font-body text-gray-500 text-xs">Room {code}</p>
        <p className="font-heading text-yellow text-xs glow-yellow">
          Q{questionNum}/{totalQuestions}
        </p>
      </div>

      {/* State indicator */}
      <div className="mb-6">
        {buzzState === "LOCKED" && (
          <div className="font-heading text-sm text-gray-500 text-center leading-relaxed">
            BUZZER LOCKED
          </div>
        )}
        {buzzState === "OPEN" && (
          <div className="font-heading text-sm text-lime glow-lime text-center leading-relaxed pulse-glow">
            BUZZER OPEN
          </div>
        )}
        {buzzState === "BUZZED" && buzzer && (
          <div className="flex flex-col items-center gap-2">
            <div className="font-heading text-sm text-pink glow-pink text-center leading-relaxed">
              BUZZED!
            </div>
            <div className="font-heading text-lg text-yellow glow-yellow text-center leading-relaxed">
              {buzzer.name}
            </div>
          </div>
        )}
      </div>

      {/* Host controls */}
      <div className="flex flex-col gap-3 w-full max-w-xs mb-8">
        {buzzState === "LOCKED" && (
          <button
            onClick={handleOpenBuzzer}
            className="neon-btn bg-bg text-lime border-lime box-glow-lime text-base w-full py-4"
          >
            OPEN BUZZER
          </button>
        )}

        {buzzState === "OPEN" && (
          <button
            onClick={handleLock}
            className="neon-btn bg-bg text-gray-400 border-gray-600 text-sm w-full py-3"
          >
            LOCK (skip question)
          </button>
        )}

        {buzzState === "BUZZED" && (
          <div className="flex gap-3">
            <button
              onClick={handleCorrect}
              className="neon-btn bg-bg text-lime border-lime box-glow-lime text-base flex-1 py-4"
            >
              CORRECT
            </button>
            <button
              onClick={handleIncorrect}
              className="neon-btn bg-bg text-pink border-pink box-glow-pink text-base flex-1 py-4"
            >
              WRONG
            </button>
          </div>
        )}
      </div>

      {/* Scoreboard */}
      <div className="w-full max-w-sm">
        <h2 className="font-heading text-xs text-cyan glow-cyan mb-3 text-center leading-relaxed">
          SCOREBOARD
        </h2>
        <div className="flex flex-col gap-2">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between bg-bg border rounded-lg px-4 py-3 ${
                i === 0 && p.score > 0
                  ? "border-yellow box-glow-yellow"
                  : "border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-heading text-xs text-gray-500">{i + 1}</span>
                <span className="font-body text-white text-sm">{p.name}</span>
              </div>
              <span className="font-heading text-sm text-yellow glow-yellow">
                {p.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
