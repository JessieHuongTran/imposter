import { Link } from "react-router-dom";

export default function Anomia() {
  return (
    <div className="page-enter flex flex-col items-center justify-center px-5 min-h-dvh gap-6">
      <span className="text-6xl">🧠</span>
      <h1 className="font-heading text-cyan text-xl glow-cyan text-center leading-relaxed">
        ANOMIA
      </h1>
      <p className="text-gray-400 font-body text-lg">Coming Soon</p>
      <Link
        to="/"
        className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-base no-underline"
      >
        ← Back
      </Link>
    </div>
  );
}
