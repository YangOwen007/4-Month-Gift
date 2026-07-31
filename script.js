// This configuration is the main place to customize your adventure.
// Update the titles, notes, coordinates, and image paths with your real memories.
const GAME_CONFIG = {
  width: 17,
  height: 11,
  start: { x: 1, y: 9 },
  end: { x: 15, y: 1 },
  stops: [
    {
      id: "coffee-date",
      title: "Our First Cozy Stop",
      note: "This is where your real note will go. You can swap this out with a favorite memory, an inside joke, or something sweet you want her to read.",
      image: "",
      x: 4,
      y: 9,
      gate: { x: 5, y: 9 }
    },
    {
      id: "movie-night",
      title: "A Little Night We Loved",
      note: "Add another memory here, like the way that night felt or why it still makes you smile.",
      image: "",
      x: 8,
      y: 7,
      gate: { x: 8, y: 6 }
    },
    {
      id: "day-trip",
      title: "One of Our Adventures",
      note: "This can become a longer love note plus a photo from the actual day trip, dinner, or any moment you want to celebrate.",
      image: "",
      x: 11,
      y: 4,
      gate: { x: 11, y: 3 }
    },
    {
      id: "favorite-place",
      title: "Our Favorite Place",
      note: "Use this last stop to set up the ending before she reaches the cliff and fireworks.",
      image: "",
      x: 13,
      y: 2,
      gate: { x: 14, y: 2 }
    }
  ]
};

// This tile map keeps the layout easy to adjust without adding a full level editor.
// g = grass, p = path, w = water, c = cliff.
const TILE_ROWS = [
  "ggggggggggggggggg",
  "ggggggggggggggpcg",
  "ggggggggggggppppg",
  "gggggggggggppgggg",
  "ggggggggggppggggg",
  "ggwwwwgggppgggggg",
  "gwwwwwggppggggggg",
  "gwwwwwgppgggggggg",
  "ggggggppggggggggg",
  "gppppppgggggggggg",
  "ggggggggggggggggg"
];

const board = document.querySelector("#game-board");
const objectiveText = document.querySelector("#objective-text");
const progressText = document.querySelector("#progress-text");
const dialogBackdrop = document.querySelector("#dialog-backdrop");
const closeDialogButton = document.querySelector("#close-dialog");
const dialogKicker = document.querySelector("#dialog-kicker");
const dialogTitle = document.querySelector("#dialog-title");
const dialogNote = document.querySelector("#dialog-note");
const dialogImage = document.querySelector("#dialog-image");
const dialogPlaceholder = document.querySelector("#dialog-placeholder");
const fireworksCanvas = document.querySelector("#fireworks-canvas");
const endingBanner = document.querySelector("#ending-banner");

const state = {
  player: { ...GAME_CONFIG.start },
  completedStopIds: new Set(),
  activeStop: null,
  isDialogOpen: false,
  isEndingUnlocked: false,
  isFireworksRunning: false,
  fireworkParticles: [],
  fireworkTimer: null,
  animationFrame: null
};

const positionKey = (x, y) => `${x},${y}`;

// These lookup maps make it easy to answer "what is on this tile?"
const stopByPosition = new Map(
  GAME_CONFIG.stops.map((stop) => [positionKey(stop.x, stop.y), stop])
);

function getTileType(x, y) {
  return TILE_ROWS[y]?.[x] ?? "g";
}

function isInsideBoard(x, y) {
  return x >= 0 && x < GAME_CONFIG.width && y >= 0 && y < GAME_CONFIG.height;
}

function isWalkableTile(x, y) {
  const tile = getTileType(x, y);
  return tile === "p" || tile === "c";
}

function getNextRequiredStop() {
  return GAME_CONFIG.stops.find((stop) => !state.completedStopIds.has(stop.id)) ?? null;
}

function isLockedTile(x, y) {
  const nextStop = getNextRequiredStop();

  if (!nextStop) {
    return false;
  }

  // Only the next memory stop can be entered. Later memory tiles stay locked.
  const stopAtTile = stopByPosition.get(positionKey(x, y));
  if (stopAtTile && stopAtTile.id !== nextStop.id) {
    return true;
  }

  // Each stop has a single gate tile immediately after it so progress feels clear.
  if (nextStop.gate && x === nextStop.gate.x && y === nextStop.gate.y) {
    return true;
  }

  // The end cliff stays locked until every stop has been completed.
  if (x === GAME_CONFIG.end.x && y === GAME_CONFIG.end.y) {
    return state.completedStopIds.size !== GAME_CONFIG.stops.length;
  }

  return false;
}

function renderBoard() {
  board.innerHTML = "";

  // Build the visible map tile by tile so the layout stays data-driven.
  for (let y = 0; y < GAME_CONFIG.height; y += 1) {
    for (let x = 0; x < GAME_CONFIG.width; x += 1) {
      const tile = document.createElement("div");
      const tileType = getTileType(x, y);
      tile.className = `tile ${tileType === "g" ? "grass" : tileType === "p" ? "path" : tileType === "w" ? "water" : "cliff"}`;
      tile.style.gridColumnStart = String(x + 1);
      tile.style.gridRowStart = String(y + 1);
      board.appendChild(tile);

      const stop = stopByPosition.get(positionKey(x, y));
      if (stop) {
        const marker = document.createElement("div");
        marker.className = `memory-marker ${state.completedStopIds.has(stop.id) ? "completed" : ""}`;
        marker.style.gridColumnStart = String(x + 1);
        marker.style.gridRowStart = String(y + 1);
        marker.title = stop.title;
        board.appendChild(marker);

        if (!state.completedStopIds.has(stop.id)) {
          const sparkle = document.createElement("div");
          sparkle.className = "sparkle";
          sparkle.style.left = `calc(${x} * var(--tile-size) + 18px)`;
          sparkle.style.top = `calc(${y} * var(--tile-size) + 12px)`;
          board.appendChild(sparkle);
        }
      }

      if (isLockedTile(x, y) && !stopByPosition.has(positionKey(x, y))) {
        const gate = document.createElement("div");
        gate.className = "gate-marker";
        gate.style.gridColumnStart = String(x + 1);
        gate.style.gridRowStart = String(y + 1);
        board.appendChild(gate);
      }

      if (x === GAME_CONFIG.end.x && y === GAME_CONFIG.end.y) {
        const cliff = document.createElement("div");
        cliff.className = "cliff-marker";
        cliff.style.gridColumnStart = String(x + 1);
        cliff.style.gridRowStart = String(y + 1);
        board.appendChild(cliff);
      }
    }
  }

  // Render the player last so they stay visually on top.
  const player = document.createElement("div");
  player.className = "player";
  player.style.gridColumnStart = String(state.player.x + 1);
  player.style.gridRowStart = String(state.player.y + 1);
  board.appendChild(player);
}

function updateHud() {
  const completed = state.completedStopIds.size;
  const total = GAME_CONFIG.stops.length;
  const nextStop = getNextRequiredStop();

  progressText.textContent = `${completed} / ${total} memories`;

  if (state.isEndingUnlocked) {
    objectiveText.textContent = "Enjoy the fireworks at the cliff.";
    return;
  }

  if (nextStop) {
    objectiveText.textContent = `Find and interact with "${nextStop.title}".`;
    return;
  }

  objectiveText.textContent = "Head to the cliff for the finale.";
}

function movePlayer(dx, dy) {
  if (state.isDialogOpen) {
    return;
  }

  const nextX = state.player.x + dx;
  const nextY = state.player.y + dy;

  if (!isInsideBoard(nextX, nextY) || !isWalkableTile(nextX, nextY) || isLockedTile(nextX, nextY)) {
    return;
  }

  state.player.x = nextX;
  state.player.y = nextY;

  renderBoard();
  updateHud();
  animatePlayerStep();

  if (
    state.completedStopIds.size === GAME_CONFIG.stops.length &&
    nextX === GAME_CONFIG.end.x &&
    nextY === GAME_CONFIG.end.y
  ) {
    unlockEnding();
  }
}

function animatePlayerStep() {
  const player = board.querySelector(".player");
  if (!player) {
    return;
  }

  player.classList.add("walking");
  window.setTimeout(() => player.classList.remove("walking"), 120);
}

function interact() {
  if (state.isDialogOpen) {
    return;
  }

  const currentStop = stopByPosition.get(positionKey(state.player.x, state.player.y));

  if (currentStop && getNextRequiredStop()?.id === currentStop.id) {
    openDialog(currentStop);
  }
}

function openDialog(stop) {
  state.activeStop = stop;
  state.isDialogOpen = true;

  dialogKicker.textContent = `Memory ${state.completedStopIds.size + 1}`;
  dialogTitle.textContent = stop.title;
  dialogNote.textContent = stop.note;

  // If an image path is present, show it. Otherwise, keep the placeholder visible.
  if (stop.image) {
    dialogImage.src = stop.image;
    dialogImage.alt = stop.title;
    dialogImage.classList.remove("hidden");
    dialogPlaceholder.classList.add("hidden");
  } else {
    dialogImage.removeAttribute("src");
    dialogImage.alt = "";
    dialogImage.classList.add("hidden");
    dialogPlaceholder.classList.remove("hidden");
  }

  dialogBackdrop.classList.remove("hidden");
  dialogBackdrop.setAttribute("aria-hidden", "false");
}

function closeDialog() {
  if (!state.activeStop) {
    return;
  }

  // Closing a memory dialog marks that stop complete so the path opens up.
  state.completedStopIds.add(state.activeStop.id);
  state.activeStop = null;
  state.isDialogOpen = false;
  dialogBackdrop.classList.add("hidden");
  dialogBackdrop.setAttribute("aria-hidden", "true");

  renderBoard();
  updateHud();
}

function resizeFireworksCanvas() {
  const rect = fireworksCanvas.getBoundingClientRect();
  fireworksCanvas.width = rect.width;
  fireworksCanvas.height = rect.height;
}

function unlockEnding() {
  if (state.isEndingUnlocked) {
    return;
  }

  state.isEndingUnlocked = true;
  updateHud();
  endingBanner.classList.remove("hidden");
  startFireworks();
}

function heartPoints(scale) {
  const points = [];

  // This parametric heart shape gives the ending a more personal fireworks pattern.
  for (let t = 0; t < Math.PI * 2; t += 0.22) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    points.push({
      x: x * scale,
      y: -y * scale
    });
  }

  return points;
}

function launchBurst() {
  const shapes = ["circle", "heart", "heart", "star"];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const centerX = Math.random() * fireworksCanvas.width * 0.8 + fireworksCanvas.width * 0.1;
  const centerY = Math.random() * fireworksCanvas.height * 0.45 + fireworksCanvas.height * 0.08;
  const colors = ["#ff8fab", "#ffe066", "#8ce99a", "#74c0fc", "#ffd6a5", "#f4bfff"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const particles = [];

  if (shape === "heart") {
    for (const point of heartPoints(3)) {
      particles.push({
        x: centerX,
        y: centerY,
        vx: point.x * 0.09,
        vy: point.y * 0.09,
        life: 1,
        size: 3,
        color
      });
    }
  } else {
    const count = shape === "star" ? 20 : 32;

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const radius = shape === "star" && index % 2 === 0 ? 3.4 : 2.2;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * radius,
        vy: Math.sin(angle) * radius,
        life: 1,
        size: 3,
        color
      });
    }
  }

  state.fireworkParticles.push(...particles);
}

function drawFireworks() {
  const ctx = fireworksCanvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  state.fireworkParticles = state.fireworkParticles.filter((particle) => particle.life > 0);

  for (const particle of state.fireworkParticles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.01;
    particle.life -= 0.012;

    ctx.globalAlpha = Math.max(particle.life, 0);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  state.animationFrame = window.requestAnimationFrame(drawFireworks);
}

function startFireworks() {
  if (state.isFireworksRunning) {
    return;
  }

  state.isFireworksRunning = true;
  resizeFireworksCanvas();
  launchBurst();
  drawFireworks();
  state.fireworkTimer = window.setInterval(launchBurst, 520);
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e", " ", "enter"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowup" || key === "w") {
    movePlayer(0, -1);
  } else if (key === "arrowdown" || key === "s") {
    movePlayer(0, 1);
  } else if (key === "arrowleft" || key === "a") {
    movePlayer(-1, 0);
  } else if (key === "arrowright" || key === "d") {
    movePlayer(1, 0);
  } else if (key === "e" || key === " " || key === "enter") {
    if (state.isDialogOpen) {
      closeDialog();
    } else {
      interact();
    }
  } else if (key === "escape" && state.isDialogOpen) {
    closeDialog();
  }
}

function initializeGame() {
  renderBoard();
  updateHud();
  resizeFireworksCanvas();
}

window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", resizeFireworksCanvas);
dialogBackdrop.addEventListener("click", (event) => {
  if (event.target === dialogBackdrop) {
    closeDialog();
  }
});
closeDialogButton.addEventListener("click", closeDialog);

initializeGame();
