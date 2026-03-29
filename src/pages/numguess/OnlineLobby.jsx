import { useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSB } from "../../contexts/SupabaseContext.jsx";
import { startLobbyMusic, stopLobbyMusic } from "../../utils/sound.js";

export default function NumGuessOnlineLobby() {
  const sb = useSB();
  const navigate = useNavigate();
  const location = useLocation();
  const { code, isHost, playerId } = location.state || {};
  const subRef = useRef(null);

  useEffect(() => {
    startLobbyMusic();
    return () => stopLobbyMusic();
  }, []);

  useEffect(() => {
    if (!sb || !code) return;

    const channel = sb
      .channel(`ng-lobby-${code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "numguess_rooms",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          const data = payload.new.data;
          if (data.status === "playing") {
            stopLobbyMusic();
            navigate("/numguess/online/play", {
              state: { code, role: "p1", playerId },
            });
          }
        }
      )
      .subscribe();

    subRef.current = channel;

    return () => {
      if (subRef.current) sb.removeChannel(subRef.current);
    };
  }, [sb, code, navigate, playerId]);

  if (!code) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">No room found.</p>
        <Link to="/numguess/online" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
      <h1 className="font-heading text-cyan text-sm glow-cyan text-center leading-relaxed">
        WAITING FOR OPPONENT
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
      <p className="text-gray-500 font-body text-xs">Share this code with your opponent</p>

      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-body text-sm pulse-glow">
          Waiting for P2 to join and lock in...
        </p>
      </div>
    </div>
  );
}
