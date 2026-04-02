import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSB } from "../../contexts/SupabaseContext.jsx";
import { startLobbyMusic, stopLobbyMusic, playStartGame } from "../../utils/sound.js";

// ── Role distribution table ──
// [werewolves, hunter, doctor, villagers]
const ROLE_TABLE = {
  5:  [1, 0, 1, 3],
  6:  [2, 1, 1, 2],
  7:  [2, 1, 1, 3],
  8:  [3, 1, 1, 3],
  9:  [3, 1, 1, 4],
  10: [3, 1, 1, 5],
  11: [4, 1, 1, 5],
  12: [4, 1, 1, 6],
};

export function getRoleCounts(n) {
  if (ROLE_TABLE[n]) return ROLE_TABLE[n];
  const ww = Math.max(1, Math.floor(n / 2) - 1);
  const hunter = 1;
  const doc = n >= 6 ? 1 : 0;
  return [ww, hunter, doc, n - ww - hunter - doc];
}

function assignRoles(players) {
  const n = players.length;
  const [ww, hunter, doc] = getRoleCounts(n);

  // Fisher-Yates shuffle
  const indices = players.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  let pos = 0;
  const roles = new Array(n).fill("villager");
  for (let i = 0; i < ww; i++) roles[indices[pos++]] = "werewolf";
  for (let i = 0; i < hunter; i++) roles[indices[pos++]] = "hunter";
  for (let i = 0; i < doc; i++) roles[indices[pos++]] = "doctor";

  return players.map((p, i) => ({ ...p, role: roles[i], alive: true }));
}

export default function MafiaOnlineLobby() {
  const sb = useSB();
  const navigate = useNavigate();
  const location = useLocation();
  const { code, isHost, hostId } = location.state || {};
  const subRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function shareLink() {
    const url = `${window.location.origin}/mafia/join?code=${code}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    startLobbyMusic();
    return () => stopLobbyMusic();
  }, []);

  useEffect(() => {
    if (!sb || !code) return;
    sb.from("mafia_rooms")
      .select("data")
      .eq("code", code)
      .single()
      .then(({ data }) => {
        if (data) setPlayers(data.data.players);
      });
  }, [sb, code]);

  useEffect(() => {
    if (!sb || !code) return;

    const channel = sb
      .channel(`mafia-lobby-${code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mafia_rooms",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          setPlayers(payload.new.data.players);
        }
      )
      .subscribe();

    subRef.current = channel;
    return () => {
      if (subRef.current) sb.removeChannel(subRef.current);
    };
  }, [sb, code]);

  async function handleStart() {
    if (players.length < 5) return;
    setStarting(true);

    const { data: room } = await sb
      .from("mafia_rooms")
      .select("data")
      .eq("code", code)
      .single();

    if (!room) return;

    const assigned = assignRoles(room.data.players);
    const [ww, hunter, doc, vil] = getRoleCounts(assigned.length);

    const updatedData = {
      ...room.data,
      players: assigned,
      status: "playing",
      phase: "roles",
      round: 0,
      log: [
        `Roles: ${ww} Werewolf, ${hunter} Hunter, ${doc ? "1 Doctor, " : ""}${vil} Villager`,
      ],
    };

    await sb
      .from("mafia_rooms")
      .update({ data: updatedData })
      .eq("code", code);

    stopLobbyMusic();
    playStartGame();
    navigate("/mafia/host", { state: { code, hostId } });
  }

  if (!code) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">No room found.</p>
        <Link to="/mafia" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">
          ← Back
        </Link>
      </div>
    );
  }

  const n = players.length;
  const [ww, hunter, doc, vil] = n >= 5 ? getRoleCounts(n) : [0, 0, 0, 0];

  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
      <h1 className="font-heading text-cyan text-sm glow-cyan text-center leading-relaxed">
        WEREWOLF ROOM
      </h1>

      <div className="flex gap-2">
        {code.split("").map((char, i) => (
          <div
            key={i}
            className="w-14 h-16 bg-bg border-2 border-yellow rounded-lg flex items-center justify-center"
          >
            <span className="font-heading text-xl text-yellow glow-yellow">{char}</span>
          </div>
        ))}
      </div>

      <button
        onClick={shareLink}
        className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-xs py-2 px-4"
      >
        {copied ? "Link Copied!" : "Share Join Link"}
      </button>

      {/* Role preview */}
      {n >= 5 && (
        <div className="flex gap-4 text-center">
          <div><span className="text-lg">🐺</span><p className="font-heading text-[9px] text-pink glow-pink">{ww}</p></div>
          <div><span className="text-lg">🏹</span><p className="font-heading text-[9px] text-cyan glow-cyan">{hunter}</p></div>
          {doc > 0 && <div><span className="text-lg">💊</span><p className="font-heading text-[9px] text-lime glow-lime">{doc}</p></div>}
          <div><span className="text-lg">🏘️</span><p className="font-heading text-[9px] text-gray-400">{vil}</p></div>
        </div>
      )}

      {/* Player list */}
      <div className="w-full max-w-sm">
        <p className="text-gray-400 font-body text-xs mb-2 text-center">
          {n} player{n !== 1 ? "s" : ""} {n < 5 ? `(need ${5 - n} more)` : ""}
        </p>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div key={p.id} className="bg-bg border border-gray-700 rounded-lg px-4 py-2 text-center">
              <span className="font-body text-white text-sm">{p.name}</span>
            </div>
          ))}
          {n === 0 && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 font-body text-sm pulse-glow">Waiting for players...</p>
            </div>
          )}
        </div>
      </div>

      {isHost && (
        <button
          onClick={handleStart}
          disabled={starting || n < 5}
          className="neon-btn bg-bg text-lime border-lime box-glow-lime text-lg w-full max-w-xs disabled:opacity-50 mt-2"
        >
          {starting ? "Starting..." : "START GAME"}
        </button>
      )}
    </div>
  );
}
