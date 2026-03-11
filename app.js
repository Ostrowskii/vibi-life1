const TILE_SIZE = 48;
const REAL_MS_PER_YEAR = 5 * 60 * 1000;
const NPC_STEP_MS = 520;
const WALK_DURATION_MS = 280;
const NEED_DECAY_MS = 12000;
const ACTIVITY_COOLDOWN_MS = 4200;
const ACTIVITY_VISUAL_MS = 1400;
const EAT_DURATION_MS = 2600;
const COMFORT_THRESHOLD = 70;
const EMPTY_ENTITY = "  ";

const FLOOR_GLYPHS = {
  RM: { label: "piso bordado", room: true, floorAssetKey: null },
  CK: { label: "piso de comida", room: true, floorAssetKey: "cook" },
  JR: { label: "piso de jarro", room: true, floorAssetKey: "make_jar" },
  WL: { label: "parede direta" },
};

const ENTITY_GLYPHS = {
  [EMPTY_ENTITY]: { label: "vazio" },
  PL: { label: "npc" },
  CH: { label: "bau infinito", assetKey: "chest", blocks: true },
  JA: { label: "jarro colocado", assetKey: "jar", blocks: true },
};

const AI_MODE_META = {
  wandering: {
    title: "wandering",
    summary:
      "Todos os estados estao confortaveis. O NPC caminha sozinho entre tiles adjacentes, com animacao passo a passo.",
  },
  feeding: {
    title: "comer",
    summary:
      "A saciedade caiu. O NPC ativa o balao eat, vai ao bau por um tile adjacente, pega comida e para para comer em um tile RM livre.",
  },
  decorating: {
    title: "buscar decoracao",
    summary:
      "A felicidade caiu. O NPC anda tile por tile ate um dos dois tiles JR e so faz jarro ali.",
  },
  resting: {
    title: "descansando",
    summary:
      "Energia ou saude baixas. O NPC interrompe a caminhada, descansa e depois volta ao circuito.",
  },
};

const ACTIVITY_DEFS = [
  {
    id: "organizar",
    label: "Organizar",
    successLabel: "organizou o espaco",
    floorAssetKey: null,
    balloonAssetKey: null,
    tileToken: null,
    hint: "Mantem o ambiente em ordem.",
  },
  {
    id: "fazer decoracao",
    label: "Fazer decoracao",
    successLabel: "decorou a sala",
    floorAssetKey: "make_jar",
    balloonAssetKey: "make_jar",
    tileToken: "JR",
    hint: "So pode acontecer sobre tiles JR. O jarro criado vai para um RM adjacente ou para o bau CH.",
  },
  {
    id: "fazer comida",
    label: "Fazer comida",
    successLabel: "preparou comida",
    floorAssetKey: "cook",
    balloonAssetKey: "cook",
    tileToken: "CK",
    hint: "So pode acontecer sobre tiles CK. O NPC pega ingredientes no bau CH e depois cozinha no CK.",
  },
];

const ACTIVITY_FLOOR_PATHS = {
  cook: "assets/atividades/cook_floor.png",
  make_jar: "assets/atividades/make_jar_floor.png",
};

const BALLOON_ASSET_PATHS = {
  cook: "assets/baloon/cook.png",
  make_jar: "assets/baloon/make_jar.png",
  eat: "assets/baloon/eat.png",
};

const ENTITY_ASSET_PATHS = {
  CH: "assets/atividades/chest.png",
  JA: "assets/atividades/jar.png",
};

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
    floor: ["RM", "RM", "JR", "JR", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, "CH", EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["WL", "RM", "RM", "RM", "RM", "WL"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "RM", "RM", "RM", "RM"],
  },
  {
    entity: [EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY, EMPTY_ENTITY],
    floor: ["RM", "RM", "CK", "CK", "RM", "RM"],
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
let copyMapFeedbackTimer = 0;

const dom = {
  canvas: document.getElementById("game-canvas"),
  ageDisplay: document.getElementById("age-display"),
  yearTimer: document.getElementById("year-timer"),
  favoriteObject: document.getElementById("favorite-object"),
  statusGrid: document.getElementById("status-grid"),
  metaGrid: document.getElementById("meta-grid"),
  activityCards: document.getElementById("activity-cards"),
  activityView: document.getElementById("activity-view"),
  terminalView: document.getElementById("terminal-view"),
  copyMapButton: document.getElementById("copy-map-button"),
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
  entities: {},
  activityFloors: {},
  activityBalloons: {},
};

const baseWorld = parseRawMap(WORLD_MAP_RAW);
const npcSpawn = extractEntitySpawn(baseWorld, "PL") || { x: 3, y: 1 };

const state = {
  world: baseWorld,
  character: createCharacter(npcSpawn),
  storage: {
    chestStoredJars: 0,
  },
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
  lastDirection: null,
  aiMode: "wandering",
  lastActivityId: null,
  task: null,
  motion: null,
  activityVisual: null,
  uiDirty: true,
};

bootstrap();

async function bootstrap() {
  await loadAssets();
  bindUiEvents();
  appendLog("Mapa inicial 6 x 9 carregado com camadas separadas de floor e entity.");
  appendLog("Tiles JR e CK definem os unicos pontos validos para fazer jarro e comida.");
  appendLog("O bau CH guarda jarros infinitamente e tambem serve como fonte infinita de recursos.");
  appendLog("Movimento visual agora e animado tile por tile, sem glide unico.");
  renderUi();
  state.uiDirty = false;
  requestAnimationFrame(loop);
}

function bindUiEvents() {
  dom.copyMapButton?.addEventListener("click", () => {
    void handleCopyMapClick();
  });
}

async function handleCopyMapClick() {
  const rawMap = serializeWorldToRaw();
  const copied = await copyTextToClipboard(rawMap);

  if (copied) {
    appendLog("Mapa RAW copiado para a area de transferencia.");
    setCopyButtonLabel("Copiado");
    return;
  }

  appendLog("Nao foi possivel copiar o mapa RAW automaticamente.");
  setCopyButtonLabel("Falhou");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback abaixo para navegadores que bloqueiam clipboard.writeText.
    }
  }

  dom.terminalView.focus();
  dom.terminalView.select();
  dom.terminalView.setSelectionRange(0, dom.terminalView.value.length);

  try {
    return document.execCommand("copy");
  } catch (error) {
    return false;
  }
}

function setCopyButtonLabel(label) {
  if (!dom.copyMapButton) {
    return;
  }

  dom.copyMapButton.textContent = label;
  clearTimeout(copyMapFeedbackTimer);
  copyMapFeedbackTimer = window.setTimeout(() => {
    dom.copyMapButton.textContent = "Copiar mapa";
  }, 1600);
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
    inventario: {
      item_carregado: null,
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

  updateNpcMotion(delta);
  updateActivityVisual(delta);
  updateTask(delta);

  while (state.elapsedMs >= REAL_MS_PER_YEAR) {
    state.elapsedMs -= REAL_MS_PER_YEAR;
    state.character.status.age += 1;
    appendLog(`Passou mais um ano. Idade atual: ${state.character.status.age}.`);
  }

  while (state.needClockMs >= NEED_DECAY_MS) {
    state.needClockMs -= NEED_DECAY_MS;
    applyNaturalNeedDecay();
  }

  if (!state.motion) {
    while (state.aiClockMs >= NPC_STEP_MS) {
      state.aiClockMs -= NPC_STEP_MS;
      runNpcTurn();
    }
  }

  const remainingSeconds = Math.max(0, Math.floor((REAL_MS_PER_YEAR - state.elapsedMs) / 1000));
  const shouldRender =
    state.uiDirty || remainingSeconds !== state.lastVisibleSecond || Boolean(state.motion) || Boolean(state.activityVisual);

  if (shouldRender) {
    state.lastVisibleSecond = remainingSeconds;
    renderUi();
    state.uiDirty = false;
  }

  requestAnimationFrame(loop);
}

function updateNpcMotion(delta) {
  if (!state.motion) {
    return;
  }

  state.motion.elapsedMs += delta;
  if (state.motion.elapsedMs < state.motion.durationMs) {
    return;
  }

  finalizeNpcMove();
}

function finalizeNpcMove() {
  if (!state.motion) {
    return;
  }

  const motion = state.motion;
  state.character.fisico.pos = { x: motion.to.x, y: motion.to.y };
  state.lastDirection = motion.direction;
  state.motion = null;

  state.moveCount += 1;
  applyStepCosts();

  const tileInfo = getTileInfo(state.character.fisico.pos.x, state.character.fisico.pos.y);
  appendLog(
    `Passo concluido para (${state.character.fisico.pos.x}, ${state.character.fisico.pos.y}) em ${tileInfo.label}.`
  );
}

function updateActivityVisual(delta) {
  if (!state.activityVisual) {
    return;
  }

  state.activityVisual.elapsedMs += delta;
  if (state.activityVisual.elapsedMs >= state.activityVisual.durationMs) {
    state.activityVisual = null;
  }
}

function updateTask(delta) {
  if (!state.task || state.task.type !== "eat" || state.task.stage !== "eating") {
    return;
  }

  state.task.remainingMs = Math.max(0, state.task.remainingMs - delta);
  if (state.task.remainingMs === 0) {
    finishEatingTask();
  }
}

function runNpcTurn() {
  if (state.motion) {
    return;
  }

  if (state.character.inventario.item_carregado === "JA") {
    runJarPlacementTurn();
    return;
  }

  if (state.task) {
    runTaskTurn();
    return;
  }

  syncAiMode();

  if (state.aiMode === "resting") {
    restTurn();
    return;
  }

  if (state.aiMode === "feeding") {
    startEatingTask();
    return;
  }

  if (shouldStartCookingTask()) {
    startCookingTask();
    return;
  }

  const activityId = activityForMode(state.aiMode);

  if (activityId && isActivityAllowedAtCurrentTile(activityId)) {
    if (state.activityCooldownMs === 0 && performActivity(activityId, { source: "ai" })) {
      state.activityCooldownMs = ACTIVITY_COOLDOWN_MS;
    }

    return;
  }

  const direction = chooseAutonomousDirection(state.aiMode);
  if (direction) {
    beginNpcMove(direction);
    return;
  }

  appendLog("O NPC ficou sem tiles adjacentes livres para caminhar.");
}

function shouldStartCookingTask() {
  return state.aiMode === "wandering" && state.activityCooldownMs === 0 && randomInt(1, 12) === 1;
}

function startEatingTask() {
  state.task = {
    type: "eat",
    stage: "to_chest",
    balloonKey: "eat",
    remainingMs: 0,
  };
  state.uiDirty = true;
  appendLog("A IA ativou o balao eat e vai ao bau pegar comida.");
}

function startCookingTask() {
  state.task = {
    type: "cook",
    stage: "to_chest",
    balloonKey: "cook",
  };
  state.uiDirty = true;
  appendLog("A IA ativou o balao cook e vai ao bau pegar ingredientes.");
}

function clearTask() {
  state.task = null;
  state.uiDirty = true;
}

function runTaskTurn() {
  if (!state.task) {
    return;
  }

  if (state.task.type === "eat") {
    runEatTaskTurn();
    return;
  }

  if (state.task.type === "cook") {
    runCookTaskTurn();
  }
}

function runEatTaskTurn() {
  const { x, y } = state.character.fisico.pos;

  if (state.task.stage === "to_chest") {
    if (isAdjacentToEntityToken(x, y, "CH")) {
      state.character.inventario.item_carregado = "FOOD";
      if (isValidEatingTile(x, y)) {
        state.task.stage = "eating";
        state.task.remainingMs = EAT_DURATION_MS;
        appendLog("O NPC pegou comida no bau e parou para comer.");
      } else {
        state.task.stage = "to_spot";
        appendLog("O NPC pegou comida no bau e vai buscar um tile RM livre para comer.");
      }
      state.uiDirty = true;
      return;
    }

    const direction = chooseDirectionToAdjacentChest();
    if (direction) {
      beginNpcMove(direction);
      return;
    }

    appendLog("O NPC quer comer, mas nao encontrou caminho ate o bau.");
    return;
  }

  if (state.task.stage === "to_spot") {
    if (isValidEatingTile(x, y)) {
      state.task.stage = "eating";
      state.task.remainingMs = EAT_DURATION_MS;
      state.uiDirty = true;
      appendLog("O NPC encontrou um tile livre e comecou a comer.");
      return;
    }

    const direction = chooseDirectionToEatingTile();
    if (direction) {
      beginNpcMove(direction);
      return;
    }

    state.task.stage = "eating";
    state.task.remainingMs = EAT_DURATION_MS;
    state.uiDirty = true;
    appendLog("O NPC nao encontrou outro tile neutro e vai comer onde esta.");
    return;
  }
}

function runCookTaskTurn() {
  const { x, y } = state.character.fisico.pos;

  if (state.task.stage === "to_chest") {
    if (isAdjacentToEntityToken(x, y, "CH")) {
      state.character.inventario.item_carregado = "ING";
      state.task.stage = "to_kitchen";
      state.uiDirty = true;
      appendLog("O NPC pegou ingredientes no bau e vai para o CK cozinhar.");
      return;
    }

    const direction = chooseDirectionToAdjacentChest();
    if (direction) {
      beginNpcMove(direction);
      return;
    }

    appendLog("O NPC quer cozinhar, mas nao encontrou caminho ate o bau.");
    return;
  }

  if (state.task.stage === "to_kitchen") {
    if (isActivityAllowedAtCurrentTile("fazer comida")) {
      if (performActivity("fazer comida", { source: "ai" })) {
        state.character.inventario.item_carregado = null;
        clearTask();
        state.activityCooldownMs = ACTIVITY_COOLDOWN_MS;
      }
      return;
    }

    const direction = chooseDirectionToActivityTile("fazer comida", "feeding");
    if (direction) {
      beginNpcMove(direction);
      return;
    }

    appendLog("O NPC esta com ingredientes, mas nao encontrou caminho ate um tile CK.");
  }
}

function finishEatingTask() {
  if (!state.task || state.task.type !== "eat") {
    return;
  }

  adjustStatus("saciedade", 22);
  adjustStatus("felicidade", 1);
  state.character.inventario.item_carregado = null;
  clearTask();
  state.activityCooldownMs = Math.max(state.activityCooldownMs, ACTIVITY_COOLDOWN_MS);
  appendLog("O NPC terminou de comer.");
}

function runJarPlacementTurn() {
  if (tryPlaceCarriedJarAdjacent()) {
    return;
  }

  if (tryStoreCarriedJarInChest()) {
    return;
  }

  const direction = chooseDirectionToAdjacentChest();
  if (direction) {
    beginNpcMove(direction);
    return;
  }

  appendLog("O NPC esta com um jarro pronto, mas nao encontrou tile RM adjacente livre nem caminho ate o bau.");
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
    { value: saciedade, mode: "feeding" },
    { value: felicidade, mode: "decorating" },
    { value: energia, mode: "resting" },
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

  const activityId = activityForMode(mode);
  const targetToken = getRequiredTileToken(activityId);
  if (targetToken) {
    const path = findPathToFloorToken(targetToken, mode);
    if (path && path.length > 1) {
      return directionBetween(path[0], path[1]);
    }
  }

  const filtered = filterImmediateBacktrack(options);
  const pool = filtered.length > 0 ? filtered : options;
  const priorities = directionPriorityForMode(mode);

  for (const direction of priorities) {
    const match = pool.find((option) => option.direction === direction);
    if (match) {
      return match.direction;
    }
  }

  return pool[0].direction;
}

function chooseDirectionToAdjacentChest() {
  const path = findPathToAdjacentEntityToken("CH", "resting");
  if (path && path.length > 1) {
    return directionBetween(path[0], path[1]);
  }

  return null;
}

function chooseDirectionToActivityTile(activityId, mode) {
  const targetToken = getRequiredTileToken(activityId);
  if (!targetToken) {
    return null;
  }

  const path = findPathToFloorToken(targetToken, mode);
  if (path && path.length > 1) {
    return directionBetween(path[0], path[1]);
  }

  return null;
}

function chooseDirectionToEatingTile() {
  const path = findPathToMatchingTile((x, y) => isValidEatingTile(x, y), "wandering");
  if (path && path.length > 1) {
    return directionBetween(path[0], path[1]);
  }

  return null;
}

function directionPriorityForMode(mode) {
  const priorityByMode = {
    feeding: ["down", "right", "left", "up"],
    decorating: ["up", "left", "right", "down"],
    resting: ["up", "down", "left", "right"],
    wandering: ["down", "right", "left", "up"],
  };

  return priorityByMode[mode] || priorityByMode.wandering;
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

function findPathToFloorToken(tileToken, mode) {
  if (!tileToken) {
    return null;
  }

  return findPathToMatchingTile((x, y) => state.world.cells[y][x].floor === tileToken, mode);
}

function findPathToAdjacentEntityToken(entityToken, mode) {
  return findPathToMatchingTile((x, y) => isAdjacentToEntityToken(x, y, entityToken), mode);
}

function findPathToMatchingTile(predicate, mode) {
  const start = state.character.fisico.pos;
  if (predicate(start.x, start.y)) {
    return [{ x: start.x, y: start.y }];
  }

  const priorities = directionPriorityForMode(mode);
  const queue = [{ x: start.x, y: start.y }];
  const parents = new Map();
  const visited = new Set([cellKey(start.x, start.y)]);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = neighborsByPriority(current.x, current.y, priorities);

    for (const neighbor of neighbors) {
      const key = cellKey(neighbor.x, neighbor.y);
      if (visited.has(key) || !isNpcWalkable(neighbor.x, neighbor.y)) {
        continue;
      }

      visited.add(key);
      parents.set(key, current);

      if (predicate(neighbor.x, neighbor.y)) {
        return buildPathFromParents(start, neighbor, parents);
      }

      queue.push(neighbor);
    }
  }

  return null;
}

function neighborsByPriority(x, y, priorities) {
  const deltaByDirection = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  return priorities.map((direction) => {
    const delta = deltaByDirection[direction];
    return { x: x + delta.x, y: y + delta.y };
  });
}

function buildPathFromParents(start, end, parents) {
  const path = [{ x: end.x, y: end.y }];
  let currentKey = cellKey(end.x, end.y);

  while (parents.has(currentKey)) {
    const parent = parents.get(currentKey);
    path.push({ x: parent.x, y: parent.y });
    currentKey = cellKey(parent.x, parent.y);
  }

  path.reverse();
  if (path.length === 0 || path[0].x !== start.x || path[0].y !== start.y) {
    path.unshift({ x: start.x, y: start.y });
  }

  return path;
}

function directionBetween(from, to) {
  if (to.x === from.x && to.y === from.y - 1) {
    return "up";
  }

  if (to.x === from.x && to.y === from.y + 1) {
    return "down";
  }

  if (to.x === from.x - 1 && to.y === from.y) {
    return "left";
  }

  if (to.x === from.x + 1 && to.y === from.y) {
    return "right";
  }

  return null;
}

function cellKey(x, y) {
  return `${x},${y}`;
}

function beginNpcMove(direction) {
  const target = getAdjacentOptions().find((option) => option.direction === direction);
  if (!target) {
    return false;
  }

  state.motion = {
    from: {
      x: state.character.fisico.pos.x,
      y: state.character.fisico.pos.y,
    },
    to: {
      x: target.target.x,
      y: target.target.y,
    },
    direction,
    elapsedMs: 0,
    durationMs: WALK_DURATION_MS,
  };

  if (direction === "left") {
    state.character.fisico.direcao_olhar = "esquerda";
  }

  if (direction === "right") {
    state.character.fisico.direcao_olhar = "direita";
  }

  state.uiDirty = true;
  return true;
}

function applyStepCosts() {
  adjustStatus("energia", -1);

  if (state.moveCount % 2 === 0) {
    adjustStatus("saciedade", -1);
  }

  if (state.moveCount % 3 === 0) {
    adjustStatus("felicidade", -1);
  }

  applyLowStatusConsequences();
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

  const glyph = FLOOR_GLYPHS[state.world.cells[y][x].floor];
  return Boolean(glyph && glyph.room);
}

function isNpcWalkable(x, y) {
  if (!isInsideWorld(x, y)) {
    return false;
  }

  const tileInfo = getTileInfo(x, y);
  return tileInfo.walkable;
}

function getAdjacentJarPlacementTarget() {
  const { x, y } = state.character.fisico.pos;
  const candidates = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];

  return candidates.find((candidate) => {
    if (!isInsideWorld(candidate.x, candidate.y)) {
      return false;
    }

    const cell = state.world.cells[candidate.y][candidate.x];
    const tileInfo = getTileInfo(candidate.x, candidate.y);
    return tileInfo.baseWalkable && cell.floor === "RM" && cell.entity === EMPTY_ENTITY;
  }) || null;
}

function isValidEatingTile(x, y) {
  if (!isInsideWorld(x, y)) {
    return false;
  }

  const cell = state.world.cells[y][x];
  const tileInfo = getTileInfo(x, y);
  return tileInfo.walkable && cell.floor === "RM";
}

function tryPlaceCarriedJarAdjacent() {
  if (state.character.inventario.item_carregado !== "JA") {
    return false;
  }

  const target = getAdjacentJarPlacementTarget();
  if (!target) {
    return false;
  }

  state.world.cells[target.y][target.x].entity = "JA";
  state.character.inventario.item_carregado = null;
  state.uiDirty = true;
  appendLog(`O NPC colocou um jarro em (${target.x}, ${target.y}). Esse tile agora bloqueia passagem.`);
  return true;
}

function tryStoreCarriedJarInChest() {
  if (state.character.inventario.item_carregado !== "JA") {
    return false;
  }

  const { x, y } = state.character.fisico.pos;
  if (!isAdjacentToEntityToken(x, y, "CH")) {
    return false;
  }

  state.character.inventario.item_carregado = null;
  state.storage.chestStoredJars += 1;
  state.uiDirty = true;
  appendLog(`O NPC guardou um jarro no bau. Total guardado: ${state.storage.chestStoredJars}.`);
  return true;
}

function isAdjacentToEntityToken(x, y, token) {
  const positions = [
    { x, y: y - 1 },
    { x: x + 1, y },
    { x, y: y + 1 },
    { x: x - 1, y },
  ];

  return positions.some((position) => {
    return isInsideWorld(position.x, position.y) && state.world.cells[position.y][position.x].entity === token;
  });
}

function performActivity(activityId, options = {}) {
  const activity = ACTIVITY_DEFS.find((item) => item.id === activityId);
  if (!activity) {
    return false;
  }

  if (!isActivityAllowedAtCurrentTile(activity.id)) {
    appendLog(`${activity.label} so pode acontecer sobre tiles ${activity.tileToken}.`);
    return false;
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
    adjustStatus("felicidade", succeeded ? 2 + likeBonus : -1);
    adjustStatus("saciedade", succeeded ? 0 : -1);
  }

  applyLowStatusConsequences();
  state.lastActivityId = activity.id;
  startActivityVisual(activity);

  if (activity.id === "fazer decoracao" && succeeded) {
    createJarFromDecoration();
  }

  const prefix = options.source === "ai" ? "A IA escolheu: " : "";
  const statusLabel = succeeded ? "deu certo" : "falhou";
  const summary = succeeded ? activity.successLabel : `${activity.label.toLowerCase()} e falhou`;
  appendLog(
    `${prefix}${summary}. Resultado ${statusLabel} (${roll}/10), gostar ${record.taxa_gostar}, qualidade ${record.taxa_qualidade}.`
  );
  return true;
}

function createJarFromDecoration() {
  state.character.inventario.item_carregado = "JA";
  state.uiDirty = true;
  appendLog("Um novo jarro foi criado.");

  if (tryPlaceCarriedJarAdjacent()) {
    return;
  }

  if (tryStoreCarriedJarInChest()) {
    return;
  }

  appendLog("Nao havia tile RM adjacente livre. O NPC vai procurar o bau para guardar o jarro.");
}

function startActivityVisual(activity) {
  if (!activity.balloonAssetKey || !assets.activityBalloons[activity.balloonAssetKey]) {
    return;
  }

  state.activityVisual = {
    assetKey: activity.balloonAssetKey,
    label: activity.label,
    elapsedMs: 0,
    durationMs: ACTIVITY_VISUAL_MS,
  };
}

function getRequiredTileToken(activityId) {
  return ACTIVITY_DEFS.find((item) => item.id === activityId)?.tileToken || null;
}

function isActivityAllowedAtCurrentTile(activityId) {
  const tileToken = getRequiredTileToken(activityId);
  if (!tileToken) {
    return true;
  }

  const { x, y } = state.character.fisico.pos;
  return state.world.cells[y][x].floor === tileToken;
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
  renderActivityCards();
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

  if (tileInfo.room) {
    const tileImage = assets.border[tileInfo.variant] || assets.border.center;

    if (tileImage) {
      ctx.drawImage(tileImage, screenX, screenY, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = "#6a8155";
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    if (tileInfo.walkable && tileInfo.floorAssetKey && assets.activityFloors[tileInfo.floorAssetKey]) {
      ctx.drawImage(assets.activityFloors[tileInfo.floorAssetKey], screenX, screenY, TILE_SIZE, TILE_SIZE);
    }

    if (tileInfo.walkable && tileInfo.token !== "RM") {
      drawActivityFloorMarker(screenX, screenY, tileInfo.token);
    }

    if (tileInfo.baseWalkable && cell.entity !== EMPTY_ENTITY) {
      drawStaticEntity(screenX, screenY, cell.entity);
    }

  } else {
    ctx.fillStyle = "#17120f";
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    if (hasAdjacentRoomFloor(x, y)) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }

  ctx.strokeStyle = "rgba(242, 231, 207, 0.05)";
  ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
}

function drawStaticEntity(screenX, screenY, token) {
  const image = assets.entities[token];
  const drawMap = {
    CH: { x: 10, y: 10, size: 28 },
    JA: { x: 12, y: 8, size: 24 },
  };
  const drawInfo = drawMap[token];

  if (!drawInfo) {
    return;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.beginPath();
  ctx.ellipse(screenX + 24, screenY + 35, 11, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (image) {
    ctx.drawImage(image, screenX + drawInfo.x, screenY + drawInfo.y, drawInfo.size, drawInfo.size);
    return;
  }

  ctx.fillStyle = token === "CH" ? "#7f5c41" : "#c87a4a";
  ctx.fillRect(screenX + drawInfo.x, screenY + drawInfo.y, drawInfo.size, drawInfo.size);
}

function drawActivityFloorMarker(screenX, screenY, token) {
  const paletteByToken = {
    CK: {
      fill: "rgba(176, 92, 28, 0.72)",
      stroke: "rgba(255, 219, 172, 0.9)",
    },
    JR: {
      fill: "rgba(108, 76, 44, 0.72)",
      stroke: "rgba(239, 212, 176, 0.9)",
    },
  };
  const palette = paletteByToken[token];

  if (!palette) {
    return;
  }

  ctx.fillStyle = palette.fill;
  ctx.fillRect(screenX + 4, screenY + 4, 18, 14);
  ctx.strokeStyle = palette.stroke;
  ctx.strokeRect(screenX + 4.5, screenY + 4.5, 17, 13);
  ctx.fillStyle = "#fff4dc";
  ctx.font = "bold 10px monospace";
  ctx.textBaseline = "middle";
  ctx.fillText(token, screenX + 7, screenY + 11);
}

function drawNpc() {
  const renderPosition = getNpcRenderPosition();
  const frame = getNpcFrame();
  const shadowX = renderPosition.x + 24;
  const shadowY = renderPosition.y + 39;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(shadowX, shadowY, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (frame) {
    ctx.drawImage(frame, renderPosition.x + 4, renderPosition.y - 4, 40, 40);
  } else {
    ctx.fillStyle = "#f0c875";
    ctx.fillRect(renderPosition.x + 10, renderPosition.y + 6, 24, 28);
  }

  drawActivityVisual(renderPosition);
}

function drawActivityVisual(renderPosition) {
  const balloonKey = getVisibleBalloonKey();
  if (!balloonKey) {
    return;
  }

  const image = assets.activityBalloons[balloonKey];
  if (!image) {
    return;
  }

  ctx.fillStyle = "rgba(18, 15, 12, 0.84)";
  ctx.fillRect(renderPosition.x + 14, renderPosition.y - 20, 20, 20);
  ctx.drawImage(image, renderPosition.x + 16, renderPosition.y - 18, 16, 16);
}

function getVisibleBalloonKey() {
  if (state.task?.balloonKey) {
    return state.task.balloonKey;
  }

  if (state.activityVisual?.assetKey) {
    return state.activityVisual.assetKey;
  }

  return null;
}

function getNpcRenderPosition() {
  if (!state.motion) {
    return {
      x: state.character.fisico.pos.x * TILE_SIZE,
      y: state.character.fisico.pos.y * TILE_SIZE,
    };
  }

  return {
    x: interpolatePixels(state.motion.from.x * TILE_SIZE, state.motion.to.x * TILE_SIZE, state.motion),
    y: interpolatePixels(state.motion.from.y * TILE_SIZE, state.motion.to.y * TILE_SIZE, state.motion),
  };
}

function interpolatePixels(from, to, motion) {
  const delta = to - from;
  const progress = Math.min(motion.elapsedMs, motion.durationMs);
  return from + Math.round((delta * progress) / motion.durationMs);
}

function getNpcFrame() {
  const frames = assets.npc[state.character.fisico.direcao_olhar];
  if (!frames || frames.length === 0) {
    return null;
  }

  if (!state.motion) {
    return frames[0];
  }

  const frameIndex = Math.floor((state.motion.elapsedMs * frames.length) / state.motion.durationMs);
  return frames[frameIndex % frames.length];
}

function getTileInfo(x, y) {
  if (!isInsideWorld(x, y)) {
    return {
      label: "fora do mapa",
      walkable: false,
      collidable: true,
      variant: "void",
      room: false,
      floorAssetKey: null,
      token: null,
    };
  }

  const cell = state.world.cells[y][x];
  const glyph = FLOOR_GLYPHS[cell.floor] || FLOOR_GLYPHS.WL;
  if (cell.floor === "WL") {
    return {
      label: glyph.label,
      walkable: false,
      collidable: true,
      variant: "wall_block",
      room: false,
      floorAssetKey: null,
      token: cell.floor,
    };
  }

  const variant = selectBorderVariant(x, y);
  const baseWalkable = variant === "center";
  const occupantToken = cell.entity;
  const occupantGlyph = ENTITY_GLYPHS[occupantToken];
  const occupied = occupantToken !== EMPTY_ENTITY && Boolean(occupantGlyph?.blocks);
  const walkable = baseWalkable && !occupied;
  const label = occupied ? occupantGlyph.label : baseWalkable ? glyph.label : `parede bordada (${variant})`;

  return {
    label,
    walkable,
    collidable: !walkable,
    variant,
    baseWalkable,
    room: Boolean(glyph.room),
    floorAssetKey: glyph.floorAssetKey || null,
    token: cell.floor,
    occupantToken,
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
  const taskMeta = taskPresentation();
  const motionLine = state.motion
    ? ` Passo atual: (${state.motion.from.x}, ${state.motion.from.y}) -> (${state.motion.to.x}, ${state.motion.to.y}).`
    : "";
  const carryLine =
    state.character.inventario.item_carregado === "JA"
      ? " O NPC esta carregando um jarro e vai coloca-lo num tile RM livre ou no bau."
      : state.character.inventario.item_carregado
        ? ` O NPC esta carregando ${describeCarriedItem(state.character.inventario.item_carregado)}.`
        : "";

  dom.aiMode.textContent = taskMeta?.title || aiMeta.title;
  dom.aiSummary.textContent = `${taskMeta?.summary || aiMeta.summary}${motionLine}${carryLine}`;
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
  const destinationLabel = state.motion ? `(${state.motion.to.x}, ${state.motion.to.y})` : "nenhum";

  dom.metaGrid.innerHTML = [
    { label: "Idade", value: `${state.character.status.age} anos` },
    {
      label: "Posicao logica",
      value: `(${state.character.fisico.pos.x}, ${state.character.fisico.pos.y})`,
    },
    {
      label: "Destino visual",
      value: destinationLabel,
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
      label: "Item carregado",
      value: describeCarriedItem(state.character.inventario.item_carregado),
    },
    {
      label: "Jarros no bau",
      value: `${state.storage.chestStoredJars}`,
    },
    {
      label: "Atividades ja praticadas",
      value: `${activitiesCount}`,
    },
    {
      label: "Em movimento",
      value: state.motion ? "sim" : "nao",
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

function renderActivityCards() {
  dom.activityCards.innerHTML = ACTIVITY_DEFS.map((activity) => {
    const record = state.character.preferencias.atividades_praticadas.find((item) => {
      return item.atividade === activity.id;
    });
    const activeClass = state.lastActivityId === activity.id ? " active" : "";
    const iconMarkup = activity.floorAssetKey
      ? `<img class="activity-icon" src="${ACTIVITY_FLOOR_PATHS[activity.floorAssetKey]}" alt="${activity.label}" />`
      : `<span class="activity-placeholder">TXT</span>`;
    const statsLabel = record
      ? `gostar ${record.taxa_gostar} | qualidade ${record.taxa_qualidade}`
      : "ainda nao praticada";

    return `
      <article class="activity-card${activeClass}">
        <div class="activity-card-head">
          ${iconMarkup}
          <div class="activity-card-copy">
            <strong>${activity.label}</strong>
            <span>${statsLabel}</span>
          </div>
        </div>
        <p>${activity.hint}</p>
      </article>
    `;
  }).join("");
}

function renderActivities() {
  const activityRecords = state.character.preferencias.atividades_praticadas;

  if (activityRecords.length === 0) {
    dom.activityView.textContent =
      "A IA ainda nao escolheu nenhuma atividade.\n\nA viewport usa animacao de caminhada por tile.\nComer usa o balao eat com comida do bau, e cozinhar usa o balao cook com ingredientes do bau.";
    return;
  }

  const chestLine = `Bau CH\n  jarros guardados: ${state.storage.chestStoredJars}\n  recursos: infinitos\n  comida: infinita`;

  dom.activityView.textContent = [chestLine]
    .concat(
      activityRecords.map((record) => {
        const label = ACTIVITY_DEFS.find((item) => item.id === record.atividade)?.label || record.atividade;
        return [
          `${label}`,
          `  gostar: ${record.taxa_gostar}`,
          `  sucesso: ${record.taxa_sucesso}`,
          `  qualidade: ${record.taxa_qualidade}`,
          `  repeticoes: ${record.repeticoes}`,
        ].join("\n");
      })
    )
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
    "  CK = tile de comida; so faz comida ali",
    "  JR = tile de jarro; so faz decoracao ali",
    "  CH = bau infinito para guardar jarros e buscar recursos",
    "  JA = jarro colocado sobre um tile RM; bloqueia passagem",
    "  eat = pega comida ao lado do bau e come parado em tile RM",
    "  cook = pega ingredientes ao lado do bau e vai ao CK cozinhar",
    "  WL = parede direta do mapa",
    "  Apenas a variante center e caminhavel",
    "  O RAW segue por tile; a viewport interpola cada passo visual",
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
    inventario: state.character.inventario,
    conhecidos: state.character.conhecidos,
    mundo: {
      jarros_no_bau: state.storage.chestStoredJars,
    },
    movimento_visual: state.motion
      ? {
          from: state.motion.from,
          to: state.motion.to,
          elapsed_ms: state.motion.elapsedMs,
          duration_ms: state.motion.durationMs,
        }
      : null,
    ia: {
      modo: state.aiMode,
      tarefa: state.task,
      direcao_anterior: state.lastDirection,
      cooldown_atividade_ms: state.activityCooldownMs,
      ultima_atividade: state.lastActivityId,
    },
  };
}

function taskPresentation() {
  if (!state.task) {
    return null;
  }

  if (state.task.type === "eat") {
    if (state.task.stage === "to_chest") {
      return {
        title: "buscar comida",
        summary: "O NPC ativou o balao eat e esta indo ao bau por um tile adjacente para pegar comida.",
      };
    }

    if (state.task.stage === "to_spot") {
      return {
        title: "procurar lugar para comer",
        summary: "O NPC ja pegou comida no bau e esta buscando um tile RM livre para ficar parado enquanto come.",
      };
    }

    return {
      title: "comendo",
      summary: "O NPC esta parado com o balao eat acima da cabeca enquanto termina a refeicao.",
    };
  }

  if (state.task.type === "cook") {
    if (state.task.stage === "to_chest") {
      return {
        title: "buscar ingredientes",
        summary: "O NPC ativou o balao cook e esta indo ao bau por um tile adjacente buscar ingredientes.",
      };
    }

    return {
      title: "indo cozinhar",
      summary: "O NPC ja pegou ingredientes no bau e esta indo para um tile CK cozinhar.",
    };
  }

  return null;
}

function describeCarriedItem(itemKey) {
  const labels = {
    JA: "jarro",
    FOOD: "comida",
    ING: "ingredientes",
  };

  return labels[itemKey] || "nenhum";
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
  const [borderEntries, leftFrames, rightFrames, floorEntries, balloonEntries, entityEntries] = await Promise.all([
    Promise.all(
      Object.entries(BORDER_TILE_PATHS).map(async ([key, src]) => {
        return [key, await loadImage(src)];
      })
    ),
    Promise.all(NPC_SPRITES.esquerda.map((src) => loadImage(src))),
    Promise.all(NPC_SPRITES.direita.map((src) => loadImage(src))),
    Promise.all(
      Object.entries(ACTIVITY_FLOOR_PATHS).map(async ([key, src]) => {
        return [key, await loadImage(src)];
      })
    ),
    Promise.all(
      Object.entries(BALLOON_ASSET_PATHS).map(async ([key, src]) => {
        return [key, await loadImage(src)];
      })
    ),
    Promise.all(
      Object.entries(ENTITY_ASSET_PATHS).map(async ([key, src]) => {
        return [key, await loadImage(src)];
      })
    ),
  ]);

  borderEntries.forEach(([key, image]) => {
    assets.border[key] = image;
  });

  floorEntries.forEach(([key, image]) => {
    assets.activityFloors[key] = image;
  });

  balloonEntries.forEach(([key, image]) => {
    assets.activityBalloons[key] = image;
  });

  entityEntries.forEach(([key, image]) => {
    assets.entities[key] = image;
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
