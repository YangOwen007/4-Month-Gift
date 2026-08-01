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
    grass: "assets/cohesive/grass.png",
    stone: "assets/cohesive/stone.png",
    cliff: "assets/cohesive/cliff.png",
    tree: "assets/refined/tree.png",
    bush: "assets/refined/bush.png",
    rock: "assets/cohesive/rock.png",
    bench: "assets/refined/bench.png",
    fenceHorizontal: "assets/refined/fence-horizontal.png",
    fenceVertical: "assets/refined/fence-vertical.png",
    path: "assets/refined/path-fill.png",
    ocean: "assets/ocean-night.png",
    sparkles: Array.from({ length: 12 }, (_, index) => `assets/sparkles/sparkle-${index}.png`),
    fireworks: Array.from({ length: 7 }, (_, index) => `assets/fireworks/firework-${index}.png`)
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
const TREE_DRAW_OFFSET = { x: 8, y: 2 };
const BUSH_DRAW_OFFSET = { x: 8, y: 22 };
const LAND_BASE_COLOR = "#8fc84a";

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
  fireworkLastTimestamp: 0,
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
const rockSet = new Set(ROCK_POSITIONS.map((item) => positionKey(item.x, item.y)));

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
      core: [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]],
      rays: [[0, -3], [0, -2], [0, 2], [0, 3], [-3, 0], [-2, 0], [2, 0], [3, 0]],
      twinkles: [[-2, -2], [2, -2], [-2, 2], [2, 2]]
    },
    {
      core: [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]],
      rays: [[0, -4], [0, -3], [0, 3], [0, 4], [-4, 0], [-3, 0], [3, 0], [4, 0]],
      twinkles: [[-3, -2], [3, -2], [-3, 2], [3, 2]]
    },
    {
      core: [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]],
      rays: [[-2, -3], [-1, -2], [1, -2], [2, -3], [-2, 3], [-1, 2], [1, 2], [2, 3], [-3, -2], [-2, -1], [2, -1], [3, -2], [-3, 2], [-2, 1], [2, 1], [3, 2]],
      twinkles: [[0, -4], [0, 4], [-4, 0], [4, 0]]
    },
    {
      core: [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]],
      rays: [[-2, -2], [-1, -1], [1, -1], [2, -2], [-2, 2], [-1, 1], [1, 1], [2, 2]],
      twinkles: [[0, -3], [0, 3], [-3, 0], [3, 0]]
    }
  ];

  return frames.map((frame) => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext("2d");

    if (!context) {
      return canvas;
    }

    context.imageSmoothingEnabled = false;

    const drawPoints = (points, color) => {
      context.fillStyle = color;
      for (const [x, y] of points) {
        context.fillRect(8 + x, 8 + y, 1, 1);
      }
    };

    // These frames keep the sparkle warm and soft so it blends with the grass palette.
    drawPoints(frame.twinkles, "#d8f36d");
    drawPoints(frame.rays, "#f4ce52");
    drawPoints(frame.core, "#fff4b8");
    return canvas;
  });
}

async function loadAssets() {
  const [grassImage, stoneImage, cliffImage, treeImage, bushImage, rockImage, benchImage, fenceHorizontalImage, fenceVerticalImage, pathImage, oceanImage] = await Promise.all([
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
    loadImage(GAME_CONFIG.assets.ocean)
  ]);

  return {
    grass: createTileCanvas(grassImage, { healSeams: true, threshold: 760 }),
    stone: createTileCanvas(stoneImage, { healSeams: true, threshold: 745 }),
    cliff: createTileCanvas(cliffImage),
    tree: trimSprite(treeImage, 96),
    bush: trimSprite(bushImage, 96),
    rock: trimSprite(rockImage, 96),
    bench: trimSprite(benchImage, 96),
    fenceHorizontal: trimSprite(fenceHorizontalImage, 96),
    fenceVertical: trimSprite(fenceVerticalImage, 96),
    path: createTileCanvas(pathImage),
    ocean: oceanImage,
    sparkleFrames: createSparkleFrames()
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
  // This bench is viewed from behind so it reads like it is facing the ocean overlook.
  gameContext.drawImage(state.assets.bench, screenX + 6, screenY + 10, 36, 20);
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

  // These overlays pull the stray moon-colored horizon band back into the night sky and brighten the reflection below.
  drawPixelRect(gameContext, 0, 145, 200, 13, "#2e2a67");
  drawPixelRect(gameContext, 280, 145, 200, 13, "#2e2a67");
  drawPixelRect(gameContext, 0, 270, 195, 11, "#362173");
  drawPixelRect(gameContext, 285, 270, 195, 11, "#362173");
  drawPixelRect(gameContext, 226, 302, 28, 4, "#b3c5ef");
  drawPixelRect(gameContext, 230, 316, 20, 3, "#9ab6eb");
  drawPixelRect(gameContext, 233, 329, 14, 3, "#89aae6");
  drawPixelRect(gameContext, 235, 342, 10, 2, "#789fe0");
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
    ? Math.round(lerp(0, GAME_CONFIG.tileSize * 5.5, state.endingCutscene.progress))
    : 0;
  const baseX = center - GAME_CONFIG.tileSize / 2;
  const baseY = center - GAME_CONFIG.tileSize / 2 + cutsceneOffset + (state.stepPhase === 0 ? -1 : 1);

  // The player gets a little more detail here so they belong better with the new map art.
  drawPixelRect(gameContext, baseX + 11, baseY + 4, 26, 4, "#1f1c27");
  drawPixelRect(gameContext, baseX + 8, baseY + 8, 32, 8, "#b53f48");
  drawPixelRect(gameContext, baseX + 12, baseY + 9, 18, 3, "#fff7ef");
  drawPixelRect(gameContext, baseX + 14, baseY + 16, 20, 9, "#f2ceb0");
  drawPixelRect(gameContext, baseX + 10, baseY + 25, 28, 13, "#4066c7");
  drawPixelRect(gameContext, baseX + 12, baseY + 26, 8, 5, "#e3efe8");
  drawPixelRect(gameContext, baseX + 28, baseY + 26, 8, 5, "#e3efe8");
  drawPixelRect(gameContext, baseX + 13, baseY + 38, 8, 9, "#2e2734");
  drawPixelRect(gameContext, baseX + 27, baseY + 38, 8, 9, "#2e2734");
  drawPixelRect(gameContext, baseX + 11, baseY + 26, 3, 8, "#f2ceb0");
  drawPixelRect(gameContext, baseX + 34, baseY + 26, 3, 8, "#f2ceb0");

  if (state.facing === "left") {
    drawPixelRect(gameContext, baseX + 14, baseY + 19, 3, 3, "#2b1a16");
  } else if (state.facing === "right") {
    drawPixelRect(gameContext, baseX + 31, baseY + 19, 3, 3, "#2b1a16");
  } else if (state.facing === "up") {
    drawPixelRect(gameContext, baseX + 18, baseY + 14, 12, 2, "#2b1a16");
  } else {
    drawPixelRect(gameContext, baseX + 18, baseY + 21, 12, 2, "#2b1a16");
  }
}

function drawStopSparkle(stop, cameraX, cameraY) {
  const frame = state.assets.sparkleFrames[state.sparkleFrame % state.assets.sparkleFrames.length];
  const x = stop.x * GAME_CONFIG.tileSize + cameraX + 9;
  const y = stop.y * GAME_CONFIG.tileSize + cameraY + 7;
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

  if (bushSet.has(tileKey)) {
    drawStyledBush(screenX, screenY);
  }

  if (rockSet.has(tileKey)) {
    gameContext.drawImage(state.assets.rock, screenX + 8, screenY + 10, 30, 24);
  }

  if (tileX === BENCH_POSITION.x && tileY === BENCH_POSITION.y) {
    drawBench(screenX, screenY);
  }

  if (treeSet.has(tileKey)) {
    drawStyledTree(screenX, screenY);
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

  drawPlayer();
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
