import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSB } from "../../contexts/SupabaseContext.jsx";
import { startLobbyMusic, stopLobbyMusic } from "../../utils/sound.js";
import categories from "../../data/categories.js";

export default function OnlineLobby() {
  const sb = useSB();
  const navigate = useNavigate();
  const location = useLocation();
  const { code, isHost, playerId } = location.state || {};

  const [players, setPlayers] = useState([]);
  const [category, setCategory] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(0);
  const [hostId, setHostId] = useState(null);
  const [copied, setCopied] = useState(false);
  const subscriptionRef = useRef(null);

  async function shareLink() {
    const url = `${window.location.origin}/imposter/online/join?code=${code}`;
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

  useEffect(() => {
    if (!sb || !code) return;

    // Initial fetch
    async function fetchRoom() {
      const { data: room } = await sb
        .from("imposter_rooms")
        .select("*")
        .eq("code", code)
        .single();

      if (room) {
        applyRoomData(room.data);
      }
    }

    function applyRoomData(data) {
      setPlayers(data.players || []);
      setCategory(data.category || "");
      setMaxPlayers(data.maxPlayers || 0);
      if (data.players?.length > 0) {
        setHostId(data.players[0].id);
      }

      if (data.status === "revealing") {
        stopLobbyMusic();
        navigate("/imposter/online/card", {
          state: { code, playerId, roomData: data },
        });
      }
    }

    fetchRoom();

    // Subscribe to realtime changes
    const channel = sb
      .channel(`room-${code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "imposter_rooms",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          applyRoomData(payload.new.data);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        sb.removeChannel(subscriptionRef.current);
      }
    };
  }, [sb, code, navigate, playerId]);

  async function handleStart() {
    // Fetch latest room state
    const { data: room } = await sb
      .from("imposter_rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (!room) return;

    const roomData = room.data;
    const catData = categories[roomData.category];
    if (!catData) return;

    // Pick random word and hint
    const wordIndex = Math.floor(Math.random() * catData.words.length);
    const word = catData.words[wordIndex];
    const hint = catData.hints[wordIndex % catData.hints.length];

    // Determine imposter count
    const playerCount = roomData.players.length;
    const imposterCount = Math.max(1, Math.floor(playerCount / 2) - 1);

    // Fisher-Yates shuffle to pick imposters
    const indices = roomData.players.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const imposterIndices = new Set(indices.slice(0, imposterCount));

    // Build gameData players
    const gamePlayers = roomData.players.map((p, i) => {
      const isImposter = imposterIndices.has(i);
      return {
        id: p.id,
        name: p.name,
        label: `Player ${i + 1}`,
        isImposter,
        word: isImposter ? hint : word,
        role: isImposter ? "IMPOSTER" : "NORMAL",
      };
    });

    // Pick first player from non-imposters
    const nonImposters = gamePlayers.filter((p) => !p.isImposter);
    const firstPlayer = nonImposters[Math.floor(Math.random() * nonImposters.length)];

    const gameData = {
      players: gamePlayers,
      firstPlayerName: firstPlayer.name,
    };

    // Update room in Supabase
    await sb
      .from("imposter_rooms")
      .update({
        data: { ...roomData, status: "revealing", gameData, viewedCount: 0 },
      })
      .eq("code", code);
  }

  if (!code) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">No room found.</p>
        <Link to="/imposter/online" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">
          ← Back
        </Link>
      </div>
    );
  }

  const canStart = isHost && players.length >= 3;

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <h1 className="font-heading text-cyan text-sm glow-cyan mb-2 text-center leading-relaxed">
        LOBBY
      </h1>

      {/* Room code display */}
      <div className="flex gap-2 mb-2">
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
        className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-xs py-2 px-4 mb-4"
      >
        {copied ? "Link Copied!" : "Share Join Link"}
      </button>

      {category && (
        <p className="text-orange font-heading text-[10px] glow-orange mb-6">{category}</p>
      )}

      {/* Player list */}
      <div className="w-full max-w-sm mb-8">
        <p className="text-gray-400 font-body text-sm mb-3">
          Players ({players.length}/{maxPlayers})
        </p>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 ${
                p.id === hostId
                  ? "border-lime bg-lime/5"
                  : "border-gray-700 bg-bg"
              }`}
            >
              <span className="text-lg">{p.id === hostId ? "👑" : "🎮"}</span>
              <span className="font-body text-white text-base">{p.name}</span>
              {p.id === hostId && (
                <span className="text-lime font-body text-xs ml-auto">Host</span>
              )}
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-800 px-4 py-3"
            >
              <span className="text-lg opacity-30">⏳</span>
              <span className="font-body text-gray-600 text-base">Waiting...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Start / waiting */}
      {isHost ? (
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="neon-btn bg-bg text-lime border-lime box-glow-lime text-lg w-full max-w-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {players.length < 3
            ? `Need ${3 - players.length} more player${3 - players.length > 1 ? "s" : ""}`
            : "Start Game 🎮"}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-body text-sm">Waiting for host to start...</p>
        </div>
      )}
    </div>
  );
}
