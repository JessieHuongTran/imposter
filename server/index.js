import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());

// Serve static frontend build in production
app.use(express.static(join(__dirname, "../dist")));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ── Room state ──────────────────────────────────────────────────────
const rooms = new Map();

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code;
  do {
    code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

function broadcastLobby(code) {
  const room = rooms.get(code);
  if (!room) return;
  io.to(code).emit("lobby_update", {
    players: room.players.map((p) => ({ name: p.name, id: p.id })),
    host: room.host,
    category: room.category,
    maxPlayers: room.maxPlayers,
  });
}

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  if (room.players.length === 0) {
    rooms.delete(code);
  }
}

// ── Categories (duplicated from client for server-side assignment) ──
import { readFileSync } from "fs";

// We'll import categories inline since they're needed for game logic
const categoriesModule = await import("../src/data/categories.js");
const categories = categoriesModule.default;

// ── Socket handlers ─────────────────────────────────────────────────
io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("create_room", ({ category, maxPlayers }, callback) => {
    const code = generateCode();
    const room = {
      code,
      type: "imposter",
      host: socket.id,
      players: [],
      category,
      maxPlayers,
      status: "lobby",
      gameData: null,
    };
    rooms.set(code, room);
    currentRoom = code;
    socket.join(code);

    // Host is also a player
    room.players.push({ id: socket.id, name: "Host", viewed: false });
    broadcastLobby(code);

    callback({ success: true, code });
  });

  socket.on("join_room", ({ code, name }, callback) => {
    const room = rooms.get(code);

    if (!room) {
      return callback({ success: false, error: "Room not found" });
    }
    if (room.status !== "lobby") {
      return callback({ success: false, error: "Game already started" });
    }
    if (room.players.length >= room.maxPlayers) {
      return callback({ success: false, error: "Room is full" });
    }
    if (room.players.some((p) => p.name === name)) {
      return callback({ success: false, error: "Name already taken" });
    }

    currentRoom = code;
    socket.join(code);
    room.players.push({ id: socket.id, name, viewed: false });
    broadcastLobby(code);

    callback({ success: true, code, isHost: false });
  });

  socket.on("update_host_name", ({ code, name }) => {
    const room = rooms.get(code);
    if (!room) return;
    const host = room.players.find((p) => p.id === socket.id);
    if (host) {
      host.name = name;
      broadcastLobby(code);
    }
  });

  socket.on("start_game", ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.host !== socket.id) return;
    if (room.players.length < 3) return;

    room.status = "revealing";

    const cat = categories[room.category];
    const wordIndex = Math.floor(Math.random() * cat.words.length);
    const word = cat.words[wordIndex];
    const hint = cat.hints[wordIndex];

    const imposterCount = Math.max(1, Math.floor(room.players.length / 2) - 1);

    // Fisher-Yates shuffle for imposter selection
    const indices = Array.from({ length: room.players.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const imposterSet = new Set(indices.slice(0, imposterCount));

    // Pick first player from non-imposters
    const nonImposters = indices.filter((i) => !imposterSet.has(i));
    const firstPlayerIndex =
      nonImposters[Math.floor(Math.random() * nonImposters.length)];

    room.gameData = { word, hint, imposterSet, firstPlayerIndex };

    // Send each player their private card data
    room.players.forEach((player, i) => {
      const isImposter = imposterSet.has(i);
      player.viewed = false;
      io.to(player.id).emit("card_dealt", {
        role: isImposter ? "IMPOSTER" : "NORMAL",
        word: isImposter ? hint : word,
        isImposter,
        playerName: player.name,
      });
    });
  });

  socket.on("card_viewed", ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) player.viewed = true;

    const allViewed = room.players.every((p) => p.viewed);

    // Broadcast view progress
    io.to(code).emit("view_progress", {
      viewedCount: room.players.filter((p) => p.viewed).length,
      totalPlayers: room.players.length,
    });

    if (allViewed) {
      room.status = "playing";
      const firstPlayer = room.players[room.gameData.firstPlayerIndex];
      io.to(code).emit("all_viewed", {
        firstPlayerName: firstPlayer.name,
      });
    }
  });

  // ── Number Guess events ──────────────────────────────────────────
  socket.on("ng_create_room", ({ secretNumber }, callback) => {
    const code = generateCode();
    const room = {
      code,
      type: "numguess",
      host: socket.id,
      players: {
        p1: { socketId: socket.id, secretNumber, locked: true },
        p2: null,
      },
      currentTurn: "p1",
      guesses: [],
      status: "waiting",
    };
    rooms.set(code, room);
    currentRoom = code;
    socket.join(code);
    callback({ success: true, code });
  });

  socket.on("ng_join_room", ({ code, secretNumber }, callback) => {
    const room = rooms.get(code);
    if (!room || room.type !== "numguess") {
      return callback({ success: false, error: "Room not found" });
    }
    if (room.status !== "waiting") {
      return callback({ success: false, error: "Game already started" });
    }
    if (room.players.p2) {
      return callback({ success: false, error: "Room is full" });
    }

    room.players.p2 = { socketId: socket.id, secretNumber, locked: true };
    room.status = "playing";
    currentRoom = code;
    socket.join(code);

    callback({ success: true, code });

    // Notify both players the game is starting
    io.to(code).emit("ng_game_start");
  });

  socket.on("ng_submit_guess", ({ code, value }) => {
    const room = rooms.get(code);
    if (!room || room.type !== "numguess" || room.status !== "playing") return;

    const guesser = room.players.p1.socketId === socket.id ? "p1" : "p2";
    if (guesser !== room.currentTurn) return;

    const opponent = guesser === "p1" ? "p2" : "p1";
    const targetNumber = room.players[opponent].secretNumber;

    let result;
    if (value === targetNumber) {
      result = "correct";
    } else if (targetNumber > value) {
      result = "higher";
    } else {
      result = "lower";
    }

    const entry = { guesser, value, result };
    room.guesses.push(entry);

    // Broadcast result to both players
    io.to(code).emit("ng_guess_result", entry);

    if (result === "correct") {
      room.status = "finished";
      io.to(code).emit("ng_game_over", {
        winner: guesser,
        p1Number: room.players.p1.secretNumber,
        p2Number: room.players.p2.secretNumber,
        allGuesses: room.guesses,
      });
    } else {
      room.currentTurn = opponent;
    }
  });

  // ── Disconnect ─────────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    // Handle Number Guess disconnect
    if (room.type === "numguess") {
      io.to(currentRoom).emit("toast", {
        message: "⚠️ Opponent left the game",
      });
      rooms.delete(currentRoom);
      return;
    }

    // Handle Imposter disconnect
    const player = room.players.find((p) => p.id === socket.id);
    const playerName = player?.name || "Someone";

    room.players = room.players.filter((p) => p.id !== socket.id);

    if (room.host === socket.id) {
      if (room.players.length > 0) {
        room.host = room.players[0].id;
        io.to(currentRoom).emit("toast", {
          message: `⚠️ ${playerName} (host) left. ${room.players[0].name} is the new host.`,
        });
      }
    } else {
      io.to(currentRoom).emit("toast", {
        message: `⚠️ ${playerName} left the game`,
      });
    }

    broadcastLobby(currentRoom);
    cleanupRoom(currentRoom);
  });
});

// SPA fallback for client-side routing in production
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
