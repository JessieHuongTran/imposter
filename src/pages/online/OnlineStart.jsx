import { Link, useLocation } from "react-router-dom";

export default function OnlineStart() {
  const location = useLocation();
  const { firstPlayerName } = location.state || {};

  if (!firstPlayerName) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">Missing game data.</p>
        <Link to="/" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">
          ← Home
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-8">
      <h1 className="font-heading text-pink text-sm glow-pink text-center leading-relaxed">
        IMPOSTER
      </h1>

      <div className="flex flex-col items-center gap-4">
        <p className="text-gray-400 font-body text-lg">Goes first:</p>
        <div className="rounded-full w-36 h-36 border-4 border-yellow box-glow-yellow flex items-center justify-center bg-bg px-3">
          <span className="font-heading text-yellow text-sm glow-yellow text-center leading-relaxed">
            {firstPlayerName}
          </span>
        </div>
      </div>

      <p className="text-gray-500 font-body text-sm text-center max-w-xs">
        Describe the word without saying it. The imposters must blend in!
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          to="/imposter/online"
          className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-base text-center no-underline"
        >
          New Game
        </Link>
        <Link
          to="/"
          className="neon-btn bg-bg text-gray-500 border-gray-700 text-sm text-center no-underline"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
