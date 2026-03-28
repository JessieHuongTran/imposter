import { Link, useLocation } from "react-router-dom";

export default function NumGuessOnlineResult() {
  const location = useLocation();
  const { winner, p1Number, p2Number, allGuesses, myRole } = location.state || {};

  if (!winner) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">Missing game data.</p>
        <Link to="/numguess" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">
          ← Back
        </Link>
      </div>
    );
  }

  const iWon = winner === myRole;

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <h1 className="font-heading text-pink text-sm glow-pink mb-4 text-center leading-relaxed">
        NUMBER GUESS
      </h1>

      <span className="text-5xl mb-2 pulse-glow">{iWon ? "🎉" : "💀"}</span>
      <p className={`font-heading text-lg mb-6 ${iWon ? "text-lime glow-lime" : "text-pink glow-pink"}`}>
        {iWon ? "YOU WIN!" : "YOU LOSE!"}
      </p>

      {/* Reveal numbers */}
      <div className="flex gap-4 mb-6">
        <div className="rounded-lg border-2 border-yellow box-glow-yellow bg-bg px-4 py-3 text-center">
          <p className="font-body text-xs text-gray-400 mb-1">P1's number</p>
          <p className="font-heading text-lg text-yellow glow-yellow">{p1Number}</p>
        </div>
        <div className="rounded-lg border-2 border-yellow box-glow-yellow bg-bg px-4 py-3 text-center">
          <p className="font-body text-xs text-gray-400 mb-1">P2's number</p>
          <p className="font-heading text-lg text-yellow glow-yellow">{p2Number}</p>
        </div>
      </div>

      {/* Guess timeline */}
      {allGuesses && allGuesses.length > 0 && (
        <div className="w-full max-w-sm rounded-lg border-2 border-gray-700 bg-bg p-3 mb-8 max-h-60 overflow-y-auto">
          <p className="font-body text-gray-500 text-xs mb-2">Guess Timeline</p>
          {allGuesses.map((g, i) => {
            const gColor = g.guesser === "p1" ? "text-cyan" : "text-pink";
            const rColor = g.result === "correct" ? "text-lime" : g.result === "higher" ? "text-cyan" : "text-pink";
            const rIcon = g.result === "correct" ? "✅" : g.result === "higher" ? "⬆" : "⬇";
            const rLabel = g.result === "correct" ? "Correct!" : g.result === "higher" ? "Higher" : "Lower";
            return (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-800 last:border-0">
                <span className={`font-heading text-[9px] ${gColor} w-6`}>{g.guesser.toUpperCase()}</span>
                <span className="font-body text-white text-sm">{g.value}</span>
                <span className={`font-body text-xs ${rColor} ml-auto`}>{rIcon} {rLabel}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          to="/numguess/online"
          className="neon-btn bg-bg text-orange border-orange box-glow-orange text-base text-center no-underline"
        >
          PLAY AGAIN
        </Link>
        <Link to="/" className="neon-btn bg-bg text-pink border-pink text-sm text-center no-underline">
          HOME
        </Link>
      </div>
    </div>
  );
}
