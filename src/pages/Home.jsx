import { useState } from "react";
import { Link } from "react-router-dom";
import { playTap, playFlipOpen, playSelect } from "../utils/sound.js";

const categories = [
  {
    name: "Party Games",
    emoji: "🎉",
    cardClass: "border-yellow box-glow-yellow",
    labelClass: "text-yellow glow-yellow",
    games: [
      {
        name: "Imposter",
        description: "One word. One imposter. Can you blend in?",
        path: "/imposter",
        cardClass: "border-pink box-glow-pink",
        titleClass: "text-pink glow-pink",
        emoji: "🕵️",
      },
      {
        name: "Trivia Buzz",
        description: "Host reads questions, players race to buzz in!",
        path: "/trivia",
        cardClass: "border-orange box-glow-orange",
        titleClass: "text-orange glow-orange",
        emoji: "🔔",
      },
      {
        name: "Werewolf",
        description: "Secret roles, night kills & village votes. Who's the wolf?",
        path: "/mafia",
        cardClass: "border-purple box-glow-purple",
        titleClass: "text-purple glow-purple",
        emoji: "🐺",
      },
      {
        name: "Anomia",
        description: "Coming Soon",
        path: "/anomia",
        cardClass: "border-cyan box-glow-cyan",
        titleClass: "text-cyan glow-cyan",
        emoji: "🧠",
      },
    ],
  },
  {
    name: "Couple Games",
    emoji: "💕",
    cardClass: "border-cyan box-glow-cyan",
    labelClass: "text-cyan glow-cyan",
    games: [
      {
        name: "Who Knows Who",
        description: "How well do you really know your partner?",
        path: "/who-knows-who.html",
        cardClass: "border-purple box-glow-purple",
        titleClass: "text-purple glow-purple",
        emoji: "💕",
        external: true,
      },
      {
        name: "Hot Or Not",
        description: "Swipe on things together — see where you clash!",
        path: "/hot-or-not.html",
        cardClass: "border-pink box-glow-pink",
        titleClass: "text-pink glow-pink",
        emoji: "🔥",
        external: true,
      },
      {
        name: "Number Guess",
        description: "Guess your opponent's secret number!",
        path: "/numguess",
        cardClass: "border-orange box-glow-orange",
        titleClass: "text-orange glow-orange",
        emoji: "🔢",
      },
    ],
  },
];

function GameCard({ game }) {
  const inner = (
    <div
      className={`relative rounded-xl border-2 ${game.cardClass} bg-bg p-5 flex items-center gap-4 active:translate-y-0.5 active:shadow-none transition-transform`}
    >
      <span className="text-3xl">{game.emoji}</span>
      <div className="text-left">
        <h2 className={`font-heading text-[11px] ${game.titleClass} mb-1 leading-relaxed`}>
          {game.name}
        </h2>
        <p className="font-body text-sm text-gray-300">{game.description}</p>
      </div>
    </div>
  );

  if (game.external) {
    return (
      <a href={game.path} className="no-underline" onClick={playSelect}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={game.path} className="no-underline" onClick={playSelect}>
      {inner}
    </Link>
  );
}

export default function Home() {
  const [openCat, setOpenCat] = useState(null);

  function toggleCat(name) {
    playFlipOpen();
    setOpenCat((prev) => (prev === name ? null : name));
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-10 min-h-dvh">
      <h1 className="font-heading text-yellow text-2xl leading-relaxed text-center glow-yellow mb-2">
        BOOM BOX
      </h1>
      <p className="text-gray-400 font-body text-base mb-8">
        Pick a category & start playing
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm pb-6">
        {categories.map((cat) => {
          const isOpen = openCat === cat.name;
          return (
            <div key={cat.name}>
              <button
                onClick={() => toggleCat(cat.name)}
                className={`w-full rounded-xl border-2 ${cat.cardClass} bg-bg p-5 flex items-center gap-4 text-left active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer`}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <div className="flex-1">
                  <span className={`font-heading text-xs ${cat.labelClass} leading-relaxed`}>
                    {cat.name}
                  </span>
                  <p className="font-body text-xs text-gray-500 mt-1">
                    {cat.games.length} game{cat.games.length > 1 ? "s" : ""}
                  </p>
                </div>
                <span
                  className={`text-gray-500 text-lg transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {isOpen && (
                <div className="flex flex-col gap-3 mt-3 ml-2 pl-4 border-l-2 border-gray-800">
                  {cat.games.map((game) => (
                    <GameCard key={game.name} game={game} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
