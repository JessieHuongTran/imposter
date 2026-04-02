import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSB } from "../../contexts/SupabaseContext.jsx";
import { playBuzz, playTap, startLobbyMusic, stopLobbyMusic } from "../../utils/sound.js";

export default function TriviaPlayerBoard() {
  const sb = useSB();
  const location = useLocation();
  const { code, playerId, playerName } = location.state || {};
  const subRef = useRef(null);
  const broadcastRef = useRef(null);

  const [roomData, setRoomData] = useState(null);
  const [waiting, setWaiting] = useState(true); // waiting for game to start
  const [buzzSent, setBuzzSent] = useState(false);

  // Fetch initial state
  useEffect(() => {
    if (!sb || !code) return;
    sb.from("trivia_rooms")
      .select("data")
      .eq("code", code)
      .single()
      .then(({ data }) => {
        if (data) {
          setRoomData(data.data);
          if (data.data.status === "playing") setWaiting(false);
        }
      });
  }, [sb, code]);

  // Subscribe to DB changes
  useEffect(() => {
    if (!sb || !code) return;

    const channel = sb
      .channel(`trivia-player-${code}-${playerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trivia_rooms",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          const data = payload.new.data;
          setRoomData(data);

          if (data.status === "playing" && waiting) {
            stopLobbyMusic();
            setWaiting(false);
          }

          // Reset buzzSent when a new question opens
          if (data.buzzState === "OPEN") {
            setBuzzSent(false);
          }
          if (data.buzzState === "LOCKED") {
            setBuzzSent(false);
          }
        }
      )
      .subscribe();

    subRef.current = channel;
    return () => {
      if (subRef.current) sb.removeChannel(subRef.current);
    };
  }, [sb, code, playerId, waiting]);

  // Setup broadcast channel for sending buzz
  useEffect(() => {
    if (!sb || !code) return;

    const channel = sb.channel(`trivia-buzz-${code}`).subscribe();
    broadcastRef.current = channel;

    return () => {
      if (broadcastRef.current) sb.removeChannel(broadcastRef.current);
    };
  }, [sb, code]);

  // Play lobby music while waiting
  useEffect(() => {
    if (waiting) startLobbyMusic();
    return () => stopLobbyMusic();
  }, [waiting]);

  function handleBuzz() {
    if (buzzSent) return;
    playBuzz();
    setBuzzSent(true);

    if (broadcastRef.current) {
      broadcastRef.current.send({
        type: "broadcast",
        event: "buzz",
        payload: { playerId, playerName },
      });
    }
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

  // Waiting for game to start
  if (waiting) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
        <h1 className="font-heading text-cyan text-sm glow-cyan text-center leading-relaxed">
          WAITING FOR HOST
        </h1>
        <p className="font-body text-gray-400 text-sm">Room {code}</p>
        <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-body text-sm pulse-glow">
          Game will start soon...
        </p>
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

  const { buzzState, buzzer, questionNum, totalQuestions, players, status } = roomData;
  const myScore = players.find((p) => p.id === playerId)?.score ?? 0;
  const iWon = buzzer?.id === playerId;
  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (status === "finished") {
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
                i === 0
                  ? "border-yellow box-glow-yellow"
                  : p.id === playerId
                  ? "border-cyan"
                  : "border-gray-700"
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
    <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
      {/* Question number */}
      <p className="font-heading text-yellow text-xs glow-yellow">
        Q{questionNum}/{totalQuestions}
      </p>

      {/* Buzz button area */}
      {buzzState === "LOCKED" && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-40 h-40 rounded-full border-4 border-gray-700 flex items-center justify-center">
            <span className="font-heading text-xs text-gray-600 text-center leading-relaxed">
              WAIT FOR<br />HOST
            </span>
          </div>
        </div>
      )}

      {buzzState === "OPEN" && !buzzSent && (
        <button
          onClick={handleBuzz}
          className="w-44 h-44 rounded-full border-4 border-pink box-glow-pink bg-bg flex items-center justify-center active:scale-95 transition-transform cursor-pointer pulse-glow"
        >
          <span className="font-heading text-2xl text-pink glow-pink leading-relaxed">
            BUZZ!
          </span>
        </button>
      )}

      {buzzState === "OPEN" && buzzSent && (
        <div className="w-40 h-40 rounded-full border-4 border-yellow flex items-center justify-center">
          <span className="font-heading text-xs text-yellow glow-yellow text-center leading-relaxed">
            BUZZ<br />SENT!
          </span>
        </div>
      )}

      {buzzState === "BUZZED" && (
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-40 h-40 rounded-full border-4 flex items-center justify-center ${
              iWon
                ? "border-lime box-glow-lime"
                : "border-gray-700"
            }`}
          >
            <span
              className={`font-heading text-xs text-center leading-relaxed ${
                iWon ? "text-lime glow-lime" : "text-gray-500"
              }`}
            >
              {iWon ? "YOU\nBUZZED!" : `${buzzer?.name}\nGOT IT`}
            </span>
          </div>
        </div>
      )}

      {/* My score */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-gray-500 font-body text-xs">Your score</p>
        <p className="font-heading text-2xl text-yellow glow-yellow">{myScore}</p>
      </div>

      {/* Mini scoreboard */}
      <div className="w-full max-w-xs">
        <div className="flex flex-col gap-1">
          {[...players].sort((a, b) => b.score - a.score).map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-3 py-2 rounded ${
                p.id === playerId ? "bg-gray-900" : ""
              }`}
            >
              <span className={`font-body text-xs ${p.id === playerId ? "text-cyan" : "text-gray-400"}`}>
                {p.name}
              </span>
              <span className="font-heading text-xs text-yellow">{p.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
