import { Link, useNavigate } from "react-router-dom";

export default function ModeSelect() {
  const navigate = useNavigate();

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Home
      </Link>

      <h1 className="font-heading text-pink text-base glow-pink mb-2 text-center leading-relaxed">
        IMPOSTER
      </h1>
      <p className="text-gray-400 font-body text-base mb-10">How are you playing?</p>

      <div className="flex flex-col gap-5 w-full max-w-sm">
        <button
          onClick={() => navigate("/imposter/local")}
          className="neon-btn bg-bg text-yellow border-yellow box-glow-yellow flex items-center gap-4 text-left w-full py-5 px-5"
        >
          <span className="text-3xl">🏠</span>
          <div>
            <span className="font-heading text-xs glow-yellow block mb-1">LOCAL</span>
            <span className="font-body text-sm text-gray-300 font-normal">
              Pass the phone around
            </span>
          </div>
        </button>

        <button
          onClick={() => navigate("/imposter/online")}
          className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan flex items-center gap-4 text-left w-full py-5 px-5"
        >
          <span className="text-3xl">🌐</span>
          <div>
            <span className="font-heading text-xs glow-cyan block mb-1">ONLINE</span>
            <span className="font-body text-sm text-gray-300 font-normal">
              Everyone on their own device
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
