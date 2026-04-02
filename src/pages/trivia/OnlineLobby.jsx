import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSB } from "../../contexts/SupabaseContext.jsx";
import { startLobbyMusic, stopLobbyMusic, playStartGame } from "../../utils/sound.js";

export default function TriviaOnlineLobby() {
  const sb = useSB();
  const navigate = useNavigate();
  const location = useLocation();
  const { code, isHost, hostId } = location.state || {};
  const subRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function shareLink() {
    const url = `${window.location.origin}/trivia/join?code=${code}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    startLobbyMusic();
    return () => stopLobbyMusic();
  }, []);

  // Fetch initial player list
  useEffect(() => {
    if (!sb || !code) return;
    sb.from("trivia_rooms")
      .select("data")
      .eq("code", code)
      .single()
      .then(({ data }) => {
        if (data) setPlayers(data.data.players);
      });
  }, [sb, code]);

  // Subscribe to updates
  useEffect(() => {
    if (!sb || !code) return;

    const channel = sb
      .channel(`trivia-lobby-${code}`)
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
          setPlayers(data.players);

          if (data.status === "playing") {
            stopLobbyMusic();
            playStartGame();
            // Players go to player board; host stays to navigate manually
            if (!isHost) {
              // Find this player's info from location state (they came from join)
              // They don't have playerId here — but they came from join, not lobby
              // Actually players land here? No — players go straight to /trivia/play from join
            }
          }
        }
      )
      .subscribe();

    subRef.current = channel;
    return () => {
      if (subRef.current) sb.removeChannel(subRef.current);
    };
  }, [sb, code, isHost, navigate]);

  async function handleStart() {
    if (players.length < 1) return;
    setStarting(true);

    const { data: room } = await sb
      .from("trivia_rooms")
      .select("data")
      .eq("code", code)
      .single();

    if (!room) return;

    const updatedData = {
      ...room.data,
      status: "playing",
      buzzState: "LOCKED",
      questionNum: 1,
    };

    await sb
      .from("trivia_rooms")
      .update({ data: updatedData })
      .eq("code", code);

    stopLobbyMusic();
    playStartGame();
    navigate("/trivia/host", { state: { code, hostId } });
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

  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
      <h1 className="font-heading text-cyan text-sm glow-cyan text-center leading-relaxed">
        TRIVIA ROOM
      </h1>

      <div className="flex gap-2">
        {code.split("").map((char, i) => (
          <div
            key={i}
            className="w-14 h-16 bg-bg border-2 border-yellow rounded-lg flex items-center justify-center"
          >
            <span className="font-heading text-xl text-yellow glow-yellow">{char}</span>
          </div>
        ))}
      </div>
      <button
        onClick={shareLink}
        className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-xs py-2 px-4"
      >
        {copied ? "Link Copied!" : "Share Join Link"}
      </button>

      {/* Player list */}
      <div className="w-full max-w-sm">
        <p className="text-gray-400 font-body text-xs mb-2 text-center">
          {players.length} player{players.length !== 1 ? "s" : ""} joined
        </p>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="bg-bg border border-gray-700 rounded-lg px-4 py-2 text-center"
            >
              <span className="font-body text-white text-sm">{p.name}</span>
            </div>
          ))}
          {players.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 font-body text-sm pulse-glow">
                Waiting for players...
              </p>
            </div>
          )}
        </div>
      </div>

      {isHost && (
        <button
          onClick={handleStart}
          disabled={starting || players.length < 1}
          className="neon-btn bg-bg text-lime border-lime box-glow-lime text-lg w-full max-w-xs disabled:opacity-50 mt-2"
        >
          {starting ? "Starting..." : "START GAME"}
        </button>
      )}
    </div>
  );
}
