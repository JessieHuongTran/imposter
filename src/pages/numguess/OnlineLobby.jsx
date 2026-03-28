import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext.jsx";

export default function NumGuessOnlineLobby() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { code, isHost } = location.state || {};
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    if (!socket || !code) return;

    function onGameStart() {
      setWaiting(false);
      navigate("/numguess/online/play", { state: { code, role: "p1" } });
    }

    socket.on("ng_game_start", onGameStart);

    return () => {
      socket.off("ng_game_start", onGameStart);
    };
  }, [socket, code, navigate]);

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

      {/* Room code */}
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
