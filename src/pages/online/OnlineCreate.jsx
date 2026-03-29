import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import categories from "../../data/categories.js";
import { useSB, generateId, generateCode } from "../../contexts/SupabaseContext.jsx";

const categoryNames = Object.keys(categories);

const colorCycle = [
  "text-orange border-orange",
  "text-cyan border-cyan",
  "text-pink border-pink",
  "text-lime border-lime",
  "text-yellow border-yellow",
];

const categoryEmojis = {
  Food: "🍕", Drink: "🧋", Movie: "🎬", Location: "📍", Object: "🔮",
  Celebrity: "⭐", Trends: "📱", "K-Drama": "📺", Anime: "⚔️",
  "Asian Food": "🥢", Music: "🎵", Gaming: "🎮",
};

export default function OnlineCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedCategory = location.state?.category;
  const sb = useSB();
  const [category, setCategory] = useState(preselectedCategory || null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [hostName, setHostName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!category) return setError("Pick a category");
    if (!hostName.trim()) return setError("Enter your name");

    setCreating(true);
    setError("");

    try {
      const playerId = generateId();
      const code = generateCode();

      const roomData = {
        players: [{ id: playerId, name: hostName.trim() }],
        category,
        maxPlayers,
        status: "lobby",
        gameData: null,
        viewedCount: 0,
      };

      const { error: insertError } = await sb
        .from("imposter_rooms")
        .insert({ code, data: roomData });

      if (insertError) {
        setError("Failed to create room: " + insertError.message);
        setCreating(false);
        return;
      }

      navigate("/imposter/online/lobby", {
        state: { code, isHost: true, playerId },
      });
    } catch (err) {
      setError(err.message || "Could not create room");
      setCreating(false);
    }
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/imposter/online" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Back
      </Link>

      <h1 className="font-heading text-lime text-sm glow-lime mb-6 text-center leading-relaxed">
        HOST GAME
      </h1>

      {/* Host name */}
      <div className="w-full max-w-sm mb-6">
        <label className="font-body text-gray-400 text-sm mb-2 block">Your name</label>
        <input
          type="text"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          placeholder="Enter your name"
          maxLength={12}
          className="w-full bg-bg border-2 border-lime rounded-lg px-4 py-3 text-white font-body text-base outline-none focus:box-glow-lime"
        />
      </div>

      {/* Category picker */}
      <div className="w-full max-w-sm mb-6">
        <label className="font-body text-gray-400 text-sm mb-2 block">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {categoryNames.map((cat, i) => {
            const active = category === cat;
            const color = colorCycle[i % colorCycle.length];
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-lg border-2 py-2 px-1 text-center ${color} ${
                  active ? "bg-white/10" : "bg-bg opacity-60"
                }`}
              >
                <span className="text-base block">{categoryEmojis[cat] || "🎯"}</span>
                <span className="font-body text-[10px]">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Player count */}
      <div className="w-full max-w-sm mb-8">
        <label className="font-body text-gray-400 text-sm mb-2 block">Max players</label>
        <div className="flex items-center gap-4 justify-center">
          <button
            onClick={() => setMaxPlayers((c) => Math.max(3, c - 1))}
            className="neon-btn bg-bg text-cyan border-cyan text-xl w-12 h-12 flex items-center justify-center p-0"
          >
            −
          </button>
          <span className="font-heading text-2xl text-white glow-cyan">{maxPlayers}</span>
          <button
            onClick={() => setMaxPlayers((c) => Math.min(8, c + 1))}
            className="neon-btn bg-bg text-cyan border-cyan text-xl w-12 h-12 flex items-center justify-center p-0"
          >
            +
          </button>
        </div>
      </div>

      {error && <p className="text-pink font-body text-sm mb-4">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="neon-btn bg-bg text-lime border-lime box-glow-lime text-lg w-full max-w-sm disabled:opacity-50"
      >
        {creating ? "Creating..." : "Create Room 👑"}
      </button>
    </div>
  );
}
