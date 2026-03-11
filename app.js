const TILE_SIZE = 48;
const REAL_MS_PER_YEAR = 5 * 60 * 1000;
const NPC_STEP_MS = 850;
const NEED_DECAY_MS = 12000;
const ACTIVITY_COOLDOWN_MS = 4200;
const COMFORT_THRESHOLD = 70;
const EMPTY_ENTITY = "  ";

const FLOOR_GLYPHS = {
  RM: { label: "piso bordado" },
  WL: { label: "parede direta" },
};

const ENTITY_GLYPHS = {
  [EMPTY_ENTITY]: { label: "vazio" },
  PL: { label: "npc" },
};

const AI_MODE_META = {
  wandering: {
    title: "wandering",
    summary:
      "Todos os estados estao confortaveis. O NPC caminha aleatoriamente entre tiles adjacentes livres.",
  },
  feeding: {
    title: "buscar comida",
    summary:
      "A saciedade caiu. O NPC tenta descer pelo mapa e cozinhar quando a rota estabiliza.",
  },
  decorating: {
    title: "buscar decoracao",
    summary:
      "A felicidade caiu. O NPC tenta subir pelo mapa e decorar quando encontra um ponto util.",
  },
  resting: {
    title: "descansando",
    summary:
      "Energia ou saude baixas. O NPC para para se recuperar antes de voltar a circular.",
  },
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

const NPC_SPRITES = {
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

const WORLD_LAYOUT = [
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, "PL", EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["WL", "RM", "RM", "RM", "RM", "WL"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
];

const WORLD_MAP_RAW = buildWorldRaw(WORLD_LAYOUT);

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
  aiMode: document.getElementById("ai-mode"),
  aiSummary: document.getElementById("ai-summary"),
};

const ctx = dom.canvas.getContext("2d");

const assets = {
  border: {},
  npc: {
    esquerda: [],
    direita: [],
  },
};

const baseWorld = parseRawMap(WORLD_MAP_RAW);
const npcSpawn = extractEntitySpawn(baseWorld, "PL") || { x: 2, y: 0 };

const state = {
  world: baseWorld,
  character: createCharacter(npcSpawn),
  log: [],
  elapsedMs: 0,
  runtimeMs: 0,
  lastFrameTimestamp: 0,
  lastVisibleSecond: -1,
  needClockMs: 0,
  activityCooldownMs: 0,
  aiClockMs: 0,
  needCycles: 0,
  moveCount: 0,
  playerFrame: 0,
  lastDirection: null,
  aiMode: "wandering",
  uiDirty: true,
};

bootstrap();

async function bootstrap() {
  await loadAssets();
  appendLog("Prototipo iniciado com um NPC autonomo de 18 anos.");
  appendLog("Movimento manual removido. A IA anda sozinha por tiles adjacentes.");
  renderUi();
  state.uiDirty = false;
  requestAnimationFrame(loop);
}

function buildWorldRaw(layout) {
  return layout
    .flatMap((row) => {
      return [serializeTokens(row.entity), serializeTokens(row.floor)];
    })
    .join("\n");
}

function serializeTokens(tokens) {
  return tokens.map((token) => ` ${token} `).join("");
}

function createCharacter(spawn) {
  return {
    status: {
      saude: 100,
      saciedade: 100,
      felicidade: 100,
      energia: 100,
      age: 18,
    },
    fisico: {
      pos: { x: spawn.x, y: spawn.y },
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

function extractEntitySpawn(world, token) {
  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      if (world.cells[y][x].entity === token) {
        world.cells[y][x].entity = EMPTY_ENTITY;
        return { x, y };
      }
    }
  }

  return null;
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
      const entity = isNpcAt(x, y) ? "PL" : cell.entity;
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
  state.runtimeMs += delta;
  state.elapsedMs += delta;
  state.needClockMs += delta;
  state.aiClockMs += delta;
  state.activityCooldownMs = Math.max(0, state.activityCooldownMs - delta);

  while (state.elapsedMs >= REAL_MS_PER_YEAR) {
    state.elapsedMs -= REAL_MS_PER_YEAR;
    state.character.status.age += 1;
    appendLog(`Passou mais um ano. Idade atual: ${state.character.status.age}.`);
  }

  while (state.needClockMs >= NEED_DECAY_MS) {
    state.needClockMs -= NEED_DECAY_MS;
    applyNaturalNeedDecay();
  }

  while (state.aiClockMs >= NPC_STEP_MS) {
    state.aiClockMs -= NPC_STEP_MS;
    runNpcTurn();
  }

  const remainingSeconds = Math.max(0, Math.floor((REAL_MS_PER_YEAR - state.elapsedMs) / 1000));

  if (state.uiDirty || remainingSeconds !== state.lastVisibleSecond) {
    state.lastVisibleSecond = remainingSeconds;
    renderUi();
    state.uiDirty = false;
  }

  requestAnimationFrame(loop);
}

function runNpcTurn() {
  syncAiMode();

  if (state.aiMode === "resting") {
    restTurn();
    return;
  }

  const activityId = activityForMode(state.aiMode);
  if (activityId && state.activityCooldownMs === 0 && isInNeedZone(state.aiMode)) {
    performActivity(activityId, { source: "ai" });
    state.activityCooldownMs = ACTIVITY_COOLDOWN_MS;
    return;
  }

  const direction = chooseAutonomousDirection(state.aiMode);
  if (direction) {
    moveNpc(direction);
    return;
  }

  if (activityId && state.activityCooldownMs === 0) {
    performActivity(activityId, { source: "ai" });
    state.activityCooldownMs = ACTIVITY_COOLDOWN_MS;
    return;
  }

  appendLog("O NPC ficou sem tiles adjacentes livres para caminhar.");
}

function syncAiMode() {
  const nextMode = resolveAiMode();
  if (nextMode !== state.aiMode) {
    state.aiMode = nextMode;
    appendLog(`Modo atual da IA: ${AI_MODE_META[nextMode].title}.`);
  }
}

function resolveAiMode() {
  const { saude, saciedade, felicidade, energia } = state.character.status;

  if (saude <= 40 || energia <= 55) {
    return "resting";
  }

  if (allNeedsComfortable()) {
    return "wandering";
  }

  const weakestNeed = [
    { key: "saciedade", value: saciedade, mode: "feeding" },
    { key: "felicidade", value: felicidade, mode: "decorating" },
    { key: "energia", value: energia, mode: "resting" },
  ].sort((left, right) => left.value - right.value)[0];

  return weakestNeed.mode;
}

function allNeedsComfortable() {
  const { saude, saciedade, felicidade, energia } = state.character.status;
  return (
    saude >= COMFORT_THRESHOLD &&
    saciedade >= COMFORT_THRESHOLD &&
    felicidade >= COMFORT_THRESHOLD &&
    energia >= COMFORT_THRESHOLD
  );
}

function activityForMode(mode) {
  if (mode === "feeding") {
    return "fazer comida";
  }

  if (mode === "decorating") {
    return "fazer decoracao";
  }

  return null;
}

function isInNeedZone(mode) {
  const currentY = state.character.fisico.pos.y;
  const options = getAdjacentOptions();

  if (mode === "feeding") {
    return currentY >= state.world.height - 3 || !options.some((option) => option.target.y > currentY);
  }

  if (mode === "decorating") {
    return currentY <= 2 || !options.some((option) => option.target.y < currentY);
  }

  return true;
}

function restTurn() {
  adjustStatus("energia", 4);

  if (state.character.status.saude < 100) {
    adjustStatus("saude", 1);
  }

  if (state.runtimeMs % 5000 < NPC_STEP_MS) {
    appendLog("O NPC esta descansando para recuperar energia.");
  }
}

function applyNaturalNeedDecay() {
  state.needCycles += 1;
  adjustStatus("saciedade", -1);
  adjustStatus("energia", -1);

  if (state.needCycles % 2 === 0) {
    adjustStatus("felicidade", -1);
  }

  applyLowStatusConsequences();
}

function chooseAutonomousDirection(mode) {
  const options = getAdjacentOptions();
  if (options.length === 0) {
    return null;
  }

  if (mode === "wandering") {
    const filtered = filterImmediateBacktrack(options);
    return sample(filtered.length > 0 ? filtered : options).direction;
  }

  const priorityByMode = {
    feeding: ["down", "right", "left", "up"],
    decorating: ["up", "left", "right", "down"],
    resting: ["up", "down", "left", "right"],
  };

  const priorities = priorityByMode[mode] || priorityByMode.wandering;
  const filtered = filterImmediateBacktrack(options);
  const pool = filtered.length > 0 ? filtered : options;

  for (const direction of priorities) {
    const match = pool.find((option) => option.direction === direction);
    if (match) {
      return match.direction;
    }
  }

  return pool[0].direction;
}

function filterImmediateBacktrack(options) {
  const reverse = reverseDirection(state.lastDirection);
  if (!reverse || options.length <= 1) {
    return options;
  }

  return options.filter((option) => option.direction !== reverse);
}

function reverseDirection(direction) {
  const reverseMap = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  return reverseMap[direction] || null;
}

function getAdjacentOptions() {
  const deltas = [
    { direction: "up", x: 0, y: -1 },
    { direction: "down", x: 0, y: 1 },
    { direction: "left", x: -1, y: 0 },
    { direction: "right", x: 1, y: 0 },
  ];

  return deltas
    .map((delta) => {
      return {
        direction: delta.direction,
        target: {
          x: state.character.fisico.pos.x + delta.x,
          y: state.character.fisico.pos.y + delta.y,
        },
      };
    })
    .filter((option) => isNpcWalkable(option.target.x, option.target.y));
}

function moveNpc(direction) {
  const target = getAdjacentOptions().find((option) => option.direction === direction);
  if (!target) {
    return false;
  }

  state.character.fisico.pos = target.target;
  state.lastDirection = direction;

  if (direction === "left") {
    state.character.fisico.direcao_olhar = "esquerda";
  }

  if (direction === "right") {
    state.character.fisico.direcao_olhar = "direita";
  }

  state.moveCount += 1;
  state.playerFrame = (state.playerFrame + 1) % Math.max(assets.npc.direita.length, 1);
  adjustStatus("energia", -1);

  if (state.moveCount % 2 === 0) {
    adjustStatus("saciedade", -1);
  }

  if (state.moveCount % 3 === 0) {
    adjustStatus("felicidade", -1);
  }

  applyLowStatusConsequences();
  state.uiDirty = true;
  return true;
}

function isInsideWorld(x, y) {
  return x >= 0 && x < state.world.width && y >= 0 && y < state.world.height;
}

function isNpcAt(x, y) {
  return state.character.fisico.pos.x === x && state.character.fisico.pos.y === y;
}

function isRoomFloorToken(x, y) {
  if (!isInsideWorld(x, y)) {
    return false;
  }

  return state.world.cells[y][x].floor === "RM";
}

function isNpcWalkable(x, y) {
  if (!isInsideWorld(x, y)) {
    return false;
  }

  const tileInfo = getTileInfo(x, y);
  return tileInfo.walkable;
}

function performActivity(activityId, options = {}) {
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

  const prefix = options.source === "ai" ? "A IA escolheu: " : "";
  const statusLabel = succeeded ? "deu certo" : "falhou";
  const summary = succeeded ? activity.successLabel : `${activity.label.toLowerCase()} e falhou`;
  appendLog(
    `${prefix}${summary}. Resultado ${statusLabel} (${roll}/10), gostar ${record.taxa_gostar}, qualidade ${record.taxa_qualidade}.`
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
  const current = state.character.status[key];
  const next = clamp(current + delta, 0, 100);

  if (next !== current) {
    state.character.status[key] = next;
    state.uiDirty = true;
  }
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
  renderBehavior();
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

  drawNpc();
}

function drawCell(x, y, cell) {
  const screenX = x * TILE_SIZE;
  const screenY = y * TILE_SIZE;
  const tileInfo = getTileInfo(x, y);

  if (cell.floor === "RM") {
    const tileImage = assets.border[tileInfo.variant] || assets.border.center;

    if (tileImage) {
      ctx.drawImage(tileImage, screenX, screenY, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = "#6a8155";
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    if (!tileInfo.walkable) {
      ctx.fillStyle = "rgba(16, 12, 9, 0.34)";
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "rgba(31, 22, 17, 0.8)";
      ctx.fillRect(screenX, screenY, TILE_SIZE, 10);
    }
  } else {
    ctx.fillStyle = "#17120f";
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    if (hasAdjacentRoomFloor(x, y)) {
      ctx.fillStyle = "#2b2218";
      ctx.fillRect(screenX, screenY, TILE_SIZE, 10);
      ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
      ctx.fillRect(screenX, screenY + 10, TILE_SIZE, TILE_SIZE - 10);
    }
  }

  ctx.strokeStyle = "rgba(242, 231, 207, 0.05)";
  ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
}

function drawNpc() {
  const { x, y } = state.character.fisico.pos;
  const facing = state.character.fisico.direcao_olhar;
  const frames = assets.npc[facing];
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

function getTileInfo(x, y) {
  if (!isInsideWorld(x, y)) {
    return {
      label: "fora do mapa",
      walkable: false,
      collidable: true,
      variant: "void",
    };
  }

  const cell = state.world.cells[y][x];
  if (cell.floor === "WL") {
    return {
      label: "parede direta",
      walkable: false,
      collidable: true,
      variant: "wall_block",
    };
  }

  const variant = selectBorderVariant(x, y);
  const walkable = variant === "center";

  return {
    label: walkable ? "piso livre" : `parede bordada (${variant})`,
    walkable,
    collidable: !walkable,
    variant,
  };
}

function selectBorderVariant(x, y) {
  const up = isRoomFloorToken(x, y - 1);
  const right = isRoomFloorToken(x + 1, y);
  const down = isRoomFloorToken(x, y + 1);
  const left = isRoomFloorToken(x - 1, y);
  const upLeft = isRoomFloorToken(x - 1, y - 1);
  const upRight = isRoomFloorToken(x + 1, y - 1);
  const downRight = isRoomFloorToken(x + 1, y + 1);
  const downLeft = isRoomFloorToken(x - 1, y + 1);

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

function hasAdjacentRoomFloor(x, y) {
  return (
    isRoomFloorToken(x, y - 1) ||
    isRoomFloorToken(x + 1, y) ||
    isRoomFloorToken(x, y + 1) ||
    isRoomFloorToken(x - 1, y)
  );
}

function renderBehavior() {
  const aiMeta = AI_MODE_META[state.aiMode];
  dom.aiMode.textContent = aiMeta.title;
  dom.aiSummary.textContent = aiMeta.summary;
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
  const currentTile = getTileInfo(state.character.fisico.pos.x, state.character.fisico.pos.y);

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
      label: "Modo da IA",
      value: AI_MODE_META[state.aiMode].title,
    },
    {
      label: "Tile atual",
      value: currentTile.label,
    },
    {
      label: "Atividades ja praticadas",
      value: `${activitiesCount}`,
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

function renderActivities() {
  const activityRecords = state.character.preferencias.atividades_praticadas;

  if (activityRecords.length === 0) {
    dom.activityView.textContent =
      "A IA ainda nao escolheu nenhuma atividade.\n\nQuando a necessidade apertar:\n- comida melhora a saciedade\n- decoracao ajuda a felicidade\n- descanso recupera energia sem mover";
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
  const tileInfo = getTileInfo(state.character.fisico.pos.x, state.character.fisico.pos.y);

  dom.legendView.textContent = [
    `Tile atual: ${tileInfo.label}`,
    `Variante visual: ${tileInfo.variant}`,
    `Caminhavel: ${tileInfo.walkable ? "sim" : "nao"}`,
    `Entidade atual: ${ENTITY_GLYPHS.PL.label}`,
    "",
    "Legenda:",
    "  RM = piso com borda automatica",
    "  WL = parede direta do mapa",
    "  Apenas a variante center e caminhavel",
    "  O NPC anda apenas para tiles adjacentes",
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
    ia: {
      modo: state.aiMode,
      direcao_anterior: state.lastDirection,
      cooldown_atividade_ms: state.activityCooldownMs,
    },
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
  if (state.log[0] !== message) {
    state.log.unshift(message);
  }

  state.log = state.log.slice(0, 40);
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
    Promise.all(NPC_SPRITES.esquerda.map((src) => loadImage(src))),
    Promise.all(NPC_SPRITES.direita.map((src) => loadImage(src))),
  ]);

  borderEntries.forEach(([key, image]) => {
    assets.border[key] = image;
  });

  assets.npc.esquerda = leftFrames.filter(Boolean);
  assets.npc.direita = rightFrames.filter(Boolean);
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
