import { Link, useNavigate } from "react-router-dom";
import categories from "../../data/categories.js";
import { playTap } from "../../utils/sound.js";

const colorCycle = [
  { btnClass: "text-orange border-orange box-glow-orange", labelClass: "glow-orange" },
  { btnClass: "text-cyan border-cyan box-glow-cyan", labelClass: "glow-cyan" },
  { btnClass: "text-pink border-pink box-glow-pink", labelClass: "glow-pink" },
  { btnClass: "text-lime border-lime box-glow-lime", labelClass: "glow-lime" },
  { btnClass: "text-yellow border-yellow box-glow-yellow", labelClass: "glow-yellow" },
];

const categoryEmojis = {
  Food: "🍕",
  Drink: "🧋",
  Movie: "🎬",
  Location: "📍",
  Object: "🔮",
  Celebrity: "⭐",
  Trends: "📱",
  "K-Drama": "📺",
  Anime: "⚔️",
  "Asian Food": "🥢",
  Music: "🎵",
  Gaming: "🎮",
};

export default function CategorySelect() {
  const navigate = useNavigate();

  function handleSelect(category) {
    playTap();
    navigate("/imposter/local/players", { state: { category } });
  }

  const categoryNames = Object.keys(categories);

  return (
    <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
      <Link to="/imposter" className="self-start text-gray-500 font-body text-sm no-underline mb-4">
        ← Back
      </Link>

      <h1 className="font-heading text-pink text-base glow-pink mb-2 text-center leading-relaxed">
        IMPOSTER
      </h1>
      <p className="text-gray-400 font-body text-base mb-8">Pick a category</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm pb-8">
        {categoryNames.map((cat, i) => {
          const style = colorCycle[i % colorCycle.length];
          const emoji = categoryEmojis[cat] || "🎯";
          return (
            <button
              key={cat}
              onClick={() => handleSelect(cat)}
              className={`neon-btn bg-bg ${style.btnClass} flex flex-col items-center gap-2 py-4 text-center w-full`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className={`font-heading text-[10px] ${style.labelClass}`}>{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
