const TILE_SIZE = 48;
const REAL_MS_PER_YEAR = 5 * 60 * 1000;
const MOVE_COOLDOWN_MS = 120;
const EMPTY_ENTITY = "  ";

const FLOOR_GLYPHS = {
  RM: { label: "sala", walkable: true, collidable: false },
  CR: { label: "corredor", walkable: true, collidable: false },
  WL: { label: "parede", walkable: false, collidable: true },
};

const ENTITY_GLYPHS = {
  [EMPTY_ENTITY]: { label: "vazio" },
  PL: { label: "personagem" },
};

const ACTIVITY_DEFS = [
  { id: "organizar", label: "Organizar", successLabel: "organizou o espaco" },
  { id: "fazer decoracao", label: "Fazer decoracao", successLabel: "decorou a sala" },
  { id: "fazer comida", label: "Fazer comida", successLabel: "preparou comida" },
];

const FAVORITE_OBJECTS = [
  "planta",
  "quadro",
  "cadeira",
  "livro",
  "luminaria",
  "vaso",
];

const BORDER_TILE_PATHS = {
  center: "assets/teste_chao_bordered/teste_chao_center.png",
  edge_top: "assets/teste_chao_bordered/teste_chao_edge_top.png",
  edge_rgt: "assets/teste_chao_bordered/teste_chao_edge_rgt.png",
  edge_bot: "assets/teste_chao_bordered/teste_chao_edge_bot.png",
  edge_lft: "assets/teste_chao_bordered/teste_chao_edge_lft.png",
  outer_top_lft: "assets/teste_chao_bordered/teste_chao_outer_top_lft.png",
  outer_top_rgt: "assets/teste_chao_bordered/teste_chao_outer_top_rgt.png",
  outer_bot_rgt: "assets/teste_chao_bordered/teste_chao_outer_bot_rgt.png",
  outer_bot_lft: "assets/teste_chao_bordered/teste_chao_outer_bot_lft.png",
  inner_top_lft: "assets/teste_chao_bordered/teste_chao_inner_top_lft.png",
  inner_top_rgt: "assets/teste_chao_bordered/teste_chao_inner_top_rgt.png",
  inner_bot_rgt: "assets/teste_chao_bordered/teste_chao_inner_bot_rgt.png",
  inner_bot_lft: "assets/teste_chao_bordered/teste_chao_inner_bot_lft.png",
};

const PLAYER_SPRITES = {
  esquerda: [
    "assets/char_walk_left/frame_001.png",
    "assets/char_walk_left/frame_002.png",
    "assets/char_walk_left/frame_003.png",
    "assets/char_walk_left/frame_004.png",
    "assets/char_walk_left/frame_005.png",
    "assets/char_walk_left/frame_006.png",
    "assets/char_walk_left/frame_007.png",
    "assets/char_walk_left/frame_008.png",
  ],
  direita: [
    "assets/char_walk_right/frame_001.png",
    "assets/char_walk_right/frame_002.png",
    "assets/char_walk_right/frame_003.png",
    "assets/char_walk_right/frame_004.png",
    "assets/char_walk_right/frame_005.png",
    "assets/char_walk_right/frame_006.png",
    "assets/char_walk_right/frame_007.png",
    "assets/char_walk_right/frame_008.png",
  ],
};

const WORLD_MAP_RAW = [
  "                        ",
  " RM  RM  RM  RM  RM  RM ",
  "                        ",
  " RM  RM  RM  RM  RM  RM ",
  "                        ",
  " RM  RM  RM  RM  RM  RM ",
  "                        ",
  " RM  RM  RM  RM  RM  RM ",
  "                        ",
  " WL  WL  CR  CR  WL  WL ",
  "                        ",
  " RM  RM  RM  RM  RM  RM ",
  "                        ",
  " RM  RM  RM  RM  RM  RM ",
  "                        ",
  " RM  RM  RM  RM  RM  RM ",
  "                        ",
  " RM  RM  RM  RM  RM  RM ",
].join("\n");

const dom = {
  canvas: document.getElementById("game-canvas"),
  ageDisplay: document.getElementById("age-display"),
  yearTimer: document.getElementById("year-timer"),
  favoriteObject: document.getElementById("favorite-object"),
  statusGrid: document.getElementById("status-grid"),
  metaGrid: document.getElementById("meta-grid"),
  activityView: document.getElementById("activity-view"),
  terminalView: document.getElementById("terminal-view"),
  legendView: document.getElementById("legend-view"),
  stateView: document.getElementById("state-view"),
  logList: document.getElementById("log-list"),
};

const ctx = dom.canvas.getContext("2d");

const assets = {
  border: {},
  player: {
    esquerda: [],
    direita: [],
  },
};

const baseWorld = parseRawMap(WORLD_MAP_RAW);

const state = {
  world: baseWorld,
  character: createCharacter(),
  log: [],
  elapsedMs: 0,
  lastFrameTimestamp: 0,
  lastVisibleSecond: -1,
  nextInputAt: 0,
  moveCount: 0,
  playerFrame: 0,
  uiDirty: true,
};

bindEvents();
bootstrap();

async function bootstrap() {
  await loadAssets();
  appendLog("Prototipo iniciado com um personagem de 18 anos.");
  appendLog("Mapa RAW carregado a partir da string oficial.");
  renderUi();
  state.uiDirty = false;
  requestAnimationFrame(loop);
}

function bindEvents() {
  window.addEventListener("keydown", onKeyDown);

  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => attemptMove(button.dataset.move));
  });

  document.querySelectorAll("[data-activity]").forEach((button) => {
    button.addEventListener("click", () => performActivity(button.dataset.activity));
  });
}

function createCharacter() {
  return {
    status: {
      saude: 100,
      saciedade: 100,
      felicidade: 100,
      energia: 100,
      age: 18,
    },
    fisico: {
      pos: { x: 2, y: 1 },
      direcao_olhar: "direita",
    },
    preferencias: {
      objeto_favorito: sample(FAVORITE_OBJECTS),
      atividades_praticadas: [],
    },
    conhecidos: [],
  };
}

function parseRawMap(rawMap) {
  const lines = rawMap.split(/\r?\n/).filter((line, index, arr) => {
    return !(index === arr.length - 1 && line === "");
  });

  if (lines.length % 2 !== 0) {
    throw new Error("Mapa RAW invalido: numero de linhas precisa ser par.");
  }

  const normalizedLines = lines.map(normalizeRawLine);
  const width = Math.max(...normalizedLines.map((line) => line.length)) / 4;
  const height = normalizedLines.length / 2;
  const cells = [];

  for (let row = 0; row < height; row += 1) {
    const entityTokens = parseRawLine(normalizedLines[row * 2], width);
    const floorTokens = parseRawLine(normalizedLines[row * 2 + 1], width);
    const parsedRow = [];

    for (let column = 0; column < width; column += 1) {
      parsedRow.push({
        entity: entityTokens[column] || EMPTY_ENTITY,
        floor: floorTokens[column] || "WL",
      });
    }

    cells.push(parsedRow);
  }

  return { width, height, cells };
}

function normalizeRawLine(line) {
  if (line.length % 4 === 3) {
    return `${line} `;
  }

  return line;
}

function parseRawLine(line, width) {
  const paddedLine = line.padEnd(width * 4, " ");
  const tokens = [];

  for (let index = 0; index < paddedLine.length; index += 4) {
    const cell = paddedLine.slice(index, index + 4);
    tokens.push(cell.slice(1, 3));
  }

  return tokens;
}

function serializeWorldToRaw() {
  const lines = [];

  for (let y = 0; y < state.world.height; y += 1) {
    let entityLine = "";
    let floorLine = "";

    for (let x = 0; x < state.world.width; x += 1) {
      const cell = state.world.cells[y][x];
      const entity = isPlayerAt(x, y) ? "PL" : cell.entity;
      entityLine += ` ${entity} `;
      floorLine += ` ${cell.floor} `;
    }

    lines.push(entityLine, floorLine);
  }

  return lines.join("\n");
}

function loop(timestamp) {
  if (state.lastFrameTimestamp === 0) {
    state.lastFrameTimestamp = timestamp;
  }

  const delta = Math.max(0, Math.round(timestamp - state.lastFrameTimestamp));
  state.lastFrameTimestamp = timestamp;
  state.elapsedMs += delta;

  while (state.elapsedMs >= REAL_MS_PER_YEAR) {
    state.elapsedMs -= REAL_MS_PER_YEAR;
    state.character.status.age += 1;
    appendLog(`Passou mais um ano. Idade atual: ${state.character.status.age}.`);
  }

  const remainingSeconds = Math.max(0, Math.floor((REAL_MS_PER_YEAR - state.elapsedMs) / 1000));

  if (state.uiDirty || remainingSeconds !== state.lastVisibleSecond) {
    state.lastVisibleSecond = remainingSeconds;
    renderUi();
    state.uiDirty = false;
  }

  requestAnimationFrame(loop);
}

function onKeyDown(event) {
  const directionByKey = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    a: "left",
    s: "down",
    d: "right",
    W: "up",
    A: "left",
    S: "down",
    D: "right",
  };

  const direction = directionByKey[event.key];

  if (!direction) {
    return;
  }

  event.preventDefault();
  attemptMove(direction);
}

function attemptMove(direction) {
  const now = performance.now();
  if (now < state.nextInputAt) {
    return;
  }

  const deltaByDirection = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const delta = deltaByDirection[direction];
  if (!delta) {
    return;
  }

  const target = {
    x: state.character.fisico.pos.x + delta.x,
    y: state.character.fisico.pos.y + delta.y,
  };

  state.nextInputAt = now + MOVE_COOLDOWN_MS;

  if (!isInsideWorld(target.x, target.y)) {
    appendLog("Limite do mapa alcancado.");
    return;
  }

  const targetCell = state.world.cells[target.y][target.x];
  const floorDef = FLOOR_GLYPHS[targetCell.floor] || FLOOR_GLYPHS.WL;

  if (!floorDef.walkable) {
    appendLog(`Colisao com ${floorDef.label}.`);
    return;
  }

  state.character.fisico.pos = target;

  if (direction === "left") {
    state.character.fisico.direcao_olhar = "esquerda";
  }

  if (direction === "right") {
    state.character.fisico.direcao_olhar = "direita";
  }

  state.moveCount += 1;
  state.playerFrame = (state.playerFrame + 1) % PLAYER_SPRITES.direita.length;

  adjustStatus("energia", -1);

  if (state.moveCount % 3 === 0) {
    adjustStatus("saciedade", -1);
  }

  if (state.moveCount % 4 === 0) {
    adjustStatus("felicidade", -1);
  }

  applyLowStatusConsequences();
  appendLog(`Moveu para (${target.x}, ${target.y}) no ${floorDef.label}.`);
}

function isInsideWorld(x, y) {
  return x >= 0 && x < state.world.width && y >= 0 && y < state.world.height;
}

function isPlayerAt(x, y) {
  return state.character.fisico.pos.x === x && state.character.fisico.pos.y === y;
}

function performActivity(activityId) {
  const activity = ACTIVITY_DEFS.find((item) => item.id === activityId);
  if (!activity) {
    return;
  }

  const record = getOrCreateActivityRecord(activity.id);
  record.repeticoes += 1;

  if (record.repeticoes > 1 && record.repeticoes % 5 === 0 && record.taxa_qualidade < 10) {
    record.taxa_qualidade += 1;
  }

  const roll = randomInt(1, 10);
  const succeeded = roll <= record.taxa_sucesso;
  const likeBonus = levelBonus(record.taxa_gostar);
  const qualityBonus = levelBonus(record.taxa_qualidade);

  if (activity.id === "organizar") {
    adjustStatus("energia", succeeded ? -(3 + qualityBonus) : -4);
    adjustStatus("felicidade", succeeded ? 2 + likeBonus : -2);
    adjustStatus("saciedade", -2);
  }

  if (activity.id === "fazer decoracao") {
    adjustStatus("energia", succeeded ? -(4 + qualityBonus) : -5);
    adjustStatus("felicidade", succeeded ? 3 + likeBonus : -3);
    adjustStatus("saciedade", -2);
  }

  if (activity.id === "fazer comida") {
    adjustStatus("energia", succeeded ? -3 : -4);
    adjustStatus("felicidade", succeeded ? 1 + likeBonus : -1);
    adjustStatus("saciedade", succeeded ? 6 + qualityBonus : -2);
  }

  applyLowStatusConsequences();

  const statusLabel = succeeded ? "deu certo" : "falhou";
  const summary = succeeded ? activity.successLabel : `${activity.label.toLowerCase()} e falhou`;
  appendLog(
    `${summary}. Resultado ${statusLabel} (${roll}/10), gostar ${record.taxa_gostar}, qualidade ${record.taxa_qualidade}.`
  );
}

function getOrCreateActivityRecord(activityId) {
  let record = state.character.preferencias.atividades_praticadas.find((item) => {
    return item.atividade === activityId;
  });

  if (!record) {
    record = {
      atividade: activityId,
      taxa_gostar: randomInt(0, 10),
      taxa_sucesso: 8,
      taxa_qualidade: randomInt(1, 5),
      repeticoes: 0,
    };

    state.character.preferencias.atividades_praticadas.push(record);
  }

  return record;
}

function levelBonus(value) {
  if (value <= 2) {
    return 1;
  }

  if (value <= 5) {
    return 2;
  }

  if (value <= 8) {
    return 3;
  }

  return 4;
}

function adjustStatus(key, delta) {
  state.character.status[key] = clamp(state.character.status[key] + delta, 0, 100);
}

function applyLowStatusConsequences() {
  const { status } = state.character;

  if (status.energia <= 20) {
    adjustStatus("saude", -1);
  }

  if (status.saciedade <= 20) {
    adjustStatus("saude", -1);
  }

  if (status.felicidade <= 20) {
    adjustStatus("energia", -1);
  }
}

function renderUi() {
  drawWorld();
  renderStatus();
  renderMeta();
  renderActivities();
  renderTerminal();
  renderLegend();
  renderState();
  renderLog();
  renderTime();
}

function drawWorld() {
  ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
  ctx.fillStyle = "#10130f";
  ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);

  for (let y = 0; y < state.world.height; y += 1) {
    for (let x = 0; x < state.world.width; x += 1) {
      const cell = state.world.cells[y][x];
      drawCell(x, y, cell);
    }
  }

  drawPlayer();
}

function drawCell(x, y, cell) {
  const screenX = x * TILE_SIZE;
  const screenY = y * TILE_SIZE;
  const floor = FLOOR_GLYPHS[cell.floor] || FLOOR_GLYPHS.WL;

  if (floor.walkable) {
    const variant = selectBorderVariant(x, y);
    const tileImage = assets.border[variant];

    if (tileImage) {
      ctx.drawImage(tileImage, screenX, screenY, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = cell.floor === "CR" ? "#5b7650" : "#6a8155";
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = "rgba(12, 15, 12, 0.38)";
      ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    if (cell.floor === "CR") {
      ctx.fillStyle = "rgba(242, 231, 207, 0.08)";
      ctx.fillRect(screenX + 8, screenY + 20, TILE_SIZE - 16, 8);
    }
  } else {
    ctx.fillStyle = "#181410";
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    if (hasAdjacentWalkable(x, y)) {
      ctx.fillStyle = "#2a221a";
      ctx.fillRect(screenX, screenY, TILE_SIZE, 10);
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fillRect(screenX, screenY + 10, TILE_SIZE, TILE_SIZE - 10);
    }
  }

  ctx.strokeStyle = "rgba(242, 231, 207, 0.05)";
  ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
}

function drawPlayer() {
  const { x, y } = state.character.fisico.pos;
  const facing = state.character.fisico.direcao_olhar;
  const frames = assets.player[facing];
  const frame = frames[state.playerFrame] || frames[0];
  const shadowX = x * TILE_SIZE + 10;
  const shadowY = y * TILE_SIZE + 31;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(shadowX + 14, shadowY + 8, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (frame) {
    ctx.drawImage(frame, x * TILE_SIZE + 4, y * TILE_SIZE - 4, 40, 40);
  } else {
    ctx.fillStyle = "#f0c875";
    ctx.fillRect(x * TILE_SIZE + 10, y * TILE_SIZE + 6, 24, 28);
  }
}

function selectBorderVariant(x, y) {
  const up = isWalkableFloor(x, y - 1);
  const right = isWalkableFloor(x + 1, y);
  const down = isWalkableFloor(x, y + 1);
  const left = isWalkableFloor(x - 1, y);
  const upLeft = isWalkableFloor(x - 1, y - 1);
  const upRight = isWalkableFloor(x + 1, y - 1);
  const downRight = isWalkableFloor(x + 1, y + 1);
  const downLeft = isWalkableFloor(x - 1, y + 1);

  if (up && right && down && left) {
    if (!upLeft) {
      return "inner_top_lft";
    }

    if (!upRight) {
      return "inner_top_rgt";
    }

    if (!downRight) {
      return "inner_bot_rgt";
    }

    if (!downLeft) {
      return "inner_bot_lft";
    }

    return "center";
  }

  if (!up && right && down && left) {
    return "edge_top";
  }

  if (up && !right && down && left) {
    return "edge_rgt";
  }

  if (up && right && !down && left) {
    return "edge_bot";
  }

  if (up && right && down && !left) {
    return "edge_lft";
  }

  if (!up && !left) {
    return "outer_top_lft";
  }

  if (!up && !right) {
    return "outer_top_rgt";
  }

  if (!down && !right) {
    return "outer_bot_rgt";
  }

  if (!down && !left) {
    return "outer_bot_lft";
  }

  return "center";
}

function isWalkableFloor(x, y) {
  if (!isInsideWorld(x, y)) {
    return false;
  }

  const cell = state.world.cells[y][x];
  const floor = FLOOR_GLYPHS[cell.floor] || FLOOR_GLYPHS.WL;
  return floor.walkable;
}

function hasAdjacentWalkable(x, y) {
  return (
    isWalkableFloor(x, y - 1) ||
    isWalkableFloor(x + 1, y) ||
    isWalkableFloor(x, y + 1) ||
    isWalkableFloor(x - 1, y)
  );
}

function renderStatus() {
  const metrics = [
    { key: "saude", label: "Saude" },
    { key: "saciedade", label: "Saciedade" },
    { key: "felicidade", label: "Felicidade" },
    { key: "energia", label: "Energia" },
  ];

  dom.favoriteObject.textContent = state.character.preferencias.objeto_favorito;
  dom.statusGrid.innerHTML = metrics
    .map(({ key, label }) => {
      const value = state.character.status[key];
      return `
        <div class="metric">
          <div class="metric-head">
            <span>${label}</span>
            <strong>${value}%</strong>
          </div>
          <div class="metric-track">
            <div class="metric-fill ${key}" style="width: ${value}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderMeta() {
  const activitiesCount = state.character.preferencias.atividades_praticadas.length;

  dom.metaGrid.innerHTML = [
    { label: "Idade", value: `${state.character.status.age} anos` },
    {
      label: "Posicao",
      value: `(${state.character.fisico.pos.x}, ${state.character.fisico.pos.y})`,
    },
    {
      label: "Direcao",
      value: state.character.fisico.direcao_olhar,
    },
    {
      label: "Atividades ja praticadas",
      value: `${activitiesCount}`,
    },
    {
      label: "Conhecidos",
      value: `${state.character.conhecidos.length}`,
    },
    {
      label: "Tile atual",
      value: currentFloorLabel(),
    },
  ]
    .map((item) => {
      return `
        <div class="meta-card">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `;
    })
    .join("");
}

function currentFloorLabel() {
  const tile = state.world.cells[state.character.fisico.pos.y][state.character.fisico.pos.x];
  const floor = FLOOR_GLYPHS[tile.floor] || FLOOR_GLYPHS.WL;
  return floor.label;
}

function renderActivities() {
  const activityRecords = state.character.preferencias.atividades_praticadas;

  if (activityRecords.length === 0) {
    dom.activityView.textContent =
      "Nenhuma atividade praticada ainda.\n\nAo praticar pela primeira vez:\n- gostar vira um inteiro de 0 a 10\n- sucesso base fica em 8\n- qualidade inicial vai de 1 a 5";
    return;
  }

  dom.activityView.textContent = activityRecords
    .map((record) => {
      const label = ACTIVITY_DEFS.find((item) => item.id === record.atividade)?.label || record.atividade;
      return [
        `${label}`,
        `  gostar: ${record.taxa_gostar}`,
        `  sucesso: ${record.taxa_sucesso}`,
        `  qualidade: ${record.taxa_qualidade}`,
        `  repeticoes: ${record.repeticoes}`,
      ].join("\n");
    })
    .join("\n\n");
}

function renderTerminal() {
  dom.terminalView.value = serializeWorldToRaw();
}

function renderLegend() {
  const tile = state.world.cells[state.character.fisico.pos.y][state.character.fisico.pos.x];
  const floor = FLOOR_GLYPHS[tile.floor] || FLOOR_GLYPHS.WL;
  const currentEntity = isPlayerAt(state.character.fisico.pos.x, state.character.fisico.pos.y)
    ? ENTITY_GLYPHS.PL
    : ENTITY_GLYPHS[tile.entity] || ENTITY_GLYPHS[EMPTY_ENTITY];

  dom.legendView.textContent = [
    `Tile atual: ${tile.floor} -> ${floor.label}`,
    `Colidivel: ${floor.collidable ? "sim" : "nao"}`,
    `Entidade atual: ${currentEntity.label}`,
    "",
    "Legenda:",
    "  RM = sala transitavel",
    "  CR = corredor transitavel",
    "  WL = parede colidivel",
    "  PL = personagem",
  ].join("\n");
}

function renderState() {
  dom.stateView.textContent = JSON.stringify(characterSnapshot(), null, 2);
}

function characterSnapshot() {
  return {
    status: state.character.status,
    fisico: state.character.fisico,
    preferencias: state.character.preferencias,
    conhecidos: state.character.conhecidos,
  };
}

function renderLog() {
  dom.logList.innerHTML = state.log
    .slice(0, 8)
    .map((message) => `<li>${message}</li>`)
    .join("");
}

function renderTime() {
  dom.ageDisplay.textContent = `${state.character.status.age}`;
  dom.yearTimer.textContent = `proximo ano em ${formatRemainingTime(REAL_MS_PER_YEAR - state.elapsedMs)}`;
}

function formatRemainingTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function appendLog(message) {
  state.log.unshift(message);
  state.uiDirty = true;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample(items) {
  return items[randomInt(0, items.length - 1)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function loadAssets() {
  const [borderEntries, leftFrames, rightFrames] = await Promise.all([
    Promise.all(
      Object.entries(BORDER_TILE_PATHS).map(async ([key, src]) => {
        return [key, await loadImage(src)];
      })
    ),
    Promise.all(PLAYER_SPRITES.esquerda.map((src) => loadImage(src))),
    Promise.all(PLAYER_SPRITES.direita.map((src) => loadImage(src))),
  ]);

  borderEntries.forEach(([key, image]) => {
    assets.border[key] = image;
  });
  assets.player.esquerda = leftFrames.filter(Boolean);
  assets.player.direita = rightFrames.filter(Boolean);
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
