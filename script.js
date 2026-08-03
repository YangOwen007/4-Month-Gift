// This renderer keeps every world element on a strict pixel grid so the whole
// map feels like one consistent handheld-style scene instead of mixed assets.
const GAME_CONFIG = {
  mapWidth: 26,
  mapHeight: 36,
  viewportTiles: 10,
  tileSize: 48,
  start: { x: 13, y: 31 },
  end: { x: 13, y: 4 },
  bench: { x: 12, y: 3 },
  strawberry: { x: 13, y: 4 },
  stops: [
    {
      id: "first-stop",
      title: "The Start Of Us",
      note: "Use this first stop for how it all began. A shorter note feels nice here because it kicks off the whole little walk.",
      image: "",
      x: 13,
      y: 27,
      gate: { x: 14, y: 27 }
    },
    {
      id: "second-stop",
      title: "One Of My Favorite Days",
      note: "This stop is a good place for a favorite date, trip, or memory that still feels bright whenever you think about it.",
      image: "",
      x: 17,
      y: 20,
      gate: { x: 16, y: 20 }
    },
    {
      id: "third-stop",
      title: "A Quiet Little Moment",
      note: "This one works especially well for a softer memory: a drive, a walk, a late conversation, or one of those tiny moments that mattered a lot.",
      image: "",
      x: 9,
      y: 13,
      gate: { x: 9, y: 12 }
    },
    {
      id: "fourth-stop",
      title: "Almost At The View",
      note: "You can use this memory to build anticipation for the ending and hint that the ocean overlook is almost there.",
      image: "",
      x: 9,
      y: 8,
      gate: { x: 10, y: 8 }
    }
  ],
  assets: {
    grass: "assets/cohesive/grass-clean.png",
    stone: "assets/cohesive/stone.png",
    cliff: "assets/cohesive/cliff.png",
    tree: "assets/refined/tree.png",
    bush: "assets/refined/bush.png",
    rock: "assets/cohesive/rock.png",
    bench: "assets/ending/bench-double.png",
    fenceHorizontal: "assets/refined/fence-horizontal.png",
    fenceVertical: "assets/refined/fence-vertical.png",
    path: "assets/refined/path-fill.png",
    ocean: "assets/ocean-generated.png",
    strawberryWalk: [
      "assets/ending/strawberry-walk-0.png",
      "assets/ending/strawberry-walk-1.png"
    ],
    strawberrySit: "assets/ending/strawberry-sit.png",
    catSit: "assets/ending/cat-sit.png",
    hearts: Array.from({ length: 3 }, (_, index) => `assets/ending/heart-${index}.png`),
    sparkles: Array.from({ length: 12 }, (_, index) => `assets/sparkles/sparkle-${index}.png`),
    fireworks: Array.from({ length: 7 }, (_, index) => `assets/fireworks/firework-${index}.png`)
  }
};

// Versioned character URLs keep GitHub Pages and the browser from reusing older sprite exports.
const PLAYER_FRAME_VERSION = "20260803-character-picker-5";
const PARTNER_FRAME_VERSION = "20260803-blue-partner-3";
const ENDING_ASSET_VERSION = "20260802-ending-seat-1";

GAME_CONFIG.assets.bench = `assets/ending/bench-double.png?v=${ENDING_ASSET_VERSION}`;
GAME_CONFIG.assets.strawberryWalk = [
  `assets/ending/strawberry-walk-0.png?v=${ENDING_ASSET_VERSION}`,
  `assets/ending/strawberry-walk-1.png?v=${ENDING_ASSET_VERSION}`
];
GAME_CONFIG.assets.strawberrySit = `assets/ending/strawberry-sit.png?v=${ENDING_ASSET_VERSION}`;
GAME_CONFIG.assets.catSit = `assets/ending/cat-sit.png?v=${ENDING_ASSET_VERSION}`;
GAME_CONFIG.assets.hearts = Array.from(
  { length: 3 },
  (_, index) => `assets/ending/heart-${index}.png?v=${ENDING_ASSET_VERSION}`
);

function buildPlayerFramePaths(folder, version = PLAYER_FRAME_VERSION) {
  return {
    down: [
      `${folder}/down-0.png?v=${version}`,
      `${folder}/down-1.png?v=${version}`
    ],
    left: [
      `${folder}/left-0.png?v=${version}`,
      `${folder}/left-1.png?v=${version}`
    ],
    up: [
      `${folder}/up-0.png?v=${version}`,
      `${folder}/up-1.png?v=${version}`
    ],
    right: [
      `${folder}/right-0.png?v=${version}`,
      `${folder}/right-1.png?v=${version}`
    ]
  };
}

// Both player choices live in one shared config so later partner-swap logic can branch from the same source of truth.
const CHARACTER_OPTIONS = {
  white: {
    label: "Original Cat",
    preview: `assets/player-cat/down-0.png?v=${PLAYER_FRAME_VERSION}`,
    sit: `assets/ending/cat-sit.png?v=${ENDING_ASSET_VERSION}`,
    playerFrames: buildPlayerFramePaths("assets/player-cat"),
    worldDraw: { width: 40, height: 40, offsetX: 4, offsetY: 3 },
    seatedDraw: { width: 38, height: 38, offsetX: 0, offsetY: 1 }
  },
  pink: {
    label: "Pink Nubcat",
    preview: `assets/player-pink-v5/down-0.png?v=${PLAYER_FRAME_VERSION}`,
    sit: `assets/ending/pink-cat-sit-v5.png?v=${PLAYER_FRAME_VERSION}`,
    playerFrames: buildPlayerFramePaths("assets/player-pink-v5"),
    worldDraw: { width: 48, height: 48, offsetX: 0, offsetY: 0 },
    seatedDraw: { width: 42, height: 42, offsetX: 0, offsetY: -1 }
  }
};

// The pink route gets its own matching partner, while the original route keeps the strawberry ending intact.
const PARTNER_OPTIONS = {
  strawberry: {
    type: "simple",
    draw: { width: 36, height: 36, offsetX: 0, offsetY: 0 },
    seatedDraw: { width: 30, height: 32, offsetX: 0, offsetY: -2 }
  },
  blue: {
    type: "directional",
    sit: `assets/ending/blue-nubcat-sit-v2.png?v=${PARTNER_FRAME_VERSION}`,
    playerFrames: buildPlayerFramePaths("assets/partner-blue-v2", PARTNER_FRAME_VERSION),
    draw: { width: 48, height: 48, offsetX: 0, offsetY: 0 },
    seatedDraw: { width: 40, height: 40, offsetX: 0, offsetY: -1 }
  }
};

// Terrain legend:
// g grass, o ocean void, c cliff top, a overlook platform.
const RAW_TERRAIN_ROWS = Array.from({ length: GAME_CONFIG.mapHeight }, (_, y) => {
  if (y <= 1) {
    return "oooooooooooooooooooooooooo";
  }

  if (y === 2) {
    return "oooooooooocccccccooooooooo";
  }

  if (y === 3) {
    return "ooooooooccccccccccoooooooo";
  }

  if (y === 4) {
    return "ggggggggacccccccccaggggggg";
  }

  if (y === 5) {
    return "gggggggggacccccccagggggggg";
  }

  if (y === 6) {
    return "ggggggggggaccccagggggggggg";
  }

  return "gggggggggggggggggggggggggg";
});

// Tree placement stays dense around the path but avoids blocking key read lines.
const TREE_POSITIONS = [
  { x: 5, y: 31 }, { x: 8, y: 30 }, { x: 18, y: 31 }, { x: 21, y: 30 },
  { x: 4, y: 26 }, { x: 21, y: 26 }, { x: 6, y: 22 }, { x: 20, y: 22 },
  { x: 4, y: 18 }, { x: 21, y: 18 }, { x: 6, y: 14 }, { x: 20, y: 14 },
  { x: 4, y: 10 }, { x: 21, y: 10 }, { x: 6, y: 6 }, { x: 19, y: 6 },
  { x: 9, y: 5 }, { x: 17, y: 5 }, { x: 3, y: 28 }, { x: 22, y: 28 }
];

// Bushes stay off the walkable route so the path reads clearly at every turn.
const BUSH_POSITIONS = [
  { x: 9, y: 32 }, { x: 17, y: 32 }, { x: 20, y: 27 }, { x: 5, y: 24 },
  { x: 21, y: 21 }, { x: 6, y: 17 }, { x: 19, y: 17 }, { x: 11, y: 11 },
  { x: 17, y: 11 }, { x: 6, y: 9 }, { x: 20, y: 8 }, { x: 8, y: 20 }
];

const ROCK_POSITIONS = [
  { x: 10, y: 24 }, { x: 19, y: 24 }, { x: 8, y: 19 },
  { x: 18, y: 20 }, { x: 10, y: 6 }, { x: 16, y: 6 }
];

// Fireflies now appear across many more meadow tiles so the whole route feels alive at night.
const FIREFLY_POSITIONS = [
  { x: 5, y: 31 }, { x: 7, y: 30 }, { x: 10, y: 31 }, { x: 15, y: 31 }, { x: 18, y: 29 }, { x: 21, y: 30 },
  { x: 6, y: 27 }, { x: 9, y: 26 }, { x: 12, y: 27 }, { x: 16, y: 26 }, { x: 20, y: 24 }, { x: 22, y: 25 },
  { x: 5, y: 23 }, { x: 8, y: 22 }, { x: 13, y: 22 }, { x: 18, y: 22 }, { x: 6, y: 21 }, { x: 21, y: 21 },
  { x: 4, y: 18 }, { x: 9, y: 18 }, { x: 14, y: 18 }, { x: 19, y: 16 }, { x: 22, y: 17 },
  { x: 5, y: 14 }, { x: 7, y: 12 }, { x: 11, y: 12 }, { x: 16, y: 12 }, { x: 20, y: 12 },
  { x: 6, y: 10 }, { x: 12, y: 9 }, { x: 18, y: 9 }, { x: 21, y: 8 }, { x: 11, y: 7 }, { x: 16, y: 7 }
];

const PATH_SEGMENTS = [
  [{ x: 13, y: 31 }, { x: 13, y: 27 }],
  [{ x: 13, y: 27 }, { x: 17, y: 27 }],
  [{ x: 17, y: 27 }, { x: 17, y: 20 }],
  [{ x: 17, y: 20 }, { x: 9, y: 20 }],
  [{ x: 9, y: 20 }, { x: 9, y: 13 }],
  [{ x: 9, y: 13 }, { x: 9, y: 8 }],
  [{ x: 9, y: 8 }, { x: 13, y: 8 }],
  [{ x: 13, y: 8 }, { x: 13, y: 4 }]
];

const TERRAIN_ROWS = RAW_TERRAIN_ROWS.map((row) => row.slice(0, GAME_CONFIG.mapWidth).padEnd(GAME_CONFIG.mapWidth, "g"));
const VIEWPORT_PIXELS = GAME_CONFIG.viewportTiles * GAME_CONFIG.tileSize;
const BENCH_POSITION = GAME_CONFIG.bench;
const STRAWBERRY_POSITION = GAME_CONFIG.strawberry;
const TREE_DRAW_OFFSET = { x: 8, y: 2 };
const BUSH_DRAW_OFFSET = { x: 8, y: 22 };
const LAND_BASE_COLOR = "#8fc84a";
const NIGHT_TINT_COLOR = "rgba(16, 28, 58, 0.36)";
const MEMORY_GLOW_COLORS = ["rgba(255, 233, 138, 0.18)", "rgba(255, 201, 98, 0.22)", "rgba(255, 247, 204, 0.28)"];
const FIREFLY_GLOW_COLORS = ["rgba(228, 247, 136, 0.12)", "rgba(255, 239, 171, 0.18)", "rgba(255, 247, 214, 0.24)"];
const FIREFLY_SWARM_OFFSETS = [
  { x: -12, y: -10, phase: 0, size: 2 },
  { x: -4, y: -12, phase: 1, size: 2 },
  { x: 7, y: -9, phase: 2, size: 2 },
  { x: 13, y: -3, phase: 3, size: 1 },
  { x: -14, y: 1, phase: 4, size: 2 },
  { x: -5, y: 4, phase: 5, size: 1 },
  { x: 4, y: 6, phase: 6, size: 2 },
  { x: 12, y: 9, phase: 7, size: 2 },
  { x: -9, y: 12, phase: 8, size: 1 },
  { x: 0, y: 13, phase: 9, size: 2 }
];
const MEMORY_GLOW_OFFSETS = [
  { x: 0, y: -18, size: 6 },
  { x: -12, y: -8, size: 5 },
  { x: 12, y: -8, size: 5 },
  { x: -16, y: 4, size: 4 },
  { x: 16, y: 4, size: 4 },
  { x: -8, y: 16, size: 4 },
  { x: 8, y: 16, size: 4 }
];
// The bench gets a visual nudge so it sits more centrally on the overlook without changing its logic tile.
const BENCH_DRAW_OFFSET = { x: 28, y: 34 };
const BENCH_DRAW_SIZE = { width: 88, height: 36 };
const STRAWBERRY_DRAW_SIZE = { width: 34, height: 36 };
const SEATED_CAT_DRAW_SIZE = { width: 38, height: 38 };
const SEATED_STRAWBERRY_DRAW_SIZE = { width: 30, height: 32 };
// These sit offsets keep the swap from walking pose to seated pose at the same visual height on the bench.
const SEATED_CAT_DRAW_OFFSET = { x: 0, y: 1 };
const SEATED_STRAWBERRY_DRAW_OFFSET = { x: 0, y: -2 };
const ENDING_WALK_DURATION = 2200;
const ENDING_CAMERA_DURATION = 2600;
const ENDING_TOTAL_DURATION = ENDING_WALK_DURATION + ENDING_CAMERA_DURATION;
const CAT_ENDING_PATH = [
  { x: 13, y: 4 },
  { x: 12.1, y: 4.14 },
  { x: 12.12, y: 3.58 },
  { x: 12.66, y: 3.16 }
];
const STRAWBERRY_ENDING_PATH = [
  { x: 13, y: 4 },
  { x: 13.9, y: 4.14 },
  { x: 13.88, y: 3.58 },
  { x: 13.34, y: 3.16 }
];

const gameCanvas = document.querySelector("#game-canvas");
const gameContext = gameCanvas.getContext("2d");
const fireworksCanvas = document.querySelector("#fireworks-canvas");
const fireworksContext = fireworksCanvas.getContext("2d");
const objectiveText = document.querySelector("#objective-text");
const progressText = document.querySelector("#progress-text");
const buildVersionText = document.querySelector("#build-version");
const dialogBackdrop = document.querySelector("#dialog-backdrop");
const closeDialogButton = document.querySelector("#close-dialog");
const dialogKicker = document.querySelector("#dialog-kicker");
const dialogTitle = document.querySelector("#dialog-title");
const dialogNote = document.querySelector("#dialog-note");
const dialogImage = document.querySelector("#dialog-image");
const dialogPlaceholder = document.querySelector("#dialog-placeholder");
const endingBanner = document.querySelector("#ending-banner");
const characterPicker = document.querySelector("#character-picker");
const characterChoiceButtons = Array.from(document.querySelectorAll("[data-character-choice]"));
const characterPreviewWhite = document.querySelector("#character-preview-white");
const characterPreviewPink = document.querySelector("#character-preview-pink");
const characterLabelWhite = document.querySelector("#character-label-white");
const characterLabelPink = document.querySelector("#character-label-pink");
const backgroundMusic = document.querySelector("#background-music");

const state = {
  player: { ...GAME_CONFIG.start },
  facing: "up",
  stepPhase: 0,
  selectedCharacterId: "white",
  isCharacterPickerOpen: true,
  isBackgroundMusicStarted: false,
  completedStopIds: new Set(),
  activeStop: null,
  isDialogOpen: false,
  isEndingUnlocked: false,
  isFireworksRunning: false,
  sparkleFrame: 0,
  sparkleTime: 0,
  fireflyTime: 0,
  fireworks: [],
  fireworkTimer: null,
  fireworkLastTimestamp: 0,
  animationFrame: null,
  lastTimestamp: 0,
  assets: null,
  endingCutscene: {
    active: false,
    timeline: 0,
    progress: 0,
    fireworksStarted: false,
    heartFrame: 0,
    heartTime: 0,
    heartLoopTime: 0
  }
};

function getSelectedCharacterOption() {
  return CHARACTER_OPTIONS[state.selectedCharacterId] ?? CHARACTER_OPTIONS.white;
}

function getSelectedPartnerId() {
  return state.selectedCharacterId === "pink" ? "blue" : "strawberry";
}

function getSelectedPartnerOption() {
  return PARTNER_OPTIONS[getSelectedPartnerId()] ?? PARTNER_OPTIONS.strawberry;
}

function startBackgroundMusic() {
  if (!backgroundMusic || state.isBackgroundMusicStarted) {
    return;
  }

  // Starting audio from the character-choice click keeps autoplay-friendly behavior in browsers.
  backgroundMusic.volume = 0.24;
  backgroundMusic.currentTime = 0;

  const playPromise = backgroundMusic.play();
  state.isBackgroundMusicStarted = true;

  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      // If a browser still blocks playback, we log it and allow another interaction to retry later.
      console.warn("Background music could not start yet.", error);
      state.isBackgroundMusicStarted = false;
    });
  }
}

async function loadBuildVersion() {
  if (!buildVersionText) {
    return;
  }

  try {
    // Fetching a generated version file lets the live Pages site identify exactly which deployment is active.
    const response = await fetch(`version.json?v=${Date.now()}`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Version request failed with ${response.status}`);
    }

    const payload = await response.json();
    const shortSha = payload.sha ? String(payload.sha).slice(0, 7) : "unknown";
    const builtAt = payload.builtAt ? new Date(payload.builtAt).toLocaleString() : "unknown time";
    buildVersionText.textContent = `${shortSha} • ${builtAt}`;
  } catch (error) {
    console.warn("Build version lookup failed.", error);
    buildVersionText.textContent = "Local preview / build info unavailable";
  }
}

function positionKey(x, y) {
  return `${x},${y}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function buildPathTiles() {
  const tiles = new Set();

  // The route is defined by simple axis-aligned segments so it is easy to edit.
  for (const [from, to] of PATH_SEGMENTS) {
    const xStep = Math.sign(to.x - from.x);
    const yStep = Math.sign(to.y - from.y);
    let currentX = from.x;
    let currentY = from.y;
    tiles.add(positionKey(currentX, currentY));

    while (currentX !== to.x || currentY !== to.y) {
      currentX += xStep;
      currentY += yStep;
      tiles.add(positionKey(currentX, currentY));
    }
  }

  return tiles;
}

const PATH_TILES = buildPathTiles();
const stopByPosition = new Map(GAME_CONFIG.stops.map((stop) => [positionKey(stop.x, stop.y), stop]));
const treeSet = new Set(TREE_POSITIONS.map((item) => positionKey(item.x, item.y)));
const bushSet = new Set(BUSH_POSITIONS.map((item) => positionKey(item.x, item.y)));
const rockSet = new Set(ROCK_POSITIONS.map((item) => positionKey(item.x, item.y)));
const fireflySet = new Set(FIREFLY_POSITIONS.map((item) => positionKey(item.x, item.y)));

function getTerrainType(x, y) {
  if (PATH_TILES.has(positionKey(x, y))) {
    return y <= 5 ? "a" : "p";
  }

  return TERRAIN_ROWS[y]?.[x] ?? "g";
}

function isInsideBoard(x, y) {
  return x >= 0 && x < GAME_CONFIG.mapWidth && y >= 0 && y < GAME_CONFIG.mapHeight;
}

function isWalkableTile(x, y) {
  const terrain = getTerrainType(x, y);
  return terrain === "p" || terrain === "a";
}

function getNextRequiredStop() {
  return GAME_CONFIG.stops.find((stop) => !state.completedStopIds.has(stop.id)) ?? null;
}

function isLockedTile(x, y) {
  const nextStop = getNextRequiredStop();

  if (!nextStop) {
    return false;
  }

  if (nextStop.gate && x === nextStop.gate.x && y === nextStop.gate.y) {
    return true;
  }

  if (x === GAME_CONFIG.end.x && y === GAME_CONFIG.end.y) {
    return state.completedStopIds.size !== GAME_CONFIG.stops.length;
  }

  return false;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function trimSprite(image, threshold = 32) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return image;
    }

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    // Sprite art from the generated sheet sits on white, so we cut that cleanly here.
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const distance = Math.abs(255 - red) + Math.abs(255 - green) + Math.abs(255 - blue);
      if (distance <= threshold) {
        pixels[index + 3] = 0;
        continue;
      }

      const pixelIndex = index / 4;
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    // A second pass strips the bright fringe pixels that were left on some props.
    for (let y = 1; y < canvas.height - 1; y += 1) {
      for (let x = 1; x < canvas.width - 1; x += 1) {
        const pixelIndex = (y * canvas.width + x) * 4;
        if (pixels[pixelIndex + 3] === 0) {
          continue;
        }

        const brightness = pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2];
        if (brightness < 690) {
          continue;
        }

        const neighbors = [
          ((y - 1) * canvas.width + x) * 4,
          ((y + 1) * canvas.width + x) * 4,
          (y * canvas.width + (x - 1)) * 4,
          (y * canvas.width + (x + 1)) * 4
        ];

        if (neighbors.some((neighborIndex) => pixels[neighborIndex + 3] === 0)) {
          pixels[pixelIndex + 3] = 0;
        }
      }
    }

    context.putImageData(imageData, 0, 0);

    if (maxX < minX || maxY < minY) {
      return canvas;
    }

    const trimmed = document.createElement("canvas");
    trimmed.width = maxX - minX + 1;
    trimmed.height = maxY - minY + 1;
    const trimmedContext = trimmed.getContext("2d");

    if (!trimmedContext) {
      return canvas;
    }

    trimmedContext.drawImage(canvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
    return trimmed;
  } catch (error) {
    console.warn("Sprite trim failed, using original image instead.", error);
    return image;
  }
}

function trimTransparentSprite(image) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return image;
    }

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    // Player frames already have a transparent background, so we crop only by alpha.
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] === 0) {
        continue;
      }

      const pixelIndex = index / 4;
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    if (maxX < minX || maxY < minY) {
      return canvas;
    }

    const trimmed = document.createElement("canvas");
    trimmed.width = maxX - minX + 1;
    trimmed.height = maxY - minY + 1;
    const trimmedContext = trimmed.getContext("2d");

    if (!trimmedContext) {
      return canvas;
    }

    trimmedContext.imageSmoothingEnabled = false;
    trimmedContext.drawImage(canvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
    return trimmed;
  } catch (error) {
    console.warn("Transparent sprite trim failed, using original image instead.", error);
    return image;
  }
}

function createTileCanvas(image, options = {}) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = GAME_CONFIG.tileSize;
    canvas.height = GAME_CONFIG.tileSize;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return image;
    }

    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize);

    if (options.healSeams) {
      healTileSeams(canvas, options.threshold ?? 760);
      blendTileBorders(canvas, options.threshold ?? 760);
    }

    return canvas;
  } catch (error) {
    console.warn("Tile preprocessing failed, using original image instead.", error);
    return image;
  }
}

function healTileSeams(canvas, threshold = 760) {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const nextPixels = new Uint8ClampedArray(pixels);

  // Only pure white seam pixels are repaired so the underlying tile art stays the same.
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const brightness = pixels[index] + pixels[index + 1] + pixels[index + 2];

      if (brightness < threshold) {
        continue;
      }

      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) {
            continue;
          }

          const neighborX = x + offsetX;
          const neighborY = y + offsetY;

          if (neighborX < 0 || neighborX >= canvas.width || neighborY < 0 || neighborY >= canvas.height) {
            continue;
          }

          const neighborIndex = (neighborY * canvas.width + neighborX) * 4;
          const neighborBrightness = pixels[neighborIndex] + pixels[neighborIndex + 1] + pixels[neighborIndex + 2];

          if (neighborBrightness >= threshold) {
            continue;
          }

          red += pixels[neighborIndex];
          green += pixels[neighborIndex + 1];
          blue += pixels[neighborIndex + 2];
          count += 1;
        }
      }

      if (count > 0) {
        nextPixels[index] = Math.round(red / count);
        nextPixels[index + 1] = Math.round(green / count);
        nextPixels[index + 2] = Math.round(blue / count);
      }
    }
  }

  imageData.data.set(nextPixels);
  context.putImageData(imageData, 0, 0);
}

function blendTileBorders(canvas, threshold = 760) {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const blendEdgePixel = (x, y, sampleX, sampleY) => {
    const index = (y * canvas.width + x) * 4;
    const brightness = pixels[index] + pixels[index + 1] + pixels[index + 2];

    if (brightness < threshold) {
      return;
    }

    const sampleIndex = (sampleY * canvas.width + sampleX) * 4;
    pixels[index] = pixels[sampleIndex];
    pixels[index + 1] = pixels[sampleIndex + 1];
    pixels[index + 2] = pixels[sampleIndex + 2];
  };

  // The grass tile has bright export pixels baked into its outer border, so we pull those edge colors inward.
  for (let x = 0; x < canvas.width; x += 1) {
    blendEdgePixel(x, 0, x, Math.min(2, canvas.height - 1));
    blendEdgePixel(x, 1, x, Math.min(3, canvas.height - 1));
    blendEdgePixel(x, canvas.height - 1, x, Math.max(canvas.height - 3, 0));
    blendEdgePixel(x, canvas.height - 2, x, Math.max(canvas.height - 4, 0));
  }

  for (let y = 0; y < canvas.height; y += 1) {
    blendEdgePixel(0, y, Math.min(2, canvas.width - 1), y);
    blendEdgePixel(1, y, Math.min(3, canvas.width - 1), y);
    blendEdgePixel(canvas.width - 1, y, Math.max(canvas.width - 3, 0), y);
    blendEdgePixel(canvas.width - 2, y, Math.max(canvas.width - 4, 0), y);
  }

  context.putImageData(imageData, 0, 0);
}

function createSparkleFrames() {
  const frames = [
    {
      halo: [[0, -8], [0, 8], [-8, 0], [8, 0], [-5, -5], [5, -5], [-5, 5], [5, 5]],
      outer: [[0, -6], [0, -5], [0, 5], [0, 6], [-6, 0], [-5, 0], [5, 0], [6, 0], [-4, -4], [4, -4], [-4, 4], [4, 4]],
      mid: [[0, -4], [0, -3], [0, 3], [0, 4], [-4, 0], [-3, 0], [3, 0], [4, 0], [-2, -2], [2, -2], [-2, 2], [2, 2]],
      core: [[0, -1], [0, 0], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]
    },
    {
      halo: [[0, -9], [0, 9], [-9, 0], [9, 0], [-7, -3], [7, -3], [-7, 3], [7, 3], [-3, -7], [3, -7], [-3, 7], [3, 7]],
      outer: [[0, -7], [0, -6], [0, 6], [0, 7], [-7, 0], [-6, 0], [6, 0], [7, 0], [-5, -2], [5, -2], [-5, 2], [5, 2], [-2, -5], [2, -5], [-2, 5], [2, 5]],
      mid: [[-4, -4], [-3, -3], [3, -3], [4, -4], [-4, 4], [-3, 3], [3, 3], [4, 4], [0, -4], [0, 4], [-4, 0], [4, 0], [-2, -2], [2, -2], [-2, 2], [2, 2]],
      core: [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]
    },
    {
      halo: [[-8, -1], [-8, 1], [8, -1], [8, 1], [-1, -8], [1, -8], [-1, 8], [1, 8], [-6, -6], [6, -6], [-6, 6], [6, 6]],
      outer: [[-6, -1], [-6, 1], [6, -1], [6, 1], [-1, -6], [1, -6], [-1, 6], [1, 6], [-5, -4], [5, -4], [-5, 4], [5, 4], [-4, -5], [4, -5], [-4, 5], [4, 5]],
      mid: [[-4, -1], [-4, 1], [4, -1], [4, 1], [-1, -4], [1, -4], [-1, 4], [1, 4], [-3, -3], [3, -3], [-3, 3], [3, 3], [-2, 0], [2, 0], [0, -2], [0, 2]],
      core: [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]
    },
    {
      halo: [[0, -8], [0, 8], [-8, 0], [8, 0], [-6, -3], [6, -3], [-6, 3], [6, 3], [-3, -6], [3, -6], [-3, 6], [3, 6]],
      outer: [[0, -6], [0, -5], [0, 5], [0, 6], [-6, 0], [-5, 0], [5, 0], [6, 0], [-4, -3], [4, -3], [-4, 3], [4, 3], [-3, -4], [3, -4], [-3, 4], [3, 4]],
      mid: [[-3, -1], [3, -1], [-3, 1], [3, 1], [-1, -3], [1, -3], [-1, 3], [1, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]],
      core: [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]
    },
    {
      halo: [[-7, 0], [7, 0], [0, -7], [0, 7], [-5, -5], [5, -5], [-5, 5], [5, 5]],
      outer: [[-5, 0], [5, 0], [0, -5], [0, 5], [-4, -4], [4, -4], [-4, 4], [4, 4], [-2, -6], [2, -6], [-2, 6], [2, 6], [-6, -2], [6, -2], [-6, 2], [6, 2]],
      mid: [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2], [-1, -4], [1, -4], [-1, 4], [1, 4], [-4, -1], [4, -1], [-4, 1], [4, 1]],
      core: [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]
    }
  ];

  return frames.map((frame) => {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext("2d");

    if (!context) {
      return canvas;
    }

    context.imageSmoothingEnabled = false;

    const drawPoints = (points, color) => {
      context.fillStyle = color;
      for (const [x, y] of points) {
        context.fillRect(12 + x, 12 + y, 1, 1);
      }
    };

    // These larger layers keep the sparkle crisp at the newer art scale without feeling disconnected from the meadow palette.
    drawPoints(frame.halo, "#a7d64b");
    drawPoints(frame.outer, "#f0b847");
    drawPoints(frame.mid, "#ffe07d");
    drawPoints(frame.core, "#fff6c9");
    return canvas;
  });
}

async function loadCharacterAssets(characterOption) {
  const [sitImage, ...playerFrameImages] = await Promise.all([
    loadImage(characterOption.sit),
    ...Object.values(characterOption.playerFrames).flat().map((path) => loadImage(path))
  ]);

  // Each character keeps the same four-direction animation contract, which lets the rest of the game stay generic.
  const playerFrames = {
    down: playerFrameImages.slice(0, 2).map((image) => trimTransparentSprite(image)),
    left: playerFrameImages.slice(2, 4).map((image) => trimTransparentSprite(image)),
    up: playerFrameImages.slice(4, 6).map((image) => trimTransparentSprite(image)),
    right: playerFrameImages.slice(6, 8).map((image) => trimTransparentSprite(image))
  };

  return {
    sit: trimTransparentSprite(sitImage),
    playerFrames
  };
}

async function loadDirectionalPartnerAssets(partnerOption) {
  const [sitImage, ...partnerFrameImages] = await Promise.all([
    loadImage(partnerOption.sit),
    ...Object.values(partnerOption.playerFrames).flat().map((path) => loadImage(path))
  ]);

  return {
    sit: trimTransparentSprite(sitImage),
    playerFrames: {
      down: partnerFrameImages.slice(0, 2).map((image) => trimTransparentSprite(image)),
      left: partnerFrameImages.slice(2, 4).map((image) => trimTransparentSprite(image)),
      up: partnerFrameImages.slice(4, 6).map((image) => trimTransparentSprite(image)),
      right: partnerFrameImages.slice(6, 8).map((image) => trimTransparentSprite(image))
    }
  };
}

async function loadAssets() {
  const [
    grassImage,
    stoneImage,
    cliffImage,
    treeImage,
    bushImage,
    rockImage,
    benchImage,
    fenceHorizontalImage,
    fenceVerticalImage,
    pathImage,
    oceanImage,
    strawberryWalk0Image,
    strawberryWalk1Image,
    strawberrySitImage,
    heart0Image,
    heart1Image,
    heart2Image
  ] = await Promise.all([
    loadImage(GAME_CONFIG.assets.grass),
    loadImage(GAME_CONFIG.assets.stone),
    loadImage(GAME_CONFIG.assets.cliff),
    loadImage(GAME_CONFIG.assets.tree),
    loadImage(GAME_CONFIG.assets.bush),
    loadImage(GAME_CONFIG.assets.rock),
    loadImage(GAME_CONFIG.assets.bench),
    loadImage(GAME_CONFIG.assets.fenceHorizontal),
    loadImage(GAME_CONFIG.assets.fenceVertical),
    loadImage(GAME_CONFIG.assets.path),
    loadImage(GAME_CONFIG.assets.ocean),
    ...GAME_CONFIG.assets.strawberryWalk.map((path) => loadImage(path)),
    loadImage(GAME_CONFIG.assets.strawberrySit),
    ...GAME_CONFIG.assets.hearts.map((path) => loadImage(path))
  ]);

  const characters = Object.fromEntries(
    await Promise.all(
      Object.entries(CHARACTER_OPTIONS).map(async ([characterId, characterOption]) => {
        const characterAssets = await loadCharacterAssets(characterOption);
        return [characterId, characterAssets];
      })
    )
  );

  const partners = Object.fromEntries(
    await Promise.all(
      Object.entries(PARTNER_OPTIONS)
        .filter(([, partnerOption]) => partnerOption.type === "directional")
        .map(async ([partnerId, partnerOption]) => {
          const partnerAssets = await loadDirectionalPartnerAssets(partnerOption);
          return [partnerId, partnerAssets];
        })
    )
  );

  return {
    grass: createTileCanvas(grassImage),
    stone: createTileCanvas(stoneImage, { healSeams: true, threshold: 745 }),
    cliff: createTileCanvas(cliffImage),
    tree: trimSprite(treeImage, 96),
    bush: trimSprite(bushImage, 96),
    rock: trimSprite(rockImage, 96),
    bench: trimTransparentSprite(benchImage),
    fenceHorizontal: trimSprite(fenceHorizontalImage, 96),
    fenceVertical: trimSprite(fenceVerticalImage, 96),
    path: createTileCanvas(pathImage),
    ocean: oceanImage,
    strawberryWalk: [strawberryWalk0Image, strawberryWalk1Image].map((image) => trimTransparentSprite(image)),
    strawberrySit: trimTransparentSprite(strawberrySitImage),
    heartFrames: [heart0Image, heart1Image, heart2Image].map((image) => trimTransparentSprite(image)),
    characters,
    partners,
    sparkleFrames: createSparkleFrames()
  };
}

function sampleWaypointPath(waypoints, progress) {
  const segments = [];
  let totalLength = 0;

  // We walk the cutscene actors across measured segment lengths so both curves feel evenly paced.
  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const from = waypoints[index];
    const to = waypoints[index + 1];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    segments.push({ from, to, length });
    totalLength += length;
  }

  if (totalLength === 0 || segments.length === 0) {
    return { ...waypoints[0], facing: "up", stepPhase: 0 };
  }

  let remaining = totalLength * clamp(progress, 0, 1);

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    if (remaining <= segment.length || index === segments.length - 1) {
      const localProgress = segment.length === 0 ? 0 : remaining / segment.length;
      const x = lerp(segment.from.x, segment.to.x, localProgress);
      const y = lerp(segment.from.y, segment.to.y, localProgress);
      const dx = segment.to.x - segment.from.x;
      const dy = segment.to.y - segment.from.y;
      const facing = Math.abs(dx) > Math.abs(dy)
        ? (dx >= 0 ? "right" : "left")
        : (dy >= 0 ? "down" : "up");

      return {
        x,
        y,
        facing,
        stepPhase: Math.floor(progress * 8) % 2
      };
    }

    remaining -= segment.length;
  }

  const fallback = waypoints[waypoints.length - 1];
  return { ...fallback, facing: "up", stepPhase: 0 };
}

function getEndingActorState() {
  const walkProgress = clamp(state.endingCutscene.timeline / ENDING_WALK_DURATION, 0, 1);
  const isSeated = walkProgress >= 1;

  return {
    walkProgress,
    isSeated,
    cat: sampleWaypointPath(CAT_ENDING_PATH, walkProgress),
    strawberry: sampleWaypointPath(STRAWBERRY_ENDING_PATH, walkProgress)
  };
}

function getSelectedCharacterAssets() {
  return state.assets?.characters?.[state.selectedCharacterId] ?? state.assets?.characters?.white;
}

function getSelectedPartnerAssets() {
  return state.assets?.partners?.[getSelectedPartnerId()] ?? null;
}

function updateHud() {
  const completed = state.completedStopIds.size;
  const total = GAME_CONFIG.stops.length;
  const nextStop = getNextRequiredStop();

  progressText.textContent = `${completed} / ${total} memories`;

  if (state.endingCutscene.active) {
    objectiveText.textContent = "Enjoy the view.";
    return;
  }

  if (state.isEndingUnlocked) {
    objectiveText.textContent = "Take in the ocean and enjoy the fireworks.";
    return;
  }

  if (nextStop) {
    objectiveText.textContent = `Reach "${nextStop.title}" and interact before the route opens.`;
    return;
  }

  objectiveText.textContent = 'Meet the strawberry at the bench and interact.';
}

function getCenteredCameraOrigin() {
  const viewportCenter = VIEWPORT_PIXELS / 2;
  return {
    x: Math.round(viewportCenter - (state.player.x * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2)),
    y: Math.round(viewportCenter - (state.player.y * GAME_CONFIG.tileSize + GAME_CONFIG.tileSize / 2))
  };
}

function getCameraOrigin() {
  const centered = getCenteredCameraOrigin();

  if (!state.endingCutscene.active) {
    return centered;
  }

  // The finale slowly pushes the camera upward so the ocean view takes over.
  return {
    x: centered.x,
    y: Math.round(centered.y + lerp(0, GAME_CONFIG.tileSize * 5.5, state.endingCutscene.progress))
  };
}

function drawPixelRect(context, x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function drawPixelLine(context, x, y, width, height, color) {
  drawPixelRect(context, x, y, width, height, color);
}

function drawStyledBush(screenX, screenY) {
  // The generated bush stays compact so it decorates the lane without swallowing the grass tile.
  gameContext.drawImage(state.assets.bush, screenX + 6, screenY + 18, 36, 32);
}

function drawStyledTree(screenX, screenY) {
  // The new tree keeps more detail than the old blocky stand-in, but still fits inside one map tile.
  gameContext.drawImage(state.assets.tree, screenX + 8, screenY + 2, 32, 42);
}

function drawFence(screenX, screenY, isVertical) {
  if (isVertical) {
    gameContext.drawImage(state.assets.fenceVertical, screenX + 11, screenY + 3, 26, 42);
  } else {
    gameContext.drawImage(state.assets.fenceHorizontal, screenX + 3, screenY + 12, 42, 24);
  }
}

function drawOceanBench(screenX, screenY) {
  // The finale bench spans two cliff tiles so both characters can sit together without crowding.
  gameContext.drawImage(
    state.assets.bench,
    screenX + BENCH_DRAW_OFFSET.x,
    screenY + BENCH_DRAW_OFFSET.y,
    BENCH_DRAW_SIZE.width,
    BENCH_DRAW_SIZE.height
  );
}

function getFireflySwarmLights(screenX, screenY, tileX, tileY) {
  const centerX = screenX + 24;
  const centerY = screenY + 22;

  return FIREFLY_SWARM_OFFSETS.map((offset, index) => {
    // Each light gets its own stagger so one tile feels like a small swarm instead of one blinking dot.
    const pulse = (Math.floor((state.fireflyTime + (tileX * 91) + (tileY * 57) + (index * 73)) / 170) + offset.phase) % 4;
    const intensity = [0.4, 0.75, 1, 0.6][pulse];
    const sizeBoost = intensity > 0.9 ? 1 : 0;
    const coreColor = pulse === 2 ? "#fff7cf" : pulse === 1 ? "#f7e66f" : "#d8f07a";

    return {
      x: centerX + offset.x,
      y: centerY + offset.y,
      size: offset.size + sizeBoost,
      intensity,
      coreColor
    };
  });
}

function drawSoftGlow(x, y, palette, scale = 1) {
  // A few stacked translucent squares create a pixel-friendly halo that can brighten nearby sprites too.
  const layers = [
    { size: Math.round(22 * scale), color: palette[0] },
    { size: Math.round(14 * scale), color: palette[1] },
    { size: Math.round(8 * scale), color: palette[2] }
  ];

  for (const layer of layers) {
    drawPixelRect(
      gameContext,
      Math.round(x - layer.size / 2),
      Math.round(y - layer.size / 2),
      layer.size,
      layer.size,
      layer.color
    );
  }
}

function drawFireflies(screenX, screenY, tileX, tileY) {
  const activeLights = getFireflySwarmLights(screenX, screenY, tileX, tileY);

  for (const light of activeLights) {
    drawPixelRect(
      gameContext,
      Math.round(light.x - light.size / 2),
      Math.round(light.y - light.size / 2),
      light.size,
      light.size,
      light.coreColor
    );
  }
}

function drawFireflyGlow(screenX, screenY, tileX, tileY) {
  const activeLights = getFireflySwarmLights(screenX, screenY, tileX, tileY);

  gameContext.save();
  // `lighten` keeps overlapping glow areas from stacking brighter and brighter on top of each other.
  gameContext.globalCompositeOperation = "lighten";

  for (const light of activeLights) {
    drawSoftGlow(light.x, light.y, FIREFLY_GLOW_COLORS, 0.65 + light.intensity * 0.55);
  }

  gameContext.restore();
}

function drawMemoryGlow(stop, cameraX, cameraY) {
  const tileLeft = stop.x * GAME_CONFIG.tileSize + cameraX;
  const tileTop = stop.y * GAME_CONFIG.tileSize + cameraY;
  const centerX = tileLeft + GAME_CONFIG.tileSize / 2;
  const centerY = tileTop + GAME_CONFIG.tileSize / 2;
  const shimmer = state.sparkleFrame % 3;

  gameContext.save();
  // Memories use the same non-stacking blend mode so nearby light sources stay soft instead of compounding.
  gameContext.globalCompositeOperation = "lighten";

  // The memory glow follows the sparkle animation so it feels like the same magical source of light.
  for (let index = 0; index < MEMORY_GLOW_OFFSETS.length; index += 1) {
    const offset = MEMORY_GLOW_OFFSETS[(index + shimmer) % MEMORY_GLOW_OFFSETS.length];
    const scale = index === 0 ? 1.15 : 0.7 + ((index + shimmer) % 3) * 0.12;
    drawSoftGlow(centerX + offset.x, centerY + offset.y, MEMORY_GLOW_COLORS, scale);
  }

  gameContext.restore();
}

function drawLighting(cameraX, cameraY) {
  // Lighting is drawn after the night tint so glows brighten the world, props, and nearby cat pixels together.
  for (let y = 0; y < GAME_CONFIG.mapHeight; y += 1) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x += 1) {
      const screenX = x * GAME_CONFIG.tileSize + cameraX;
      const screenY = y * GAME_CONFIG.tileSize + cameraY;

      if (screenX <= -GAME_CONFIG.tileSize || screenY <= -GAME_CONFIG.tileSize || screenX >= VIEWPORT_PIXELS || screenY >= VIEWPORT_PIXELS) {
        continue;
      }

      if (fireflySet.has(positionKey(x, y))) {
        drawFireflyGlow(screenX, screenY, x, y);
      }
    }
  }

  for (const stop of GAME_CONFIG.stops) {
    if (state.completedStopIds.has(stop.id)) {
      continue;
    }

    drawMemoryGlow(stop, cameraX, cameraY);
  }
}

function drawTextureTile(image, screenX, screenY, tileX, tileY) {
  gameContext.drawImage(image, screenX, screenY);
}

function drawGrassTile(screenX, screenY, tileX, tileY) {
  // A flat meadow underlay hides tiny transparent corner gaps without changing the grass art itself.
  drawPixelRect(gameContext, screenX, screenY, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize, LAND_BASE_COLOR);
  drawTextureTile(state.assets.grass, screenX, screenY, tileX, tileY);
}

function drawPathTile(screenX, screenY, tileX, tileY, neighbors) {
  drawGrassTile(screenX, screenY, tileX, tileY);
  const centerX = screenX + 24;
  const centerY = screenY + 24;
  const pathPattern = state.assets.pathPattern ??= gameContext.createPattern(state.assets.path, "repeat");

  const paintSegment = (x, y, width, height) => {
    // The repeated dirt texture keeps the hand-painted feel while the rectangle masks preserve the route logic.
    gameContext.save();
    gameContext.translate(screenX, screenY);
    gameContext.fillStyle = pathPattern;
    gameContext.fillRect(x - screenX, y - screenY, width, height);
    gameContext.restore();
  };

  // The path keeps the same route shape but now uses the new textured dirt instead of flat blocks.
  paintSegment(centerX - 11, centerY - 11, 22, 22);
  drawPixelRect(gameContext, centerX - 8, centerY - 8, 16, 2, "#edd8b0");
  drawPixelRect(gameContext, centerX - 4, centerY + 2, 3, 2, "#a97848");
  drawPixelRect(gameContext, centerX + 4, centerY - 1, 2, 2, "#a97848");

  if (neighbors.up) {
    paintSegment(centerX - 11, screenY, 22, 17);
  }
  if (neighbors.down) {
    paintSegment(centerX - 11, screenY + 31, 22, 17);
  }
  if (neighbors.left) {
    paintSegment(screenX, centerY - 11, 17, 22);
  }
  if (neighbors.right) {
    paintSegment(screenX + 31, centerY - 11, 17, 22);
  }

  // A couple of grass nicks stop the path from feeling stamped on top of the meadow.
  drawPixelRect(gameContext, screenX + 10, screenY + 7, 6, 2, "#7faa47");
  drawPixelRect(gameContext, screenX + 32, screenY + 39, 5, 2, "#7faa47");
}

function drawCliffTopTile(screenX, screenY, tileX, tileY) {
  drawTextureTile(state.assets.stone, screenX, screenY, tileX, tileY);
  drawPixelRect(gameContext, screenX, screenY, 48, 5, "rgba(255,255,255,0.12)");
}

function drawCliffWallTile(screenX, screenY, tileX, tileY) {
  drawTextureTile(state.assets.cliff, screenX, screenY, tileX, tileY);
}

function drawOverlookTile(screenX, screenY, tileX, tileY) {
  drawTextureTile(state.assets.stone, screenX, screenY, tileX + 2, tileY + 2);
}

function drawBench(screenX, screenY) {
  drawOceanBench(screenX, screenY);
}

function drawIdlePartner(screenX, screenY) {
  const selectedPartnerId = getSelectedPartnerId();
  const selectedPartnerOption = getSelectedPartnerOption();

  if (selectedPartnerId === "strawberry") {
    const frame = state.assets.strawberryWalk[Math.floor(state.lastTimestamp / 260) % state.assets.strawberryWalk.length];
    gameContext.drawImage(
      frame,
      screenX + 7,
      screenY + 7,
      STRAWBERRY_DRAW_SIZE.width,
      STRAWBERRY_DRAW_SIZE.height
    );
    return;
  }

  const selectedPartnerAssets = getSelectedPartnerAssets();
  const frame = selectedPartnerAssets?.playerFrames?.down?.[Math.floor(state.lastTimestamp / 260) % 2];
  if (!frame) {
    return;
  }

  gameContext.drawImage(
    frame,
    screenX + (GAME_CONFIG.tileSize - selectedPartnerOption.draw.width) / 2 + selectedPartnerOption.draw.offsetX,
    screenY + (GAME_CONFIG.tileSize - selectedPartnerOption.draw.height) / 2 + selectedPartnerOption.draw.offsetY,
    selectedPartnerOption.draw.width,
    selectedPartnerOption.draw.height
  );
}

function drawWorldSprite(image, worldX, worldY, width, height, cameraX, cameraY, offsetX = 0, offsetY = 0) {
  const screenX = worldX * GAME_CONFIG.tileSize + cameraX + (GAME_CONFIG.tileSize - width) / 2 + offsetX;
  const screenY = worldY * GAME_CONFIG.tileSize + cameraY + (GAME_CONFIG.tileSize - height) / 2 + offsetY;
  gameContext.drawImage(image, screenX, screenY, width, height);
}

function drawEndingBenchOverlay(cameraX, cameraY) {
  const overlayThreshold = 0.62;
  const actorState = getEndingActorState();

  if (actorState.walkProgress < overlayThreshold) {
    return;
  }

  const screenX = BENCH_POSITION.x * GAME_CONFIG.tileSize + cameraX;
  const screenY = BENCH_POSITION.y * GAME_CONFIG.tileSize + cameraY;

  // Once both characters have moved around the bench, drawing it again in the foreground sells the seated overlap.
  drawBench(screenX, screenY);
}

function drawEndingHearts(cameraX, cameraY) {
  if (state.endingCutscene.timeline < ENDING_WALK_DURATION) {
    return;
  }

  const heartFrames = state.assets.heartFrames;
  const benchScreenX = BENCH_POSITION.x * GAME_CONFIG.tileSize + cameraX + BENCH_DRAW_OFFSET.x;
  const benchScreenY = BENCH_POSITION.y * GAME_CONFIG.tileSize + cameraY + BENCH_DRAW_OFFSET.y;
  const seatedHeartAnchors = [
    { x: benchScreenX + 22, y: benchScreenY + 4, delay: 0 },
    { x: benchScreenX + 58, y: benchScreenY + 6, delay: 320 },
    { x: benchScreenX + 34, y: benchScreenY - 8, delay: 640 },
    { x: benchScreenX + 50, y: benchScreenY - 10, delay: 960 }
  ];

  // Anchoring directly to the drawn bench keeps the hearts visible even after the camera finishes its upward move.
  for (const anchor of seatedHeartAnchors) {
    const localTime = Math.max(0, state.endingCutscene.heartLoopTime + anchor.delay);
    const cycle = (localTime % 1500) / 1500;
    const heartFrame = heartFrames[Math.floor(cycle * heartFrames.length) % heartFrames.length];
    const sway = Math.sin(cycle * Math.PI * 2) * 3;
    const rise = cycle * 18;
    const x = anchor.x + sway;
    const y = anchor.y - rise;
    gameContext.drawImage(heartFrame, x, y, 18, 18);
  }
}

function drawEndingActors(cameraX, cameraY) {
  const actorState = getEndingActorState();
  const selectedCharacterAssets = getSelectedCharacterAssets();
  const selectedCharacterOption = getSelectedCharacterOption();
  const selectedPartnerAssets = getSelectedPartnerAssets();
  const selectedPartnerId = getSelectedPartnerId();
  const selectedPartnerOption = getSelectedPartnerOption();
  const catFrame = actorState.isSeated
    ? selectedCharacterAssets?.sit
    : selectedCharacterAssets?.playerFrames?.[actorState.cat.facing]?.[actorState.cat.stepPhase];
  const partnerFrame = selectedPartnerId === "strawberry"
    ? (actorState.isSeated
        ? state.assets.strawberrySit
        : state.assets.strawberryWalk[actorState.strawberry.stepPhase])
    : (actorState.isSeated
        ? selectedPartnerAssets?.sit
        : selectedPartnerAssets?.playerFrames?.[actorState.strawberry.facing]?.[actorState.strawberry.stepPhase]);

  // While moving, both characters use standing poses; once seated we swap into dedicated bench sprites.
  if (actorState.isSeated) {
    drawWorldSprite(
      catFrame,
      actorState.cat.x,
      actorState.cat.y,
      selectedCharacterOption.seatedDraw.width,
      selectedCharacterOption.seatedDraw.height,
      cameraX,
      cameraY,
      selectedCharacterOption.seatedDraw.offsetX,
      selectedCharacterOption.seatedDraw.offsetY
    );
    drawWorldSprite(
      partnerFrame,
      actorState.strawberry.x,
      actorState.strawberry.y,
      selectedPartnerOption.seatedDraw.width,
      selectedPartnerOption.seatedDraw.height,
      cameraX,
      cameraY,
      selectedPartnerOption.seatedDraw.offsetX,
      selectedPartnerOption.seatedDraw.offsetY
    );
  } else {
    drawWorldSprite(
      catFrame,
      actorState.cat.x,
      actorState.cat.y,
      selectedCharacterOption.worldDraw.width,
      selectedCharacterOption.worldDraw.height,
      cameraX,
      cameraY,
      selectedCharacterOption.worldDraw.offsetX,
      selectedCharacterOption.worldDraw.offsetY
    );
    drawWorldSprite(
      partnerFrame,
      actorState.strawberry.x,
      actorState.strawberry.y,
      selectedPartnerOption.draw.width,
      selectedPartnerOption.draw.height,
      cameraX,
      cameraY,
      selectedPartnerOption.draw.offsetX,
      selectedPartnerOption.draw.offsetY
    );
  }
}

function shouldShowOceanBackdrop() {
  return state.player.y <= 9 || state.endingCutscene.active;
}

function drawOceanBackdrop() {
  gameContext.drawImage(state.assets.ocean, 0, 0, VIEWPORT_PIXELS, VIEWPORT_PIXELS);

  // Tiny star clusters give the night sky some life without leaving the pixel grid.
  const stars = [
    [22, 24], [61, 34], [109, 18], [142, 41], [187, 27], [246, 21], [281, 46],
    [322, 26], [369, 19], [422, 39], [448, 22], [77, 72], [156, 81], [238, 67],
    [314, 88], [391, 73], [444, 85]
  ];

  for (const [x, y] of stars) {
    drawPixelRect(gameContext, x, y, 2, 2, "#c7d8ff");
    drawPixelRect(gameContext, x + 2, y + 2, 2, 2, "#8aa9ff");
  }
}

function drawNightWorldTint(cameraX, cameraY) {
  gameContext.save();

  // Tint only the map-driven world tiles so the night sky and ocean backdrop stay bright in the distance.
  for (let y = 0; y < GAME_CONFIG.mapHeight; y += 1) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x += 1) {
      const terrain = getTerrainType(x, y);

      if (terrain === "o") {
        continue;
      }

      const screenX = x * GAME_CONFIG.tileSize + cameraX;
      const screenY = y * GAME_CONFIG.tileSize + cameraY;

      if (
        screenX <= -GAME_CONFIG.tileSize ||
        screenY <= -GAME_CONFIG.tileSize ||
        screenX >= VIEWPORT_PIXELS ||
        screenY >= VIEWPORT_PIXELS
      ) {
        continue;
      }

      drawPixelRect(gameContext, screenX, screenY, GAME_CONFIG.tileSize, GAME_CONFIG.tileSize, NIGHT_TINT_COLOR);
    }
  }

  gameContext.restore();
}

function getPathNeighbors(x, y) {
  return {
    up: PATH_TILES.has(positionKey(x, y - 1)),
    down: PATH_TILES.has(positionKey(x, y + 1)),
    left: PATH_TILES.has(positionKey(x - 1, y)),
    right: PATH_TILES.has(positionKey(x + 1, y))
  };
}

function drawPlayer() {
  if (state.endingCutscene.active) {
    return;
  }

  const selectedCharacterAssets = getSelectedCharacterAssets();
  const selectedCharacterOption = getSelectedCharacterOption();
  const center = VIEWPORT_PIXELS / 2;
  const cutsceneOffset = state.endingCutscene.active
    ? Math.round(lerp(0, GAME_CONFIG.tileSize * 5.5, state.endingCutscene.progress))
    : 0;
  const baseX = center - GAME_CONFIG.tileSize / 2;
  const baseY = center - GAME_CONFIG.tileSize / 2 + cutsceneOffset;
  const frames = selectedCharacterAssets?.playerFrames?.[state.facing] ?? selectedCharacterAssets?.playerFrames?.down;
  const frame = frames?.[state.stepPhase] ?? frames?.[0];

  if (!frame) {
    return;
  }

  // The cat sprite stays centered in the tile while still getting a tiny step bounce from movement.
  const bobOffset = state.stepPhase === 0 ? -1 : 1;
  gameContext.drawImage(
    frame,
    baseX + selectedCharacterOption.worldDraw.offsetX,
    baseY + selectedCharacterOption.worldDraw.offsetY + bobOffset,
    selectedCharacterOption.worldDraw.width,
    selectedCharacterOption.worldDraw.height
  );
}

function drawStopSparkle(stop, cameraX, cameraY) {
  const frame = state.assets.sparkleFrames[state.sparkleFrame % state.assets.sparkleFrames.length];
  const sparkleSize = 90;
  const tileLeft = stop.x * GAME_CONFIG.tileSize + cameraX;
  const tileTop = stop.y * GAME_CONFIG.tileSize + cameraY;
  const x = tileLeft + (GAME_CONFIG.tileSize - sparkleSize) / 2;
  const y = tileTop + (GAME_CONFIG.tileSize - sparkleSize) / 2;

  // Centering from the tile bounds keeps the sparkle locked to the grid even at larger showcase sizes.
  gameContext.drawImage(frame, x, y, sparkleSize, sparkleSize);
}

function drawMemoryMarker(stop, cameraX, cameraY) {
  const markerX = stop.x * GAME_CONFIG.tileSize + cameraX;
  const markerY = stop.y * GAME_CONFIG.tileSize + cameraY;

  if (state.completedStopIds.has(stop.id)) {
    drawPixelRect(gameContext, markerX + 15, markerY + 15, 18, 18, "#f2c85e");
    drawPixelRect(gameContext, markerX + 18, markerY + 18, 12, 12, "#ffef9e");
    return;
  }

  drawStopSparkle(stop, cameraX, cameraY);
}

function drawGate(tileX, tileY, cameraX, cameraY) {
  const neighbors = getPathNeighbors(tileX, tileY);
  const isVerticalPath = (neighbors.up || neighbors.down) && !neighbors.left && !neighbors.right;
  const x = tileX * GAME_CONFIG.tileSize + cameraX;
  const y = tileY * GAME_CONFIG.tileSize + cameraY;
  drawFence(x, y, isVerticalPath);
}

function drawTile(tileX, tileY, cameraX, cameraY) {
  const terrain = getTerrainType(tileX, tileY);
  const screenX = tileX * GAME_CONFIG.tileSize + cameraX;
  const screenY = tileY * GAME_CONFIG.tileSize + cameraY;

  if (screenX <= -GAME_CONFIG.tileSize || screenY <= -GAME_CONFIG.tileSize || screenX >= VIEWPORT_PIXELS || screenY >= VIEWPORT_PIXELS) {
    return;
  }

  if (terrain === "o") {
    return;
  }

  if (terrain === "g") {
    drawGrassTile(screenX, screenY, tileX, tileY);
  } else if (terrain === "p") {
    drawPathTile(screenX, screenY, tileX, tileY, getPathNeighbors(tileX, tileY));
  } else if (terrain === "c") {
    drawCliffTopTile(screenX, screenY, tileX, tileY);
  } else if (terrain === "v") {
    drawCliffWallTile(screenX, screenY, tileX, tileY);
  } else if (terrain === "a") {
    drawOverlookTile(screenX, screenY, tileX, tileY);
  }
}

function drawDecor(tileX, tileY, cameraX, cameraY) {
  const screenX = tileX * GAME_CONFIG.tileSize + cameraX;
  const screenY = tileY * GAME_CONFIG.tileSize + cameraY;
  const tileKey = positionKey(tileX, tileY);

  if (fireflySet.has(tileKey)) {
    drawFireflies(screenX, screenY, tileX, tileY);
  }

  if (bushSet.has(tileKey)) {
    drawStyledBush(screenX, screenY);
  }

  if (rockSet.has(tileKey)) {
    gameContext.drawImage(state.assets.rock, screenX + 8, screenY + 10, 30, 24);
  }

  if (tileX === BENCH_POSITION.x && tileY === BENCH_POSITION.y) {
    drawBench(screenX, screenY);
  }

  if (!state.endingCutscene.active && tileX === STRAWBERRY_POSITION.x && tileY === STRAWBERRY_POSITION.y) {
    drawIdlePartner(screenX, screenY);
  }

  if (treeSet.has(tileKey)) {
    drawStyledTree(screenX, screenY);
  }
}

function updateCutscene(delta) {
  if (!state.endingCutscene.active) {
    return;
  }

  state.endingCutscene.timeline = clamp(state.endingCutscene.timeline + delta, 0, ENDING_TOTAL_DURATION);
  state.endingCutscene.heartTime += delta;
  state.endingCutscene.heartLoopTime += delta;
  if (state.endingCutscene.heartTime >= 220) {
    state.endingCutscene.heartFrame = (state.endingCutscene.heartFrame + 1) % state.assets.heartFrames.length;
    state.endingCutscene.heartTime = 0;
  }

  // The camera waits until both characters are seated, then drifts upward toward the ocean reveal.
  const cameraTime = Math.max(0, state.endingCutscene.timeline - ENDING_WALK_DURATION);
  state.endingCutscene.progress = clamp(cameraTime / ENDING_CAMERA_DURATION, 0, 1);

  if (!state.endingCutscene.fireworksStarted && state.endingCutscene.timeline >= ENDING_WALK_DURATION + 500) {
    state.endingCutscene.fireworksStarted = true;
    unlockEnding();
  }

  if (state.endingCutscene.progress >= 1) {
    endingBanner.classList.remove("hidden");
  }
}

function renderGame(timestamp = 0) {
  const delta = state.lastTimestamp === 0 ? 16 : timestamp - state.lastTimestamp;
  state.lastTimestamp = timestamp;
  state.sparkleTime += delta;
  state.fireflyTime += delta;

  if (state.sparkleTime >= 400) {
    state.sparkleFrame = (state.sparkleFrame + 1) % state.assets.sparkleFrames.length;
    state.sparkleTime = 0;
  }

  updateCutscene(delta);

  const camera = getCameraOrigin();
  gameContext.clearRect(0, 0, VIEWPORT_PIXELS, VIEWPORT_PIXELS);
  gameContext.imageSmoothingEnabled = false;
  if (shouldShowOceanBackdrop()) {
    drawOceanBackdrop();
  } else {
    drawPixelRect(gameContext, 0, 0, VIEWPORT_PIXELS, VIEWPORT_PIXELS, "#87cb4f");
  }

  // Base terrain is drawn first, then larger props so layering stays clean.
  for (let y = 0; y < GAME_CONFIG.mapHeight; y += 1) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x += 1) {
      drawTile(x, y, camera.x, camera.y);
    }
  }

  for (let y = 0; y < GAME_CONFIG.mapHeight; y += 1) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x += 1) {
      drawDecor(x, y, camera.x, camera.y);
    }
  }

  for (const stop of GAME_CONFIG.stops) {
    drawMemoryMarker(stop, camera.x, camera.y);
  }

  const nextStop = getNextRequiredStop();
  if (nextStop?.gate) {
    drawGate(nextStop.gate.x, nextStop.gate.y, camera.x, camera.y);
  }

  if (state.endingCutscene.active) {
    drawEndingActors(camera.x, camera.y);
    drawEndingBenchOverlay(camera.x, camera.y);
    drawEndingHearts(camera.x, camera.y);
  }

  drawPlayer();

  // Applying the tint last lets it darken terrain, props, and characters together without touching the ocean sky.
  drawNightWorldTint(camera.x, camera.y);
  drawLighting(camera.x, camera.y);
  state.animationFrame = window.requestAnimationFrame(renderGame);
}

function launchBurst() {
  const shapes = ["ring", "heart", "star"];
  const palettes = [
    ["#ffeaa0", "#ffca5f", "#ff7b89"],
    ["#fff3bf", "#ffd166", "#ff8ab4"],
    ["#f8f4ff", "#9ed8ff", "#ff9dd7"]
  ];
  state.fireworks.push({
    x: Math.round(Math.random() * 180 + 150),
    y: Math.round(Math.random() * 70 + 45),
    age: 0,
    duration: 1200,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    palette: palettes[Math.floor(Math.random() * palettes.length)]
  });
}

function drawFireworkParticle(x, y, color) {
  drawPixelRect(fireworksContext, x - 2, y - 2, 4, 4, color);
}

function drawBurstShape(burst, progress) {
  const radius = 10 + progress * 34;
  const [core, mid, outer] = burst.palette;
  const count = burst.shape === "heart" ? 22 : burst.shape === "star" ? 18 : 20;

  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count;
    let x;
    let y;

    if (burst.shape === "heart") {
      const heartX = 16 * Math.pow(Math.sin(angle), 3);
      const heartY = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
      x = burst.x + heartX * (0.85 + progress * 0.9);
      y = burst.y + heartY * (0.85 + progress * 0.9);
    } else if (burst.shape === "star") {
      const spoke = index % 2 === 0 ? radius : radius * 0.45;
      x = burst.x + Math.cos(angle) * spoke;
      y = burst.y + Math.sin(angle) * spoke;
    } else {
      x = burst.x + Math.cos(angle) * radius;
      y = burst.y + Math.sin(angle) * radius;
    }

    const color = progress < 0.35 ? core : progress < 0.7 ? mid : outer;
    drawFireworkParticle(Math.round(x), Math.round(y), color);
  }

  drawPixelRect(fireworksContext, burst.x - 3, burst.y - 3, 6, 6, "#fffef5");
}

function drawFireworks(delta) {
  fireworksContext.clearRect(0, 0, VIEWPORT_PIXELS, VIEWPORT_PIXELS);
  fireworksContext.imageSmoothingEnabled = false;

  state.fireworks = state.fireworks.filter((burst) => burst.age < burst.duration);

  for (const burst of state.fireworks) {
    burst.age += delta;
    drawBurstShape(burst, Math.min(1, burst.age / burst.duration));
  }
}

function fireworkLoop(timestamp = 0) {
  const delta = state.fireworkLastTimestamp === 0 ? 16 : timestamp - state.fireworkLastTimestamp;
  state.fireworkLastTimestamp = timestamp;
  drawFireworks(delta);
  window.requestAnimationFrame(fireworkLoop);
}

function startFireworks() {
  if (state.isFireworksRunning) {
    return;
  }

  state.isFireworksRunning = true;
  state.fireworkLastTimestamp = 0;
  launchBurst();
  state.fireworkTimer = window.setInterval(launchBurst, 3360);
  fireworkLoop();
}

function openDialog(stop) {
  state.activeStop = stop;
  state.isDialogOpen = true;
  dialogKicker.textContent = `Memory ${state.completedStopIds.size + 1}`;
  dialogTitle.textContent = stop.title;
  dialogNote.textContent = stop.note;

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

  state.completedStopIds.add(state.activeStop.id);
  state.activeStop = null;
  state.isDialogOpen = false;
  dialogBackdrop.classList.add("hidden");
  dialogBackdrop.setAttribute("aria-hidden", "true");
  updateHud();
}

function unlockEnding() {
  if (state.isEndingUnlocked) {
    return;
  }

  state.isEndingUnlocked = true;
  updateHud();
  startFireworks();
}

function startEndingCutscene() {
  if (state.endingCutscene.active) {
    return;
  }

  state.endingCutscene.active = true;
  state.player.x = STRAWBERRY_POSITION.x;
  state.player.y = STRAWBERRY_POSITION.y;
  state.facing = "up";
  state.stepPhase = 0;
  state.endingCutscene.timeline = 0;
  state.endingCutscene.progress = 0;
  state.endingCutscene.fireworksStarted = false;
  state.endingCutscene.heartFrame = 0;
  state.endingCutscene.heartTime = 0;
  state.endingCutscene.heartLoopTime = 0;
  endingBanner.classList.add("hidden");
  updateHud();
}

function interact() {
  if (state.isCharacterPickerOpen || state.isDialogOpen || state.endingCutscene.active) {
    return;
  }

  const currentStop = stopByPosition.get(positionKey(state.player.x, state.player.y));
  if (currentStop && getNextRequiredStop()?.id === currentStop.id) {
    openDialog(currentStop);
    return;
  }

  if (
    state.completedStopIds.size === GAME_CONFIG.stops.length &&
    state.player.x === STRAWBERRY_POSITION.x &&
    state.player.y === STRAWBERRY_POSITION.y
  ) {
    startEndingCutscene();
  }
}

function movePlayer(dx, dy) {
  if (state.isCharacterPickerOpen || state.isDialogOpen || state.endingCutscene.active) {
    return;
  }

  const nextX = state.player.x + dx;
  const nextY = state.player.y + dy;

  if (!isInsideBoard(nextX, nextY) || !isWalkableTile(nextX, nextY) || isLockedTile(nextX, nextY)) {
    return;
  }

  state.player.x = nextX;
  state.player.y = nextY;
  state.facing = dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down";
  state.stepPhase = state.stepPhase === 0 ? 1 : 0;
  updateHud();
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e", " ", "enter"].includes(key)) {
    event.preventDefault();
  }

  if (state.isCharacterPickerOpen) {
    return;
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

function chooseCharacter(characterId) {
  if (!CHARACTER_OPTIONS[characterId]) {
    return;
  }

  // Selection only swaps the player asset set for now, which keeps the future partner swap isolated.
  state.selectedCharacterId = characterId;
  state.isCharacterPickerOpen = false;
  characterPicker.classList.add("hidden");
  characterPicker.setAttribute("aria-hidden", "true");
  startBackgroundMusic();
}

function initializeCharacterPicker() {
  characterPreviewWhite.src = CHARACTER_OPTIONS.white.preview;
  characterPreviewPink.src = CHARACTER_OPTIONS.pink.preview;
  characterLabelWhite.textContent = CHARACTER_OPTIONS.white.label;
  characterLabelPink.textContent = CHARACTER_OPTIONS.pink.label;
}

async function initializeGame() {
  gameContext.imageSmoothingEnabled = false;
  fireworksContext.imageSmoothingEnabled = false;
  initializeCharacterPicker();
  loadBuildVersion();
  state.assets = await loadAssets();
  updateHud();
  renderGame();
}

window.addEventListener("keydown", handleKeydown);
dialogBackdrop.addEventListener("click", (event) => {
  if (event.target === dialogBackdrop) {
    closeDialog();
  }
});
closeDialogButton.addEventListener("click", closeDialog);
characterChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => chooseCharacter(button.dataset.characterChoice));
});

initializeGame().catch((error) => {
  console.error("Failed to initialize game", error);
});
