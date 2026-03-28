import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext.jsx";

export default function OnlineLobby() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { code, isHost } = location.state || {};

  const [players, setPlayers] = useState([]);
  const [lobbyHost, setLobbyHost] = useState(null);
  const [category, setCategory] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(0);

  useEffect(() => {
    if (!socket || !code) return;

    function onLobbyUpdate(data) {
      setPlayers(data.players);
      setLobbyHost(data.host);
      setCategory(data.category);
      setMaxPlayers(data.maxPlayers);
    }

    function onCardDealt(cardData) {
      navigate("/imposter/online/card", { state: { code, ...cardData } });
    }

    socket.on("lobby_update", onLobbyUpdate);
    socket.on("card_dealt", onCardDealt);

    return () => {
      socket.off("lobby_update", onLobbyUpdate);
      socket.off("card_dealt", onCardDealt);
    };
  }, [socket, code, navigate]);

  function handleStart() {
    socket.emit("start_game", { code });
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
      <p className="text-gray-500 font-body text-xs mb-6">Share this code with friends</p>

      {category && (
        <p className="text-orange font-heading text-[10px] glow-orange mb-6">{category}</p>
      )}

      {/* Player list */}
      <div className="w-full max-w-sm mb-8">
        <p className="text-gray-400 font-body text-sm mb-3">
          Players ({players.length}/{maxPlayers})
        </p>
        <div className="flex flex-col gap-2">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 ${
                p.id === lobbyHost
                  ? "border-lime bg-lime/5"
                  : "border-gray-700 bg-bg"
              }`}
            >
              <span className="text-lg">{p.id === lobbyHost ? "👑" : "🎮"}</span>
              <span className="font-body text-white text-base">{p.name}</span>
              {p.id === lobbyHost && (
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
