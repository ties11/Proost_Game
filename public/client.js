const els = {
  statusText: document.getElementById("statusText"),

  loginScreen: document.getElementById("loginScreen"),
  gameScreen: document.getElementById("gameScreen"),

  roomCodeInput: document.getElementById("roomCodeInput"),
  playerNameInput: document.getElementById("playerNameInput"),
  joinBtn: document.getElementById("joinBtn"),
  loginError: document.getElementById("loginError"),

  cardSection: document.getElementById("card-section"),
  roomPill: document.getElementById("roomPill"),
  playersList: document.getElementById("playersList"),
  opdrachtText: document.getElementById("opdrachtText"),
  nextBtn: document.getElementById("nextBtn"),
  gameError: document.getElementById("gameError"),

  leaderboardList: document.getElementById("leaderboardList"),
  toast: document.getElementById("toast"),
  confetti: document.getElementById("confetti"),

  kingName: document.getElementById("kingName"),
  kingRule: document.getElementById("kingRule"),
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
};

function setScreen(screen) {
  const isLogin = screen === "login";
  els.loginScreen.classList.toggle("hidden", !isLogin);
  els.gameScreen.classList.toggle("hidden", isLogin);
}

function showGameMode(mode) {
  // mode: "card" | "vote" | "reaction" | "fast" | "stopwatch"
  els.cardSection.classList.toggle("hidden", mode !== "card");
  els.votingSection.classList.toggle("hidden", mode !== "vote");
  els.reactionSection.classList.toggle("hidden", mode !== "reaction");
  els.fastFingersSection.classList.toggle("hidden", mode !== "fast");
  els.stopwatchSection.classList.toggle("hidden", mode !== "stopwatch");
}

function setError(targetEl, message) {
  targetEl.textContent = message ? String(message) : "";
}

function normalizeRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

function renderPlayers(players) {
  const list = Array.isArray(players) ? players : [];
  const sorted = [...list].sort((a, b) => (b.sips || 0) - (a.sips || 0) || a.name.localeCompare(b.name, "nl"));

  // "In de kamer" chips (namen)
  els.playersList.innerHTML = "";
  for (const p of sorted) {
    const li = document.createElement("li");
    li.textContent = p.name;
    els.playersList.appendChild(li);
  }

  // Leaderboard (ranglijst met slokken)
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
    if (els.kingName) els.kingName.textContent = kingName || "—";
  }
  if (typeof rule !== "undefined") {
    currentRuleText = rule || "Geen";
    if (els.kingRule) els.kingRule.textContent = currentRuleText;
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
};

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

socket.on("joinedRoom", ({ roomCode } = {}) => {
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
});

// Server stuurt updates met huidige spelerslijst
socket.on("updatePlayers", ({ roomCode, players, hostId } = {}) => {
  if (roomCode) els.roomPill.textContent = roomCode;
  state.hostId = hostId || null;
  state.isHost = !!state.hostId && socket.id === state.hostId;
  // Host-only controls
  els.nextBtn.style.display = state.isHost ? "block" : "none";
  renderPlayers(players);
});

// Server stuurt nieuwe kaart/opdracht
socket.on("newCard", ({ opdracht, type } = {}) => {
  if (type && type !== "text") return;
  if (!opdracht) return;
  showGameMode("card");
  els.nextBtn.classList.remove("hidden");
  els.opdrachtText.textContent = opdracht;
  // retrigger fade-in animatie
  els.opdrachtText.classList.remove("fadeIn");
  // force reflow
  void els.opdrachtText.offsetWidth;
  els.opdrachtText.classList.add("fadeIn");
});

socket.on("startVoting", ({ question, players } = {}) => {
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
      // submitVote per spec; server accepteert ook alias
      socket.emit("submitVote", { targetId: p.id });
      els.voteButtons.querySelectorAll("button").forEach((b) => (b.disabled = true));
      els.voteStatus.textContent = "Wachten op de rest...";
    });
    els.voteButtons.appendChild(btn);
  }
});

socket.on("voteResults", ({ losers } = {}) => {
  showGameMode("card");
  const loserNames = Array.isArray(losers) ? losers.map((l) => l.name).filter(Boolean) : [];
  const nameText =
    loserNames.length === 0 ? "Niemand" : loserNames.length === 1 ? loserNames[0] : loserNames.join(" & ");
  const text = `${nameText} heeft de meeste stemmen en neemt 3 slokken!`;

  els.opdrachtText.textContent = text;
  els.opdrachtText.classList.remove("fadeIn");
  void els.opdrachtText.offsetWidth;
  els.opdrachtText.classList.add("fadeIn");

  if (loserNames.length > 0) showToast(`${nameText} heeft 5 slokken gekregen!`);
  if (state.isHost) els.nextBtn.classList.remove("hidden");
});

// Dilemma works like voting but with 2 choices
socket.on("startDilemma", ({ question, optionA, optionB } = {}) => {
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

socket.on("dilemmaResults", ({ losers, minority, countA, countB, optionA, optionB } = {}) => {
  showGameMode("card");
  const loserNames = Array.isArray(losers) ? losers.map((l) => l.name).filter(Boolean) : [];

  let headline = "Gelijkspel! Niemand drinkt.";
  if (minority && loserNames.length > 0) {
    const nameText = loserNames.length === 1 ? loserNames[0] : loserNames.join(" & ");
    headline = `${nameText} zit in de minderheid en neemt 5 slokken!`;
    showToast(`${nameText} heeft 5 slokken gekregen!`);
  }

  const aText = `A (${countA ?? 0}): ${optionA || ""}`.trim();
  const bText = `B (${countB ?? 0}): ${optionB || ""}`.trim();
  els.opdrachtText.textContent = `${headline}\n\n${aText}\n${bText}`;
  els.opdrachtText.classList.remove("fadeIn");
  void els.opdrachtText.offsetWidth;
  els.opdrachtText.classList.add("fadeIn");

  if (state.isHost) els.nextBtn.classList.remove("hidden");
});

// Fast-fingers
let fastTarget = 15;
let fastLocalCount = 0;

socket.on("startFastFingers", ({ target } = {}) => {
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
  els.opdrachtText.textContent = `${loser} heeft de minste clicks en neemt 5 slokken!`;
  els.opdrachtText.classList.remove("fadeIn");
  void els.opdrachtText.offsetWidth;
  els.opdrachtText.classList.add("fadeIn");
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

socket.on("startStopwatch", ({ targetTime } = {}) => {
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
  showGameMode("card");
  const name = loserName || "iemand";
  const target = typeof targetTime === "number" ? targetTime : 8;
  els.opdrachtText.textContent = `${name} had de slechtste timing (doel: ${target.toFixed(2)}s) en neemt 5 slokken!`;
  els.opdrachtText.classList.remove("fadeIn");
  void els.opdrachtText.offsetWidth;
  els.opdrachtText.classList.add("fadeIn");
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

socket.on("startReaction", () => {
  showGameMode("reaction");
  els.nextBtn.classList.add("hidden");
  setError(els.gameError, "");
  els.reactionStatus.textContent = "";
  els.reactionBtn.disabled = false;
  els.reactionBtn.textContent = "DRUK NU!";
});

socket.on("reactionLoser", ({ name } = {}) => {
  showGameMode("card");
  const loser = name || "iemand";
  els.opdrachtText.textContent = `${loser} was te laat en moet drinken!`;
  els.opdrachtText.classList.remove("fadeIn");
  void els.opdrachtText.offsetWidth;
  els.opdrachtText.classList.add("fadeIn");
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

