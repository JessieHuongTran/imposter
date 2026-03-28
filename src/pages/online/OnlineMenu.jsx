import { useNavigate, useLocation, Link } from "react-router-dom";

export default function OnlineMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category;

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link
        to="/imposter"
        className="self-start text-gray-500 font-body text-sm no-underline mb-4"
      >
        ← Back
      </Link>

      <h1 className="font-heading text-cyan text-base glow-cyan mb-2 text-center leading-relaxed">
        ONLINE
      </h1>
      {category && (
        <p className="text-yellow font-heading text-[10px] glow-yellow mb-6">{category}</p>
      )}
      <p className="text-gray-400 font-body text-base mb-10">Create or join a room</p>

      <div className="flex flex-col gap-5 w-full max-w-sm">
        <button
          onClick={() => navigate("/imposter/online/create", { state: { category } })}
          className="neon-btn bg-bg text-lime border-lime box-glow-lime flex items-center gap-4 text-left w-full py-5 px-5"
        >
          <span className="text-3xl">👑</span>
          <div>
            <span className="font-heading text-xs glow-lime block mb-1">HOST GAME</span>
            <span className="font-body text-sm text-gray-300 font-normal">
              Create a room & invite friends
            </span>
          </div>
        </button>

        <button
          onClick={() => navigate("/imposter/online/join")}
          className="neon-btn bg-bg text-pink border-pink box-glow-pink flex items-center gap-4 text-left w-full py-5 px-5"
        >
          <span className="text-3xl">🎟️</span>
          <div>
            <span className="font-heading text-xs glow-pink block mb-1">JOIN GAME</span>
            <span className="font-body text-sm text-gray-300 font-normal">
              Enter a room code
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
