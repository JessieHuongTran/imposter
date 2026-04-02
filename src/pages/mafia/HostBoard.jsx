import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSB } from "../../contexts/SupabaseContext.jsx";
import { playCorrect, playWrong, playTap } from "../../utils/sound.js";

const ROLE_EMOJI = { werewolf: "🐺", seer: "🔮", doctor: "💊", villager: "🏘️" };
const ROLE_COLOR = {
  werewolf: "text-pink glow-pink",
  seer: "text-purple glow-purple",
  doctor: "text-lime glow-lime",
  villager: "text-gray-400",
};

function checkWin(players) {
  const alive = players.filter((p) => p.alive);
  const wolves = alive.filter((p) => p.role === "werewolf").length;
  const others = alive.length - wolves;
  if (wolves === 0) return "village";
  if (wolves >= others) return "werewolves";
  return null;
}

function getMajority(votes, allowTie) {
  const counts = {};
  Object.values(votes).forEach((tid) => {
    counts[tid] = (counts[tid] || 0) + 1;
  });
  if (Object.keys(counts).length === 0) return null;

  const max = Math.max(...Object.values(counts));
  const tied = Object.entries(counts).filter(([, c]) => c === max);

  if (tied.length > 1 && allowTie) return null; // no elimination on tie
  return tied[Math.floor(Math.random() * tied.length)][0]; // random tiebreak
}

export default function MafiaHostBoard() {
  const sb = useSB();
  const location = useLocation();
  const { code, hostId } = location.state || {};
  const subRef = useRef(null);
  const broadcastRef = useRef(null);

  const [roomData, setRoomData] = useState(null);

  // Local action trackers (from broadcasts, reset each phase)
  const [wolfVotes, setWolfVotes] = useState({});
  const [seerPeek, setSeerPeek] = useState(null);
  const [doctorSave, setDoctorSave] = useState(null);
  const [dayVotes, setDayVotes] = useState({});

  // Fetch initial state
  useEffect(() => {
    if (!sb || !code) return;
    sb.from("mafia_rooms").select("data").eq("code", code).single()
      .then(({ data }) => { if (data) setRoomData(data.data); });
  }, [sb, code]);

  // Subscribe to DB changes
  useEffect(() => {
    if (!sb || !code) return;
    const channel = sb
      .channel(`mafia-host-db-${code}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "mafia_rooms", filter: `code=eq.${code}`,
      }, (payload) => setRoomData(payload.new.data))
      .subscribe();
    subRef.current = channel;
    return () => { if (subRef.current) sb.removeChannel(subRef.current); };
  }, [sb, code]);

  // Subscribe to broadcast actions
  const handleBroadcast = useCallback((payload) => {
    const { event } = payload;
    const d = payload.payload;
    if (event === "wolf_vote") {
      setWolfVotes((prev) => ({ ...prev, [d.playerId]: d.targetId }));
    } else if (event === "seer_peek") {
      setSeerPeek(d.targetId);
    } else if (event === "doctor_save") {
      setDoctorSave(d.targetId);
    } else if (event === "day_vote") {
      setDayVotes((prev) => ({ ...prev, [d.playerId]: d.targetId }));
    }
  }, []);

  useEffect(() => {
    if (!sb || !code) return;
    const channel = sb
      .channel(`mafia-${code}`)
      .on("broadcast", { event: "wolf_vote" }, handleBroadcast)
      .on("broadcast", { event: "seer_peek" }, handleBroadcast)
      .on("broadcast", { event: "doctor_save" }, handleBroadcast)
      .on("broadcast", { event: "day_vote" }, handleBroadcast)
      .subscribe();
    broadcastRef.current = channel;
    return () => { if (broadcastRef.current) sb.removeChannel(broadcastRef.current); };
  }, [sb, code, handleBroadcast]);

  // ── Helper: read-then-write ──
  async function freshRoom() {
    const { data } = await sb.from("mafia_rooms").select("data").eq("code", code).single();
    return data?.data;
  }

  async function writeRoom(changes) {
    const current = await freshRoom();
    if (!current) return;
    await sb.from("mafia_rooms").update({ data: { ...current, ...changes } }).eq("code", code);
  }

  // ── Phase transitions ──
  async function advanceToNight() {
    playTap();
    const current = await freshRoom();
    if (!current) return;
    const nextRound = current.round + 1;
    setWolfVotes({});
    setSeerPeek(null);
    setDoctorSave(null);
    await writeRoom({
      phase: "night",
      round: nextRound,
      nightResult: null,
      seerReveal: null,
      voteResult: null,
      log: [...current.log, `── Night ${nextRound} ──`],
    });
  }

  async function resolveNight() {
    playTap();
    const current = await freshRoom();
    if (!current) return;

    // Wolf majority target (random tiebreak)
    const wolfTarget = getMajority(wolfVotes, false);
    const saved = doctorSave != null && doctorSave === wolfTarget;

    let players = [...current.players];
    let killedName = null;

    if (wolfTarget && !saved) {
      players = players.map((p) =>
        p.id === wolfTarget ? { ...p, alive: false } : p
      );
      killedName = players.find((p) => p.id === wolfTarget)?.name;
    }

    // Seer reveal
    let seerRevealData = null;
    if (seerPeek) {
      const target = players.find((p) => p.id === seerPeek);
      seerRevealData = {
        targetId: seerPeek,
        targetName: target?.name,
        isWerewolf: target?.role === "werewolf",
      };
    }

    const winner = checkWin(players);
    const nightMsg = saved
      ? `Night ${current.round}: No one died (doctor save!)`
      : killedName
      ? `Night ${current.round}: ${killedName} was killed`
      : `Night ${current.round}: No one died`;

    if (winner) playCorrect(); else playWrong();

    await sb.from("mafia_rooms").update({
      data: {
        ...current,
        players,
        phase: winner ? "ended" : "day",
        nightResult: {
          killedId: saved ? null : wolfTarget,
          killedName: saved ? null : killedName,
          saved,
        },
        seerReveal: seerRevealData,
        winner,
        log: [...current.log, nightMsg],
      },
    }).eq("code", code);

    setWolfVotes({});
    setSeerPeek(null);
    setDoctorSave(null);
  }

  async function openDayVote() {
    playTap();
    setDayVotes({});
    await writeRoom({ phase: "day_vote" });
  }

  async function resolveDay() {
    playTap();
    const current = await freshRoom();
    if (!current) return;

    const target = getMajority(dayVotes, true); // null on tie

    let players = [...current.players];
    let eliminatedName = null;
    let eliminatedRole = null;

    if (target) {
      const p = players.find((x) => x.id === target);
      eliminatedName = p?.name;
      eliminatedRole = p?.role;
      players = players.map((x) =>
        x.id === target ? { ...x, alive: false } : x
      );
    }

    const winner = checkWin(players);
    const dayMsg = target
      ? `Day ${current.round}: ${eliminatedName} eliminated (${eliminatedRole})`
      : `Day ${current.round}: No elimination (tied vote)`;

    if (winner) playCorrect();

    await sb.from("mafia_rooms").update({
      data: {
        ...current,
        players,
        phase: winner ? "ended" : "vote_result",
        voteResult: { eliminatedId: target, eliminatedName, eliminatedRole, tie: !target },
        winner,
        log: [...current.log, dayMsg],
      },
    }).eq("code", code);

    setDayVotes({});
  }

  // ── Render helpers ──
  if (!code) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-dvh px-5 gap-4">
        <p className="text-gray-400 font-body">No room found.</p>
        <Link to="/mafia" className="neon-btn bg-bg text-pink border-pink box-glow-pink text-sm no-underline">← Back</Link>
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

  const { players, phase, round, nightResult, voteResult, winner, log } = roomData;
  const alive = players.filter((p) => p.alive);
  const aliveWolves = alive.filter((p) => p.role === "werewolf");
  const aliveSeer = alive.find((p) => p.role === "seer");
  const aliveDoctor = alive.find((p) => p.role === "doctor");

  const nameOf = (id) => players.find((p) => p.id === id)?.name || "?";

  // Count expected night actions
  const wolfsDone = Object.keys(wolfVotes).length;
  const wolfsExpected = aliveWolves.length;
  const seerDone = !aliveSeer || seerPeek != null;
  const doctorDone = !aliveDoctor || doctorSave != null;
  const allNightDone = wolfsDone >= wolfsExpected && seerDone && doctorDone;

  // Day vote counts
  const aliveNonDead = alive.length;
  const dayVotesDone = Object.keys(dayVotes).length;

  // ── ENDED ──
  if (phase === "ended") {
    return (
      <div className="page-enter flex flex-col items-center px-5 py-6 min-h-dvh">
        <h1 className="font-heading text-yellow text-base glow-yellow mb-2 text-center leading-relaxed">
          GAME OVER
        </h1>
        <p className={`font-heading text-sm mb-6 text-center leading-relaxed ${winner === "werewolves" ? "text-pink glow-pink" : "text-lime glow-lime"}`}>
          {winner === "werewolves" ? "🐺 WEREWOLVES WIN" : "🏘️ VILLAGE WINS"}
        </p>

        <div className="w-full max-w-sm flex flex-col gap-2 mb-6">
          {players.map((p) => (
            <div key={p.id} className={`flex items-center justify-between bg-bg border rounded-lg px-4 py-3 ${p.alive ? "border-gray-700" : "border-gray-800 opacity-50"}`}>
              <div className="flex items-center gap-2">
                <span>{ROLE_EMOJI[p.role]}</span>
                <span className="font-body text-white text-sm">{p.name}</span>
                {!p.alive && <span className="text-xs text-gray-600">💀</span>}
              </div>
              <span className={`font-heading text-[10px] ${ROLE_COLOR[p.role]}`}>{p.role}</span>
            </div>
          ))}
        </div>

        {/* Log */}
        <div className="w-full max-w-sm">
          <h2 className="font-heading text-[10px] text-gray-500 mb-2">GAME LOG</h2>
          <div className="text-gray-500 font-body text-xs space-y-1 max-h-48 overflow-y-auto">
            {log.map((entry, i) => <p key={i}>{entry}</p>)}
          </div>
        </div>

        <Link to="/" className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-sm no-underline mt-6">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col items-center px-5 py-6 min-h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm mb-3">
        <p className="font-body text-gray-500 text-xs">Room {code}</p>
        <p className="font-heading text-yellow text-xs glow-yellow">
          {round > 0 ? `Round ${round}` : ""}
        </p>
      </div>

      {/* Phase badge */}
      <div className="mb-4">
        {phase === "roles" && (
          <span className="font-heading text-sm text-purple glow-purple leading-relaxed">ROLE REVEAL</span>
        )}
        {phase === "night" && (
          <span className="font-heading text-sm text-cyan glow-cyan leading-relaxed pulse-glow">NIGHT {round}</span>
        )}
        {phase === "day" && (
          <span className="font-heading text-sm text-yellow glow-yellow leading-relaxed">DAY {round}</span>
        )}
        {phase === "day_vote" && (
          <span className="font-heading text-sm text-orange glow-orange leading-relaxed pulse-glow">VOTING</span>
        )}
        {phase === "vote_result" && (
          <span className="font-heading text-sm text-pink glow-pink leading-relaxed">VOTE RESULT</span>
        )}
      </div>

      {/* Player roster (always visible) */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex flex-col gap-1">
          {players.map((p) => (
            <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded ${p.alive ? "bg-bg" : "bg-gray-900/50 opacity-40"}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{ROLE_EMOJI[p.role]}</span>
                <span className="font-body text-white text-xs">{p.name}</span>
                {!p.alive && <span className="text-[10px]">💀</span>}
              </div>
              <span className={`font-heading text-[9px] ${ROLE_COLOR[p.role]}`}>{p.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PHASE CONTROLS ── */}

      {/* ROLES phase */}
      {phase === "roles" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-gray-400 font-body text-sm text-center">
            Players are viewing their roles...
          </p>
          <button onClick={advanceToNight}
            className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-base w-full py-4">
            BEGIN NIGHT 1
          </button>
        </div>
      )}

      {/* NIGHT phase */}
      {phase === "night" && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <h3 className="font-heading text-[10px] text-gray-500 text-center">NIGHT ACTIONS</h3>

          {/* Wolf votes */}
          <div className="border border-gray-800 rounded-lg px-3 py-2">
            <p className="font-heading text-[9px] text-pink mb-1">
              🐺 WOLVES ({wolfsDone}/{wolfsExpected})
            </p>
            {aliveWolves.map((w) => (
              <p key={w.id} className="font-body text-xs text-gray-400">
                {w.name}: {wolfVotes[w.id] ? <span className="text-pink">{nameOf(wolfVotes[w.id])}</span> : <span className="text-gray-600">waiting...</span>}
              </p>
            ))}
          </div>

          {/* Seer peek */}
          {aliveSeer && (
            <div className="border border-gray-800 rounded-lg px-3 py-2">
              <p className="font-heading text-[9px] text-purple mb-1">
                🔮 SEER {seerPeek ? "✓" : ""}
              </p>
              <p className="font-body text-xs text-gray-400">
                {seerPeek
                  ? <><span className="text-purple">{nameOf(seerPeek)}</span> → {players.find((p) => p.id === seerPeek)?.role === "werewolf" ? <span className="text-pink">WEREWOLF!</span> : <span className="text-lime">Not a wolf</span>}</>
                  : <span className="text-gray-600">waiting...</span>}
              </p>
            </div>
          )}

          {/* Doctor save */}
          {aliveDoctor && (
            <div className="border border-gray-800 rounded-lg px-3 py-2">
              <p className="font-heading text-[9px] text-lime mb-1">
                💊 DOCTOR {doctorSave ? "✓" : ""}
              </p>
              <p className="font-body text-xs text-gray-400">
                {doctorSave
                  ? <span className="text-lime">Protecting {nameOf(doctorSave)}</span>
                  : <span className="text-gray-600">waiting...</span>}
              </p>
            </div>
          )}

          <button onClick={resolveNight}
            disabled={!allNightDone}
            className="neon-btn bg-bg text-yellow border-yellow box-glow-yellow text-sm w-full py-3 mt-2 disabled:opacity-40">
            {allNightDone ? "RESOLVE NIGHT" : "WAITING FOR ACTIONS..."}
          </button>
        </div>
      )}

      {/* DAY phase (show night result, open discussion) */}
      {phase === "day" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          {nightResult && (
            <div className="border-2 border-gray-700 rounded-xl px-5 py-4 w-full text-center">
              {nightResult.saved ? (
                <p className="font-body text-lime text-sm">No one died! The doctor saved them.</p>
              ) : nightResult.killedName ? (
                <p className="font-body text-pink text-sm">
                  💀 <span className="font-heading text-xs">{nightResult.killedName}</span> was killed in the night.
                </p>
              ) : (
                <p className="font-body text-gray-400 text-sm">A peaceful night. No one died.</p>
              )}
            </div>
          )}
          <p className="text-gray-500 font-body text-xs text-center">Discussion phase — let players talk.</p>
          <button onClick={openDayVote}
            className="neon-btn bg-bg text-orange border-orange box-glow-orange text-base w-full py-4">
            OPEN VOTING
          </button>
        </div>
      )}

      {/* DAY_VOTE phase */}
      {phase === "day_vote" && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <h3 className="font-heading text-[10px] text-orange text-center">
            VOTES ({dayVotesDone}/{aliveNonDead})
          </h3>
          {alive.map((p) => {
            const votesForThis = Object.values(dayVotes).filter((t) => t === p.id).length;
            return (
              <div key={p.id} className="flex items-center justify-between border border-gray-800 rounded-lg px-3 py-2">
                <span className="font-body text-white text-xs">{p.name}</span>
                <div className="flex items-center gap-2">
                  {votesForThis > 0 && (
                    <div className="h-3 bg-orange/30 rounded" style={{ width: `${votesForThis * 20}px` }} />
                  )}
                  <span className="font-heading text-xs text-orange">{votesForThis}</span>
                </div>
              </div>
            );
          })}
          <button onClick={resolveDay}
            disabled={dayVotesDone < aliveNonDead}
            className="neon-btn bg-bg text-yellow border-yellow box-glow-yellow text-sm w-full py-3 mt-2 disabled:opacity-40">
            {dayVotesDone >= aliveNonDead ? "RESOLVE VOTE" : "WAITING FOR VOTES..."}
          </button>
        </div>
      )}

      {/* VOTE_RESULT phase */}
      {phase === "vote_result" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          {voteResult && (
            <div className="border-2 border-gray-700 rounded-xl px-5 py-4 w-full text-center">
              {voteResult.tie ? (
                <p className="font-body text-gray-400 text-sm">Tied vote — no one is eliminated.</p>
              ) : (
                <p className="font-body text-pink text-sm">
                  💀 <span className="font-heading text-xs">{voteResult.eliminatedName}</span> was eliminated.
                  <br />
                  <span className="text-gray-500 text-xs">They were a {ROLE_EMOJI[voteResult.eliminatedRole]} {voteResult.eliminatedRole}.</span>
                </p>
              )}
            </div>
          )}
          <button onClick={advanceToNight}
            className="neon-btn bg-bg text-cyan border-cyan box-glow-cyan text-base w-full py-4">
            NEXT NIGHT →
          </button>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="w-full max-w-sm mt-6">
          <h2 className="font-heading text-[10px] text-gray-600 mb-1">LOG</h2>
          <div className="text-gray-600 font-body text-[10px] space-y-0.5 max-h-32 overflow-y-auto">
            {log.map((entry, i) => <p key={i}>{entry}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}
