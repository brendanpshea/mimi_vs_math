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

const COLS        = 70;
const ROWS        = 50;
const BORDER      = 2;   // border wall thickness — tiles 0–1 / 68–69 / etc.
const NODE_CLEAR  = 5;   // glade radius around every key position
const CORRIDOR_HW = 2;   // corridor half-width: total width = 2*CORRIDOR_HW+1 = 5 tiles

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
  (c, r) => { const h = _tileHash(c, r);                                                           // R1 Meadow Maze
    return { col: c, row: r, key: h === 0 ? 'decoration_tree_meadow'  : 'decoration_tree_meadow_b',  blocking: true }; },
  (c, r) => { const h = _tileHash(c, r);                                                           // R2 Desert Dunes
    return { col: c, row: r, key: h === 0 ? 'decoration_rock'         : 'decoration_rock_b',         blocking: true }; },
  (c, r) => { const h = _tileHash(c, r);                                                           // R3 Frostbite Cavern
    return { col: c, row: r, key: h === 0 ? 'decoration_icicle'       : 'decoration_icicle_b',       blocking: true }; },
  (c, r) => { const h = _tileHash(c, r);                                                           // R4 Shadow Castle
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
  [ // R1 — Meadow Maze: mushroom groves + lily clusters
    { key: 'decoration_mushroom', freq: 0.10, threshold: 0.80, seed: 300 },
    { key: 'decoration_lily',     freq: 0.14, threshold: 0.84, seed: 400 },
  ],
  [ // R2 — Desert Dunes: bone fields + tumbleweeds
    { key: 'decoration_bones',       freq: 0.11, threshold: 0.82, seed: 500 },
    { key: 'decoration_tumbleweed',  freq: 0.09, threshold: 0.84, seed: 600 },
  ],
  [ // R3 — Frostbite Cavern: snow drifts + frost flowers
    { key: 'decoration_snowpile',    freq: 0.10, threshold: 0.78, seed: 700 },
    { key: 'decoration_frost_flower',freq: 0.13, threshold: 0.84, seed: 800 },
  ],
  [ // R4 — Shadow Castle: skulls + torches
    { key: 'decoration_skull',  freq: 0.12, threshold: 0.82, seed: 900 },
    { key: 'decoration_torch',  freq: 0.08, threshold: 0.86, seed: 1000 },
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
  { // R1 — Meadow flower ring
    key: 'landmark_flower_ring', tilesW: 5, tilesH: 4, blocking: false, margin: 2,
  },
  { // R2 — Lava pool
    key: 'landmark_lava_pool', tilesW: 5, tilesH: 4, blocking: true, margin: 2,
  },
  { // R3 — Frozen lake
    key: 'landmark_frozen_lake', tilesW: 6, tilesH: 5, blocking: true, margin: 2,
  },
  { // R4 — Dark altar
    key: 'landmark_dark_altar', tilesW: 4, tilesH: 4, blocking: true, margin: 2,
  },
];

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a complete map for one region.
 *
 * @param  {object} regionData  - One entry from regions.js
 * @returns {{ decorations: Array, blocked: Set<string> }}
 *   decorations — tile objects for ExploreScene._addDecorations()
 *   blocked     — exact blocked-tile Set (borders + remaining walls after carving),
 *                 suitable for BFS reachability tests
 */
export function generateRegionMap(regionData) {
  const tileFn = TILE_FN[regionData.id] ?? TILE_FN[0];

  // Key positions — mimiStart must be index 0 (MST root).
  const nodes = [
    regionData.mimiStart,
    regionData.npcTile,
    regionData.bossTile,
    ...regionData.enemySpawns.map(s => ({ col: s.col, row: s.row })),
  ];

  // ── Step 1: Start with border walls + fully filled walkable area ──────
  const blocked = new Set();

  // Border walls (rendered by ExploreScene as tileSprites, not decorations)
  for (let c = 0; c < COLS; c++) {
    blocked.add(`${c},0`);      blocked.add(`${c},1`);
    blocked.add(`${c},48`);     blocked.add(`${c},49`);
  }
  for (let r = 0; r < ROWS; r++) {
    blocked.add(`0,${r}`);      blocked.add(`1,${r}`);
    blocked.add(`68,${r}`);     blocked.add(`69,${r}`);
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

  return { decorations, blocked, landmarks };
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
    { c1: 14, c2: 50, r1: 35, r2: 43 },   // south zone
    { c1: 14, c2: 50, r1: 19, r2: 27 },   // mid zone
    { c1: 14, c2: 50, r1:  5, r2: 12 },   // north zone
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
