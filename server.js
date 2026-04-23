const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(express.static("public"));

// In-memory state:
// rooms = Map<
//   roomCode,
//   {
//     players: Map<socketId, { id, name, sips: number }>,
//     hostId: null | socketId,
//     currentKingId: null | socketId,
//     activeRule: string,
//     voting: null | { question: string, votes: Map<voterId, targetId> },
//     dilemma: null | { question: string, optionA: string, optionB: string, votes: Map<voterId, "A" | "B"> },
//     fastFingers: null | { target: number, startedAt: number, counts: Map<playerId, number>, finishedAt: Map<playerId, number>, timeout: NodeJS.Timeout },
//     stopwatch: null | { targetTime: number, times: Map<playerId, number> },
//     reaction: null | { startedAt: number, clicks: Map<playerId, number>, timeout: NodeJS.Timeout }
//   }
// >
const rooms = new Map();

const opdrachten = [
  // --- STANDAARD & GRAPPIG ---
  { type: "text", content: "Iedereen die vanavond al naar de wc is geweest, neemt 2 slokken." },
  {
    type: "text",
    content:
      "T-Rex armpjes! Iedereen moet zijn ellebogen in zijn zij houden tot de volgende kaart. Vergeten = 1 slok.",
  },
  { type: "text", content: "De speler met de minste batterij op zijn telefoon neemt 4 slokken." },
  { type: "text", content: "Iedereen die kleiner is dan de host, drinkt 2 slokken." },

  // --- SPECIFIEK & WEIRD ---
  {
    type: "text",
    content:
      "{player} moet de laatste 3 foto's uit zijn/haar filmrol laten zien. Weigeren = 5 slokken.",
  },
  {
    type: "text",
    content:
      "{player} moet zijn/haar meest recente Google-zoekopdracht hardop voorlezen. Te gênant? 5 slokken.",
  },
  {
    type: "text",
    content:
      "{player} wijst een drinkbuddy aan. Tot het einde van het spel: als de één drinkt, moet de ander ook.",
  },
  {
    type: "text",
    content:
      "{player} mag de komende 3 rondes alleen nog maar fluisteren. Overtreding = 2 slokken per keer.",
  },
  { type: "text", content: "Wissel een kledingstuk met de persoon tegenover je, of neem 4 slokken." },
  {
    type: "text",
    content: "{player} moet de elleboog van de persoon links van zich likken. Weigeren = een atje.",
  },

  // --- HEFTIG & INTENS ---
  {
    type: "text",
    content:
      "WATERVAL! {player} begint met drinken, de rest volgt. Je mag pas stoppen als de persoon voor je stopt.",
  },
  {
    type: "text",
    content: "{player} en de persoon met de meeste slokken nemen een shotje (of adten hun glas).",
  },
  {
    type: "text",
    content:
      "Telefoon-roulette! {player} laat de speler rechts van zich een appje sturen naar iemand naar keuze. Weigeren = glas leeg.",
  },
  {
    type: "text",
    content: "Iedereen die weleens de ex van een vriend of vriendin heeft ge-DM'd, neemt 5 slokken.",
  },
  {
    type: "text",
    content:
      '{player} belt een familielid op speaker en zegt "Ik ben zwanger / Ik word vader" of "Ik zit in de gevangenis". Weigeren is je hele drankje leegdrinken.',
  },

  // --- MINIGAMES: STEMMEN ---
  { type: "vote", question: "Wie heeft de grootste kans om per ongeluk een sekte te starten?" },
  { type: "vote", question: "Wie heeft de ergste walk of shame gehad?" },
  { type: "vote", question: "Wie heeft de slechtste smaak in bedpartners?" },
  { type: "vote", question: "Wie zou als eerste doodgaan in een horrorfilm?" },
  { type: "vote", question: "Wie van ons verbergt de raarste fetish?" },

  // --- MINIGAMES: REACTIE ---
  { type: "reaction" },
  { type: "reaction" },
  { type: "reaction" }, // Een paar keer toevoegen zodat hij vaker voorbij komt

  // --- FAST FINGERS ---
  { type: "fast-fingers", content: "Tik 15 keer zo snel mogelijk op de knop!" },

  // --- STOPWATCH ---
  { type: "stopwatch", targetTime: 8, content: "Stop de klok op exact 8.00 seconden!" },

  // --- DILEMMA ---
  {
    type: "dilemma",
    question: "Zou je liever... altijd te laat zijn",
    optionA: "maar altijd iconisch binnenkomen",
    optionB: "of altijd op tijd zijn maar niemand onthoudt je?",
  },
  {
    type: "dilemma",
    question: "Zou je liever... nooit meer kunnen liegen",
    optionA: "en alles moeten zeggen wat je denkt",
    optionB: "of 1 dag per week alleen maar kunnen liegen?",
  },

  // --- EXTRA WEIRD TEXT ---
  { type: "text", content: "{player} moet zijn/haar schoen als glas gebruiken voor de volgende 2 slokken." },
  {
    type: "text",
    content:
      "De persoon die als laatst een foto heeft gepost op Instagram, moet een willekeurige comment van de groep plaatsen bij de bovenste post in hun feed.",
  },
  {
    type: "text",
    content: "Staar-wedstrijd! {player} kiest iemand. De eerste die knippert drinkt 3 slokken.",
  },
  {
    type: "text",
    content:
      "De 'Medusa' regel: De host roept 'MEDUSA!'. Iedereen moet naar de grond kijken. Op 3 kijkt iedereen naar een andere speler. Als je oogcontact maakt met iemand, drink je beide 5 slokken.",
  },
  {
    type: "text",
    content:
      "{player} moet een blinddoek om (of ogen dicht) en raden wie hem/haar een tikje op de schouder geeft. Fout? 3 slokken.",
  },

  // --- KONING ---
  {
    type: "king",
    content: "JIJ BENT DE KONING! Verzin een regel die tot de volgende koning geldt.",
  },
];

function normalizeRoomCode(roomCode) {
  return String(roomCode || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

function getRoom(roomCode) {
  const code = normalizeRoomCode(roomCode);
  if (!code) return { code: "", room: null };
  let room = rooms.get(code);
  if (!room) {
    room = {
      players: new Map(),
      hostId: null,
      currentKingId: null,
      activeRule: "Geen",
      voting: null,
      dilemma: null,
      fastFingers: null,
      stopwatch: null,
      reaction: null,
    };
    rooms.set(code, room);
  }
  return { code, room };
}

function getActivePlayersArray(room) {
  return Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    sips: p.sips || 0,
  }));
}

function emitRoomPlayers(roomCode) {
  const room = rooms.get(roomCode);
  const players = room ? getActivePlayersArray(room) : [];
  // Preferred event name (frontend)
  io.to(roomCode).emit("updatePlayers", { roomCode, players, hostId: room?.hostId || null });
  // Backwards compatible
  io.to(roomCode).emit("roomPlayers", { roomCode, players });
}

function requireHost(room, socket) {
  return !!room?.hostId && room.hostId === socket.id;
}

function addSips(roomCode, playerName, amount) {
  const room = rooms.get(roomCode);
  if (!room) return false;

  const targetName = String(playerName || "").trim();
  const delta = Number(amount) || 0;
  if (!targetName || delta <= 0) return false;

  let updated = false;
  for (const [id, p] of room.players.entries()) {
    if (p.name !== targetName) continue;
    room.players.set(id, { ...p, sips: (p.sips || 0) + delta });
    updated = true;
  }

  if (updated) emitRoomPlayers(roomCode);
  return updated;
}

function clearVoting(room) {
  room.voting = null;
}

function clearDilemma(room) {
  room.dilemma = null;
}

function clearFastFingers(room) {
  if (room.fastFingers?.timeout) clearTimeout(room.fastFingers.timeout);
  room.fastFingers = null;
}

function clearStopwatch(room) {
  room.stopwatch = null;
}

function clearReaction(room) {
  if (room.reaction?.timeout) clearTimeout(room.reaction.timeout);
  room.reaction = null;
}

function getRandomPlayer(room) {
  const players = getActivePlayersArray(room);
  if (players.length === 0) return null;
  return players[Math.floor(Math.random() * players.length)];
}

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ roomCode, playerName } = {}) => {
    const { code, room } = getRoom(roomCode);
    const name = String(playerName || "").trim().slice(0, 32);

    if (!code) {
      socket.emit("errorMessage", { message: "Ongeldige roomCode." });
      return;
    }
    if (!name) {
      socket.emit("errorMessage", { message: "Ongeldige playerName." });
      return;
    }

    socket.data.roomCode = code;
    socket.data.playerName = name;

    socket.join(code);
    room.players.set(socket.id, { id: socket.id, name, sips: 0 });
    if (!room.hostId) room.hostId = socket.id;

    socket.emit("joinedRoom", { roomCode: code, playerId: socket.id });
    socket.to(code).emit("playerJoined", { id: socket.id, name });
    emitRoomPlayers(code);
  });

  socket.on("nextCard", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms.has(roomCode)) {
      socket.emit("errorMessage", { message: "Je zit niet in een kamer." });
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) return;
    if (!requireHost(room, socket)) {
      socket.emit("errorMessage", { message: "Alleen de host kan de volgende kaart trekken." });
      return;
    }

    // Stop any running minigames when a new card starts
    clearVoting(room);
    clearDilemma(room);
    clearFastFingers(room);
    clearStopwatch(room);
    clearReaction(room);

    const players = getActivePlayersArray(room);
    const randomPlayer =
      players.length > 0 ? players[Math.floor(Math.random() * players.length)] : null;

    const card = opdrachten[Math.floor(Math.random() * opdrachten.length)];

    if (card.type === "text") {
      let opdracht = card.content;
      if (opdracht.includes("{player}")) {
        const replacement = randomPlayer?.name || "iemand";
        opdracht = opdracht.replaceAll("{player}", replacement);
      }
      // Preferred event name (frontend)
      io.to(roomCode).emit("newCard", { opdracht, type: "text" });
      // Backwards compatible
      io.to(roomCode).emit("card", { opdracht });
      return;
    }

    if (card.type === "vote") {
      room.voting = { question: card.question, votes: new Map() };
      io.to(roomCode).emit("startVoting", { question: card.question, players });
      return;
    }

    if (card.type === "dilemma") {
      const question = String(card.question || "Zou je liever...").trim() || "Zou je liever...";
      const optionA = String(card.optionA || "").trim();
      const optionB = String(card.optionB || "").trim();
      if (!optionA || !optionB) {
        socket.emit("errorMessage", { message: "Dilemma kaart mist opties." });
        return;
      }

      room.dilemma = { question, optionA, optionB, votes: new Map() };
      io.to(roomCode).emit("startDilemma", { question, optionA, optionB, players });
      return;
    }

    if (card.type === "fast-fingers") {
      const target = 15;
      const startedAt = Date.now();
      room.fastFingers = {
        target,
        startedAt,
        counts: new Map(),
        finishedAt: new Map(),
        timeout: null,
      };

      for (const p of players) room.fastFingers.counts.set(p.id, 0);

      const finish = (reason) => {
        const ff = room.fastFingers;
        if (!ff) return;

        const playersNow = getActivePlayersArray(room);
        const ids = playersNow.map((p) => p.id);
        if (ids.length === 0) {
          clearFastFingers(room);
          return;
        }

        // Determine loser
        let loserId = null;

        if (reason === "early") {
          const notFinished = ids.filter((id) => !ff.finishedAt.has(id));
          if (notFinished.length === 1) {
            loserId = notFinished[0];
          } else if (notFinished.length === 0) {
            // everyone finished: last finisher loses
            let latestT = -1;
            for (const [id, t] of ff.finishedAt.entries()) {
              if (t > latestT) {
                latestT = t;
                loserId = id;
              }
            }
          }
        }

        if (!loserId) {
          // timeout (or fallback): lowest click count loses
          let min = Infinity;
          for (const id of ids) {
            const c = ff.counts.get(id) || 0;
            min = Math.min(min, c);
          }
          const lowest = ids.filter((id) => (ff.counts.get(id) || 0) === min);
          loserId = lowest[Math.floor(Math.random() * lowest.length)];
        }

        const loser = playersNow.find((p) => p.id === loserId);
        clearFastFingers(room);

        addSips(roomCode, loser?.name, 5);
        io.to(roomCode).emit("fastFingersLoser", { name: loser?.name || "iemand" });
      };

      room.fastFingers.timeout = setTimeout(() => finish("timeout"), 15000);
      io.to(roomCode).emit("startFastFingers", { target, durationMs: 15000, content: card.content });
      return;
    }

    if (card.type === "stopwatch") {
      const targetTime = Math.max(1, Math.min(30, Number(card.targetTime) || 8));
      room.stopwatch = { targetTime, times: new Map() };
      io.to(roomCode).emit("startStopwatch", { targetTime, content: card.content });
      return;
    }

    if (card.type === "reaction") {
      const startedAt = Date.now();
      room.reaction = { startedAt, clicks: new Map(), timeout: null };

      const finishReaction = () => {
        const r = room.reaction;
        if (!r) return;

        const now = Date.now();
        const clickTimes = new Map(r.clicks);
        const playerIds = players.map((p) => p.id);

        // Players that never clicked are always slowest; if multiple, pick one.
        const notClicked = playerIds.filter((id) => !clickTimes.has(id));
        let loserId = null;

        if (notClicked.length > 0) {
          loserId = notClicked[Math.floor(Math.random() * notClicked.length)];
        } else {
          // Everyone clicked: slowest is max click time delta
          let maxDelta = -1;
          for (const [id, t] of clickTimes.entries()) {
            const delta = Math.max(0, t - startedAt);
            if (delta > maxDelta) {
              maxDelta = delta;
              loserId = id;
            }
          }
        }

        const loser = players.find((p) => p.id === loserId);
        clearReaction(room);

        // Sips: reaction loser drinks 5
        addSips(roomCode, loser?.name, 5);
        io.to(roomCode).emit("reactionLoser", {
          name: loser?.name || "iemand",
          durationMs: Math.max(0, now - startedAt),
        });
      };

      room.reaction.timeout = setTimeout(finishReaction, 5000);
      io.to(roomCode).emit("startReaction", { durationMs: 5000, players });
      return;
    }

    if (card.type === "king") {
      // Reset rule for new king cycle
      room.activeRule = "Geen";
      io.to(roomCode).emit("ruleUpdated", { rule: room.activeRule });

      // Choose king: player with the most sips (tie -> random among top)
      const playersNow = Array.from(room.players.values());
      if (playersNow.length === 0) {
        socket.emit("errorMessage", { message: "Geen spelers gevonden om koning te kiezen." });
        return;
      }

      let maxSips = -1;
      for (const p of playersNow) maxSips = Math.max(maxSips, p.sips || 0);
      const top = playersNow.filter((p) => (p.sips || 0) === maxSips);
      const kingEntry = top[Math.floor(Math.random() * top.length)];

      room.currentKingId = kingEntry.id;

      // Only the king gets the naming UI
      io.to(kingEntry.id).emit("startKingNaming", {
        content: card.content,
        rule: room.activeRule,
      });

      // Announce to everyone
      io.to(roomCode).emit("newKingAnnounced", { name: kingEntry.name, kingId: kingEntry.id });
      return;
    }

    socket.emit("errorMessage", { message: "Onbekend kaarttype." });
  });

  socket.on("proposeRule", ({ rule } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    if (!room.currentKingId || room.currentKingId !== socket.id) {
      socket.emit("errorMessage", { message: "Alleen de Koning kan een regel instellen." });
      return;
    }

    const nextRule = String(rule || "").trim().slice(0, 140) || "Geen";
    room.activeRule = nextRule;

    io.to(roomCode).emit("ruleUpdated", {
      rule: room.activeRule,
      king: room.players.get(socket.id)?.name || "Koning",
    });
  });

  socket.on("giveManualSip", ({ targetId, amount } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    if (!requireHost(room, socket)) {
      socket.emit("errorMessage", { message: "Alleen de host kan slokken uitdelen." });
      return;
    }

    if (!room.players.has(targetId)) {
      socket.emit("errorMessage", { message: "Speler niet gevonden." });
      return;
    }

    const delta = Math.max(1, Math.min(10, Number(amount) || 1));
    const name = room.players.get(targetId)?.name;
    addSips(roomCode, name, delta);
  });

  socket.on("submitDilemma", ({ choice } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room?.dilemma) {
      socket.emit("errorMessage", { message: "Er is momenteel geen dilemma actief." });
      return;
    }

    const voterId = socket.id;
    if (!room.players.has(voterId)) return;

    const c = choice === "A" || choice === "B" ? choice : null;
    if (!c) {
      socket.emit("errorMessage", { message: "Ongeldige keuze." });
      return;
    }

    room.dilemma.votes.set(voterId, c);

    const playerIds = Array.from(room.players.keys());
    if (room.dilemma.votes.size < playerIds.length) return;

    let countA = 0;
    let countB = 0;
    for (const v of room.dilemma.votes.values()) {
      if (v === "A") countA++;
      if (v === "B") countB++;
    }

    // Minority loses (if tie: nobody loses)
    let minorityChoice = null;
    if (countA !== countB) minorityChoice = countA < countB ? "A" : "B";

    const minorityIds =
      minorityChoice === null
        ? []
        : playerIds.filter((id) => room.dilemma.votes.get(id) === minorityChoice);

    const minorityPlayers = minorityIds.map((id) => ({
      id,
      name: room.players.get(id)?.name || "Onbekend",
    }));

    if (minorityPlayers.length > 0) {
      for (const p of minorityPlayers) addSips(roomCode, p.name, 5);
    }

    const payload = {
      question: room.dilemma.question,
      optionA: room.dilemma.optionA,
      optionB: room.dilemma.optionB,
      countA,
      countB,
      minority: minorityChoice,
      losers: minorityPlayers,
    };

    clearDilemma(room);
    io.to(roomCode).emit("dilemmaResults", payload);
  });

  socket.on("fastFingersClick", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    const ff = room?.fastFingers;
    if (!room || !ff) return;

    const playerId = socket.id;
    if (!room.players.has(playerId)) return;

    const current = ff.counts.get(playerId) || 0;
    if (current >= ff.target) return;

    const next = current + 1;
    ff.counts.set(playerId, next);
    if (next >= ff.target && !ff.finishedAt.has(playerId)) {
      ff.finishedAt.set(playerId, Date.now());
    }

    const playerIds = Array.from(room.players.keys());
    const finishedCount = playerIds.filter((id) => (ff.counts.get(id) || 0) >= ff.target).length;

    // Finish early when all but one are done
    if (playerIds.length > 1 && finishedCount >= playerIds.length - 1) {
      if (ff.timeout) clearTimeout(ff.timeout);
      ff.timeout = null;

      // Reuse finish logic by simulating "early" end:
      const playersNow = getActivePlayersArray(room);
      const ids = playersNow.map((p) => p.id);

      let loserId = null;
      const notFinished = ids.filter((id) => (ff.counts.get(id) || 0) < ff.target);
      if (notFinished.length === 1) {
        loserId = notFinished[0];
      } else if (notFinished.length === 0) {
        let latestT = -1;
        for (const [id, t] of ff.finishedAt.entries()) {
          if (t > latestT) {
            latestT = t;
            loserId = id;
          }
        }
      }
      if (!loserId) {
        // fallback: lowest count
        let min = Infinity;
        for (const id of ids) min = Math.min(min, ff.counts.get(id) || 0);
        const lowest = ids.filter((id) => (ff.counts.get(id) || 0) === min);
        loserId = lowest[Math.floor(Math.random() * lowest.length)];
      }

      const loser = playersNow.find((p) => p.id === loserId);
      clearFastFingers(room);
      addSips(roomCode, loser?.name, 5);
      io.to(roomCode).emit("fastFingersLoser", { name: loser?.name || "iemand" });
    }
  });

  socket.on("stopTime", ({ elapsedMs } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    const sw = room?.stopwatch;
    if (!room || !sw) return;

    const playerId = socket.id;
    if (!room.players.has(playerId)) return;
    if (sw.times.has(playerId)) return; // only once

    const ms = Math.max(0, Math.min(60000, Number(elapsedMs) || 0));
    sw.times.set(playerId, ms);

    const playerIds = Array.from(room.players.keys());
    if (sw.times.size < playerIds.length) return;

    const targetMs = Math.round(sw.targetTime * 1000);
    const times = playerIds.map((id) => ({
      id,
      name: room.players.get(id)?.name || "Onbekend",
      timeMs: sw.times.get(id) ?? 0,
      diffMs: Math.abs((sw.times.get(id) ?? 0) - targetMs),
    }));

    let maxDiff = -1;
    for (const t of times) maxDiff = Math.max(maxDiff, t.diffMs);
    const worst = times.filter((t) => t.diffMs === maxDiff);
    const loser = worst[Math.floor(Math.random() * worst.length)];

    clearStopwatch(room);
    addSips(roomCode, loser.name, 5);
    io.to(roomCode).emit("stopwatchLoser", {
      loserName: loser.name,
      targetTime: sw.targetTime,
      times,
    });
  });

  const handleVote = ({ targetId } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room?.voting) {
      socket.emit("errorMessage", { message: "Er is momenteel geen stemming actief." });
      return;
    }

    const voterId = socket.id;
    if (!room.players.has(voterId)) return;
    if (!room.players.has(targetId)) {
      socket.emit("errorMessage", { message: "Ongeldige stem." });
      return;
    }

    room.voting.votes.set(voterId, targetId);

    const playerIds = Array.from(room.players.keys());
    if (room.voting.votes.size < playerIds.length) return;

    // Tally votes
    const counts = new Map();
    for (const id of playerIds) counts.set(id, 0);
    for (const votedFor of room.voting.votes.values()) {
      counts.set(votedFor, (counts.get(votedFor) || 0) + 1);
    }

    let maxVotes = 0;
    for (const v of counts.values()) maxVotes = Math.max(maxVotes, v);

    const results = playerIds
      .map((id) => ({
        id,
        name: room.players.get(id)?.name || "Onbekend",
        votes: counts.get(id) || 0,
      }))
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, "nl"));

    const losers = results.filter((r) => r.votes === maxVotes && maxVotes > 0);
    const question = room.voting.question;
    clearVoting(room);

    // Sips: voting loser(s) drink 5
    for (const l of losers) addSips(roomCode, l.name, 5);
    io.to(roomCode).emit("voteResults", { question, results, losers });
  };

  // Backend supports both event names
  socket.on("castVote", handleVote);
  socket.on("submitVote", handleVote);

  socket.on("reactionClick", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    const r = room?.reaction;
    if (!room || !r) return;

    if (!room.players.has(socket.id)) return;
    if (r.clicks.has(socket.id)) return;

    r.clicks.set(socket.id, Date.now());

    const playerCount = room.players.size;
    if (r.clicks.size >= Math.max(0, playerCount - 1)) {
      // Everyone except one clicked -> end early
      if (r.timeout) clearTimeout(r.timeout);
      r.timeout = null;

      const players = getActivePlayersArray(room);
      const startedAt = r.startedAt;
      const notClicked = players.filter((p) => !r.clicks.has(p.id));
      const loser = notClicked.length
        ? notClicked[Math.floor(Math.random() * notClicked.length)]
        : players[Math.floor(Math.random() * players.length)];

      clearReaction(room);
      // Sips: reaction loser drinks 5
      addSips(roomCode, loser?.name, 5);
      io.to(roomCode).emit("reactionLoser", {
        name: loser?.name || "iemand",
        durationMs: Math.max(0, Date.now() - startedAt),
      });
    }
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const wasHost = room.hostId === socket.id;
    const wasKing = room.currentKingId === socket.id;
    const player = room.players.get(socket.id);
    room.players.delete(socket.id);

    if (player) {
      socket.to(roomCode).emit("playerLeft", { id: socket.id, name: player.name });
    }

    // If a minigame is running, it may need to complete with fewer players
    if (room.voting) {
      room.voting.votes.delete(socket.id);
      const remainingIds = Array.from(room.players.keys());
      if (room.voting.votes.size >= remainingIds.length && remainingIds.length > 0) {
        // Force completion by reusing castVote tally logic: compute and emit now.
        const counts = new Map();
        for (const id of remainingIds) counts.set(id, 0);
        for (const votedFor of room.voting.votes.values()) {
          if (!counts.has(votedFor)) continue;
          counts.set(votedFor, (counts.get(votedFor) || 0) + 1);
        }

        let maxVotes = 0;
        for (const v of counts.values()) maxVotes = Math.max(maxVotes, v);

        const results = remainingIds
          .map((id) => ({
            id,
            name: room.players.get(id)?.name || "Onbekend",
            votes: counts.get(id) || 0,
          }))
          .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, "nl"));

        const losers = results.filter((r) => r.votes === maxVotes && maxVotes > 0);
        const question = room.voting.question;
        clearVoting(room);
        // Sips: voting loser(s) drink 5
        for (const l of losers) addSips(roomCode, l.name, 5);
        io.to(roomCode).emit("voteResults", { question, results, losers });
      }
    }

    if (room.dilemma) {
      room.dilemma.votes.delete(socket.id);
      const remainingIds = Array.from(room.players.keys());
      if (room.dilemma.votes.size >= remainingIds.length && remainingIds.length > 0) {
        // Finalize dilemma with remaining players
        let countA = 0;
        let countB = 0;
        for (const v of room.dilemma.votes.values()) {
          if (v === "A") countA++;
          if (v === "B") countB++;
        }

        let minorityChoice = null;
        if (countA !== countB) minorityChoice = countA < countB ? "A" : "B";

        const minorityIds =
          minorityChoice === null
            ? []
            : remainingIds.filter((id) => room.dilemma.votes.get(id) === minorityChoice);

        const losers = minorityIds.map((id) => ({
          id,
          name: room.players.get(id)?.name || "Onbekend",
        }));

        if (losers.length > 0) for (const p of losers) addSips(roomCode, p.name, 5);

        const payload = {
          question: room.dilemma.question,
          optionA: room.dilemma.optionA,
          optionB: room.dilemma.optionB,
          countA,
          countB,
          minority: minorityChoice,
          losers,
        };

        clearDilemma(room);
        io.to(roomCode).emit("dilemmaResults", payload);
      }
    }

    if (room.fastFingers) {
      room.fastFingers.counts.delete(socket.id);
      room.fastFingers.finishedAt.delete(socket.id);
      if (room.players.size <= 1) {
        clearFastFingers(room);
      }
    }

    if (room.stopwatch) {
      room.stopwatch.times.delete(socket.id);
      if (room.players.size <= 1) {
        clearStopwatch(room);
      }
    }

    if (room.reaction) {
      room.reaction.clicks.delete(socket.id);
      // If only 0-1 players remain, end the reaction game
      if (room.players.size <= 1) {
        clearReaction(room);
      }
    }

    if (wasKing) {
      room.currentKingId = null;
      room.activeRule = "Geen";
      io.to(roomCode).emit("newKingAnnounced", { name: null, kingId: null });
      io.to(roomCode).emit("ruleUpdated", { rule: room.activeRule });
    }

    if (wasHost) {
      const nextHostId = room.players.keys().next().value || null;
      room.hostId = nextHostId;
      emitRoomPlayers(roomCode);
    }

    if (room.players.size === 0) {
      clearVoting(room);
      clearReaction(room);
      rooms.delete(roomCode);
      return;
    }

    emitRoomPlayers(roomCode);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Proost! server luistert op http://localhost:${PORT}`);
});

