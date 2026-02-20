/**
 * ProceduralMap.js — "Fill-and-carve" procedural level generator.
 *
 * Algorithm
 * ─────────
 *  1. Fill the entire walkable area with blocking terrain (dense walls).
 *  2. Clear a square glade (NODE_CLEAR tile radius) around every key
 *     position: Mimi's start, each enemy, the NPC, the chest, and the boss.
 *  3. Build a minimum spanning tree (Prim's) rooted at Mimi's start,
 *     connecting ALL key positions by shortest Manhattan distance.
 *  4. Carve a 3-tile-wide L-shaped corridor along every MST edge:
 *     horizontal leg at A's row, then vertical leg at B's column.
 *  5. Convert the remaining blocked tiles to a decoration array that
 *     ExploreScene._addDecorations() consumes verbatim.
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

// ── Blocking tile constructor for each region ─────────────────────────────
// One sprite per region theme — dense walls will cluster visually because
// ExploreScene scales trees ×1.35, rocks ×1.20 (adjacent tiles merge).
const TILE_FN = [
  (c, r) => ({ col: c, row: r, key: 'decoration_tree',   blocking: true }), // R0 Sunny Village
  (c, r) => ({ col: c, row: r, key: 'decoration_tree',   blocking: true }), // R1 Meadow Maze
  (c, r) => ({ col: c, row: r, key: 'decoration_rock',   blocking: true }), // R2 Desert Dunes
  (c, r) => ({ col: c, row: r, key: 'decoration_icicle', blocking: true }), // R3 Frostbite Cavern
  (c, r) => ({ col: c, row: r, key: 'decoration_pillar', blocking: true }), // R4 Shadow Castle
];

// ── Non-blocking accent tile for open floor areas (null = no accents) ──────
const ACCENT_FN = [
  (c, r) => ({ col: c, row: r, key: 'decoration_flower',   blocking: false }), // R0
  (c, r) => ({ col: c, row: r, key: 'decoration_mushroom', blocking: false }), // R1
  null,   // R2 — barren desert
  (c, r) => ({ col: c, row: r, key: 'decoration_snowpile', blocking: false }), // R3
  null,   // R4 — bare castle stone
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
    regionData.chestTile,
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

  // ── Step 5: Blocked tiles → decoration array ─────────────────────────
  // Skip border tiles — those are rendered by ExploreScene independently.
  const decorations = [];
  for (const key of blocked) {
    const [c, r] = key.split(',').map(Number);
    if (c < BORDER || c >= COLS - BORDER) continue;
    if (r < BORDER || r >= ROWS - BORDER) continue;
    decorations.push(tileFn(c, r));
  }

  // ── Step 6: Scatter non-blocking accents in open (carved) areas ─────────
  // ~1-in-12 open tiles gets an accent.  Deterministic positional hash so the
  // layout is stable across renders and ExploreScene's clearance guard
  // (CLEAR_R=3) will silently drop any accent too close to a key position.
  const accentFn = ACCENT_FN[regionData.id];
  if (accentFn) {
    const ACCENT_RATE = 12;
    for (let c = BORDER; c < COLS - BORDER; c++) {
      for (let r = BORDER; r < ROWS - BORDER; r++) {
        if (blocked.has(`${c},${r}`)) continue;           // only in open areas
        // Multiplicative XOR hash — no diagonal periodicity unlike linear hashes
        const h = ((Math.imul(c, 1073741827) ^ Math.imul(r, 2147483693)) >>> 0) % ACCENT_RATE;
        if (h !== 0) continue;
        decorations.push(accentFn(c, r));
      }
    }
  }

  return { decorations, blocked };
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
