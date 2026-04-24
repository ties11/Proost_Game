const els = {
  statusText: document.getElementById("statusText"),

  loginScreen: document.getElementById("loginScreen"),
  gameScreen: document.getElementById("gameScreen"),

  roomCodeInput: document.getElementById("roomCodeInput"),
  playerNameInput: document.getElementById("playerNameInput"),
  joinBtn: document.getElementById("joinBtn"),
  loginError: document.getElementById("loginError"),

  cardSection: document.getElementById("card-section"),
  currentCard: document.getElementById("current-card"),
  stakesBadge: document.getElementById("stakes-badge"),
  stakesBadgeText: document.getElementById("stakes-badge-text"),
  stakesBadgeCountdown: document.getElementById("stakes-badge-countdown"),
  stakesBadgeCountdownText: document.getElementById("stakes-badge-countdown-text"),
  roomPill: document.getElementById("roomPill"),
  playersList: document.getElementById("playersList"),
  opdrachtText: document.getElementById("opdrachtText"),
  pollResultWrap: document.getElementById("pollResultWrap"),
  nextBtn: document.getElementById("nextBtn"),
  gameError: document.getElementById("gameError"),

  leaderboardList: document.getElementById("leaderboardList"),
  toast: document.getElementById("toast"),
  confetti: document.getElementById("confetti"),

  kingStatus: document.getElementById("king-status"),
  kingStatusLine: document.getElementById("kingStatusLine"),
  kingModal: document.getElementById("kingModal"),
  ruleInput: document.getElementById("ruleInput"),
  setRuleBtn: document.getElementById("setRuleBtn"),
  closeKingModalBtn: document.getElementById("closeKingModalBtn"),

  votingSection: document.getElementById("voting-section"),
  voteQuestion: document.getElementById("voteQuestion"),
  voteButtons: document.getElementById("voteButtons"),
  voteStatus: document.getElementById("voteStatus"),

  reactionSection: document.getElementById("reaction-section"),
  reactionBtn: document.getElementById("reactionBtn"),
  reactionStatus: document.getElementById("reactionStatus"),

  fastFingersSection: document.getElementById("fast-fingers-section"),
  fastFingersBtn: document.getElementById("fastFingersBtn"),
  fastFingersCount: document.getElementById("fastFingersCount"),
  fastFingersStatus: document.getElementById("fastFingersStatus"),

  stopwatchSection: document.getElementById("stopwatch-section"),
  stopwatchTarget: document.getElementById("stopwatchTarget"),
  stopwatchDisplay: document.getElementById("stopwatchDisplay"),
  stopwatchBtn: document.getElementById("stopwatchBtn"),
  stopwatchStatus: document.getElementById("stopwatchStatus"),

  tugSection: document.getElementById("tug-of-war-section"),
  tugContent: document.getElementById("tugContent"),
  tugBarRed: document.getElementById("tugBarRed"),
  tugBarBlue: document.getElementById("tugBarBlue"),
  tugScoreRed: document.getElementById("tugScoreRed"),
  tugScoreBlue: document.getElementById("tugScoreBlue"),
  tugBtn: document.getElementById("tugBtn"),
  tugStatus: document.getElementById("tugStatus"),

  hlSection: document.getElementById("higher-lower-section"),
  hlContent: document.getElementById("hlContent"),
  hlBigNumber: document.getElementById("hlBigNumber"),
  hlOutcome: document.getElementById("hlOutcome"),
  hlHigherBtn: document.getElementById("hlHigherBtn"),
  hlLowerBtn: document.getElementById("hlLowerBtn"),
  hlHlStatus: document.getElementById("hlHlStatus"),

  spotOddSection: document.getElementById("spot-odd-section"),
  spotOddIntro: document.getElementById("spotOddIntro"),
  spotOddGrid: document.getElementById("spotOddGrid"),
  spotOddOutcome: document.getElementById("spotOddOutcome"),
  spotOddBlock: document.getElementById("spotOddBlock"),
  spotOddBlockInner: document.getElementById("spotOddBlockInner"),

  redLightSection: document.getElementById("red-light-section"),
  redLightIntro: document.getElementById("redLightIntro"),
  redLightStatus: document.getElementById("redLightStatus"),
  redLightBtn: document.getElementById("redLightBtn"),

  simonSaysSection: document.getElementById("simon-says-section"),
  simonIntro: document.getElementById("simonIntro"),
  simonBtnGrid: document.getElementById("simonBtnGrid"),

  auctionSection: document.getElementById("auction-section"),
  auctionCard: document.getElementById("auctionCard"),
  auctionPrize: document.getElementById("auction-prize"),
  auctionTimer: document.getElementById("auction-timer"),
  auctionResult: document.getElementById("auctionResult"),
  auctionHighValue: document.getElementById("auction-high-value"),
  auctionHighLeader: document.getElementById("auction-high-leader"),
  auctionTurn: document.getElementById("auctionTurn"),
  auctionBidRow: document.getElementById("auctionBidRow"),
  auctionPlusOneBtn: document.getElementById("auctionPlusOneBtn"),
  auctionPassBtn: document.getElementById("auctionPassBtn"),
  auctionWait: document.getElementById("auctionWait"),

  hostNextDock: document.getElementById("host-next-dock"),
  countdownOverlay: document.getElementById("countdown-overlay"),
  countdownTitle: document.getElementById("countdown-title"),
  countdownNumber: document.getElementById("countdown-number"),
  toggleScoresBtn: document.getElementById("toggle-scores-btn"),
  leaderboardModal: document.getElementById("leaderboard-modal"),
  leaderboardModalClose: document.getElementById("leaderboard-modal-close"),
};

function isLeaderboardModalOpen() {
  const m = els.leaderboardModal;
  if (!m) return false;
  return m.style.display === "flex";
}

/** Zichtbaarheid leaderboard: inline display flex | none (wint van CSS). */
function setLeaderboardModalOpen(open) {
  const m = els.leaderboardModal;
  if (!m) return;
  m.style.display = open ? "flex" : "none";
  m.setAttribute("aria-hidden", open ? "false" : "true");
}

function closeLeaderboardModal() {
  setLeaderboardModalOpen(false);
}

function openLeaderboardModal() {
  setLeaderboardModalOpen(true);
}

function toggleLeaderboardModal() {
  setLeaderboardModalOpen(!isLeaderboardModalOpen());
}

function syncHostNextDock() {
  if (!els.hostNextDock || !els.gameScreen) return;
  const show =
    state.isHost && els.nextBtn && !els.nextBtn.classList.contains("hidden");
  els.hostNextDock.classList.toggle("hidden", !show);
  els.gameScreen.classList.toggle("hasHostDock", !!show);
  els.hostNextDock.setAttribute("aria-hidden", show ? "false" : "true");
}

function setScreen(screen) {
  const isLogin = screen === "login";
  els.loginScreen.classList.toggle("hidden", !isLogin);
  els.gameScreen.classList.toggle("hidden", isLogin);
  if (isLogin) closeLeaderboardModal();
}

function showGameMode(mode) {
  // mode: "card" | "vote" | "reaction" | "fast" | "stopwatch" | "tug" | "hl" | "spotOdd" | "redLight" | "simonSays" | "auction"
  els.cardSection.classList.toggle("hidden", mode !== "card");
  els.votingSection.classList.toggle("hidden", mode !== "vote");
  els.reactionSection.classList.toggle("hidden", mode !== "reaction");
  els.fastFingersSection.classList.toggle("hidden", mode !== "fast");
  els.stopwatchSection.classList.toggle("hidden", mode !== "stopwatch");
  els.tugSection.classList.toggle("hidden", mode !== "tug");
  els.hlSection.classList.toggle("hidden", mode !== "hl");
  els.spotOddSection.classList.toggle("hidden", mode !== "spotOdd");
  els.redLightSection?.classList.toggle("hidden", mode !== "redLight");
  els.simonSaysSection?.classList.toggle("hidden", mode !== "simonSays");
  els.auctionSection?.classList.toggle("hidden", mode !== "auction");
  if (mode !== "auction") clearAuctionClockInterval();
  // Minigame/stem UI in #current-card: zelfde middenplek als tekstkaart
  els.currentCard?.classList.toggle(
    "gameCurrentCard--stackMinigame",
    mode !== "card",
  );
}

const minigameCountdownTimeouts = [];
let minigameCountdownActive = false;
let countdownTickInterval = null;

const AUCTION_PLUS_ONE_LABEL = "Bied +1 Slok";
const AUCTION_LIMIT_LABEL = "Limiet bereikt";
const AUCTION_NO_BIDS_LINE = "Niemand heeft geboden. De veiling is gesloten.";

function formatAuctionWinnerLine(winnerName, item) {
  const w = String(winnerName || "").trim() || "iemand";
  const it = String(item || "").trim() || "het item";
  return `Winnaar ${w} mag ${it} uitdelen!`;
}

function resetAuctionEndState() {
  els.auctionCard?.classList.remove("auctionCard--ended");
  if (els.auctionResult) {
    els.auctionResult.textContent = "";
    els.auctionResult.classList.add("hidden");
  }
}

let auctionLastHigh = 0;
let auctionBidClicksLocal = 0;
let auctionClockInterval = null;
const auctionUiSnapshot = {
  endsAt: 0,
  item: "",
  bidsUsed: 0,
  isMyTurn: false,
  currentBidderName: "",
};

function auctionPrizeDisplayText(item, content) {
  const it = String(item || "").trim();
  if (it) return it;
  const c = String(content || "").trim();
  if (!c) return "—";
  return c.length > 48 ? `${c.slice(0, 45).trim()}…` : c;
}

function clearAuctionClockInterval() {
  if (auctionClockInterval) {
    clearInterval(auctionClockInterval);
    auctionClockInterval = null;
  }
}

function updateAuctionTurnLine() {
  const sec =
    auctionUiSnapshot.endsAt > 0
      ? Math.max(0, Math.ceil((auctionUiSnapshot.endsAt - Date.now()) / 1000))
      : 0;
  if (els.auctionTimer) els.auctionTimer.textContent = String(sec);
  if (!els.auctionTurn) return;
  if (auctionUiSnapshot.isMyTurn) {
    els.auctionTurn.textContent = `Jij · ${auctionUiSnapshot.bidsUsed}/2 bod(en)`;
  } else if (auctionUiSnapshot.currentBidderName) {
    els.auctionTurn.textContent = `Beurt: ${auctionUiSnapshot.currentBidderName}`;
  } else {
    els.auctionTurn.textContent = "";
  }
}

function setCountdownStakesVisible(show) {
  const wrap = els.stakesBadgeCountdown;
  const label = els.stakesBadgeCountdownText;
  if (!wrap || !label) return;
  const t = String(state.currentStakesText || "").trim();
  if (show && t) {
    label.textContent = t;
    wrap.classList.remove("hidden");
  } else {
    label.textContent = "";
    wrap.classList.add("hidden");
  }
}

/** Zet inzet-label (hoofdscherm + optioneel countdown-overlay). */
function applyStakesText(raw) {
  const t = String(raw || "").trim();
  state.currentStakesText = t;
  const card = els.stakesBadge;
  const cardLabel = els.stakesBadgeText;
  if (card && cardLabel) {
    if (t) {
      cardLabel.textContent = t;
      card.classList.remove("hidden");
    } else {
      cardLabel.textContent = "";
      card.classList.add("hidden");
    }
  }
  if (els.countdownOverlay?.classList.contains("countdownOverlay--visible")) {
    setCountdownStakesVisible(true);
  }
}

function hideCountdownOverlay() {
  els.countdownOverlay?.classList.remove("countdownOverlay--visible");
  els.countdownOverlay?.setAttribute("aria-hidden", "true");
  setCountdownStakesVisible(false);
}

function showCountdownOverlay() {
  els.countdownOverlay?.classList.add("countdownOverlay--visible");
  els.countdownOverlay?.setAttribute("aria-hidden", "false");
  setCountdownStakesVisible(true);
}

function clearCountdownTickInterval() {
  if (countdownTickInterval) {
    clearInterval(countdownTickInterval);
    countdownTickInterval = null;
  }
}

function clearMinigameCountdownTimeouts() {
  for (const t of minigameCountdownTimeouts) clearTimeout(t);
  minigameCountdownTimeouts.length = 0;
  clearCountdownTickInterval();
}

function abortMinigameCountdownDisplay() {
  minigameCountdownActive = false;
  clearMinigameCountdownTimeouts();
  clearSimonHighlightTimers();
  hideCountdownOverlay();
  if (els.countdownTitle) els.countdownTitle.textContent = "";
}

function gameKeyToShowMode(gameKey) {
  const map = {
    vote: "vote",
    reaction: "reaction",
    "fast-fingers": "fast",
    stopwatch: "stopwatch",
    "tug-of-war": "tug",
    "higher-lower": "hl",
    "spot-the-odd": "spotOdd",
    "red-light": "redLight",
    "simon-says": "simonSays",
    auction: "auction",
  };
  return map[gameKey] || null;
}

function setError(targetEl, message) {
  targetEl.textContent = message ? String(message) : "";
}

function clearPollResultCard() {
  els.pollResultWrap?.classList.add("hidden");
  els.pollResultWrap?.replaceChildren();
  els.opdrachtText?.classList.remove("hidden");
}

function applyStakesFromPayload(payload = {}) {
  if (Object.prototype.hasOwnProperty.call(payload, "stakesText")) {
    applyStakesText(payload.stakesText);
  }
}

function setPlainOpdrachtWithFade(text) {
  clearPollResultCard();
  if (!els.opdrachtText) return;
  els.opdrachtText.textContent = text;
  els.opdrachtText.classList.remove("fadeIn");
  void els.opdrachtText.offsetWidth;
  els.opdrachtText.classList.add("fadeIn");
}

function formatStemLabel(n) {
  const x = Math.max(0, Math.floor(Number(n) || 0));
  return x === 1 ? "1 stem" : `${x} stemmen`;
}

function fadePollWrap() {
  const wrap = els.pollResultWrap;
  if (!wrap) return;
  wrap.classList.remove("fadeIn");
  void wrap.offsetWidth;
  wrap.classList.add("fadeIn");
}

function renderDilemmaResultsInCard(payload = {}) {
  if (!els.pollResultWrap || !els.opdrachtText) return;
  const {
    question,
    optionA,
    optionB,
    countA,
    countB,
    minority,
    losers,
    isTie,
  } = payload;

  const myId = socket.id;
  const loserIds = new Set(
    Array.isArray(losers) ? losers.map((l) => l.id).filter(Boolean) : [],
  );

  els.opdrachtText.classList.add("hidden");
  els.pollResultWrap.classList.remove("hidden");
  els.pollResultWrap.replaceChildren();

  const root = document.createElement("div");
  root.className = "pollResultInner";

  const title = document.createElement("div");
  title.className = "pollResultTitle";
  title.textContent = "De uitslag!";

  const q = document.createElement("p");
  q.className = "pollResultQuestion muted";
  q.textContent = question || "Zou je liever…";

  const optionsEl = document.createElement("div");
  optionsEl.className = "pollResultOptions pollResultOptions--dilemmaGrid";

  const makeOption = (key, letter, text, count) => {
    const isMinoritySide = !isTie && minority != null && key === minority;
    const block = document.createElement("div");
    let cls = "pollResultOption";
    if (isTie || minority == null) cls += " pollResultOption--dilemmaTie";
    else if (isMinoritySide) cls += " pollResultOption--loser";
    else cls += " pollResultOption--safe";
    if (isMinoritySide && loserIds.has(myId)) cls += " pollResultOption--youLost";
    block.className = cls;
    const head = document.createElement("div");
    head.className = "pollResultOptionHead";
    const badge = document.createElement("span");
    badge.className = "pollResultOptionBadge";
    badge.textContent = letter;
    const countEl = document.createElement("span");
    countEl.className = "pollResultOptionCount";
    countEl.textContent = formatStemLabel(count);
    head.append(badge, countEl);
    const body = document.createElement("p");
    body.className = "pollResultOptionText";
    body.textContent = text || "—";
    block.append(head, body);
    return block;
  };

  optionsEl.append(
    makeOption("A", "A", optionA, countA ?? 0),
    makeOption("B", "B", optionB, countB ?? 0),
  );

  root.append(title, q, optionsEl);
  els.pollResultWrap.appendChild(root);
  fadePollWrap();
}

function renderVoteResultsInCard(payload = {}) {
  if (!els.pollResultWrap || !els.opdrachtText) return;
  const { question, results, losers, maxVotes, isTie } = payload;

  els.opdrachtText.classList.add("hidden");
  els.pollResultWrap.classList.remove("hidden");
  els.pollResultWrap.replaceChildren();

  const loserIds = new Set((losers || []).map((l) => l.id));
  const list = Array.isArray(results) ? [...results] : [];
  list.sort(
    (a, b) =>
      (b.votes || 0) - (a.votes || 0) ||
      String(a.name || "").localeCompare(String(b.name || ""), "nl"),
  );
  const computedMaxVotes =
    maxVotes != null && Number.isFinite(Number(maxVotes))
      ? Number(maxVotes)
      : list.reduce((m, r) => Math.max(m, r.votes || 0), 0);

  const root = document.createElement("div");
  root.className = "pollResultInner";

  const title = document.createElement("div");
  title.className = "pollResultTitle";
  title.textContent = "De uitslag!";

  const q = document.createElement("p");
  q.className = "pollResultQuestion muted";
  q.textContent = question || "Stemronde";

  const optionsEl = document.createElement("div");
  optionsEl.className = "pollResultOptions pollResultOptions--vote";

  for (const row of list) {
    const isLoser = loserIds.has(row.id);
    const block = document.createElement("div");
    block.className =
      "pollResultOption pollResultOption--vote" +
      (isLoser ? " pollResultOption--loser" : "");
    const head = document.createElement("div");
    head.className = "pollResultOptionHead";
    const nameEl = document.createElement("span");
    nameEl.className = "pollResultVoteName";
    nameEl.textContent = row.name || "?";
    const countEl = document.createElement("span");
    countEl.className = "pollResultOptionCount";
    countEl.textContent = formatStemLabel(row.votes);
    head.append(nameEl, countEl);
    block.appendChild(head);
    optionsEl.appendChild(block);
  }

  const footer = document.createElement("p");
  footer.className = "pollResultFooter pollResultFooter--compact muted";
  const loserNames = (losers || []).map((l) => l.name).filter(Boolean);
  if (isTie || loserNames.length === 0) {
    footer.textContent = "Gelijkspel.";
  } else {
    footer.textContent = `Meeste stemmen: ${formatStemLabel(computedMaxVotes)}.`;
  }

  root.append(title, q, optionsEl, footer);
  els.pollResultWrap.appendChild(root);
  fadePollWrap();
}

function normalizeRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

/** Vorige 🍺-telling per speler-id; voor pulse bij stijging. */
let previousSipsById = null;

function renderPlayers(players) {
  const list = Array.isArray(players) ? players : [];
  const sorted = [...list].sort((a, b) => (b.sips || 0) - (a.sips || 0) || a.name.localeCompare(b.name, "nl"));

  const nextSipsById = {};
  for (const p of list) {
    nextSipsById[p.id] = p.sips || 0;
  }

  const increasedIds = new Set();
  if (previousSipsById) {
    for (const p of list) {
      const prev = previousSipsById[p.id];
      if (prev !== undefined && (p.sips || 0) > prev) {
        increasedIds.add(p.id);
      }
    }
  }
  previousSipsById = nextSipsById;

  // "In de kamer" chips (namen)
  els.playersList.innerHTML = "";
  for (const p of sorted) {
    const li = document.createElement("li");
    li.textContent = p.name;
    els.playersList.appendChild(li);
  }

  // Leaderboard in #leaderboard-modal (lijst blijft sync, modal mag dicht zijn)
  if (els.leaderboardList) {
    els.leaderboardList.innerHTML = "";
    for (const [idx, p] of sorted.entries()) {
      const li = document.createElement("li");

      const left = document.createElement("div");
      left.className = "leaderName";
      left.textContent = idx === 0 ? `${p.name} 👑` : p.name;

      const right = document.createElement("div");
      right.className = "leaderMeta";

      if (state.hostId && p.id === state.hostId) {
        const host = document.createElement("span");
        host.className = "hostBadge";
        host.textContent = "HOST";
        right.appendChild(host);
      }

      const sips = document.createElement("span");
      sips.className = "sips";
      sips.textContent = `🍺 ${p.sips || 0}`;

      right.appendChild(sips);

      if (state.isHost) {
        const btn = document.createElement("button");
        btn.className = "manualSipBtn";
        btn.type = "button";
        btn.textContent = "+";
        btn.title = `Geef 1 slok aan ${p.name}`;
        btn.addEventListener("click", () => {
          socket.emit("giveManualSip", { targetId: p.id, amount: 1 });
          showToast(`${p.name} heeft 1 slok gekregen!`);
        });
        right.appendChild(btn);
      }

      li.appendChild(left);
      li.appendChild(right);
      els.leaderboardList.appendChild(li);

      if (increasedIds.has(p.id)) {
        li.classList.add("leaderRowPulse");
        sips.classList.add("sipsPulse");
        setTimeout(() => {
          li.classList.remove("leaderRowPulse");
          sips.classList.remove("sipsPulse");
        }, 950);
      }
    }
  }
}

let toastTimer = null;
function showToast(message) {
  if (!els.toast) return;
  if (toastTimer) clearTimeout(toastTimer);

  els.toast.textContent = message;
  els.toast.classList.remove("toastShow");
  void els.toast.offsetWidth; // retrigger
  els.toast.classList.add("toastShow");

  toastTimer = setTimeout(() => {
    els.toast.classList.remove("toastShow");
  }, 1900);
}

let currentKingName = null;
let currentRuleText = "Geen";

function setKingStatus({ kingName, rule } = {}) {
  if (typeof kingName !== "undefined") {
    currentKingName = kingName;
  }
  if (typeof rule !== "undefined") {
    currentRuleText = rule || "Geen";
  }

  const name = currentKingName;
  const ruleText = currentRuleText || "Geen";
  const hasKing =
    name != null &&
    String(name).trim() !== "" &&
    name !== "—" &&
    name !== "Geen";

  if (els.kingStatusLine) {
    els.kingStatusLine.textContent = `👑 Koning ${name || "—"}: ${ruleText}`;
  }
  if (els.kingStatus) {
    els.kingStatus.classList.toggle("hidden", !hasKing);
  }
}

function openKingModal() {
  if (!els.kingModal) return;
  els.kingModal.classList.remove("hidden");
  if (els.ruleInput) {
    els.ruleInput.value = "";
    els.ruleInput.focus();
  }
}

function closeKingModal() {
  if (!els.kingModal) return;
  els.kingModal.classList.add("hidden");
}

function playKingSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 880;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.stop(now + 0.28);
    osc.onended = () => ctx.close?.();
  } catch {
    // ignore
  }
}

function launchConfetti() {
  if (!els.confetti) return;
  els.confetti.innerHTML = "";
  els.confetti.classList.add("on");
  const colors = ["#7c3aed", "#22c55e", "#ffd700", "#fb7185", "#60a5fa"];
  const count = 26;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confettiPiece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 120}ms`;
    piece.style.transform = `translateY(-10px) rotate(${Math.random() * 90}deg)`;
    els.confetti.appendChild(piece);
  }
  setTimeout(() => {
    els.confetti.classList.remove("on");
    els.confetti.innerHTML = "";
  }, 1400);
}

setScreen("login");
showGameMode("card");
els.statusText.textContent = "Verbinden…";

// Socket.io verbinding
const socket = io();

const state = {
  hostId: null,
  isHost: false,
  currentStakesText: "",
};

const WELCOME_HOST =
  "Jij bent de host! Klik onderaan op 'Volgende Kaart' om te beginnen.";
const WELCOME_NON_HOST = "Wachten tot de host de eerste kaart trekt…";

if (typeof MutationObserver !== "undefined" && els.nextBtn && els.hostNextDock) {
  new MutationObserver(() => syncHostNextDock()).observe(els.nextBtn, {
    attributes: true,
    attributeFilter: ["class"],
  });
}
syncHostNextDock();

socket.on("connect", () => {
  els.statusText.textContent = "Verbonden";
  // host status will be computed when updatePlayers arrives
});

socket.on("disconnect", () => {
  els.statusText.textContent = "Verbinding kwijt";
});

socket.on("errorMessage", ({ message } = {}) => {
  const msg = message || "Er ging iets mis.";
  if (!els.loginScreen.classList.contains("hidden")) setError(els.loginError, msg);
  if (!els.gameScreen.classList.contains("hidden")) setError(els.gameError, msg);
});

socket.on("joinedRoom", ({ roomCode, hostId } = {}) => {
  previousSipsById = null;
  auctionBidClicksLocal = 0;
  applyStakesText("");
  abortMinigameCountdownDisplay();
  closeLeaderboardModal();
  els.roomPill.textContent = roomCode || "—";
  setError(els.loginError, "");
  setError(els.gameError, "");
  els.voteStatus.textContent = "";
  els.reactionStatus.textContent = "";
  els.reactionBtn.disabled = false;
  els.reactionBtn.textContent = "DRUK NU!";
  setKingStatus({ kingName: "—", rule: "Geen" });
  showGameMode("card");
  setScreen("game");

  const isHostPlayer = !!hostId && socket.id === hostId;
  if (els.opdrachtText) {
    setPlainOpdrachtWithFade(isHostPlayer ? WELCOME_HOST : WELCOME_NON_HOST);
  }
});

// Server stuurt updates met huidige spelerslijst
socket.on("updatePlayers", ({ roomCode, players, hostId } = {}) => {
  if (roomCode) els.roomPill.textContent = roomCode;
  state.hostId = hostId || null;
  state.isHost = !!state.hostId && socket.id === state.hostId;
  renderPlayers(players);
  syncHostNextDock();
  // Fallback als joinedRoom geen hostId had (oude server): welkomst voor host alsnog goed zetten
  if (
    state.isHost &&
    els.opdrachtText &&
    els.opdrachtText.textContent === WELCOME_NON_HOST
  ) {
    setPlainOpdrachtWithFade(WELCOME_HOST);
  }
});

// Server stuurt nieuwe kaart/opdracht
socket.on("newCard", ({ opdracht, type, stakesText } = {}) => {
  if (type && type !== "text") return;
  if (!opdracht) return;
  resetAuctionEndState();
  abortMinigameCountdownDisplay();
  showGameMode("card");
  els.nextBtn.classList.remove("hidden");
  applyStakesFromPayload({ stakesText });
  setPlainOpdrachtWithFade(opdracht);
});

socket.on("startVoting", ({ question, players, stakesText } = {}) => {
  finishCountdownThenStart(() => {
    applyStakesFromPayload({ stakesText });
    showGameMode("vote");
    els.nextBtn.classList.add("hidden");
    setError(els.gameError, "");
    els.voteStatus.textContent = "";

    els.voteQuestion.textContent = question || "Stem!";
    els.voteButtons.innerHTML = "";

    const list = Array.isArray(players) ? players : [];
    for (const p of list) {
      const btn = document.createElement("button");
      btn.className = "voteBtn";
      btn.type = "button";
      btn.textContent = p.name;
      btn.addEventListener("click", () => {
        socket.emit("submitVote", { targetId: p.id });
        els.voteButtons.querySelectorAll("button").forEach((b) => (b.disabled = true));
        els.voteStatus.textContent = "Wachten op de rest...";
      });
      els.voteButtons.appendChild(btn);
    }
  });
});

socket.on("voteResults", (payload = {}) => {
  showGameMode("card");
  renderVoteResultsInCard(payload);
  const loserNames = Array.isArray(payload.losers)
    ? payload.losers.map((l) => l.name).filter(Boolean)
    : [];
  const sip = Math.max(1, Math.floor(Number(payload.sipCount) || 5));
  if (loserNames.length > 0) {
    const nameText =
      loserNames.length === 1 ? loserNames[0] : loserNames.join(" & ");
    showToast(`${nameText}: ${sip} slokken!`);
  }
  if (state.isHost) els.nextBtn.classList.remove("hidden");
});

// Dilemma works like voting but with 2 choices
socket.on("startDilemma", ({ question, optionA, optionB, stakesText } = {}) => {
  finishCountdownThenStart(() => {
    applyStakesFromPayload({ stakesText });
    showGameMode("vote");
    els.nextBtn.classList.add("hidden");
    setError(els.gameError, "");
    els.voteStatus.textContent = "";

    els.voteQuestion.textContent = question || "Zou je liever...";
    els.voteButtons.innerHTML = "";

    const btnA = document.createElement("button");
    btnA.className = "voteBtn";
    btnA.type = "button";
    btnA.textContent = `A: ${optionA || ""}`.trim();
    btnA.addEventListener("click", () => {
      socket.emit("submitDilemma", { choice: "A" });
      els.voteButtons.querySelectorAll("button").forEach((b) => (b.disabled = true));
      els.voteStatus.textContent = "Wachten op de rest...";
    });

    const btnB = document.createElement("button");
    btnB.className = "voteBtn";
    btnB.type = "button";
    btnB.textContent = `B: ${optionB || ""}`.trim();
    btnB.addEventListener("click", () => {
      socket.emit("submitDilemma", { choice: "B" });
      els.voteButtons.querySelectorAll("button").forEach((b) => (b.disabled = true));
      els.voteStatus.textContent = "Wachten op de rest...";
    });

    els.voteButtons.appendChild(btnA);
    els.voteButtons.appendChild(btnB);
  });
});

socket.on("dilemmaResults", (payload = {}) => {
  showGameMode("card");
  renderDilemmaResultsInCard(payload);
  const losers = Array.isArray(payload.losers) ? payload.losers : [];
  const imLoser = losers.some((l) => l && l.id === socket.id);
  const sip = Math.max(1, Math.floor(Number(payload.sipCount) || 2));
  if (imLoser) {
    showToast(`+${sip} slokken verwerkt!`);
  }
  if (state.isHost) els.nextBtn.classList.remove("hidden");
});

// Fast-fingers
let fastTarget = 15;
let fastLocalCount = 0;

socket.on("startFastFingers", ({ target, stakesText } = {}) => {
  finishCountdownThenStart(() => {
    applyStakesFromPayload({ stakesText });
    fastTarget = Math.max(1, Math.min(50, Number(target) || 15));
    fastLocalCount = 0;

    showGameMode("fast");
    els.nextBtn.classList.add("hidden");
    setError(els.gameError, "");

    if (els.fastFingersBtn) {
      els.fastFingersBtn.disabled = false;
      els.fastFingersBtn.textContent = "TIK!";
    }
    if (els.fastFingersCount) els.fastFingersCount.textContent = `${fastLocalCount}/${fastTarget}`;
    if (els.fastFingersStatus) els.fastFingersStatus.textContent = "";
  });
});

els.fastFingersBtn?.addEventListener("click", () => {
  if (fastLocalCount >= fastTarget) return;
  fastLocalCount++;
  if (els.fastFingersCount) els.fastFingersCount.textContent = `${fastLocalCount}/${fastTarget}`;
  socket.emit("fastFingersClick");

  if (fastLocalCount >= fastTarget) {
    els.fastFingersBtn.disabled = true;
    els.fastFingersBtn.textContent = "Klaar! Wachten...";
    if (els.fastFingersStatus) els.fastFingersStatus.textContent = "Wachten op de rest...";
  }
});

socket.on("fastFingersLoser", ({ name } = {}) => {
  showGameMode("card");
  const loser = name || "iemand";
  setPlainOpdrachtWithFade(`${loser} heeft de minste clicks en neemt 5 slokken!`);
  if (name) showToast(`${loser} heeft 5 slokken gekregen!`);
  if (state.isHost) els.nextBtn.classList.remove("hidden");
});

// Stopwatch
let stopwatchTargetMs = 8000;
let stopwatchStart = 0;
let stopwatchInterval = null;
let stopwatchHideTimer = null;
let stopwatchStopped = false;

function formatStopwatch(ms) {
  const s = Math.max(0, ms) / 1000;
  return s.toFixed(2);
}

function clearStopwatchTimers() {
  if (stopwatchInterval) clearInterval(stopwatchInterval);
  stopwatchInterval = null;
  if (stopwatchHideTimer) clearTimeout(stopwatchHideTimer);
  stopwatchHideTimer = null;
}

function activateStopwatchMinigame(payload = {}) {
  applyStakesFromPayload(payload);
  const { targetTime } = payload;
  stopwatchTargetMs = Math.max(1000, Math.min(30000, Number(targetTime) * 1000 || 8000));
  stopwatchStart = performance.now();
  stopwatchStopped = false;

  showGameMode("stopwatch");
  els.nextBtn.classList.add("hidden");
  setError(els.gameError, "");
  if (els.stopwatchStatus) els.stopwatchStatus.textContent = "";
  if (els.stopwatchTarget) els.stopwatchTarget.textContent = `Doel: ${(stopwatchTargetMs / 1000).toFixed(2)}s`;

  if (els.stopwatchBtn) {
    els.stopwatchBtn.disabled = false;
    els.stopwatchBtn.textContent = "STOP";
  }
  if (els.stopwatchDisplay) {
    els.stopwatchDisplay.classList.remove("stopwatchHidden");
    els.stopwatchDisplay.textContent = "0.00";
  }

  clearStopwatchTimers();
  stopwatchInterval = setInterval(() => {
    if (stopwatchStopped) return;
    const elapsed = performance.now() - stopwatchStart;
    if (els.stopwatchDisplay && !els.stopwatchDisplay.classList.contains("stopwatchHidden")) {
      els.stopwatchDisplay.textContent = formatStopwatch(elapsed);
    }
  }, 30);

  stopwatchHideTimer = setTimeout(() => {
    if (els.stopwatchDisplay) {
      els.stopwatchDisplay.classList.add("stopwatchHidden");
      els.stopwatchDisplay.textContent = "??.??";
    }
  }, 2500);
}

function finishCountdownThenStart(run) {
  clearCountdownTickInterval();
  minigameCountdownActive = false;
  clearMinigameCountdownTimeouts();
  hideCountdownOverlay();
  if (els.countdownTitle) els.countdownTitle.textContent = "";
  run();
}

socket.on("startCountdown", ({ game, gameTitle, auctionItem, stakesText } = {}) => {
  if (!game) return;
  clearPollResultCard();
  applyStakesFromPayload({ stakesText });
  if (game === "auction") auctionBidClicksLocal = 0;
  minigameCountdownActive = true;
  clearMinigameCountdownTimeouts();
  showGameMode("card");
  els.nextBtn?.classList.add("hidden");
  syncHostNextDock();
  setError(els.gameError, "");
  showCountdownOverlay();
  if (els.countdownTitle) {
    if (game === "auction" && auctionItem) {
      els.countdownTitle.textContent = `${gameTitle ? String(gameTitle) : "Veiling"}: ${auctionItem}`;
    } else {
      els.countdownTitle.textContent = gameTitle ? String(gameTitle) : "";
    }
  }
  let n = 3;
  if (els.countdownNumber) els.countdownNumber.textContent = String(n);
  countdownTickInterval = setInterval(() => {
    if (!minigameCountdownActive) {
      clearCountdownTickInterval();
      return;
    }
    n -= 1;
    if (els.countdownNumber) els.countdownNumber.textContent = String(n);
    if (n <= 0) {
      clearCountdownTickInterval();
      minigameCountdownActive = false;
      hideCountdownOverlay();
      if (els.countdownTitle) els.countdownTitle.textContent = "";
      const mode = gameKeyToShowMode(game);
      if (mode) {
        showGameMode(mode);
        els.currentCard?.classList.toggle("gameCurrentCard--stackMinigame", mode !== "card");
      }
    }
  }, 1000);
});

socket.on("countdownCancelled", ({ reason } = {}) => {
  abortMinigameCountdownDisplay();
  applyStakesText("");
  clearPollResultCard();
  showGameMode("card");
  if (reason) setError(els.gameError, String(reason));
  if (state.isHost) els.nextBtn?.classList.remove("hidden");
  syncHostNextDock();
});

socket.on("startStopwatch", (payload = {}) => {
  finishCountdownThenStart(() => activateStopwatchMinigame(payload));
});

els.stopwatchBtn?.addEventListener("click", () => {
  if (stopwatchStopped) return;
  stopwatchStopped = true;
  const elapsedMs = Math.round(performance.now() - stopwatchStart);
  socket.emit("stopTime", { elapsedMs });
  if (els.stopwatchBtn) {
    els.stopwatchBtn.disabled = true;
    els.stopwatchBtn.textContent = "Gestopt! Wachten...";
  }
  if (els.stopwatchStatus) els.stopwatchStatus.textContent = "Wachten op de rest...";
  clearStopwatchTimers();
});

socket.on("stopwatchLoser", ({ loserName, times, targetTime } = {}) => {
  abortMinigameCountdownDisplay();
  showGameMode("card");
  const name = loserName || "iemand";
  const target = typeof targetTime === "number" ? targetTime : 8;
  setPlainOpdrachtWithFade(
    `${name} had de slechtste timing (doel: ${target.toFixed(2)}s) en neemt 5 slokken!`,
  );
  showToast(`${name} heeft 5 slokken gekregen!`);

  // Optional: show a compact summary in console-like style (kept minimal in UI)
  if (Array.isArray(times) && times.length > 0) {
    const summary = times
      .map((t) => `${t.name}: ${(t.timeMs / 1000).toFixed(2)}s`)
      .join(" | ");
    if (els.gameError) els.gameError.textContent = summary;
  }

  if (state.isHost) els.nextBtn.classList.remove("hidden");
});

let tugMyTeam = null;

function updateTugBar(scoreRed, scoreBlue) {
  const r = Math.max(0, Math.min(100, Number(scoreRed) || 0));
  const b = Math.max(0, Math.min(100, Number(scoreBlue) || 0));
  if (els.tugScoreRed) els.tugScoreRed.textContent = String(r);
  if (els.tugScoreBlue) els.tugScoreBlue.textContent = String(b);
  if (els.tugBarRed) els.tugBarRed.style.flex = `${r} 1 0`;
  if (els.tugBarBlue) els.tugBarBlue.style.flex = `${b} 1 0`;
}

function activateTugOfWarMinigame(payload = {}) {
  applyStakesFromPayload(payload);
  const { content, scoreRed, scoreBlue, teamRed, teamBlue } = payload;
  const myId = socket.id;
  let team = null;
  if (Array.isArray(teamRed) && teamRed.some((p) => p.id === myId)) team = "red";
  if (Array.isArray(teamBlue) && teamBlue.some((p) => p.id === myId)) team = "blue";
  tugMyTeam = team;

  showGameMode("tug");
  els.nextBtn.classList.add("hidden");
  setError(els.gameError, "");
  if (els.tugContent) els.tugContent.textContent = content || "Touwtrekken!";
  if (els.tugStatus) els.tugStatus.textContent = team ? `Jij speelt voor team ${team === "red" ? "ROOD" : "BLAUW"}.` : "";

  updateTugBar(scoreRed ?? 50, scoreBlue ?? 50);

  if (els.tugBtn) {
    els.tugBtn.disabled = false;
    els.tugBtn.textContent = "RAM!";
    els.tugBtn.classList.remove("tugBtn--red", "tugBtn--blue");
    if (team === "red") els.tugBtn.classList.add("tugBtn--red");
    else if (team === "blue") els.tugBtn.classList.add("tugBtn--blue");
  }
}

socket.on("startTugOfWar", (payload = {}) => {
  finishCountdownThenStart(() => activateTugOfWarMinigame(payload));
});

socket.on("tugScoreUpdate", ({ scoreRed, scoreBlue } = {}) => {
  updateTugBar(scoreRed, scoreBlue);
});

socket.on("tugWinner", ({ winner, scoreRed, scoreBlue } = {}) => {
  abortMinigameCountdownDisplay();
  showGameMode("card");
  updateTugBar(scoreRed ?? 50, scoreBlue ?? 50);
  const winLabel = winner === "red" ? "ROOD" : "BLAUW";
  const loseLabel = winner === "red" ? "blauw" : "rood";
  setPlainOpdrachtWithFade(
    `Team ${winLabel} wint! (${scoreRed ?? 0}–${scoreBlue ?? 0}) Team ${loseLabel} neemt 3 slokken.`,
  );
  showToast(`Team ${loseLabel}: 3 slokken!`);
  tugMyTeam = null;
  if (state.isHost) els.nextBtn.classList.remove("hidden");
});

els.tugBtn?.addEventListener("click", () => {
  if (!tugMyTeam) return;
  socket.emit("tugClick");
});

let hlVoted = false;

let spotOddOddIndex = -1;
let spotOddCommonEmoji = "🍺";
let spotOddOddEmoji = "🍷";
let spotOddEnded = true;
let spotOddBlockTimer = null;

function clearSpotOddBlockTimer() {
  if (spotOddBlockTimer) {
    clearTimeout(spotOddBlockTimer);
    spotOddBlockTimer = null;
  }
}

function buildSpotOddGrid(oddIndex, commonEmoji, oddEmoji) {
  if (!els.spotOddGrid) return;
  const common = String(commonEmoji || "🍺");
  const odd = String(oddEmoji || "🍷");
  els.spotOddGrid.innerHTML = "";
  const o = Math.max(0, Math.min(15, oddIndex));
  for (let i = 0; i < 16; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "spotOddCell";
    b.dataset.spotIndex = String(i);
    b.textContent = i === o ? odd : common;
    b.setAttribute(
      "aria-label",
      i === o ? "Afwijkende emoji" : "Gemeenschappelijke emoji",
    );
    els.spotOddGrid.appendChild(b);
  }
}

function setSpotOddCellsDisabled(disabled) {
  els.spotOddGrid?.querySelectorAll(".spotOddCell").forEach((btn) => {
    btn.disabled = disabled;
  });
}

function resetHigherLowerUi() {
  hlVoted = false;
  els.hlOutcome.classList.add("hidden");
  els.hlOutcome.innerHTML = "";
  els.hlBigNumber.classList.remove("hlPop");
  els.hlHigherBtn.disabled = false;
  els.hlLowerBtn.disabled = false;
  els.hlHlStatus.textContent = "";
  els.hlHlStatus.classList.remove("hlWaiting");
}

socket.on("startHigherLower", ({ startNumber, content } = {}) => {
  finishCountdownThenStart(() => {
    resetHigherLowerUi();
    showGameMode("hl");
    els.nextBtn.classList.add("hidden");
    setError(els.gameError, "");
    els.hlContent.textContent =
      content || "Hoger of Lager? Stem nu!";
    els.hlBigNumber.textContent =
      startNumber != null ? String(startNumber) : "?";
  });
});

els.hlHigherBtn?.addEventListener("click", () => {
  if (hlVoted) return;
  hlVoted = true;
  socket.emit("voteHigher");
  els.hlHigherBtn.disabled = true;
  els.hlLowerBtn.disabled = true;
  els.hlHlStatus.textContent = "Wachten op de anderen…";
  els.hlHlStatus.classList.add("hlWaiting");
});

els.hlLowerBtn?.addEventListener("click", () => {
  if (hlVoted) return;
  hlVoted = true;
  socket.emit("voteLower");
  els.hlHigherBtn.disabled = true;
  els.hlLowerBtn.disabled = true;
  els.hlHlStatus.textContent = "Wachten op de anderen…";
  els.hlHlStatus.classList.add("hlWaiting");
});

socket.on("higherLowerResult", (payload = {}) => {
  const {
    startNumber,
    secondNumber,
    tie,
    losers,
    correctVote,
  } = payload;

  els.hlBigNumber.classList.remove("hlPop");
  void els.hlBigNumber.offsetWidth;
  els.hlBigNumber.textContent =
    secondNumber != null ? String(secondNumber) : "?";
  els.hlBigNumber.classList.add("hlPop");

  els.hlOutcome.classList.remove("hidden");
  const names = Array.isArray(losers) ? losers.filter(Boolean) : [];
  let msg = "";
  if (tie) {
    msg = `Gelijkspel (${startNumber}). Iedereen zat fout — 3 slokken!`;
  } else {
    const dir =
      correctVote === "higher"
        ? "hoger"
        : correctVote === "lower"
          ? "lager"
          : "";
    msg = `Het was ${secondNumber} (${dir}). `;
    if (names.length) {
      msg += `${names.join(", ")} moet${names.length > 1 ? "en" : ""} 3 slokken nemen!`;
    } else {
      msg += "Niemand hoeft extra te drinken.";
    }
  }
  els.hlOutcome.textContent = msg;

  names.forEach((n) => showToast(`${n}: 3 slokken!`));

  setTimeout(() => {
    showGameMode("card");
    setPlainOpdrachtWithFade(msg);
    if (state.isHost) els.nextBtn.classList.remove("hidden");
  }, 3200);
});

socket.on("startSpotOdd", ({ oddIndex, commonEmoji, oddEmoji, content, stakesText } = {}) => {
  finishCountdownThenStart(() => {
    applyStakesFromPayload({ stakesText });
    clearSpotOddBlockTimer();
    spotOddEnded = false;
    spotOddOddIndex =
      typeof oddIndex === "number" && Number.isInteger(oddIndex)
        ? oddIndex
        : Math.floor(Math.random() * 16);
    spotOddCommonEmoji = commonEmoji != null ? String(commonEmoji) : "🍺";
    spotOddOddEmoji = oddEmoji != null ? String(oddEmoji) : "🍷";
    showGameMode("spotOdd");
    els.nextBtn.classList.add("hidden");
    setError(els.gameError, "");
    els.spotOddIntro.textContent =
      content ||
      "Zoek de verrader! Tik als eerste op de afwijkende emoji.";
    els.spotOddOutcome.classList.add("hidden");
    els.spotOddOutcome.textContent = "";
    els.spotOddBlock.classList.add("hidden");
    els.spotOddGrid.classList.remove("isBlocked");
    if (els.spotOddBlockInner) els.spotOddBlockInner.textContent = "Fout!";
    buildSpotOddGrid(spotOddOddIndex, spotOddCommonEmoji, spotOddOddEmoji);
  });
});

els.spotOddGrid?.addEventListener("click", (e) => {
  const btn = e.target.closest(".spotOddCell");
  if (!btn || spotOddEnded) return;
  const idx = Number(btn.dataset.spotIndex);
  if (!Number.isInteger(idx)) return;

  if (idx === spotOddOddIndex) {
    spotOddEnded = true;
    setSpotOddCellsDisabled(true);
    socket.emit("foundOdd", { index: idx });
    return;
  }

  clearSpotOddBlockTimer();
  if (els.spotOddBlockInner) {
    els.spotOddBlockInner.textContent = `Fout! ${spotOddCommonEmoji}`;
  }
  els.spotOddBlock.classList.remove("hidden");
  els.spotOddGrid.classList.add("isBlocked");
  spotOddBlockTimer = setTimeout(() => {
    spotOddBlockTimer = null;
    els.spotOddBlock.classList.add("hidden");
    els.spotOddGrid.classList.remove("isBlocked");
  }, 2000);
});

socket.on("spotOddResult", ({ winnerName } = {}) => {
  clearSpotOddBlockTimer();
  spotOddEnded = true;
  els.spotOddBlock.classList.add("hidden");
  els.spotOddGrid.classList.remove("isBlocked");
  setSpotOddCellsDisabled(true);

  const name = winnerName || "iemand";
  const msg = `${name} was het snelst! Jij mag 3 slokken uitdelen aan wie je wil — zeg het hardop of wijs iemand aan.`;

  els.spotOddOutcome.textContent = msg;
  els.spotOddOutcome.classList.remove("hidden");
  els.spotOddOutcome.classList.remove("fadeIn");
  void els.spotOddOutcome.offsetWidth;
  els.spotOddOutcome.classList.add("fadeIn");
  showToast(`${name} wint — 3 slokken uitdelen!`);

  setTimeout(() => {
    showGameMode("card");
    setPlainOpdrachtWithFade(msg);
    if (state.isHost) els.nextBtn.classList.remove("hidden");
  }, 3800);
});

socket.on("startReaction", ({ stakesText } = {}) => {
  finishCountdownThenStart(() => {
    applyStakesFromPayload({ stakesText });
    showGameMode("reaction");
    els.nextBtn.classList.add("hidden");
    setError(els.gameError, "");
    els.reactionStatus.textContent = "";
    els.reactionBtn.disabled = false;
    els.reactionBtn.textContent = "DRUK NU!";
  });
});

let redLightPhase = "off";

socket.on("startRedLight", ({ content, stakesText } = {}) => {
  finishCountdownThenStart(() => {
    applyStakesFromPayload({ stakesText });
    redLightPhase = "wait";
    showGameMode("redLight");
    els.redLightSection?.classList.remove("redLightSection--go");
    els.redLightSection?.classList.add("redLightSection--wait");
    els.redLightSection?.classList.add("redLightSection--blink");
    els.nextBtn.classList.add("hidden");
    setError(els.gameError, "");
    if (els.redLightIntro) els.redLightIntro.textContent = content || "";
    if (els.redLightStatus) els.redLightStatus.textContent = "Rood licht — tik nog niet!";
    if (els.redLightBtn) {
      els.redLightBtn.disabled = false;
      els.redLightBtn.classList.remove("redLightBtn--go");
    }
  });
});

socket.on("redLightGreen", () => {
  redLightPhase = "go";
  els.redLightSection?.classList.remove("redLightSection--wait", "redLightSection--blink");
  els.redLightSection?.classList.add("redLightSection--go");
  if (els.redLightStatus) els.redLightStatus.textContent = "Groen licht!";
  if (els.redLightBtn) els.redLightBtn.classList.add("redLightBtn--go");
});

socket.on("redLightEarlyPenalty", ({ name } = {}) => {
  if (name) showToast(`${name}: 3 strafslokken (te vroeg)!`);
});

els.redLightBtn?.addEventListener("click", () => {
  socket.emit("redLightClick");
});

const simonHighlightTimers = [];
function clearSimonHighlightTimers() {
  for (const t of simonHighlightTimers) clearTimeout(t);
  simonHighlightTimers.length = 0;
  els.simonBtnGrid?.querySelectorAll(".simonColorBtn").forEach((b) => {
    b.classList.remove("active", "simonColorBtn--demo");
  });
}

function playSimonSequenceHighlight(sequence, onDone) {
  clearSimonHighlightTimers();
  const done = typeof onDone === "function" ? onDone : () => {};
  if (!els.simonBtnGrid || !Array.isArray(sequence) || sequence.length === 0) {
    done();
    return;
  }
  const byColor = {};
  els.simonBtnGrid.querySelectorAll(".simonColorBtn").forEach((btn) => {
    byColor[btn.dataset.simon] = btn;
  });
  const startDelay = 520;
  const holdMs = 520;
  const pauseBetween = 320;
  let delay = startDelay;
  for (const color of sequence) {
    const btn = byColor[color];
    if (!btn) {
      delay += holdMs + pauseBetween;
      continue;
    }
    simonHighlightTimers.push(
      setTimeout(() => {
        btn.classList.add("active", "simonColorBtn--demo");
      }, delay),
    );
    simonHighlightTimers.push(
      setTimeout(() => {
        btn.classList.remove("active", "simonColorBtn--demo");
      }, delay + holdMs),
    );
    delay += holdMs + pauseBetween;
  }
  simonHighlightTimers.push(setTimeout(done, delay + 120));
}

function setSimonGridDisabled(disabled) {
  els.simonBtnGrid?.querySelectorAll(".simonColorBtn").forEach((b) => {
    b.disabled = !!disabled;
  });
}

let simonTargetSequence = [];
let simonInputIndex = 0;
let simonAcceptingInput = false;
let simonSelfLocked = false;

socket.on("startSimonSays", ({ sequence, content, stakesText } = {}) => {
  finishCountdownThenStart(() => {
    applyStakesFromPayload({ stakesText });
    clearSimonHighlightTimers();
    simonAcceptingInput = false;
    simonSelfLocked = false;
    simonTargetSequence = [];
    simonInputIndex = 0;
    setSimonGridDisabled(true);
    showGameMode("simonSays");
    els.nextBtn.classList.add("hidden");
    setError(els.gameError, "");
    if (els.simonIntro) els.simonIntro.textContent = content || "";
    const seq = Array.isArray(sequence) ? sequence : [];
    simonTargetSequence = seq.slice();
    playSimonSequenceHighlight(seq, () => {
      simonInputIndex = 0;
      const stillOnSimon =
        els.simonSaysSection && !els.simonSaysSection.classList.contains("hidden");
      if (!simonSelfLocked && stillOnSimon) {
        simonAcceptingInput = true;
        setSimonGridDisabled(false);
      }
    });
  });
});

socket.on("simonSaysPlayerOut", ({ playerId, playerName, outcome, sips } = {}) => {
  const mine = playerId === socket.id;
  const name = playerName || "iemand";
  if (outcome === "fail") {
    const n = Math.max(1, Math.floor(Number(sips) || 3));
    if (mine) {
      simonSelfLocked = true;
      simonAcceptingInput = false;
      setSimonGridDisabled(true);
    }
    showToast(mine ? `Fout! Je neemt ${n} slokken.` : `${name} faalde — ${n} slokken.`);
  } else if (outcome === "success") {
    if (mine) {
      simonSelfLocked = true;
      simonAcceptingInput = false;
      setSimonGridDisabled(true);
    }
    showToast(
      mine
        ? "Reeks goed — je zit veilig tot de ronde klaar is."
        : `${name} heeft de reeks gehaald.`,
    );
  } else if (outcome === "left") {
    showToast(mine ? "Je bent weg uit de kamer." : `${name} is weggevallen.`);
  }
});

socket.on("simonSaysRoundComplete", ({ successes, failures } = {}) => {
  simonAcceptingInput = false;
  simonSelfLocked = false;
  simonTargetSequence = [];
  clearSimonHighlightTimers();
  setSimonGridDisabled(true);
  showGameMode("card");
  const ok = Array.isArray(successes) ? successes.filter(Boolean) : [];
  const bad = Array.isArray(failures) ? failures.filter(Boolean) : [];
  const bits = [];
  if (ok.length) bits.push(`Gehaald: ${ok.join(", ")}`);
  if (bad.length) bits.push(`Fout of weg: ${bad.join(", ")}`);
  const summary =
    bits.length > 0 ? `Simon Says klaar. ${bits.join(" · ")}.` : "Simon Says ronde afgelopen.";
  setPlainOpdrachtWithFade(summary);
  showToast("Simon Says: iedereen is klaar!");
  if (state.isHost) els.nextBtn?.classList.remove("hidden");
});

els.simonBtnGrid?.addEventListener("click", (e) => {
  const btn = e.target.closest(".simonColorBtn");
  if (!btn || !simonAcceptingInput || simonSelfLocked) return;
  const color = btn.dataset.simon;
  const expected = simonTargetSequence[simonInputIndex];
  if (color !== expected) {
    simonAcceptingInput = false;
    setSimonGridDisabled(true);
    socket.emit("simonSaysFail");
    return;
  }
  simonInputIndex += 1;
  if (simonInputIndex >= simonTargetSequence.length) {
    simonAcceptingInput = false;
    setSimonGridDisabled(true);
    socket.emit("simonSaysSuccess", { sequence: [...simonTargetSequence] });
  }
});

function renderAuctionState(payload = {}) {
  clearAuctionClockInterval();
  resetAuctionEndState();
  const {
    content,
    item,
    endsAt,
    order,
    currentPlayerId,
    highestAmount,
    leaderName,
  } = payload;
  showGameMode("auction");
  els.nextBtn.classList.add("hidden");
  setError(els.gameError, "");
  if (els.auctionPrize) {
    els.auctionPrize.textContent = auctionPrizeDisplayText(item, content);
  }
  const h = Number(highestAmount) || 0;
  const lnm = leaderName || "";
  if (els.auctionHighValue) {
    els.auctionHighValue.textContent = h > 0 ? String(h) : "—";
  }
  if (els.auctionHighLeader) {
    if (h > 0 && lnm) els.auctionHighLeader.textContent = lnm;
    else if (h > 0) els.auctionHighLeader.textContent = "";
    else els.auctionHighLeader.textContent = "Geen bod";
  }
  const myId = socket.id;
  const isTurn = currentPlayerId === myId;
  const me = Array.isArray(order) ? order.find((o) => o.id === myId) : null;
  const bidsUsed = Number(me?.bidsUsed) || 0;
  auctionBidClicksLocal = Math.max(auctionBidClicksLocal, bidsUsed);
  const atBidLimit = auctionBidClicksLocal >= 2 || bidsUsed >= 2;
  const canPlusOne = isTurn && bidsUsed < 2 && auctionBidClicksLocal < 2;
  const cur = Array.isArray(order)
    ? order.find((o) => o.id === currentPlayerId)
    : null;
  auctionUiSnapshot.endsAt = Number(endsAt) || 0;
  auctionUiSnapshot.item = item || "—";
  auctionUiSnapshot.isMyTurn = isTurn;
  auctionUiSnapshot.currentBidderName = cur?.name || "";
  auctionUiSnapshot.bidsUsed = bidsUsed;
  updateAuctionTurnLine();
  if (auctionUiSnapshot.endsAt > Date.now()) {
    auctionClockInterval = setInterval(updateAuctionTurnLine, 250);
  }
  if (els.auctionBidRow && els.auctionWait) {
    els.auctionBidRow.classList.toggle("hidden", !isTurn);
    els.auctionWait.classList.toggle("hidden", isTurn);
  }
  if (els.auctionPlusOneBtn) {
    els.auctionPlusOneBtn.disabled = !canPlusOne;
    els.auctionPlusOneBtn.textContent =
      isTurn && atBidLimit ? AUCTION_LIMIT_LABEL : AUCTION_PLUS_ONE_LABEL;
  }
  auctionLastHigh = h;
}

socket.on("auctionState", (payload = {}) => {
  if (minigameCountdownActive) {
    finishCountdownThenStart(() => renderAuctionState(payload));
  } else {
    renderAuctionState(payload);
  }
});

socket.on("auctionUpdate", ({ highestAmount, leaderName } = {}) => {
  const h = Number(highestAmount) || 0;
  if (els.auctionHighValue) {
    els.auctionHighValue.textContent = h > 0 ? String(h) : "—";
  }
  if (els.auctionHighLeader) {
    if (h > 0 && leaderName) els.auctionHighLeader.textContent = leaderName;
    else if (h > 0) els.auctionHighLeader.textContent = "";
    else els.auctionHighLeader.textContent = "Geen bod";
  }
  auctionLastHigh = h;
});

socket.on("auctionEnded", ({ winnerName, highestAmount, item } = {}) => {
  abortMinigameCountdownDisplay();
  clearAuctionClockInterval();
  auctionLastHigh = 0;
  auctionBidClicksLocal = 0;
  const h = Number(highestAmount) || 0;
  const hasWinningBid = h > 0;
  const line = hasWinningBid
    ? formatAuctionWinnerLine(winnerName, item)
    : AUCTION_NO_BIDS_LINE;

  showGameMode("auction");
  if (els.auctionResult) {
    els.auctionResult.textContent = line;
    els.auctionResult.classList.remove("hidden");
  }
  els.auctionCard?.classList.add("auctionCard--ended");

  applyStakesText("");
  setPlainOpdrachtWithFade(line);
  if (state.isHost) els.nextBtn.classList.remove("hidden");
  syncHostNextDock();
});

els.auctionPlusOneBtn?.addEventListener("click", () => {
  if (els.auctionPlusOneBtn?.disabled) return;
  auctionBidClicksLocal += 1;
  const next = Math.max(1, (Number(auctionLastHigh) || 0) + 1);
  socket.emit("auctionBid", { amount: next });
  if (auctionBidClicksLocal >= 2 && els.auctionPlusOneBtn) {
    els.auctionPlusOneBtn.disabled = true;
    els.auctionPlusOneBtn.textContent = AUCTION_LIMIT_LABEL;
  }
});

els.auctionPassBtn?.addEventListener("click", () => {
  socket.emit("auctionPass");
});

socket.on("reactionLoser", ({ name } = {}) => {
  abortMinigameCountdownDisplay();
  showGameMode("card");
  const loser = name || "iemand";
  setPlainOpdrachtWithFade(`${loser} was te laat en moet drinken!`);
  if (name) showToast(`${loser} heeft 5 slokken gekregen!`);
  if (state.isHost) els.nextBtn.classList.remove("hidden");
});

// Koning mechanics
socket.on("newKingAnnounced", ({ name } = {}) => {
  setKingStatus({ kingName: name || "—" });
  if (name) {
    showToast(`${name} is de nieuwe Koning! 👑`);
    launchConfetti();
    playKingSound();
  }
});

socket.on("ruleUpdated", ({ rule } = {}) => {
  setKingStatus({ rule: rule || "Geen" });
});

socket.on("startKingNaming", ({ content } = {}) => {
  // Only the chosen king receives this
  if (content) showToast(content);
  openKingModal();
});

function join() {
  setError(els.loginError, "");

  const roomCode = normalizeRoomCode(els.roomCodeInput.value);
  const playerName = String(els.playerNameInput.value || "").trim().slice(0, 32);

  els.roomCodeInput.value = roomCode;

  if (!roomCode) {
    setError(els.loginError, "Vul een kamercode in.");
    return;
  }
  if (!playerName) {
    setError(els.loginError, "Vul je naam in.");
    return;
  }

  socket.emit("joinRoom", { roomCode, playerName });
}

els.joinBtn.addEventListener("click", join);
els.playerNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") join();
});
els.roomCodeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") join();
});

els.nextBtn.addEventListener("click", () => {
  setError(els.gameError, "");
  socket.emit("nextCard");
});

els.toggleScoresBtn?.classList.remove("hidden");
els.toggleScoresBtn?.addEventListener("click", () => {
  toggleLeaderboardModal();
});
els.leaderboardModalClose?.addEventListener("click", () => {
  closeLeaderboardModal();
});
els.leaderboardModal?.addEventListener("click", (e) => {
  if (e.target === els.leaderboardModal) closeLeaderboardModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (els.leaderboardModal && isLeaderboardModalOpen()) {
    closeLeaderboardModal();
  }
});

els.reactionBtn?.addEventListener("click", () => {
  socket.emit("reactionClick");
  els.reactionBtn.disabled = true;
  els.reactionBtn.textContent = "Geklikt! Wachten...";
  els.reactionStatus.textContent = "Wachten op de rest...";
});

els.setRuleBtn?.addEventListener("click", () => {
  const rule = String(els.ruleInput?.value || "").trim();
  socket.emit("proposeRule", { rule });
  closeKingModal();
});
els.closeKingModalBtn?.addEventListener("click", closeKingModal);
els.ruleInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    els.setRuleBtn?.click();
  }
});

