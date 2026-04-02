import { useNavigate, Link } from "react-router-dom";

export default function TriviaOnlineMenu() {
  const navigate = useNavigate();

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Back
      </Link>

      <h1 className="font-heading text-cyan text-base glow-cyan mb-2 text-center leading-relaxed">
        TRIVIA BUZZ
      </h1>
      <p className="text-gray-400 font-body text-base mb-10">Host or join a trivia room</p>

      <div className="flex flex-col gap-5 w-full max-w-sm">
        <button
          onClick={() => navigate("/trivia/create")}
          className="neon-btn bg-bg text-lime border-lime box-glow-lime flex items-center gap-4 text-left w-full py-5 px-5"
        >
          <span className="text-3xl">👑</span>
          <div>
            <span className="font-heading text-xs glow-lime block mb-1">HOST GAME</span>
            <span className="font-body text-sm text-gray-300 font-normal">
              Create a room & read questions aloud
            </span>
          </div>
        </button>

        <button
          onClick={() => navigate("/trivia/join")}
          className="neon-btn bg-bg text-pink border-pink box-glow-pink flex items-center gap-4 text-left w-full py-5 px-5"
        >
          <span className="text-3xl">🎟️</span>
          <div>
            <span className="font-heading text-xs glow-pink block mb-1">JOIN GAME</span>
            <span className="font-body text-sm text-gray-300 font-normal">
              Enter a room code & buzz in
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
