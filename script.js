// This renderer keeps every world element on a strict pixel grid so the whole
// map feels like one consistent handheld-style scene instead of mixed assets.
const GAME_CONFIG = {
  mapWidth: 26,
  mapHeight: 36,
  viewportTiles: 10,
  tileSize: 48,
  start: { x: 13, y: 31 },
  end: { x: 13, y: 4 },
  bench: { x: 13, y: 3 },
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
      gate: { x: 10, y: 13 }
    },
    {
      id: "fourth-stop",
      title: "Almost At The View",
      note: "You can use this memory to build anticipation for the ending and hint that the ocean overlook is almost there.",
      image: "",
      x: 15,
      y: 8,
      gate: { x: 14, y: 8 }
    }
  ],
  assets: {
    tree: "assets/tree-clean.png",
    bush: "assets/bush-clean.png",
    ocean: "assets/ocean-night.png",
    sparkles: Array.from({ length: 12 }, (_, index) => `assets/sparkles/sparkle-${index}.png`),
    fireworks: Array.from({ length: 7 }, (_, index) => `assets/fireworks/firework-${index}.png`)
  }
};

// Terrain legend:
// g grass, o ocean void, c cliff top, v cliff wall, a overlook platform.
const RAW_TERRAIN_ROWS = [
  "oooooooooooooooooooooooooo",
  "oooooooooooooooooooooooooo",
  "oooooooooccccccccooooooooo",
  "oooooooaccccccccccaooooooo",
  "ooooooaaccccccccccaaoooooo",
  "gggggggaccccccccccaggggggg",
  "gggggggggccccccccggggggggg",
  "ggggggggggggccgggggggggggg",
  "gggggggggggggpgpgggggggggg",
  "gggggggggggggpgggggggggggg",
  "gggggggggggggpgggggggggggg",
  "gggggggggggggpgggggggggggg",
  "ggggggggppppppppgggggggggg",
  "ggggggggpggggggppggggggggg",
  "ggggggggpgggggggpggggggggg",
  "ggggggggpgggggggpggggggggg",
  "ggggggggpppppppppggggggggg",
  "ggggggggggggggggpggggggggg",
  "ggggggggggggggggpggggggggg",
  "ggggggggggggggggpggggggggg",
  "gggggggggggggggpppgggggggg",
  "gggggggggggggggpgggggggggg",
  "gggggggggggggggpgggggggggg",
  "gggggggggggggggpgggggggggg",
  "gggggggggggggggpgggggggggg",
  "gggggggggggggggpgggggggggg",
  "gggggggggggggggpgggggggggg",
  "gggggggggggggppppggggggggg",
  "gggggggggggggpgggggggggggg",
  "gggggggggggggpgggggggggggg",
  "gggggggggggggpgggggggggggg",
  "gggggggggggggpgggggggggggg",
  "gggggggggggggagggggggggggg",
  "gggggggggggggagggggggggggg",
  "gggggggggggggagggggggggggg",
  "vvvvvvvvvvvvvvvvvvvvvvvvvv"
];

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

const FLOWER_POSITIONS = [
  { x: 7, y: 29 }, { x: 18, y: 29 }, { x: 5, y: 23 }, { x: 20, y: 23 },
  { x: 8, y: 18 }, { x: 18, y: 18 }, { x: 9, y: 15 }, { x: 18, y: 15 },
  { x: 10, y: 10 }, { x: 15, y: 10 }, { x: 8, y: 7 }, { x: 18, y: 7 }
];

const PATH_SEGMENTS = [
  [{ x: 13, y: 31 }, { x: 13, y: 27 }],
  [{ x: 13, y: 27 }, { x: 17, y: 27 }],
  [{ x: 17, y: 27 }, { x: 17, y: 20 }],
  [{ x: 17, y: 20 }, { x: 13, y: 20 }],
  [{ x: 13, y: 20 }, { x: 13, y: 13 }],
  [{ x: 13, y: 13 }, { x: 9, y: 13 }],
  [{ x: 9, y: 13 }, { x: 15, y: 13 }],
  [{ x: 15, y: 13 }, { x: 15, y: 8 }],
  [{ x: 15, y: 8 }, { x: 13, y: 8 }],
  [{ x: 13, y: 8 }, { x: 13, y: 4 }]
];

const TERRAIN_ROWS = RAW_TERRAIN_ROWS.map((row) => row.slice(0, GAME_CONFIG.mapWidth).padEnd(GAME_CONFIG.mapWidth, "g"));
const VIEWPORT_PIXELS = GAME_CONFIG.viewportTiles * GAME_CONFIG.tileSize;
const BENCH_POSITION = GAME_CONFIG.bench;
const TREE_DRAW_OFFSET = { x: 6, y: 0 };
const BUSH_DRAW_OFFSET = { x: 4, y: 20 };

const gameCanvas = document.querySelector("#game-canvas");
const gameContext = gameCanvas.getContext("2d");
const fireworksCanvas = document.querySelector("#fireworks-canvas");
const fireworksContext = fireworksCanvas.getContext("2d");
const objectiveText = document.querySelector("#objective-text");
const progressText = document.querySelector("#progress-text");
const dialogBackdrop = document.querySelector("#dialog-backdrop");
const closeDialogButton = document.querySelector("#close-dialog");
const dialogKicker = document.querySelector("#dialog-kicker");
const dialogTitle = document.querySelector("#dialog-title");
const dialogNote = document.querySelector("#dialog-note");
const dialogImage = document.querySelector("#dialog-image");
const dialogPlaceholder = document.querySelector("#dialog-placeholder");
const endingBanner = document.querySelector("#ending-banner");

const state = {
  player: { ...GAME_CONFIG.start },
  facing: "up",
  stepPhase: 0,
  completedStopIds: new Set(),
  activeStop: null,
  isDialogOpen: false,
  isEndingUnlocked: false,
  isFireworksRunning: false,
  sparkleFrame: 0,
  sparkleTime: 0,
  fireworks: [],
  fireworkTimer: null,
  animationFrame: null,
  lastTimestamp: 0,
  assets: null,
  endingCutscene: {
    active: false,
    progress: 0,
    fireworksStarted: false
  }
};

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
const flowerSet = new Set(FLOWER_POSITIONS.map((item) => positionKey(item.x, item.y)));

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

async function loadAssets() {
  const [treeImage, bushImage, oceanImage, sparkleFrames, fireworkFrames] = await Promise.all([
    loadImage(GAME_CONFIG.assets.tree),
    loadImage(GAME_CONFIG.assets.bush),
    loadImage(GAME_CONFIG.assets.ocean),
    Promise.all(GAME_CONFIG.assets.sparkles.map((src) => loadImage(src))),
    Promise.all(GAME_CONFIG.assets.fireworks.map((src) => loadImage(src)))
  ]);

  return {
    tree: treeImage,
    bush: bushImage,
    ocean: oceanImage,
    sparkleFrames,
    fireworkFrames
  };
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

  objectiveText.textContent = "Head to the cliff and interact by the bench.";
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
    y: Math.round(centered.y + lerp(0, GAME_CONFIG.tileSize * 3.5, state.endingCutscene.progress))
  };
}

function drawPixelRect(context, x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function drawPixelLine(context, x, y, width, height, color) {
  drawPixelRect(context, x, y, width, height, color);
}

function drawGrassTile(screenX, screenY) {
  drawPixelRect(gameContext, screenX, screenY, 48, 48, "#7fc64c");
  drawPixelRect(gameContext, screenX, screenY + 24, 48, 24, "#71b63f");
  drawPixelRect(gameContext, screenX + 3, screenY + 6, 8, 8, "#93dc5a");
  drawPixelRect(gameContext, screenX + 13, screenY + 4, 5, 10, "#87d14f");
  drawPixelRect(gameContext, screenX + 22, screenY + 10, 8, 7, "#9ce064");
  drawPixelRect(gameContext, screenX + 34, screenY + 6, 6, 9, "#88ce51");
  drawPixelRect(gameContext, screenX + 39, screenY + 17, 5, 11, "#609f36");
  drawPixelRect(gameContext, screenX + 6, screenY + 28, 8, 14, "#5c9d33");
  drawPixelRect(gameContext, screenX + 19, screenY + 24, 6, 15, "#68ab38");
  drawPixelRect(gameContext, screenX + 28, screenY + 31, 7, 12, "#4d8e29");
  drawPixelRect(gameContext, screenX + 39, screenY + 30, 5, 10, "#5f9b35");
  drawPixelLine(gameContext, screenX + 8, screenY + 21, 2, 10, "#b0ef74");
  drawPixelLine(gameContext, screenX + 17, screenY + 15, 2, 10, "#a7e868");
  drawPixelLine(gameContext, screenX + 31, screenY + 14, 2, 12, "#ace96d");
  drawPixelLine(gameContext, screenX + 42, screenY + 24, 2, 8, "#90d758");
}

function drawPathTile(screenX, screenY, neighbors) {
  drawGrassTile(screenX, screenY);
  drawPixelRect(gameContext, screenX + 4, screenY + 4, 40, 40, "#ceb57d");
  drawPixelRect(gameContext, screenX + 6, screenY + 6, 36, 36, "#e1cd95");
  drawPixelRect(gameContext, screenX + 8, screenY + 8, 32, 32, "#ebd8a3");
  drawPixelRect(gameContext, screenX + 10, screenY + 12, 4, 3, "#c59f61");
  drawPixelRect(gameContext, screenX + 19, screenY + 9, 3, 2, "#d4b174");
  drawPixelRect(gameContext, screenX + 28, screenY + 14, 4, 3, "#c79e5c");
  drawPixelRect(gameContext, screenX + 15, screenY + 23, 4, 4, "#d6b276");
  drawPixelRect(gameContext, screenX + 31, screenY + 29, 3, 3, "#c99857");
  drawPixelRect(gameContext, screenX + 9, screenY + 33, 5, 3, "#d0aa67");

  // These trims shape the path so corners feel hand-placed rather than boxy.
  if (!neighbors.up) {
    drawPixelRect(gameContext, screenX + 10, screenY, 28, 8, "#d6ba83");
  }
  if (!neighbors.down) {
    drawPixelRect(gameContext, screenX + 10, screenY + 40, 28, 8, "#d6ba83");
  }
  if (!neighbors.left) {
    drawPixelRect(gameContext, screenX, screenY + 10, 8, 28, "#d6ba83");
  }
  if (!neighbors.right) {
    drawPixelRect(gameContext, screenX + 40, screenY + 10, 8, 28, "#d6ba83");
  }
}

function drawFlowerPatch(screenX, screenY) {
  drawGrassTile(screenX, screenY);
  const blooms = [
    { x: 10, y: 13, color: "#ff516e" },
    { x: 17, y: 27, color: "#ffe671" },
    { x: 24, y: 11, color: "#fffef2" },
    { x: 31, y: 23, color: "#8fd8ff" },
    { x: 20, y: 18, color: "#de8cff" }
  ];

  for (const bloom of blooms) {
    drawPixelRect(gameContext, screenX + bloom.x, screenY + bloom.y, 4, 4, bloom.color);
    drawPixelRect(gameContext, screenX + bloom.x + 1, screenY + bloom.y + 4, 2, 5, "#2f7a2d");
  }
}

function drawCliffTopTile(screenX, screenY) {
  drawPixelRect(gameContext, screenX, screenY, 48, 48, "#8a877f");
  drawPixelRect(gameContext, screenX, screenY, 48, 6, "#b5b1ab");
  drawPixelRect(gameContext, screenX, screenY + 6, 48, 5, "#66635f");
  drawPixelRect(gameContext, screenX + 3, screenY + 14, 14, 8, "#75716b");
  drawPixelRect(gameContext, screenX + 17, screenY + 19, 12, 7, "#6b6762");
  drawPixelRect(gameContext, screenX + 30, screenY + 11, 11, 8, "#7d7973");
  drawPixelRect(gameContext, screenX + 8, screenY + 31, 10, 7, "#5c5955");
  drawPixelRect(gameContext, screenX + 22, screenY + 30, 14, 9, "#726f69");
  drawPixelRect(gameContext, screenX + 38, screenY + 24, 6, 11, "#54514d");
  drawPixelRect(gameContext, screenX + 0, screenY + 38, 48, 10, "#7f7b76");
}

function drawCliffWallTile(screenX, screenY) {
  drawPixelRect(gameContext, screenX, screenY, 48, 48, "#5e5b58");
  drawPixelRect(gameContext, screenX + 2, screenY, 10, 48, "#8f8b86");
  drawPixelRect(gameContext, screenX + 14, screenY, 8, 48, "#78746f");
  drawPixelRect(gameContext, screenX + 24, screenY, 8, 48, "#4c4946");
  drawPixelRect(gameContext, screenX + 35, screenY, 6, 48, "#68645f");
  drawPixelRect(gameContext, screenX + 41, screenY, 5, 48, "#9a9691");
  drawPixelRect(gameContext, screenX + 6, screenY + 10, 3, 28, "#c0bbb4");
  drawPixelRect(gameContext, screenX + 18, screenY + 8, 3, 24, "#918d88");
  drawPixelRect(gameContext, screenX + 28, screenY + 15, 3, 19, "#393633");
}

function drawOverlookTile(screenX, screenY) {
  drawPixelRect(gameContext, screenX, screenY, 48, 48, "#9e9584");
  drawPixelRect(gameContext, screenX, screenY + 7, 48, 41, "#8a8276");
  drawPixelRect(gameContext, screenX + 5, screenY, 38, 9, "#d0c39a");
  drawPixelRect(gameContext, screenX + 9, screenY + 14, 10, 6, "#7d756b");
  drawPixelRect(gameContext, screenX + 27, screenY + 18, 12, 7, "#71695d");
  drawPixelRect(gameContext, screenX + 16, screenY + 29, 18, 6, "#635d54");
}

function drawBench(screenX, screenY) {
  drawPixelRect(gameContext, screenX + 10, screenY + 28, 26, 4, "#4c2f1d");
  drawPixelRect(gameContext, screenX + 11, screenY + 22, 24, 5, "#83552f");
  drawPixelRect(gameContext, screenX + 13, screenY + 17, 20, 4, "#9f6f46");
  drawPixelRect(gameContext, screenX + 14, screenY + 33, 4, 10, "#3c2415");
  drawPixelRect(gameContext, screenX + 28, screenY + 33, 4, 10, "#3c2415");
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

function getPathNeighbors(x, y) {
  return {
    up: PATH_TILES.has(positionKey(x, y - 1)),
    down: PATH_TILES.has(positionKey(x, y + 1)),
    left: PATH_TILES.has(positionKey(x - 1, y)),
    right: PATH_TILES.has(positionKey(x + 1, y))
  };
}

function drawPlayer() {
  const center = VIEWPORT_PIXELS / 2;
  const cutsceneOffset = state.endingCutscene.active
    ? Math.round(lerp(0, GAME_CONFIG.tileSize * 3.5, state.endingCutscene.progress))
    : 0;
  const baseX = center - GAME_CONFIG.tileSize / 2;
  const baseY = center - GAME_CONFIG.tileSize / 2 + cutsceneOffset + (state.stepPhase === 0 ? -1 : 1);

  // This sprite is hand-built from blocks so it always stays perfectly sharp.
  drawPixelRect(gameContext, baseX + 12, baseY + 3, 24, 5, "#1d1b27");
  drawPixelRect(gameContext, baseX + 9, baseY + 8, 30, 8, "#b03b46");
  drawPixelRect(gameContext, baseX + 14, baseY + 16, 20, 8, "#f0c9a3");
  drawPixelRect(gameContext, baseX + 10, baseY + 24, 28, 12, "#385fc0");
  drawPixelRect(gameContext, baseX + 13, baseY + 36, 8, 10, "#2c2530");
  drawPixelRect(gameContext, baseX + 27, baseY + 36, 8, 10, "#2c2530");
  drawPixelRect(gameContext, baseX + 16, baseY + 9, 16, 3, "#f8f1eb");
  drawPixelRect(gameContext, baseX + 11, baseY + 24, 4, 7, "#f0c9a3");
  drawPixelRect(gameContext, baseX + 33, baseY + 24, 4, 7, "#f0c9a3");

  if (state.facing === "left") {
    drawPixelRect(gameContext, baseX + 12, baseY + 18, 3, 3, "#2b1a16");
  } else if (state.facing === "right") {
    drawPixelRect(gameContext, baseX + 33, baseY + 18, 3, 3, "#2b1a16");
  } else if (state.facing === "up") {
    drawPixelRect(gameContext, baseX + 18, baseY + 14, 12, 2, "#2b1a16");
  } else {
    drawPixelRect(gameContext, baseX + 18, baseY + 20, 12, 2, "#2b1a16");
  }
}

function drawStopSparkle(stop, cameraX, cameraY) {
  const frame = state.assets.sparkleFrames[state.sparkleFrame % state.assets.sparkleFrames.length];
  const x = stop.x * GAME_CONFIG.tileSize + cameraX + 9;
  const y = stop.y * GAME_CONFIG.tileSize + cameraY - 2;
  gameContext.drawImage(frame, x, y, 30, 30);
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
  const x = tileX * GAME_CONFIG.tileSize + cameraX + 10;
  const y = tileY * GAME_CONFIG.tileSize + cameraY + 8;
  drawPixelRect(gameContext, x + 10, y, 8, 32, "#e2c05a");
  drawPixelRect(gameContext, x, y + 10, 28, 8, "#f2da7f");
  drawPixelRect(gameContext, x + 8, y + 8, 12, 12, "#fff0a8");
  drawPixelRect(gameContext, x + 12, y - 4, 4, 40, "#d79a2e");
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
    if (flowerSet.has(positionKey(tileX, tileY))) {
      drawFlowerPatch(screenX, screenY);
    } else {
      drawGrassTile(screenX, screenY);
    }
  } else if (terrain === "p") {
    drawPathTile(screenX, screenY, getPathNeighbors(tileX, tileY));
  } else if (terrain === "c") {
    drawCliffTopTile(screenX, screenY);
  } else if (terrain === "v") {
    drawCliffWallTile(screenX, screenY);
  } else if (terrain === "a") {
    drawOverlookTile(screenX, screenY);
  }
}

function drawDecor(tileX, tileY, cameraX, cameraY) {
  const screenX = tileX * GAME_CONFIG.tileSize + cameraX;
  const screenY = tileY * GAME_CONFIG.tileSize + cameraY;
  const tileKey = positionKey(tileX, tileY);

  if (bushSet.has(tileKey)) {
    gameContext.drawImage(state.assets.bush, screenX + BUSH_DRAW_OFFSET.x, screenY + BUSH_DRAW_OFFSET.y);
  }

  if (tileX === BENCH_POSITION.x && tileY === BENCH_POSITION.y) {
    drawBench(screenX, screenY);
  }

  if (treeSet.has(tileKey)) {
    gameContext.drawImage(state.assets.tree, screenX + TREE_DRAW_OFFSET.x, screenY);
  }
}

function updateCutscene(delta) {
  if (!state.endingCutscene.active) {
    return;
  }

  state.endingCutscene.progress = clamp(state.endingCutscene.progress + delta / 2800, 0, 1);

  if (!state.endingCutscene.fireworksStarted && state.endingCutscene.progress >= 0.35) {
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

  if (state.sparkleTime >= 100) {
    state.sparkleFrame = (state.sparkleFrame + 1) % state.assets.sparkleFrames.length;
    state.sparkleTime = 0;
  }

  updateCutscene(delta);

  const camera = getCameraOrigin();
  gameContext.clearRect(0, 0, VIEWPORT_PIXELS, VIEWPORT_PIXELS);
  gameContext.imageSmoothingEnabled = false;
  drawOceanBackdrop();

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

  drawPlayer();
  state.animationFrame = window.requestAnimationFrame(renderGame);
}

function launchBurst() {
  const shapes = [0, 1, 2, 3, 4, 5, 6];
  state.fireworks.push({
    x: Math.round(Math.random() * 250 + 90),
    y: Math.round(Math.random() * 90 + 34),
    frame: 0,
    shapeOffset: shapes[Math.floor(Math.random() * shapes.length)]
  });
}

function drawFireworks() {
  fireworksContext.clearRect(0, 0, VIEWPORT_PIXELS, VIEWPORT_PIXELS);
  fireworksContext.imageSmoothingEnabled = false;

  state.fireworks = state.fireworks.filter((burst) => burst.frame < state.assets.fireworkFrames.length);

  for (const burst of state.fireworks) {
    const sourceFrame = state.assets.fireworkFrames[(burst.frame + burst.shapeOffset) % state.assets.fireworkFrames.length];
    fireworksContext.drawImage(sourceFrame, burst.x - sourceFrame.width / 2, burst.y - sourceFrame.height / 2);
    burst.frame += 1;
  }
}

function fireworkLoop() {
  drawFireworks();
  window.requestAnimationFrame(fireworkLoop);
}

function startFireworks() {
  if (state.isFireworksRunning) {
    return;
  }

  state.isFireworksRunning = true;
  launchBurst();
  state.fireworkTimer = window.setInterval(launchBurst, 420);
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
  state.endingCutscene.progress = 0;
  state.endingCutscene.fireworksStarted = false;
  endingBanner.classList.add("hidden");
  updateHud();
}

function interact() {
  if (state.isDialogOpen || state.endingCutscene.active) {
    return;
  }

  const currentStop = stopByPosition.get(positionKey(state.player.x, state.player.y));
  if (currentStop && getNextRequiredStop()?.id === currentStop.id) {
    openDialog(currentStop);
    return;
  }

  if (
    state.completedStopIds.size === GAME_CONFIG.stops.length &&
    state.player.x === GAME_CONFIG.end.x &&
    state.player.y === GAME_CONFIG.end.y
  ) {
    startEndingCutscene();
  }
}

function movePlayer(dx, dy) {
  if (state.isDialogOpen || state.endingCutscene.active) {
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

async function initializeGame() {
  gameContext.imageSmoothingEnabled = false;
  fireworksContext.imageSmoothingEnabled = false;
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

initializeGame().catch((error) => {
  console.error("Failed to initialize game", error);
});
