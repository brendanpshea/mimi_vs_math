/**
 * ProceduralMap.js — "Fill-and-carve" procedural level generator.
 *
 * Algorithm
 * ─────────
 *  1. Fill the entire walkable area with blocking terrain (dense walls).
 *  2. Clear a square glade (NODE_CLEAR tile radius) around every key
 *     position: Mimi's start, each enemy, the NPC, and the boss.
 *  3. Build a minimum spanning tree (Prim's) rooted at Mimi's start,
 *     connecting ALL key positions by shortest Manhattan distance.
 *  4. Carve a 3-tile-wide L-shaped corridor along every MST edge:
 *     horizontal leg at A's row, then vertical leg at B's column.
 *  5. Place region set-pieces (multi-tile landmarks) in open areas.
 *  6. Convert the remaining blocked tiles to a decoration array that
 *     ExploreScene._addDecorations() consumes verbatim.
 *  7. Scatter non-blocking accents using 2D value-noise for organic
 *     clustering (mushroom groves, flower meadows, etc.).
 *
 * The result guarantees every position reachable from Mimi with zero
 * hand-authored tile data.
 *
 * Exports
 * ───────
 *  generateRegionMap(regionData)
 *    → { decorations: Array, blocked: Set<"col,row"> }
 */

const COLS        = 80;
const ROWS        = 56;
const BORDER      = 2;   // border wall thickness — tiles 0–1 / 78–79 / etc.
const NODE_CLEAR  = 5;   // glade radius around every key position
const CORRIDOR_HW = 3;   // corridor half-width: total width = 2*CORRIDOR_HW+1 = 7 tiles

// ═══════════════════════════════════════════════════════════════════════════
// 2D seeded value-noise (no dependencies)
// ═══════════════════════════════════════════════════════════════════════════

/** Simple integer hash → float in [0,1).  Uses Math.imul for proper 32-bit
 *  multiplication without float-precision loss, then multiple xor-shift rounds
 *  to ensure values spread across the full range. */
function _hash2d(ix, iy, seed) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h = Math.imul(h ^ (h >>> 15), 521225121);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

/** Smooth interpolation (Hermite). */
function _smoothstep(t) { return t * t * (3 - 2 * t); }

/**
 * 2D value-noise in [0,1).  `freq` controls feature size (~0.08 = big blobs,
 * ~0.25 = small blobs).  Deterministic for same inputs.
 */
function noise2d(x, y, freq, seed) {
  const fx = x * freq, fy = y * freq;
  const ix = Math.floor(fx), iy = Math.floor(fy);
  const tx = _smoothstep(fx - ix), ty = _smoothstep(fy - iy);
  const a = _hash2d(ix,     iy,     seed);
  const b = _hash2d(ix + 1, iy,     seed);
  const c = _hash2d(ix,     iy + 1, seed);
  const d = _hash2d(ix + 1, iy + 1, seed);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

// ═══════════════════════════════════════════════════════════════════════════
// Blocking-tile constructors (one sprite theme per region)
// ═══════════════════════════════════════════════════════════════════════════

const _tileHash = (c, r) => ((Math.imul(c, 1073741827) ^ Math.imul(r, 2147483693)) >>> 0) % 2;

const TILE_FN = [
  (c, r) => { const h = _tileHash(c, r);                                                           // R0 Sunny Village
    return { col: c, row: r, key: h === 0 ? 'decoration_tree'         : 'decoration_tree_b',         blocking: true }; },
  (c, r) => { const h = _tileHash(c, r);                                                           // R1 Windmill Village
    return { col: c, row: r, key: h === 0 ? 'decoration_windmill'     : 'decoration_hay_bale',       blocking: true }; },
  (c, r) => { const h = _tileHash(c, r);                                                           // R2 Meadow Maze
    return { col: c, row: r, key: h === 0 ? 'decoration_tree_meadow'  : 'decoration_tree_meadow_b',  blocking: true }; },
  (c, r) => { const h = _tileHash(c, r);                                                           // R3 Desert Dunes
    return { col: c, row: r, key: h === 0 ? 'decoration_rock'         : 'decoration_rock_b',         blocking: true }; },
  (c, r) => { const h = _tileHash(c, r);                                                           // R4 Frostbite Cavern
    return { col: c, row: r, key: h === 0 ? 'decoration_icicle'       : 'decoration_icicle_b',       blocking: true }; },
  (c, r) => { const h = _tileHash(c, r);                                                           // R5 Shadow Castle
    return { col: c, row: r, key: h === 0 ? 'decoration_pillar'       : 'decoration_pillar_b',       blocking: true }; },
];

// ═══════════════════════════════════════════════════════════════════════════
// Noise-driven accent layers (organic clusters instead of flat scatter)
// ═══════════════════════════════════════════════════════════════════════════
// Each region defines one or more accent layers.  Each layer has:
//   key       — sprite key
//   freq      — noise frequency (lower = bigger blobs)
//   threshold — noise value above which an accent is placed (~0.52–0.62)
//   seed      — unique noise seed so layers don't overlap identically
//   blocking  — whether the accent blocks movement (default false)

const ACCENT_LAYERS = [
  [ // R0 — Sunny Village: flower meadows + scattered hay bales
    { key: 'decoration_flower',   freq: 0.12, threshold: 0.82, seed: 100 },
    { key: 'decoration_hay_bale', freq: 0.08, threshold: 0.86, seed: 200 },
  ],
  [ // R1 — Windmill Village: wheat stalk clusters + sunflowers
    { key: 'decoration_wheat_stalk', freq: 0.12, threshold: 0.82, seed: 250 },
    { key: 'decoration_sunflower',   freq: 0.07, threshold: 0.90, seed: 350 },
  ],
  [ // R2 — Meadow Maze: mushroom groves + lily clusters
    { key: 'decoration_mushroom', freq: 0.10, threshold: 0.80, seed: 300 },
    { key: 'decoration_clover',   freq: 0.14, threshold: 0.84, seed: 400 },
  ],
  [ // R3 — Desert Dunes: bone fields + tumbleweeds
    { key: 'decoration_bones',       freq: 0.11, threshold: 0.82, seed: 500 },
    { key: 'decoration_tumbleweed',  freq: 0.09, threshold: 0.84, seed: 600 },
  ],
  [ // R4 — Frostbite Cavern: snow drifts + frost flowers
    { key: 'decoration_snowpile',    freq: 0.10, threshold: 0.78, seed: 700 },
    { key: 'decoration_frost_flower',freq: 0.13, threshold: 0.84, seed: 800 },
  ],
  [ // R5 — Shadow Castle: skulls (moderate blobs — floor scatter looks fine)
    // + torches (very sparse: high threshold + low freq = solitary wall punctuation)
    { key: 'decoration_skull',  freq: 0.12, threshold: 0.84, seed: 900 },
    { key: 'decoration_torch',  freq: 0.05, threshold: 0.92, seed: 1000 },
  ],
];

// ═══════════════════════════════════════════════════════════════════════════
// Set-pieces — large multi-tile landmarks (one per region)
// ═══════════════════════════════════════════════════════════════════════════
// Each set-piece is a single large sprite rendered at a target tile position.
// `tilesW`/`tilesH` define how many tiles it occupies for blocking/clearance.
// `blocking` marks every tile in the footprint as impassable.
// `margin` is extra clearance beyond the footprint that must also be open.

const SET_PIECES = [
  { // R0 — Village pond
    key: 'landmark_pond', tilesW: 5, tilesH: 4, blocking: true, margin: 2,
  },
  { // R1 — Windmill mill
    key: 'landmark_windmill_mill', tilesW: 5, tilesH: 4, blocking: true, margin: 2,
  },
  { // R2 — Meadow flower ring
    key: 'landmark_flower_ring', tilesW: 5, tilesH: 4, blocking: false, margin: 2,
  },
  { // R3 — Lava pool
    key: 'landmark_lava_pool', tilesW: 5, tilesH: 4, blocking: true, margin: 2,
  },
  { // R4 — Frozen lake
    key: 'landmark_frozen_lake', tilesW: 6, tilesH: 5, blocking: true, margin: 2,
  },
  { // R5 — Dark altar
    key: 'landmark_dark_altar', tilesW: 4, tilesH: 4, blocking: true, margin: 2,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Position randomization — NPC + enemies get fresh locations each run
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Placement zones (rectangles inside the 70×50 grid).
 * Enemies are distributed across north / mid / south to maintain
 * the original three-zone gameplay flow.
 */
const PLACE_ZONES = {
  npc:   { c1: 4,  c2: 18, r1: 22, r2: 32 },  // near Mimi start (mid-left)
  north: { c1: 10, c2: 68, r1: 4,  r2: 16 },
  mid:   { c1: 14, c2: 68, r1: 20, r2: 32 },
  south: { c1: 10, c2: 68, r1: 38, r2: 50 },
};

/**
 * Zone assignment for each enemy slot index.
 * All regions now have 10 enemies (indices 0-9).
 * Pattern: 3 north, 3 mid, 4 south — spreads encounters evenly.
 */
const ZONE_SLOTS = ['north', 'north', 'south', 'mid', 'south', 'south', 'north', 'mid', 'south', 'mid'];

/**
 * Pick a random tile within `zone` that is ≥ `minDist` Manhattan distance
 * from every position in `placed`.
 *
 * Tries up to 300 random samples, then falls back to a shuffled
 * exhaustive scan with gradually relaxed distance.
 */
function pickRandomInZone(zone, placed, minDist) {
  const ok = (c, r) => placed.every(
    p => Math.abs(c - p.col) + Math.abs(r - p.row) >= minDist,
  );

  // Fast sampling
  const cSpan = zone.c2 - zone.c1 + 1;
  const rSpan = zone.r2 - zone.r1 + 1;
  for (let i = 0; i < 300; i++) {
    const c = zone.c1 + Math.floor(Math.random() * cSpan);
    const r = zone.r1 + Math.floor(Math.random() * rSpan);
    if (ok(c, r)) return { col: c, row: r };
  }

  // Fallback: exhaustive scan, shuffled, with distance relaxation
  const candidates = [];
  for (let c = zone.c1; c <= zone.c2; c++)
    for (let r = zone.r1; r <= zone.r2; r++)
      candidates.push({ col: c, row: r });
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  for (let dist = minDist; dist >= 4; dist -= 2) {
    for (const pos of candidates) {
      if (placed.every(p => Math.abs(pos.col - p.col) + Math.abs(pos.row - p.row) >= dist))
        return pos;
    }
  }
  return candidates[0];   // last resort
}

/** Minimum Manhattan distance (tiles) separating mimiStart from bossTile. */
const MIN_BOSS_DIST = 30;

/**
 * Generate randomized positions for mimiStart, bossTile, NPC, and every enemy.
 * Start and boss are drawn from per-region pools defined in regions.js.
 *
 * @param  {object} regionData — one entry from regions.js
 * @returns {{ mimiStart, bossTile, npcTile, enemySpawns }}
 */
function randomizePositions(regionData) {
  const MIN_DIST = 10;

  // ── Pick mimiStart from pool ──────────────────────────────────────────
  const startPool  = regionData.mimiStartPool ?? [regionData.mimiStart];
  const mimiStart  = startPool[Math.floor(Math.random() * startPool.length)];

  // ── Pick bossTile from pool, enforcing min separation from mimiStart ──
  const bossPool       = regionData.bossTilePool ?? [regionData.bossTile];
  const bossCandidates = bossPool.filter(
    b => Math.abs(b.col - mimiStart.col) + Math.abs(b.row - mimiStart.row) >= MIN_BOSS_DIST,
  );
  const validBossPool = bossCandidates.length > 0 ? bossCandidates : bossPool;
  const bossTile      = validBossPool[Math.floor(Math.random() * validBossPool.length)];

  const placed = [
    { col: mimiStart.col, row: mimiStart.row },
    { col: bossTile.col,  row: bossTile.row  },
  ];

  // NPC — always near Mimi (mid-left zone)
  const npcTile = pickRandomInZone(PLACE_ZONES.npc, placed, MIN_DIST);
  placed.push(npcTile);

  // Enemies — distribute across north / mid / south zones
  const enemySpawns = [];
  for (let i = 0; i < regionData.enemySpawns.length; i++) {
    const orig     = regionData.enemySpawns[i];
    const zoneName = ZONE_SLOTS[i] || 'south';
    const pos      = pickRandomInZone(PLACE_ZONES[zoneName], placed, MIN_DIST);
    placed.push(pos);
    enemySpawns.push({
      col: pos.col,
      row: pos.row,
      id:  orig.id,
      difficultyOverride: orig.difficultyOverride,
    });
  }

  return { mimiStart, bossTile, npcTile, enemySpawns };
}

// ── Interactive item pools (2 items per region) ───────────────────────────
/** Items awarded per region, cycling through all 5 types. */
const ITEM_POOLS = [
  ['sardine',      'yarn_ball'],    // R0
  ['catnip',       'lucky_collar'], // R1 Windmill Village
  ['fish_fossil',  'sardine'],      // R2 Meadow Maze
  ['yarn_ball',    'catnip'],       // R3 Desert Dunes
  ['lucky_collar', 'fish_fossil'],  // R4 Frostbite Cavern
  ['sardine',      'yarn_ball'],    // R5 Shadow Castle
];

/**
 * Scan carved-open tiles for 2 interactive item pickup spots.
 * Tiles must be at least ITEM_MIN_DIST from every key position.
 *
 * @param {Set}    blocked    blocked-tile set after corridor carving
 * @param {Array}  keyNodes   [{col,row}] key positions to clear around
 * @param {number} regionId
 * @returns {Array<{col,row,itemId}>} 0–2 entries
 */
function pickInteractiveItems(blocked, keyNodes, regionId) {
  const ITEM_MIN_DIST    = 8;
  const MIN_ITEM_SPACING = 12;
  const pool = ITEM_POOLS[regionId] ?? ITEM_POOLS[0];

  // ── BFS from mimiStart to collect only truly reachable tiles ──────────────
  const mimiStart = keyNodes[0];
  const reachable = new Set();
  const bfsQueue  = [{ col: mimiStart.col, row: mimiStart.row }];
  reachable.add(`${mimiStart.col},${mimiStart.row}`);
  while (bfsQueue.length > 0) {
    const { col, row } = bfsQueue.shift();
    for (const [dc, dr] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nc = col + dc, nr = row + dr;
      if (nc < BORDER || nc >= COLS - BORDER) continue;
      if (nr < BORDER || nr >= ROWS - BORDER) continue;
      const k = `${nc},${nr}`;
      if (blocked.has(k) || reachable.has(k)) continue;
      reachable.add(k);
      bfsQueue.push({ col: nc, row: nr });
    }
  }

  const isValidTile = (c, r) => {
    if (!reachable.has(`${c},${r}`))             return false;  // not reachable from start
    if (c < BORDER + 2 || c >= COLS - BORDER - 2) return false;  // near border
    if (r < BORDER + 2 || r >= ROWS - BORDER - 2) return false;
    return keyNodes.every(
      n => Math.abs(c - n.col) + Math.abs(r - n.row) >= ITEM_MIN_DIST,
    );
  };

  // Collect candidates (step by 3 tiles to keep scan fast)
  const candidates = [];
  for (let c = BORDER + 2; c < COLS - BORDER - 2; c += 3)
    for (let r = BORDER + 2; r < ROWS - BORDER - 2; r += 3)
      if (isValidTile(c, r)) candidates.push({ col: c, row: r });

  // Fisher-Yates shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Pick up to 2 well-separated tiles
  const chosen = [];
  for (const pos of candidates) {
    if (chosen.length >= 2) break;
    const farEnough = chosen.every(
      p => Math.abs(pos.col - p.col) + Math.abs(pos.row - p.row) >= MIN_ITEM_SPACING,
    );
    if (farEnough) chosen.push(pos);
  }

  return chosen.map((pos, i) => ({ col: pos.col, row: pos.row, itemId: pool[i] }));
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a complete map for one region.
 *
 * @param  {object} regionData  - One entry from regions.js
 * @returns {{ decorations: Array, blocked: Set<string>, landmarks: Array,
 *             npcTile: {col,row}, enemySpawns: Array }}
 *   decorations — tile objects for ExploreScene._addDecorations()
 *   blocked     — exact blocked-tile Set (borders + remaining walls after carving),
 *                 suitable for BFS reachability tests
 *   npcTile / enemySpawns — randomized positions for this run
 */
export function generateRegionMap(regionData) {
  const tileFn = TILE_FN[regionData.id] ?? TILE_FN[0];

  // Randomize all key positions (mimiStart + bossTile drawn from per-region pools)
  const { mimiStart, bossTile, npcTile, enemySpawns } = randomizePositions(regionData);

  // Key positions — mimiStart must be index 0 (MST root).
  const nodes = [
    mimiStart,
    npcTile,
    bossTile,
    ...enemySpawns.map(s => ({ col: s.col, row: s.row })),
  ];

  // ── Step 1: Start with border walls + fully filled walkable area ──────
  const blocked = new Set();

  // Border walls (rendered by ExploreScene as tileSprites, not decorations)
  for (let c = 0; c < COLS; c++) {
    blocked.add(`${c},0`);      blocked.add(`${c},1`);
    blocked.add(`${c},54`);     blocked.add(`${c},55`);
  }
  for (let r = 0; r < ROWS; r++) {
    blocked.add(`0,${r}`);      blocked.add(`1,${r}`);
    blocked.add(`78,${r}`);     blocked.add(`79,${r}`);
  }

  // Fill every tile in the walkable interior
  for (let c = BORDER; c < COLS - BORDER; c++)
    for (let r = BORDER; r < ROWS - BORDER; r++)
      blocked.add(`${c},${r}`);

  // ── Step 2: Clear glades ─────────────────────────────────────────────
  for (const n of nodes) clearGlade(blocked, n.col, n.row, NODE_CLEAR);

  // ── Steps 3 & 4: MST + corridor carving ─────────────────────────────
  for (const [a, b] of buildMST(nodes)) carveL(blocked, a, b, CORRIDOR_HW);

  // ── Step 5: Place set-piece landmark ────────────────────────────────
  const sp = SET_PIECES[regionData.id];
  const decorations = [];
  const landmarks   = [];          // separate channel — NOT filtered by decoration pipeline
  const landmarkTiles = new Set();  // tiles occupied by landmarks — excluded from decoration gen
  if (sp) {
    const pos = findSetPieceSlot(blocked, nodes, sp, regionData.id);
    if (pos) {
      // Track footprint tiles so we skip them when generating decorations,
      // and mark them blocked for pathfinding / collision purposes.
      for (let dc = 0; dc < sp.tilesW; dc++) {
        for (let dr = 0; dr < sp.tilesH; dr++) {
          const tKey = `${pos.col + dc},${pos.row + dr}`;
          landmarkTiles.add(tKey);
          if (sp.blocking) blocked.add(tKey);
        }
      }
      // Also clear a 1-tile margin around the landmark so it isn't smothered
      for (let dc = -1; dc <= sp.tilesW; dc++) {
        for (let dr = -1; dr <= sp.tilesH; dr++) {
          const tKey = `${pos.col + dc},${pos.row + dr}`;
          landmarkTiles.add(tKey);
          blocked.delete(tKey);           // ensure margin is walkable
        }
      }
      // Re-add the footprint itself for blocking landmarks
      if (sp.blocking) {
        for (let dc = 0; dc < sp.tilesW; dc++)
          for (let dr = 0; dr < sp.tilesH; dr++)
            blocked.add(`${pos.col + dc},${pos.row + dr}`);
      }

      landmarks.push({
        col: pos.col, row: pos.row,
        key: sp.key,
        blocking: sp.blocking,
        tilesW: sp.tilesW,
        tilesH: sp.tilesH,
      });
    }
  }

  // ── Step 6: Blocked tiles → decoration array ─────────────────────────
  // Skip border tiles and tiles occupied by landmark set-pieces.
  for (const key of blocked) {
    if (landmarkTiles.has(key)) continue;     // landmark covers this tile
    const [c, r] = key.split(',').map(Number);
    if (c < BORDER || c >= COLS - BORDER) continue;
    if (r < BORDER || r >= ROWS - BORDER) continue;
    decorations.push(tileFn(c, r));
  }

  // ── Step 7: Noise-driven accent clustering ──────────────────────────
  const layers = ACCENT_LAYERS[regionData.id] || [];
  const accentOccupied = new Set();            // prevent two accents on same tile

  for (const layer of layers) {
    for (let c = BORDER; c < COLS - BORDER; c++) {
      for (let r = BORDER; r < ROWS - BORDER; r++) {
        if (blocked.has(`${c},${r}`))      continue;  // inside walls
        if (landmarkTiles.has(`${c},${r}`)) continue;  // landmark zone
        if (accentOccupied.has(`${c},${r}`)) continue;  // another accent already here
        const n = noise2d(c, r, layer.freq, layer.seed + regionData.id * 7);
        if (n < layer.threshold) continue;
        accentOccupied.add(`${c},${r}`);
        decorations.push({ col: c, row: r, key: layer.key, blocking: !!layer.blocking });
      }
    }
  }

  // ── Find open spots for interactive item pickups ─────────────────────
  const interactiveItems = pickInteractiveItems(blocked, nodes, regionData.id);

  return { decorations, blocked, landmarks, mimiStart, bossTile, npcTile, enemySpawns, interactiveItems };
}

// ── Internal helpers ───────────────────────────────────────────────────────

/** Remove all tiles within a square of `radius` from (col, row). */
function clearGlade(blocked, col, row, radius) {
  for (let dc = -radius; dc <= radius; dc++)
    for (let dr = -radius; dr <= radius; dr++)
      blocked.delete(`${col + dc},${row + dr}`);
}

/**
 * Prim's minimum spanning tree, rooted at nodes[0] (Mimi's start).
 * Uses Manhattan distance as the edge weight.
 *
 * @param  {Array<{col,row}>} nodes
 * @returns {Array<[{col,row},{col,row}]>}  array of [from, to] node pairs
 */
function buildMST(nodes) {
  if (nodes.length < 2) return [];

  const n      = nodes.length;
  const inTree = new Set([0]);
  const minKey = new Array(n).fill(Infinity);  // cheapest edge to reach node i
  const parent = new Array(n).fill(-1);        // which tree node reaches node i cheapest
  minKey[0] = 0;

  // Initial relaxation from root (node 0 = mimiStart)
  for (let v = 1; v < n; v++) {
    const d = manhattan(nodes[0], nodes[v]);
    minKey[v] = d;
    parent[v] = 0;
  }

  const edges = [];

  while (inTree.size < n) {
    // Pick the non-tree node with the smallest key
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inTree.has(i) && (u === -1 || minKey[i] < minKey[u])) u = i;
    }
    inTree.add(u);
    if (parent[u] !== -1) edges.push([nodes[parent[u]], nodes[u]]);

    // Relax neighbors
    for (let v = 0; v < n; v++) {
      if (inTree.has(v)) continue;
      const d = manhattan(nodes[u], nodes[v]);
      if (d < minKey[v]) { minKey[v] = d; parent[v] = u; }
    }
  }

  return edges;
}

function manhattan(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

/**
 * Carve a 3-wide L-shaped corridor from point A to point B.
 *   Leg 1 — horizontal: A's row, A's col → B's col
 *   Leg 2 — vertical:   B's col, A's row → B's row
 * All tiles within halfW of the centre line are cleared.
 */
function carveL(blocked, a, b, halfW) {
  const c1 = Math.min(a.col, b.col), c2 = Math.max(a.col, b.col);
  const r1 = Math.min(a.row, b.row), r2 = Math.max(a.row, b.row);

  // Horizontal leg at a.row
  for (let c = c1; c <= c2; c++) {
    for (let dr = -halfW; dr <= halfW; dr++) {
      const r = a.row + dr;
      if (r >= BORDER && r < ROWS - BORDER) blocked.delete(`${c},${r}`);
    }
  }

  // Vertical leg at b.col
  for (let r = r1; r <= r2; r++) {
    for (let dc = -halfW; dc <= halfW; dc++) {
      const c = b.col + dc;
      if (c >= BORDER && c < COLS - BORDER) blocked.delete(`${c},${r}`);
    }
  }
}

/**
 * Find a slot for a set-piece landmark and CARVE the space for it.
 *
 * The map is mostly blocked at this point (only glades + corridors are open),
 * so we don't require the slot to be pre-open.  Instead we:
 *   1. Scan candidate positions in three zones (south → mid → north).
 *   2. Reject any position whose expanded footprint (footprint + margin)
 *      overlaps a key-position glade.
 *   3. The first valid hit wins — we carve (unblock) the footprint + margin.
 *
 * Returns {col, row} of the top-left corner, or null if no slot found.
 */
function findSetPieceSlot(blocked, keyPositions, sp, regionId) {
  const w = sp.tilesW, h = sp.tilesH, m = sp.margin;
  const safeR = NODE_CLEAR + 2;   // keep this far from any key position

  // Zones to scan — order is rotated by regionId so landmarks
  // don't all land in the same zone across regions.
  const allZones = [
    { c1: 14, c2: 60, r1: 38, r2: 48 },   // south zone
    { c1: 14, c2: 60, r1: 21, r2: 31 },   // mid zone
    { c1: 14, c2: 60, r1:  5, r2: 14 },   // north zone
  ];
  // Per-region column offset so each region scans from a different start
  const colOffsets = [0, 12, 6, 18, 3];
  const rid = regionId;
  const zoneOrder = [...allZones.slice(rid % 3), ...allZones.slice(0, rid % 3)];
  const cOff = colOffsets[rid % colOffsets.length] || 0;

  for (const zone of zoneOrder) {
    for (let r = zone.r1; r <= zone.r2 - h + 1; r++) {
      // Start column scan with offset, wrap around zone range
      const cRange = zone.c2 - w + 1 - zone.c1 + 1;
      for (let ci = 0; ci < cRange; ci++) {
        const c = zone.c1 + ((ci + cOff) % cRange);
        // Check expanded rect is within map bounds
        if (c - m < BORDER || c + w + m > COLS - BORDER) continue;
        if (r - m < BORDER || r + h + m > ROWS - BORDER) continue;

        // Check distance from every key position
        const tooClose = keyPositions.some(p =>
          p.col >= c - safeR && p.col < c + w + safeR &&
          p.row >= r - safeR && p.row < r + h + safeR,
        );
        if (tooClose) continue;

        // Blocking landmarks must not overlap any carved corridor or glade
        if (sp.blocking) {
          let overlapsCorridor = false;
          for (let dc = 0; dc < w && !overlapsCorridor; dc++)
            for (let dr = 0; dr < h && !overlapsCorridor; dr++)
              if (!blocked.has(`${c + dc},${r + dr}`))
                overlapsCorridor = true;
          if (overlapsCorridor) continue;
        }

        // Valid! Carve the footprint + margin so it becomes open walkable space
        for (let dc = -m; dc < w + m; dc++)
          for (let dr = -m; dr < h + m; dr++)
            blocked.delete(`${c + dc},${r + dr}`);

        return { col: c, row: r };
      }
    }
  }

  return null;   // no valid slot — skip set-piece for this region
}
