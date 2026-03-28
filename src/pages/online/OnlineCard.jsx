import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext.jsx";
import { playFlipOpen } from "../../utils/sound.js";

const AUTO_HIDE_DELAY = 4000;

export default function OnlineCard() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { code, role, word, isImposter, playerName } = location.state || {};

  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [viewProgress, setViewProgress] = useState(null);

  useEffect(() => {
    if (!socket || !code) return;

    function onViewProgress(data) {
      setViewProgress(data);
    }

    function onAllViewed(data) {
      navigate("/imposter/online/start", {
        state: { firstPlayerName: data.firstPlayerName, code },
      });
    }

    socket.on("view_progress", onViewProgress);
    socket.on("all_viewed", onAllViewed);

    return () => {
      socket.off("view_progress", onViewProgress);
      socket.off("all_viewed", onAllViewed);
    };
  }, [socket, code, navigate]);

  function handleReveal() {
    if (revealed) return;
    setRevealed(true);
    playFlipOpen();

    // Auto-hide after delay
    setTimeout(() => {
      setRevealed(false);
      setConfirmed(true);
      socket.emit("card_viewed", { code });
    }, AUTO_HIDE_DELAY);
  }

  if (!code || !role) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">Missing card data.</p>
      </div>
    );
  }

  // After confirming — waiting for others
  if (confirmed) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
        <span className="text-5xl">✅</span>
        <p className="text-gray-300 font-body text-lg">Card viewed!</p>

        {viewProgress && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {Array.from({ length: viewProgress.totalPlayers }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < viewProgress.viewedCount ? "bg-lime" : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-500 font-body text-sm">
              {viewProgress.viewedCount}/{viewProgress.totalPlayers} players ready
            </p>
          </div>
        )}

        <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-body text-xs">Waiting for everyone...</p>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
      <h1 className="font-heading text-pink text-sm glow-pink text-center leading-relaxed">
        YOUR CARD
      </h1>
      <p className="text-gray-400 font-body text-base">{playerName}</p>

      {/* Card */}
      <div
        className="perspective-[800px] w-full max-w-[280px]"
        onClick={handleReveal}
      >
        <div
          className={`card-inner relative w-full aspect-[3/4] cursor-pointer ${
            revealed ? "flipped" : ""
          }`}
        >
          {/* Front — face down */}
          <div className="card-face absolute inset-0 rounded-xl border-2 border-cyan bg-bg box-glow-cyan flex flex-col items-center justify-center gap-4">
            <span className="text-6xl">🃏</span>
            <span className="font-heading text-xs text-cyan glow-cyan">TAP TO REVEAL</span>
          </div>

          {/* Back — revealed */}
          <div
            className={`card-face card-back absolute inset-0 rounded-xl border-2 bg-bg flex flex-col items-center justify-center gap-4 px-4 ${
              isImposter
                ? "border-pink box-glow-pink"
                : "border-lime box-glow-lime"
            }`}
          >
            <span
              className={`font-heading text-xs ${
                isImposter ? "text-pink glow-pink" : "text-lime glow-lime"
              }`}
            >
              {role}
            </span>
            <span className="font-body text-3xl font-bold text-white text-center">
              {word}
            </span>
            {isImposter && (
              <span className="text-xs text-gray-500 font-body">(hint only)</span>
            )}
            <span className="text-xs text-gray-600 font-body mt-2">Auto-hiding in a moment...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
