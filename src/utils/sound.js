let audioCtx = null;
let _muted = localStorage.getItem("muted") === "true";

export function isMuted() { return _muted; }
export function setMuted(v) {
  _muted = v;
  localStorage.setItem("muted", v ? "true" : "false");
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function tone(freq, dur, type = "square", vol = 0.12) {
  if (_muted) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

// Card flip open — rising bleep
export function playFlipOpen() {
  if (_muted) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

// Card flip close — descending tone
export function playFlipClose() {
  if (_muted) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(900, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

// Win fanfare — 4-note ascending arpeggio
export function playStartGame() {
  if (_muted) return;
  const ctx = getAudioContext();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.15);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.15);
  });
}

// Button tap — short pop
export function playTap() {
  tone(800, 0.06, "square", 0.08);
}

// Game select — 2-note chime (used when tapping a game card)
export function playSelect() {
  if (_muted) return;
  const ctx = getAudioContext();
  [660, 990].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.07 + 0.12);
    osc.start(ctx.currentTime + i * 0.07);
    osc.stop(ctx.currentTime + i * 0.07 + 0.12);
  });
}

// Countdown tick — arcade beep
export function playCountdownTick() {
  tone(440, 0.12, "square", 0.1);
}

// Countdown final — higher pitch
export function playCountdownGo() {
  tone(880, 0.2, "square", 0.14);
}

// Higher — rising pitch
export function playHigher() {
  if (_muted) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

// Lower — falling pitch
export function playLower() {
  if (_muted) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(900, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

// Buzzer — loud alarm hit
export function playBuzz() {
  if (_muted) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.05);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

// Wrong answer — descending sad tone
export function playWrong() {
  if (_muted) return;
  const ctx = getAudioContext();
  [400, 300].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.15);
    osc.start(ctx.currentTime + i * 0.15);
    osc.stop(ctx.currentTime + i * 0.15 + 0.15);
  });
}

// Correct guess — victory jingle
export function playCorrect() {
  if (_muted) return;
  const ctx = getAudioContext();
  [523, 659, 784, 1047, 1318].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.12);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.12);
  });
}

// ── Lobby background music (chiptune loop) ──────
// A fun looping 8-bit melody using Web Audio scheduling
let lobbyNodes = null;
let lobbyTimeout = null;

export function startLobbyMusic() {
  stopLobbyMusic();
  if (_muted) return;
  const ctx = getAudioContext();

  // Melody: catchy arcade waiting tune
  const melody = [
    392, 0, 523, 0, 659, 0, 523, 0,
    440, 0, 523, 0, 587, 0, 523, 0,
    392, 0, 494, 0, 587, 0, 659, 0,
    523, 0, 440, 0, 392, 0, 0, 0,
  ];
  const bass = [
    196, 196, 196, 196, 220, 220, 220, 220,
    196, 196, 196, 196, 262, 262, 196, 196,
    196, 196, 196, 196, 220, 220, 220, 220,
    262, 262, 220, 220, 196, 196, 196, 196,
  ];

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const stepDur = 0.18;
  let step = 0;
  let running = true;

  function scheduleBar() {
    if (!running) return;
    const now = ctx.currentTime;

    for (let i = 0; i < melody.length; i++) {
      const t = now + i * stepDur;

      // Melody voice
      if (melody[i] > 0) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(masterGain);
        osc.type = "square";
        osc.frequency.setValueAtTime(melody[i], t);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + stepDur * 0.9);
        osc.start(t);
        osc.stop(t + stepDur * 0.9);
      }

      // Bass voice
      if (bass[i] > 0) {
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2);
        g2.connect(masterGain);
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(bass[i], t);
        g2.gain.setValueAtTime(0.2, t);
        g2.gain.exponentialRampToValueAtTime(0.01, t + stepDur * 0.8);
        osc2.start(t);
        osc2.stop(t + stepDur * 0.8);
      }
    }

    // Schedule next bar
    lobbyTimeout = setTimeout(scheduleBar, melody.length * stepDur * 1000 - 50);
  }

  scheduleBar();

  lobbyNodes = {
    masterGain,
    stop() {
      running = false;
      if (lobbyTimeout) clearTimeout(lobbyTimeout);
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      setTimeout(() => {
        try { masterGain.disconnect(); } catch {}
      }, 400);
    },
  };
}

export function stopLobbyMusic() {
  if (lobbyNodes) {
    lobbyNodes.stop();
    lobbyNodes = null;
  }
  if (lobbyTimeout) {
    clearTimeout(lobbyTimeout);
    lobbyTimeout = null;
  }
}
