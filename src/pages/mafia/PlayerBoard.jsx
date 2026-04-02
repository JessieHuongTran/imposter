import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSB } from "../../contexts/SupabaseContext.jsx";
import { playBuzz, playTap, startLobbyMusic, stopLobbyMusic } from "../../utils/sound.js";

const ROLE_EMOJI = { werewolf: "🐺", hunter: "🏹", doctor: "💊", villager: "🏘️" };
const ROLE_LABEL = { werewolf: "WEREWOLF", hunter: "HUNTER", doctor: "DOCTOR", villager: "VILLAGER" };
const ROLE_COLOR = {
  werewolf: "text-pink glow-pink",
  hunter: "text-cyan glow-cyan",
  doctor: "text-lime glow-lime",
  villager: "text-gray-300",
};
const ROLE_BORDER = {
  werewolf: "border-pink box-glow-pink",
  hunter: "border-cyan box-glow-cyan",
  doctor: "border-lime box-glow-lime",
  villager: "border-gray-600",
};
const ROLE_DESC = {
  werewolf: "Choose someone to eliminate each night. Don't get caught!",
  hunter: "Each night, choose one player to kill. Use your power wisely.",
  doctor: "Each night, choose one player to protect from death.",
  villager: "Find and vote out the werewolves during the day!",
};

export default function MafiaPlayerBoard() {
  const sb = useSB();
  const location = useLocation();
  const { code, playerId, playerName } = location.state || {};
  const subRef = useRef(null);
  const broadcastRef = useRef(null);

  const [roomData, setRoomData] = useState(null);
  const [waiting, setWaiting] = useState(true);
  const [nightTarget, setNightTarget] = useState(null);
  const [nightSubmitted, setNightSubmitted] = useState(false);
  const [dayTarget, setDayTarget] = useState(null);
  const [daySubmitted, setDaySubmitted] = useState(false);
  const [otherWolfVotes, setOtherWolfVotes] = useState({});
  const prevPhaseRef = useRef(null);

  // Fetch initial state
  useEffect(() => {
    if (!sb || !code) return;
    sb.from("mafia_rooms").select("data").eq("code", code).single()
      .then(({ data }) => {
        if (data) {
          setRoomData(data.data);
          if (data.data.status === "playing") setWaiting(false);
        }
      });
  }, [sb, code]);

  // Subscribe to DB changes
  useEffect(() => {
    if (!sb || !code) return;
    const channel = sb
      .channel(`mafia-player-${code}-${playerId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "mafia_rooms", filter: `code=eq.${code}`,
      }, (payload) => {
        const data = payload.new.data;
        setRoomData(data);

        if (data.status === "playing" && waiting) {
          stopLobbyMusic();
          setWaiting(false);
        }

        // Reset actions on phase change
        if (data.phase !== prevPhaseRef.current) {
          prevPhaseRef.current = data.phase;
          if (data.phase === "night") {
            setNightTarget(null);
            setNightSubmitted(false);
            setOtherWolfVotes({});
          }
          if (data.phase === "day_vote") {
            setDayTarget(null);
            setDaySubmitted(false);
          }
        }
      })
      .subscribe();
    subRef.current = channel;
    return () => { if (subRef.current) sb.removeChannel(subRef.current); };
  }, [sb, code, playerId, waiting]);

  // Subscribe to broadcast channel
  useEffect(() => {
    if (!sb || !code) return;
    const channel = sb
      .channel(`mafia-${code}`)
      .on("broadcast", { event: "wolf_vote" }, (payload) => {
        const d = payload.payload;
        if (d.playerId !== playerId) {
          setOtherWolfVotes((prev) => ({ ...prev, [d.playerId]: d.targetId }));
        }
      })
      .subscribe();
    broadcastRef.current = channel;
    return () => { if (broadcastRef.current) sb.removeChannel(broadcastRef.current); };
  }, [sb, code, playerId]);

  // Lobby music
  useEffect(() => {
    if (waiting) startLobbyMusic();
    return () => stopLobbyMusic();
  }, [waiting]);

  function sendBroadcast(event, payload) {
    if (!broadcastRef.current) return;
    broadcastRef.current.send({ type: "broadcast", event, payload });
  }

  function submitNightAction(targetId) {
    if (nightSubmitted) return;
    setNightTarget(targetId);
    setNightSubmitted(true);
    playBuzz();

    const me = roomData.players.find((p) => p.id === playerId);
    if (!me) return;

    if (me.role === "werewolf") {
      sendBroadcast("wolf_vote", { playerId, targetId });
    } else if (me.role === "hunter") {
      sendBroadcast("hunter_kill", { playerId, targetId });
    } else if (me.role === "doctor") {
      sendBroadcast("doctor_save", { playerId, targetId });
    }
  }

  function submitDayVote(targetId) {
    if (daySubmitted) return;
    setDayTarget(targetId);
    setDaySubmitted(true);
    playTap();
    sendBroadcast("day_vote", { playerId, targetId });
  }

  // ── Guards ──
  if (!code) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">No room found.</p>
        <Link to="/mafia" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">← Back</Link>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-6">
        <h1 className="font-heading text-cyan text-sm glow-cyan text-center leading-relaxed">WAITING FOR HOST</h1>
        <p className="font-body text-gray-400 text-sm">Room {code}</p>
        <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-body text-sm pulse-glow">Game will start soon...</p>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5">
        <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { players, phase, round, winner } = roomData;
  const me = players.find((p) => p.id === playerId);
  if (!me) return <p className="text-gray-400 p-8 text-center font-body">Player not found in game.</p>;

  const myRole = me.role;
  const alive = players.filter((p) => p.alive);
  const amAlive = me.alive;
  const fellowWolves = players.filter((p) => p.role === "werewolf" && p.id !== playerId);

  // Selectable targets for night actions
  const nightTargets =
    myRole === "werewolf" ? alive.filter((p) => p.role !== "werewolf") :
    myRole === "hunter" ? alive.filter((p) => p.id !== playerId) :
    myRole === "doctor" ? alive :
    [];

  // ── ENDED ──
  if (phase === "ended") {
    return (
      <div className="page-enter flex flex-col items-center px-5 py-8 min-h-dvh">
        <h1 className="font-heading text-yellow text-base glow-yellow mb-2 text-center leading-relaxed">GAME OVER</h1>
        <p className={`font-heading text-sm mb-6 text-center leading-relaxed ${winner === "werewolves" ? "text-pink glow-pink" : "text-lime glow-lime"}`}>
          {winner === "werewolves" ? "🐺 WEREWOLVES WIN" : "🏘️ VILLAGE WINS"}
        </p>

        <div className="w-full max-w-sm flex flex-col gap-2 mb-6">
          {players.map((p) => (
            <div key={p.id} className={`flex items-center justify-between bg-bg border rounded-lg px-4 py-3 ${p.id === playerId ? "border-cyan" : p.alive ? "border-gray-700" : "border-gray-800 opacity-50"}`}>
              <div className="flex items-center gap-2">
                <span>{ROLE_EMOJI[p.role]}</span>
                <span className="font-body text-white text-sm">{p.name}</span>
                {!p.alive && <span className="text-xs">💀</span>}
              </div>
              <span className={`font-heading text-[10px] ${ROLE_COLOR[p.role]}`}>{p.role}</span>
            </div>
          ))}
        </div>

        <Link to="/" className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-sm no-underline">Back to Home</Link>
      </div>
    );
  }

  // Dead player spectator view
  if (!amAlive && phase !== "roles") {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <span className="text-4xl">💀</span>
        <p className="font-heading text-sm text-gray-500 text-center leading-relaxed">YOU ARE DEAD</p>
        <p className="text-gray-600 font-body text-sm text-center">
          You were a {ROLE_EMOJI[myRole]} {ROLE_LABEL[myRole]}.<br />
          Watch and wait for the game to end.
        </p>
        <p className="text-gray-700 font-body text-xs">
          {alive.length} player{alive.length !== 1 ? "s" : ""} remaining
        </p>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-6 min-h-dvh gap-5">

      {/* ── ROLES phase ── */}
      {phase === "roles" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className={`border-4 ${ROLE_BORDER[myRole]} rounded-2xl px-8 py-10 flex flex-col items-center gap-3`}>
            <span className="text-5xl">{ROLE_EMOJI[myRole]}</span>
            <p className={`font-heading text-lg ${ROLE_COLOR[myRole]} leading-relaxed`}>
              {ROLE_LABEL[myRole]}
            </p>
            <p className="font-body text-gray-400 text-xs text-center max-w-[200px]">
              {ROLE_DESC[myRole]}
            </p>
          </div>

          {myRole === "werewolf" && fellowWolves.length > 0 && (
            <div className="text-center">
              <p className="font-body text-gray-500 text-xs mb-1">Your pack:</p>
              {fellowWolves.map((w) => (
                <p key={w.id} className="font-body text-pink text-sm">{w.name}</p>
              ))}
            </div>
          )}

          <p className="text-gray-600 font-body text-xs">Waiting for the moderator...</p>
        </div>
      )}

      {/* ── NIGHT phase ── */}
      {phase === "night" && (
        <>
          <p className="font-heading text-sm text-cyan glow-cyan leading-relaxed pulse-glow">
            NIGHT {round}
          </p>

          {/* Villager: sleeping */}
          {myRole === "villager" && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <span className="text-5xl">😴</span>
              <p className="font-heading text-xs text-gray-500 text-center leading-relaxed">
                CLOSE YOUR EYES...
              </p>
              <p className="text-gray-600 font-body text-xs">The village sleeps while danger lurks.</p>
            </div>
          )}

          {/* Action roles: pick target */}
          {myRole !== "villager" && !nightSubmitted && (
            <div className="w-full max-w-xs">
              <p className="font-body text-gray-300 text-sm mb-3 text-center">
                {myRole === "werewolf" && "Choose a victim to kill:"}
                {myRole === "hunter" && "Choose someone to eliminate:"}
                {myRole === "doctor" && "Choose someone to protect:"}
              </p>
              <div className="flex flex-col gap-2">
                {nightTargets.map((p) => (
                  <button key={p.id}
                    onClick={() => submitNightAction(p.id)}
                    className={`neon-btn bg-bg text-white text-sm w-full py-3 ${
                      myRole === "werewolf" ? "border-pink" :
                      myRole === "hunter" ? "border-cyan" :
                      "border-lime"
                    }`}>
                    {p.name}
                  </button>
                ))}
              </div>

              {/* Wolf: show other wolves' votes */}
              {myRole === "werewolf" && Object.keys(otherWolfVotes).length > 0 && (
                <div className="mt-4 text-center">
                  <p className="font-body text-gray-500 text-xs mb-1">Pack votes:</p>
                  {Object.entries(otherWolfVotes).map(([wid, tid]) => {
                    const wolf = players.find((p) => p.id === wid);
                    const target = players.find((p) => p.id === tid);
                    return (
                      <p key={wid} className="font-body text-pink text-xs">
                        {wolf?.name} → {target?.name}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Submitted */}
          {myRole !== "villager" && nightSubmitted && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <span className="text-3xl">✓</span>
              <p className={`font-heading text-xs ${ROLE_COLOR[myRole]} text-center leading-relaxed`}>
                {myRole === "werewolf" && `Target: ${players.find((p) => p.id === nightTarget)?.name}`}
                {myRole === "hunter" && `Target: ${players.find((p) => p.id === nightTarget)?.name}`}
                {myRole === "doctor" && `Protecting: ${players.find((p) => p.id === nightTarget)?.name}`}
              </p>
              <p className="text-gray-600 font-body text-xs">Waiting for dawn...</p>
            </div>
          )}
        </>
      )}

      {/* ── DAY phase: listen to moderator ── */}
      {phase === "day" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <p className="font-heading text-sm text-yellow glow-yellow leading-relaxed">
            DAY {round}
          </p>
          <span className="text-4xl">🌅</span>
          <p className="font-heading text-xs text-gray-400 text-center leading-relaxed">
            LISTEN TO THE MODERATOR
          </p>
          <p className="text-gray-600 font-body text-xs text-center">
            The moderator will announce what happened last night.<br />
            Then discuss with the village.
          </p>
        </div>
      )}

      {/* ── DAY_VOTE phase: blind voting ── */}
      {phase === "day_vote" && (
        <>
          <p className="font-heading text-sm text-orange glow-orange leading-relaxed">
            VOTE TO ELIMINATE
          </p>

          {!daySubmitted ? (
            <div className="w-full max-w-xs flex flex-col gap-2">
              {alive.filter((p) => p.id !== playerId).map((p) => (
                <button key={p.id}
                  onClick={() => submitDayVote(p.id)}
                  className="neon-btn bg-bg text-white border-orange text-sm w-full py-3">
                  {p.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 flex-1 justify-center">
              <span className="text-3xl">🗳️</span>
              <p className="font-heading text-xs text-orange text-center leading-relaxed">
                Vote submitted
              </p>
              <p className="text-gray-600 font-body text-xs text-center">
                Waiting for everyone to vote...
              </p>
            </div>
          )}
        </>
      )}

      {/* ── VOTE_RESULT phase: listen to moderator ── */}
      {phase === "vote_result" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <span className="text-4xl">📢</span>
          <p className="font-heading text-xs text-gray-400 text-center leading-relaxed">
            LISTEN TO THE MODERATOR
          </p>
          <p className="text-gray-600 font-body text-xs text-center">
            The moderator will announce the vote result.
          </p>
        </div>
      )}
    </div>
  );
}
