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
//     tugOfWar: null | { scoreRed: number, scoreBlue: number, teams: Map<socketId, "red"|"blue">, lastBroadcast: number, throttleTimer: NodeJS.Timeout | null },
//     higherLower: null | { startNumber: number, votes: Map<socketId, "higher" | "lower"> },
//     spotOdd: null | { oddIndex: number, commonEmoji: string, oddEmoji: string },
//     reaction: null | { startedAt: number, clicks: Map<playerId, number>, timeout: NodeJS.Timeout },
//     redLight: null | { goEmitted: boolean, waitTimer: NodeJS.Timeout | null, penalized: Set<playerId> },
//     simonSays: null | { sequence: string[], participants: { id, name }[], completed: Set<id>, failed: Set<id> },
//     auction: null | { item: string, content: string, order: string[], turnIndex: number, bidsCount: Map<playerId, number>, highestAmount: number, leaderId: null | playerId, leaderName: null | string, endsAt: number, endTimer: NodeJS.Timeout | null },
//     introCountdownTimer: null | NodeJS.Timeout
//   }
// >
const rooms = new Map();

/** Aftelling vóór stopwatch / touwtrekken (client toont 3–2–1–GO). */
const MINIGAME_COUNTDOWN_MS = 3000;

/** Willekeurige “extreme” strafregel bij start van een veiling (content op de kaart). */
/** Items die je via de veiling mag winnen om uit te delen (geen strafkaarten). */
const AUCTION_ITEMS = [
  "Heksendrankje (eigen brouwsel)",
  "Liter",
  "Vleerbuis",
  "Dubbelloopsje",
  "Pitcher Water",
  "7 Koprollen, daarna 1 bak",
];

const AUCTION_ROUND_MS = 20000;

/** [meest voorkomend, uitzondering] — spot-the-odd */
const SPOT_ODD_EMOJI_PAIRS = [
  ["🍎", "🍏"],
  ["🦁", "🐯"],
  ["🍺", "🍷"],
  ["🏐", "⚽"],
  ["🍦", "🍧"],
];

const opdrachten = [
  // --- STANDAARD & GRAPPIG ---
  { type: "text", content: "Iedereen die vanavond al naar de wc is geweest, neemt 2 slokken.", sipCount: 2 },
  {
    type: "text",
    content:
      "T-Rex armpjes! Iedereen moet zijn ellebogen in zijn zij houden tot de volgende kaart. Vergeten = 1 slok.",
    sipCount: 1,
  },
  { type: "text", content: "De speler met de minste batterij op zijn telefoon neemt 4 slokken.", sipCount: 4 },
  { type: "text", content: "Iedereen die kleiner is dan de host, drinkt 2 slokken.", sipCount: 2 },

  // --- SPECIFIEK & WEIRD ---
  {
    type: "text",
    content:
      "{player} moet een bizar slecht dansje doen (bijv. de Macarena uit de maat of de robot) en tijdens het dansen 3 slokken nemen.",
    sipCount: 3,
  },
  {
    type: "text",
    sipCount: 3,
    content:
      "{player} moet de volgende 3 slokken nemen terwijl hij/zij op één been staat en met de andere voet in zijn/haar mond probeert te krabben.",
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
    sipCount: 2,
  },
  { type: "text", content: "Wissel een kledingstuk met de persoon tegenover je, of neem 4 slokken.", sipCount: 4 },
  {
    type: "text",
    content: "{player} moet de elleboog van de persoon links van zich likken. Weigeren = een atje.",
    sipCount: 10,
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
    sipCount: 5,
  },
  {
    type: "text",
    content:
      "{player} moet 1 minuut lang planken. Zakt hij/zij in voordat de tijd om is? Dan moet {player} 3 slokken nemen.",
    sipCount: 3,
  },
  {
    type: "text",
    sipCount: 3,
    content:
      "{player} moet op handen en voeten gaan zitten en 10 seconden lang blaffen terwijl zijn/haar buur hem/haar een paar slokjes voert, good boy/girl!",
  },
  {
    type: "text",
    content:
      "{player} moet met volle overtuiging 30 seconden lang live sportcommentaar geven op wat er nu in de kamer gebeurt — alsof het de WK-finale is. Niemand lacht? {player} neemt 2 slokken.",
    sipCount: 2,
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

  // --- STOPWATCH (doel = random 5.00–12.00s op de server) ---
  {
    type: "stopwatch",
    content: "Stop de klok zo dicht mogelijk bij het doel!",
  },

  // --- TOUWETREKKEN ---
  {
    type: "tug-of-war",
    content: "Touwtrekken! Ram op de knop om voor jouw team te winnen.",
  },

  { type: "higher-lower", content: "Hoger of Lager? Stem nu!" },
  {
    type: "spot-the-odd",
    content: "Zoek de verrader! Tik als eerste op de afwijkende emoji.",
  },
  { type: "red-light", content: "Rood Licht, Groen Licht!" },
  { type: "simon-says", content: "Volg de kleuren!" },
  {
    type: "auction",
    content:
      "Bied slokken om het item te winnen. De hoogste bieder wint en mag het straks aan iemand in de groep uitschrijven — je geboden slokken tellen wel mee op je eigen score!",
  },

  // --- EXTREEM / ONGEMAKKELIJK ---
  {
    type: "text",
    content:
      "{player} moet de komende 2 minuten alles wat hij/zij zegt luidkeels zingen in de stijl van een opera. Normaal praten = direct 2 slokken.",
    sipCount: 2,
  },
  {
    type: "text",
    content:
      "{player} moet proberen zijn/haar eigen neus (of elleboog) te likken. Lukt het niet? 3 slokken. Weigeren te proberen = 5 slokken.",
    sipCount: 5,
  },
  {
    type: "text",
    content:
      "{player} moet op de grond gaan liggen en 15 seconden lang doen alsof hij/zij een spartelende vis op het droge is. Weigeren = 3 slokken.",
    sipCount: 3,
  },
  {
    type: "text",
    content:
      "{player} moet 10 keer opdrukken, terwijl de speler met de minste slokken hem/haar uitscheldt als een agressieve drillsergeant. Lukt het niet? 3 slokken.",
    sipCount: 3,
  },
  {
    type: "text",
    sipCount: 3,
    content: "{player1} en {player2} drinken 3 slokken zonder hun handen te gebruiken.",
  },
  {
    type: "text",
    content:
      "{player} laat de speler tegenover zich een magisch (en goor) brouwseltje maken van de drankjes op tafel. Neem een grote slok of neem er 3 uit je eigen glas.",
    sipCount: 3,
  },
  {
    type: "text",
    content:
      "{player} moet met zijn/haar neus de neus van de speler links aanraken en 15 seconden intens oogcontact houden zonder te lachen. Wie lacht neemt 2 slokken.",
    sipCount: 2,
  },
  {
    type: "text",
    content:
      "{player} moet de komende 3 rondes praten alsof hij/zij een uiterst serieuze nieuwslezer is. Overtreding = direct 2 slokken.",
    sipCount: 2,
  },
  {
    type: "text",
    content:
      "{player} mag zijn/haar handen niet meer gebruiken om te drinken tot de volgende kaart. Iemand anders moet het glas vasthouden. Overtreding = 2 slokken.",
    sipCount: 2,
  },
  {
    type: "text",
    content:
      "{player} moet de dichtstbijzijnde muur of deur 10 seconden lang intens en gepassioneerd zoenen. Weigeren = BAK TREKKEN!",
    sipCount: 10,
  },

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
  {
    type: "dilemma",
    question: "Zou je liever...",
    optionA: "per ongeluk een naaktfoto naar je ouders sturen",
    optionB: "per ongeluk een naaktfoto naar je werkgever/baas sturen",
  },
  {
    type: "dilemma",
    question: "Zou je liever...",
    optionA: "je volledige zoekgeschiedenis van de afgelopen 5 jaar op je Instagram story plaatsen",
    optionB:
      "iedereen hier aan tafel nu meteen je bank-app en al je afschrijvingen laten zien",
  },
  {
    type: "dilemma",
    question: "Zou je liever...",
    optionA: "je ouders betrappen terwijl zij seks hebben",
    optionB: "door je ouders betrapt worden terwijl jij seks hebt",
  },
  {
    type: "dilemma",
    question: "Zou je liever...",
    optionA:
      "de rest van je leven een partner hebben die verschrikkelijk slecht is in bed maar beeldschoon is",
    optionB:
      "de rest van je leven een partner hebben die aartslelijk is maar in bed een absolute god/godin is",
  },
  {
    type: "dilemma",
    question: "Zou je liever...",
    optionA: "elke keer als je klaarkomt de tune van het NOS journaal moeten neuriën",
    optionB: "elke keer als je lacht een heel klein beetje in je broek plassen",
  },

  // --- EXTRA WEIRD TEXT ---
  {
    type: "text",
    content: "{player} moet zijn/haar schoen als glas gebruiken voor de volgende 2 slokken.",
    sipCount: 2,
  },
  {
    type: "text",
    content:
      "Iedereen trekt een gek gezicht. {player} moet het lelijkste gezicht nadoen dat hij/zij ziet. Wie het originele gezicht had, drinkt 2 slokken uit wraak.",
    sipCount: 2,
  },
  {
    type: "text",
    content: "Staar-wedstrijd! {player} kiest iemand. De eerste die knippert drinkt 3 slokken.",
    sipCount: 3,
  },
  {
    type: "text",
    content:
      "De 'Medusa' regel: De host roept 'MEDUSA!'. Iedereen moet naar de grond kijken. Op 3 kijkt iedereen naar een andere speler. Als je oogcontact maakt met iemand, drink je beide 5 slokken.",
    sipCount: 5,
  },
  {
    type: "text",
    content:
      "{player} moet een blinddoek om (of ogen dicht) en raden wie hem/haar een tikje op de schouder geeft. Fout? 3 slokken.",
    sipCount: 3,
  },
  {
    type: "text",
    content:
      "{player} noemt 5 landen in 10 seconden. Lukt het niet? 3 slokken.",
    sipCount: 3,
  },
  {
    type: "text",
    content:
      "{player} moet een compleet liedje zingen van begin tot eind. Stopt hij/zij eerder of met de verkeerde songtekst? 5 slokken.",
    sipCount: 5,
  },
  {
    type: "text",
    content:
      "{player} mag 2 minuten lang niet lachen. Elke keer dat het misgaat, neemt hij/zij 2 extra slokken.",
    sipCount: 2,
  },
  {
    type: "text",
    content:
      "{player} praat de komende 3 beurten met een accent naar keuze. Vergeet hij/zij het? Direct 2 slokken per overtreding.",
    sipCount: 2,
  },
  {
    type: "text",
    content:
      "{player} vertelt zijn/haar meest gênante dronken verhaal. De groep stemt of het geloofwaardig is. Bij \"niet geloofwaardig\", 5 slokken.",
    sipCount: 5,
  },
  {
    type: "text",
    content:
      "{player} wisselt kleding met de persoon links van hem/haar voor de komende ronde. Weigeren kost 4 slokken.",
    sipCount: 4,
  },
  {
    type: "text",
    content:
      "{player} doet de worm. Weigeren is niet meer meespelen (of een hele bak trekken).",
  },
  {
    type: "text",
    content:
      "Iedereen doet mee aan een limbo, behalve {player} (die mag ook niet toekijken). Wie als eerste afvalt drinkt 5 slokken, de winnaar deelt 3 slokken uit aan wie hij/zij wil.",
  },

  // --- KONING ---
  {
    type: "king",
    content: "JIJ BENT DE KONING! Verzin een regel die tot de volgende koning geldt.",
  },
];

/** Alias: het volledige deck (zelfde array als opdrachten). */
const gameCards = opdrachten;

const INTERACTIVE_TYPES = new Set([
  "vote",
  "reaction",
  "fast-fingers",
  "stopwatch",
  "tug-of-war",
  "higher-lower",
  "spot-the-odd",
  "red-light",
  "simon-says",
  "auction",
]);

/** Alleen deze minigames in de gewogen random-deal; elk exact 1/6 binnen de interactieve categorie. */
const WEIGHTED_INTERACTIVE_MINIGAMES = [
  "tug-of-war",
  "stopwatch",
  "spot-the-odd",
  "red-light",
  "simon-says",
  "auction",
];

const INTERACTIVE_GAME_TITLES = {
  vote: "Stemronde",
  reaction: "Reflex!",
  "fast-fingers": "Fast Fingers",
  stopwatch: "Stopwatch",
  "tug-of-war": "Touwtrekken",
  "higher-lower": "Hoger of Lager",
  "spot-the-odd": "Spot the Odd",
  "red-light": "Rood licht, groen licht",
  "simon-says": "Simon Says",
  auction: "De veiling",
};

const DILEMMA_MINORITY_SIPS = 2;
const VOTE_MAX_SIPS = 5;
const VOTE_MINORITY_VOTER_SIPS = 2;

/** Inzetregeltekst voor interactieve spellen (countdown + start-events). */
function stakesTextForGameKey(gameKey) {
  if (gameKey === "dilemma") return "Inzet: 2 slokken";
  if (gameKey === "spot-the-odd" || gameKey === "auction") return "Inzet: Uitdelen!";
  return "Inzet: 5 slokken";
}

function finalizeDilemma(io, roomCode, room, playerIds) {
  const d = room.dilemma;
  if (!d) return;

  const { question, optionA, optionB } = d;

  let countA = 0;
  let countB = 0;
  for (const v of d.votes.values()) {
    if (v === "A") countA++;
    if (v === "B") countB++;
  }

  let minorityChoice = null;
  if (countA !== countB) minorityChoice = countA < countB ? "A" : "B";

  const minorityIds =
    minorityChoice === null
      ? []
      : playerIds.filter((id) => d.votes.get(id) === minorityChoice);

  const minorityPlayers = minorityIds.map((id) => ({
    id,
    name: room.players.get(id)?.name || "Onbekend",
  }));

  for (const id of minorityIds) {
    const p = room.players.get(id);
    if (p) room.players.set(id, { ...p, sips: (p.sips || 0) + DILEMMA_MINORITY_SIPS });
  }
  emitRoomPlayers(roomCode);

  clearDilemma(room);
  io.to(roomCode).emit("dilemmaResults", {
    question,
    optionA,
    optionB,
    countA,
    countB,
    minority: minorityChoice,
    losers: minorityPlayers,
    isTie: minorityChoice === null,
    majority: minorityChoice === null ? null : minorityChoice === "A" ? "B" : "A",
    sipCount: DILEMMA_MINORITY_SIPS,
  });
}

function finalizeVote(io, roomCode, room, playerIds) {
  const vState = room.voting;
  if (!vState) return;

  const counts = new Map();
  for (const id of playerIds) counts.set(id, 0);
  for (const votedFor of vState.votes.values()) {
    if (!counts.has(votedFor)) continue;
    counts.set(votedFor, (counts.get(votedFor) || 0) + 1);
  }

  let maxVotes = 0;
  let minVotes = Infinity;
  for (const c of counts.values()) {
    maxVotes = Math.max(maxVotes, c);
    minVotes = Math.min(minVotes, c);
  }

  const results = playerIds
    .map((id) => ({
      id,
      name: room.players.get(id)?.name || "Onbekend",
      votes: counts.get(id) || 0,
    }))
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, "nl"));

  const losers = results.filter((r) => r.votes === maxVotes && maxVotes > 0);
  const question = vState.question;

  const minorityTargetIds =
    minVotes < maxVotes
      ? new Set(results.filter((r) => r.votes === minVotes).map((r) => r.id))
      : new Set();

  for (const l of losers) {
    const p = room.players.get(l.id);
    if (p) room.players.set(l.id, { ...p, sips: (p.sips || 0) + VOTE_MAX_SIPS });
  }

  for (const [voterId, targetId] of vState.votes.entries()) {
    if (!minorityTargetIds.has(targetId)) continue;
    const p = room.players.get(voterId);
    if (p) room.players.set(voterId, { ...p, sips: (p.sips || 0) + VOTE_MINORITY_VOTER_SIPS });
  }

  emitRoomPlayers(roomCode);

  clearVoting(room);
  io.to(roomCode).emit("voteResults", {
    question,
    results,
    losers,
    maxVotes,
    isTie: losers.length === 0,
    sipCount: VOTE_MAX_SIPS,
  });
}

function pickRandomFromPool(pool) {
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  const textPool = gameCards.filter((c) => c.type === "text");
  if (textPool.length) return textPool[Math.floor(Math.random() * textPool.length)];
  return gameCards[Math.floor(Math.random() * gameCards.length)];
}

/**
 * Strikte gewogen loting op gehele 0–99:
 * 0–34 (35%) text, 35–59 (25%) dilemma, 60–94 (35%) interactief, 95–99 (5%) koning.
 * Interactief: uniform 1/6 over WEIGHTED_INTERACTIVE_MINIGAMES.
 */
function pickRandomCard() {
  const roll = Math.floor(Math.random() * 100);
  if (roll <= 34) {
    return pickRandomFromPool(gameCards.filter((c) => c.type === "text"));
  }
  if (roll <= 59) {
    return pickRandomFromPool(gameCards.filter((c) => c.type === "dilemma"));
  }
  if (roll <= 94) {
    const chosenType =
      WEIGHTED_INTERACTIVE_MINIGAMES[
        Math.floor(Math.random() * WEIGHTED_INTERACTIVE_MINIGAMES.length)
      ];
    return pickRandomFromPool(gameCards.filter((c) => c.type === chosenType));
  }
  return pickRandomFromPool(gameCards.filter((c) => c.type === "king"));
}

function scheduleInteractiveCountdown(io, roomCode, room, gameKey, startFn, countdownExtras = {}) {
  const title = INTERACTIVE_GAME_TITLES[gameKey] || gameKey;
  clearIntroCountdown(room);
  const stakesText =
    countdownExtras.stakesText !== undefined && countdownExtras.stakesText !== null
      ? countdownExtras.stakesText
      : stakesTextForGameKey(gameKey);
  io.to(roomCode).emit("startCountdown", {
    game: gameKey,
    gameTitle: title,
    ...countdownExtras,
    stakesText,
  });
  room.introCountdownTimer = setTimeout(() => {
    room.introCountdownTimer = null;
    const r = rooms.get(roomCode);
    if (!r) return;
    startFn(r, roomCode);
  }, MINIGAME_COUNTDOWN_MS);
}

function emitAuctionState(io, roomCode, room) {
  const a = room.auction;
  if (!a) return;
  const n = a.order.length;
  const currentId = a.order[a.turnIndex % n];
  const orderPayload = a.order.map((id) => ({
    id,
    name: room.players.get(id)?.name || "?",
    bidsUsed: a.bidsCount.get(id) || 0,
  }));
  io.to(roomCode).emit("auctionState", {
    content: a.content,
    item: a.item,
    endsAt: a.endsAt,
    order: orderPayload,
    currentPlayerId: currentId,
    highestAmount: a.highestAmount,
    leaderName: a.leaderName,
    leaderId: a.leaderId,
  });
}

function endAuction(io, roomCode, room) {
  const a = room.auction;
  if (!a) return;
  const { leaderId, leaderName, highestAmount, item, content } = a;
  if (leaderId && highestAmount > 0) {
    addSipsToPlayerId(roomCode, leaderId, highestAmount);
  }
  const payload = {
    winnerName: leaderName || "Niemand",
    item: item || "",
    highestAmount: highestAmount || 0,
    winnerId: leaderId,
    content: content || "",
  };
  clearAuction(room);
  io.to(roomCode).emit("auctionEnded", payload);
}

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
      tugOfWar: null,
      higherLower: null,
      spotOdd: null,
      reaction: null,
      redLight: null,
      simonSays: null,
      auction: null,
      introCountdownTimer: null,
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

function addSipsToPlayerId(roomCode, playerId, amount) {
  const room = rooms.get(roomCode);
  if (!room || !playerId) return false;
  const delta = Math.floor(Number(amount)) || 0;
  if (delta <= 0) return false;
  const p = room.players.get(playerId);
  if (!p) return false;
  room.players.set(playerId, { ...p, sips: (p.sips || 0) + delta });
  emitRoomPlayers(roomCode);
  return true;
}

/** Meerdere spelers hetzelfde aantal slokken; één keer broadcasten. */
function addSipsToPlayerIds(roomCode, playerIds, amount) {
  const room = rooms.get(roomCode);
  if (!room) return false;
  const delta = Math.floor(Number(amount)) || 0;
  if (delta <= 0) return false;
  const uniqueIds = [...new Set((playerIds || []).filter(Boolean))];
  if (!uniqueIds.length) return false;
  let updated = false;
  for (const id of uniqueIds) {
    const p = room.players.get(id);
    if (!p) continue;
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

function clearTugOfWar(room) {
  if (room.tugOfWar?.throttleTimer) clearTimeout(room.tugOfWar.throttleTimer);
  room.tugOfWar = null;
}

function clearHigherLower(room) {
  room.higherLower = null;
}

function clearSpotOdd(room) {
  room.spotOdd = null;
}

function clearRedLight(room) {
  if (room.redLight?.waitTimer) clearTimeout(room.redLight.waitTimer);
  room.redLight = null;
}

function clearSimonSays(room) {
  room.simonSays = null;
}

function simonParticipant(room, playerId) {
  const s = room?.simonSays;
  if (!s?.participants) return null;
  return s.participants.find((p) => p.id === playerId) || null;
}

function simonAllPlayersResolved(room) {
  const s = room?.simonSays;
  if (!s?.participants?.length) return false;
  for (const { id } of s.participants) {
    if (!s.completed.has(id) && !s.failed.has(id)) return false;
  }
  return true;
}

function tryFinishSimonRound(io, roomCode, room) {
  if (!room?.simonSays) return;
  if (!simonAllPlayersResolved(room)) return;
  const s = room.simonSays;
  const successes = [];
  const failures = [];
  for (const { id, name } of s.participants) {
    if (s.completed.has(id)) successes.push(name);
    else failures.push(name);
  }
  clearSimonSays(room);
  io.to(roomCode).emit("simonSaysRoundComplete", { successes, failures });
}

function clearAuction(room) {
  if (room.auction?.endTimer) {
    clearTimeout(room.auction.endTimer);
    room.auction.endTimer = null;
  }
  room.auction = null;
}

function clearIntroCountdown(room) {
  if (room.introCountdownTimer) {
    clearTimeout(room.introCountdownTimer);
    room.introCountdownTimer = null;
  }
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Twee verschillende willekeurige spelers; bij 1 speler: dezelfde tweemaal. */
function pickTwoUniqueRandomPlayers(players) {
  const list = Array.isArray(players) ? players.filter((p) => p && p.id) : [];
  if (list.length === 0) return [null, null];
  if (list.length === 1) return [list[0], list[0]];
  const shuffled = shuffleArray(list);
  return [shuffled[0], shuffled[1]];
}

function scheduleTugScoreBroadcast(roomCode, room) {
  const tug = room.tugOfWar;
  if (!tug) return;

  const emitScores = () => {
    const r = rooms.get(roomCode);
    if (!r?.tugOfWar) return;
    io.to(roomCode).emit("tugScoreUpdate", {
      scoreRed: r.tugOfWar.scoreRed,
      scoreBlue: r.tugOfWar.scoreBlue,
    });
    r.tugOfWar.lastBroadcast = Date.now();
    r.tugOfWar.throttleTimer = null;
  };

  const now = Date.now();
  if (now - tug.lastBroadcast >= 100) {
    emitScores();
    return;
  }
  if (!tug.throttleTimer) {
    tug.throttleTimer = setTimeout(emitScores, 100 - (now - tug.lastBroadcast));
  }
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

    socket.emit("joinedRoom", {
      roomCode: code,
      playerId: socket.id,
      hostId: room.hostId,
    });
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
    clearTugOfWar(room);
    clearHigherLower(room);
    clearSpotOdd(room);
    clearReaction(room);
    clearRedLight(room);
    clearSimonSays(room);
    clearAuction(room);
    clearIntroCountdown(room);

    const players = getActivePlayersArray(room);

    const card = pickRandomCard();

    if (card.type === "text") {
      let opdracht = String(card.content || "");
      const hasPlayer = opdracht.includes("{player}");
      const hasPlayer1 = opdracht.includes("{player1}");
      const hasPlayer2 = opdracht.includes("{player2}");
      const dualPlaceholders = hasPlayer1 && hasPlayer2;

      const sipCountRaw = card.sipCount;
      const sipCount =
        sipCountRaw != null && sipCountRaw !== ""
          ? Math.floor(Number(sipCountRaw))
          : null;
      const sipValid =
        sipCount != null && !Number.isNaN(sipCount) && sipCount > 0;

      let didAutoSip = false;

      if (dualPlaceholders) {
        const [p1, p2] = pickTwoUniqueRandomPlayers(players);
        opdracht = opdracht.replaceAll("{player1}", p1?.name || "iemand");
        opdracht = opdracht.replaceAll("{player2}", p2?.name || "iemand");
        if (sipValid && p1?.id && p2?.id) {
          const ids = p1.id === p2.id ? [p1.id] : [p1.id, p2.id];
          didAutoSip = addSipsToPlayerIds(roomCode, ids, sipCount);
        }
      } else {
        const randomPlayer =
          players.length > 0 ? players[Math.floor(Math.random() * players.length)] : null;
        if (hasPlayer1) {
          opdracht = opdracht.replaceAll("{player1}", randomPlayer?.name || "iemand");
        }
        if (hasPlayer2) {
          opdracht = opdracht.replaceAll("{player2}", randomPlayer?.name || "iemand");
        }
        if (hasPlayer) {
          opdracht = opdracht.replaceAll("{player}", randomPlayer?.name || "iemand");
        }
        if (sipValid && hasPlayer && randomPlayer?.id) {
          didAutoSip = addSipsToPlayerId(roomCode, randomPlayer.id, sipCount);
        }
      }

      if (opdracht.includes("{player}")) {
        const soloPick =
          players.length > 0 ? players[Math.floor(Math.random() * players.length)] : null;
        opdracht = opdracht.replaceAll("{player}", soloPick?.name || "iemand");
      }

      const payload = {
        opdracht,
        type: "text",
        stakesText: "",
        ...(didAutoSip ? { autoSipDelta: sipCount } : {}),
      };
      // Preferred event name (frontend)
      io.to(roomCode).emit("newCard", payload);
      // Backwards compatible
      io.to(roomCode).emit("card", payload);
      return;
    }

    if (card.type === "vote") {
      scheduleInteractiveCountdown(io, roomCode, room, "vote", (r, code) => {
        r.voting = { question: card.question, votes: new Map() };
        io.to(code).emit("startVoting", {
          question: card.question,
          players: getActivePlayersArray(r),
          stakesText: stakesTextForGameKey("vote"),
        });
      });
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
      io.to(roomCode).emit("startDilemma", {
        question,
        optionA,
        optionB,
        players,
        stakesText: stakesTextForGameKey("dilemma"),
      });
      return;
    }

    if (card.type === "fast-fingers") {
      scheduleInteractiveCountdown(io, roomCode, room, "fast-fingers", (r, code) => {
        const target = 15;
        const startedAt = Date.now();
        r.fastFingers = {
          target,
          startedAt,
          counts: new Map(),
          finishedAt: new Map(),
          timeout: null,
        };

        const pl = getActivePlayersArray(r);
        for (const p of pl) r.fastFingers.counts.set(p.id, 0);

        const finish = (reason) => {
          const live = rooms.get(code);
          const ff = live?.fastFingers;
          if (!ff) return;

          const playersNow = getActivePlayersArray(live);
          const ids = playersNow.map((p) => p.id);
          if (ids.length === 0) {
            clearFastFingers(live);
            return;
          }

          let loserId = null;

          if (reason === "early") {
            const notFinished = ids.filter((id) => !ff.finishedAt.has(id));
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
          }

          if (!loserId) {
            let min = Infinity;
            for (const id of ids) {
              const c = ff.counts.get(id) || 0;
              min = Math.min(min, c);
            }
            const lowest = ids.filter((id) => (ff.counts.get(id) || 0) === min);
            loserId = lowest[Math.floor(Math.random() * lowest.length)];
          }

          const loser = playersNow.find((p) => p.id === loserId);
          clearFastFingers(live);

          addSips(code, loser?.name, 5);
          io.to(code).emit("fastFingersLoser", { name: loser?.name || "iemand" });
        };

        r.fastFingers.timeout = setTimeout(() => finish("timeout"), 15000);
        io.to(code).emit("startFastFingers", {
          target,
          durationMs: 15000,
          content: card.content,
          stakesText: stakesTextForGameKey("fast-fingers"),
        });
      });
      return;
    }

    if (card.type === "stopwatch") {
      scheduleInteractiveCountdown(io, roomCode, room, "stopwatch", (r, code) => {
        const cents = 500 + Math.floor(Math.random() * 701);
        const targetTime = cents / 100;
        r.stopwatch = { targetTime, times: new Map() };
        io.to(code).emit("startStopwatch", {
          targetTime,
          content: card.content,
          stakesText: stakesTextForGameKey("stopwatch"),
        });
      });
      return;
    }

    if (card.type === "tug-of-war") {
      const idsNow = Array.from(room.players.keys());
      if (idsNow.length < 2) {
        socket.emit("errorMessage", { message: "Touwtrekken vereist minstens 2 spelers." });
        return;
      }

      const tugContent = card.content;
      scheduleInteractiveCountdown(io, roomCode, room, "tug-of-war", (r, code) => {
        const ids = shuffleArray(Array.from(r.players.keys()));
        if (ids.length < 2) {
          socket.emit("errorMessage", {
            message: "Touwtrekken vereist minstens 2 spelers.",
          });
          io.to(code).emit("countdownCancelled", {
            reason: "Niet genoeg spelers meer voor touwtrekken.",
          });
          return;
        }

        const teams = new Map();
        const mid = Math.ceil(ids.length / 2);
        for (let i = 0; i < ids.length; i++) {
          teams.set(ids[i], i < mid ? "red" : "blue");
        }

        r.tugOfWar = {
          scoreRed: 50,
          scoreBlue: 50,
          teams,
          lastBroadcast: 0,
          throttleTimer: null,
        };

        const teamRed = [];
        const teamBlue = [];
        for (const id of ids) {
          const p = r.players.get(id);
          const entry = { id, name: p?.name || "?" };
          if (teams.get(id) === "red") teamRed.push(entry);
          else teamBlue.push(entry);
        }

        io.to(code).emit("startTugOfWar", {
          content: tugContent,
          scoreRed: 50,
          scoreBlue: 50,
          teamRed,
          teamBlue,
          stakesText: stakesTextForGameKey("tug-of-war"),
        });
      });
      return;
    }

    if (card.type === "higher-lower") {
      scheduleInteractiveCountdown(io, roomCode, room, "higher-lower", (r, code) => {
        const startNumber = Math.floor(Math.random() * 8) + 2;
        r.higherLower = { startNumber, votes: new Map() };
        io.to(code).emit("startHigherLower", {
          startNumber,
          content: card.content,
          stakesText: stakesTextForGameKey("higher-lower"),
        });
      });
      return;
    }

    if (card.type === "spot-the-odd") {
      scheduleInteractiveCountdown(io, roomCode, room, "spot-the-odd", (r, code) => {
        const oddIndex = Math.floor(Math.random() * 16);
        const pair =
          SPOT_ODD_EMOJI_PAIRS[
            Math.floor(Math.random() * SPOT_ODD_EMOJI_PAIRS.length)
          ];
        const commonEmoji = pair[0] || "🍺";
        const oddEmoji = pair[1] || "🍷";
        r.spotOdd = { oddIndex, commonEmoji, oddEmoji };
        io.to(code).emit("startSpotOdd", {
          oddIndex,
          commonEmoji,
          oddEmoji,
          content: card.content,
          stakesText: stakesTextForGameKey("spot-the-odd"),
        });
      });
      return;
    }

    if (card.type === "reaction") {
      const startedAt = Date.now();
      room.reaction = { startedAt, clicks: new Map(), timeout: null };

      const finishReaction = () => {
        const live = rooms.get(roomCode);
        const rx = live?.reaction;
        if (!rx) return;

        const now = Date.now();
        const clickTimes = new Map(rx.clicks);
        const playersNow = getActivePlayersArray(live);
        const playerIds = playersNow.map((p) => p.id);

        const notClicked = playerIds.filter((id) => !clickTimes.has(id));
        let loserId = null;

        if (notClicked.length > 0) {
          loserId = notClicked[Math.floor(Math.random() * notClicked.length)];
        } else {
          let maxDelta = -1;
          for (const [id, t] of clickTimes.entries()) {
            const delta = Math.max(0, t - startedAt);
            if (delta > maxDelta) {
              maxDelta = delta;
              loserId = id;
            }
          }
        }

        const loser = playersNow.find((p) => p.id === loserId);
        clearReaction(live);

        addSips(roomCode, loser?.name, 5);
        io.to(roomCode).emit("reactionLoser", {
          name: loser?.name || "iemand",
          durationMs: Math.max(0, now - startedAt),
        });
      };

      room.reaction.timeout = setTimeout(finishReaction, 5000);
      io.to(roomCode).emit("startReaction", {
        durationMs: 5000,
        players: getActivePlayersArray(room),
        stakesText: stakesTextForGameKey("reaction"),
      });
      return;
    }

    if (card.type === "red-light") {
      scheduleInteractiveCountdown(io, roomCode, room, "red-light", (r, code) => {
        clearRedLight(r);
        const waitMs = 2000 + Math.floor(Math.random() * 6000);
        r.redLight = {
          goEmitted: false,
          penalized: new Set(),
          waitTimer: setTimeout(() => {
            const live = rooms.get(code);
            if (!live?.redLight) return;
            live.redLight.goEmitted = true;
            live.redLight.waitTimer = null;
            io.to(code).emit("redLightGreen", {});
          }, waitMs),
        };
        io.to(code).emit("startRedLight", {
          content: card.content,
          waitMs,
          stakesText: stakesTextForGameKey("red-light"),
        });
      });
      return;
    }

    if (card.type === "simon-says") {
      const palette = ["red", "green", "blue", "yellow"];
      const sequence = [];
      for (let i = 0; i < 6; i++) {
        sequence.push(palette[Math.floor(Math.random() * palette.length)]);
      }
      scheduleInteractiveCountdown(io, roomCode, room, "simon-says", (r, c) => {
        const participants = Array.from(r.players.keys()).map((id) => ({
          id,
          name: r.players.get(id)?.name || "?",
        }));
        if (participants.length === 0) {
          io.to(c).emit("countdownCancelled", { reason: "Geen spelers voor Simon Says." });
          return;
        }
        r.simonSays = {
          sequence,
          participants,
          completed: new Set(),
          failed: new Set(),
        };
        io.to(c).emit("startSimonSays", {
          sequence,
          content: card.content,
          stakesText: stakesTextForGameKey("simon-says"),
        });
      });
      return;
    }

    if (card.type === "auction") {
      const item = AUCTION_ITEMS[Math.floor(Math.random() * AUCTION_ITEMS.length)];
      scheduleInteractiveCountdown(
        io,
        roomCode,
        room,
        "auction",
        (r, code) => {
          const ids = shuffleArray(Array.from(r.players.keys()));
          if (ids.length === 0) {
            io.to(code).emit("countdownCancelled", { reason: "Geen spelers voor de veiling." });
            return;
          }
          const intro = String(card.content || "").trim();
          const endsAt = Date.now() + AUCTION_ROUND_MS;
          r.auction = {
            item,
            content: intro,
            order: ids,
            turnIndex: 0,
            bidsCount: new Map(),
            highestAmount: 0,
            leaderId: null,
            leaderName: null,
            endsAt,
            endTimer: null,
          };
          for (const id of ids) r.auction.bidsCount.set(id, 0);
          r.auction.endTimer = setTimeout(() => {
            const live = rooms.get(code);
            if (!live?.auction) return;
            endAuction(io, code, live);
          }, AUCTION_ROUND_MS);
          emitAuctionState(io, code, r);
        },
        { auctionItem: item },
      );
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

  socket.on("redLightClick", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    const rl = room?.redLight;
    if (!room || !rl) return;
    const playerId = socket.id;
    if (!room.players.has(playerId)) return;
    if (rl.goEmitted) return;
    if (rl.penalized.has(playerId)) return;
    rl.penalized.add(playerId);
    const name = room.players.get(playerId)?.name || "iemand";
    addSips(roomCode, name, 3);
    io.to(roomCode).emit("redLightEarlyPenalty", { name });
  });

  socket.on("simonSaysFail", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    const s = room?.simonSays;
    if (!room || !s) return;
    const pid = socket.id;
    if (!room.players.has(pid)) return;
    if (!simonParticipant(room, pid)) return;
    if (s.completed.has(pid) || s.failed.has(pid)) return;

    const name = room.players.get(pid)?.name || "iemand";
    addSips(roomCode, name, 3);
    s.failed.add(pid);
    io.to(roomCode).emit("simonSaysPlayerOut", {
      playerId: pid,
      playerName: name,
      outcome: "fail",
      sips: 3,
    });
    tryFinishSimonRound(io, roomCode, room);
  });

  socket.on("simonSaysSuccess", ({ sequence } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    const s = room?.simonSays;
    if (!room || !s) return;
    const pid = socket.id;
    if (!room.players.has(pid)) return;
    if (!simonParticipant(room, pid)) return;
    if (s.completed.has(pid) || s.failed.has(pid)) return;

    const expected = s.sequence;
    if (!Array.isArray(expected) || !Array.isArray(sequence)) return;
    if (sequence.length !== expected.length) return;
    for (let i = 0; i < expected.length; i += 1) {
      if (sequence[i] !== expected[i]) return;
    }

    const name = room.players.get(pid)?.name || "iemand";
    s.completed.add(pid);
    io.to(roomCode).emit("simonSaysPlayerOut", {
      playerId: pid,
      playerName: name,
      outcome: "success",
    });
    tryFinishSimonRound(io, roomCode, room);
  });

  socket.on("auctionBid", ({ amount } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    const a = room?.auction;
    if (!room || !a) return;
    const pid = socket.id;
    if (!room.players.has(pid)) return;

    const n = a.order.length;
    const expected = a.order[a.turnIndex % n];
    if (expected !== pid) {
      socket.emit("errorMessage", { message: "Niet jouw beurt om te bieden." });
      return;
    }

    const used = a.bidsCount.get(pid) || 0;
    if (used >= 2) {
      socket.emit("errorMessage", { message: "Je mag maximaal 2 keer bieden." });
      return;
    }

    const bid = Math.floor(Number(amount));
    if (!Number.isFinite(bid) || bid < 1 || bid <= a.highestAmount) {
      socket.emit("errorMessage", {
        message: "Ongeldig bod: moet hoger zijn dan het huidige hoogste bod (min. 1).",
      });
      return;
    }

    a.bidsCount.set(pid, used + 1);
    a.highestAmount = bid;
    a.leaderId = pid;
    a.leaderName = room.players.get(pid)?.name || "?";
    a.turnIndex = (a.turnIndex + 1) % n;

    io.to(roomCode).emit("auctionUpdate", {
      highestAmount: a.highestAmount,
      leaderName: a.leaderName,
      leaderId: a.leaderId,
      lastBidder: room.players.get(pid)?.name,
      lastBid: bid,
    });
    emitAuctionState(io, roomCode, room);
  });

  socket.on("auctionPass", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    const a = room?.auction;
    if (!room || !a) return;
    const pid = socket.id;
    if (!room.players.has(pid)) return;

    const n = a.order.length;
    if (a.order[a.turnIndex % n] !== pid) {
      socket.emit("errorMessage", { message: "Niet jouw beurt." });
      return;
    }

    a.turnIndex = (a.turnIndex + 1) % n;
    emitAuctionState(io, roomCode, room);
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

    finalizeDilemma(io, roomCode, room, playerIds);
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

  socket.on("tugClick", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    const tug = room?.tugOfWar;
    if (!room || !tug) return;

    const playerId = socket.id;
    if (!room.players.has(playerId)) return;

    const team = tug.teams.get(playerId);
    if (!team) return;

    if (team === "red") {
      tug.scoreRed = Math.min(100, tug.scoreRed + 1);
      tug.scoreBlue = Math.max(0, tug.scoreBlue - 1);
    } else {
      tug.scoreBlue = Math.min(100, tug.scoreBlue + 1);
      tug.scoreRed = Math.max(0, tug.scoreRed - 1);
    }

    let winner = null;
    if (tug.scoreRed >= 100 || tug.scoreBlue <= 0) winner = "red";
    else if (tug.scoreBlue >= 100 || tug.scoreRed <= 0) winner = "blue";

    if (winner) {
      if (tug.throttleTimer) {
        clearTimeout(tug.throttleTimer);
        tug.throttleTimer = null;
      }
      io.to(roomCode).emit("tugScoreUpdate", { scoreRed: tug.scoreRed, scoreBlue: tug.scoreBlue });

      const loserTeam = winner === "red" ? "blue" : "red";
      for (const [id, t] of tug.teams.entries()) {
        if (t !== loserTeam) continue;
        const name = room.players.get(id)?.name;
        if (name) addSips(roomCode, name, 3);
      }

      io.to(roomCode).emit("tugWinner", {
        winner,
        scoreRed: tug.scoreRed,
        scoreBlue: tug.scoreBlue,
      });
      clearTugOfWar(room);
      return;
    }

    scheduleTugScoreBroadcast(roomCode, room);
  });

  function maybeFinishHigherLower(roomCode, room) {
    const hl = room.higherLower;
    if (!hl) return;

    const playerIds = Array.from(room.players.keys());
    if (hl.votes.size < playerIds.length) return;

    const first = hl.startNumber;
    const second = Math.floor(Math.random() * 8) + 2;
    const tie = second === first;

    const results = playerIds.map((id) => {
      const vote = hl.votes.get(id);
      const v = vote === "higher" || vote === "lower" ? vote : null;
      let correct = false;
      if (tie) correct = false;
      else if (second > first) correct = v === "higher";
      else correct = v === "lower";
      return {
        id,
        name: room.players.get(id)?.name || "Onbekend",
        vote: v,
        correct,
      };
    });

    const losers = results.filter((r) => !r.correct);
    for (const l of losers) {
      if (l.name) addSips(roomCode, l.name, 3);
    }

    const correctVote = tie ? null : second > first ? "higher" : "lower";

    clearHigherLower(room);

    io.to(roomCode).emit("higherLowerResult", {
      startNumber: first,
      firstNumber: first,
      secondNumber: second,
      tie,
      correctVote,
      results,
      losers: losers.map((l) => l.name).filter(Boolean),
    });
  }

  socket.on("voteHigher", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    const hl = room?.higherLower;
    if (!room || !hl) {
      socket.emit("errorMessage", { message: "Er is geen Hoger/Lager-rondje actief." });
      return;
    }

    if (!room.players.has(socket.id)) return;
    hl.votes.set(socket.id, "higher");
    maybeFinishHigherLower(roomCode, room);
  });

  socket.on("voteLower", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    const hl = room?.higherLower;
    if (!room || !hl) {
      socket.emit("errorMessage", { message: "Er is geen Hoger/Lager-rondje actief." });
      return;
    }

    if (!room.players.has(socket.id)) return;
    hl.votes.set(socket.id, "lower");
    maybeFinishHigherLower(roomCode, room);
  });

  socket.on("foundOdd", ({ index } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    const so = room?.spotOdd;
    if (!room || !so) return;

    if (!room.players.has(socket.id)) return;

    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i > 15 || i !== so.oddIndex) return;

    const winnerName = room.players.get(socket.id)?.name || "Onbekend";
    clearSpotOdd(room);

    io.to(roomCode).emit("spotOddResult", {
      winnerName,
      winnerId: socket.id,
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

    finalizeVote(io, roomCode, room, playerIds);
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

    if (room.simonSays && player && simonParticipant(room, socket.id)) {
      const s = room.simonSays;
      const pid = socket.id;
      if (!s.completed.has(pid) && !s.failed.has(pid)) {
        s.failed.add(pid);
        io.to(roomCode).emit("simonSaysPlayerOut", {
          playerId: pid,
          playerName: player.name,
          outcome: "left",
        });
        tryFinishSimonRound(io, roomCode, room);
      }
    }

    room.players.delete(socket.id);

    if (player) {
      socket.to(roomCode).emit("playerLeft", { id: socket.id, name: player.name });
    }

    // If a minigame is running, it may need to complete with fewer players
    if (room.voting) {
      room.voting.votes.delete(socket.id);
      const remainingIds = Array.from(room.players.keys());
      if (room.voting.votes.size >= remainingIds.length && remainingIds.length > 0) {
        finalizeVote(io, roomCode, room, remainingIds);
      }
    }

    if (room.dilemma) {
      room.dilemma.votes.delete(socket.id);
      const remainingIds = Array.from(room.players.keys());
      if (room.dilemma.votes.size >= remainingIds.length && remainingIds.length > 0) {
        finalizeDilemma(io, roomCode, room, remainingIds);
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

    if (room.tugOfWar) {
      clearTugOfWar(room);
    }

    if (room.higherLower) {
      clearHigherLower(room);
    }

    if (room.spotOdd) {
      clearSpotOdd(room);
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

    if (room.introCountdownTimer) {
      clearIntroCountdown(room);
      io.to(roomCode).emit("countdownCancelled", {});
    }

    if (room.players.size === 0) {
      clearVoting(room);
      clearDilemma(room);
      clearFastFingers(room);
      clearStopwatch(room);
      clearTugOfWar(room);
      clearHigherLower(room);
      clearSpotOdd(room);
      clearReaction(room);
      clearRedLight(room);
      clearSimonSays(room);
      clearAuction(room);
      clearIntroCountdown(room);
      rooms.delete(roomCode);
      return;
    }

    emitRoomPlayers(roomCode);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});

