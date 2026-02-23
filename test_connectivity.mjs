/**
 * test_connectivity.mjs
 * Structural reachability tests for all five ExploreScene regions.
 *
 * Uses WALK_GRIDS — the exact blocked-tile Sets produced by the procedural
 * map generator — to run BFS from mimiStart and assert that every key
 * position (enemies, NPC, boss) is reachable.
 *
 * Note: chestTile is intentionally excluded. It was removed from the MST
 * so the SE corner no longer gets a carved glade or connecting corridor.
 *
 * Run with:  node test_connectivity.mjs
 */

import MAPS, { WALK_GRIDS, POSITIONS } from './src/data/maps.js';
import REGIONS               from './src/data/regions/index.js';

// ── BFS ──────────────────────────────────────────────────────────────────────

/**
 * Return the Set of all tile keys ("col,row") reachable from `start` using
 * 4-directional movement, avoiding tiles in `blocked`.
 *
 * @param {{col:number, row:number}} start
 * @param {Set<string>}              blocked
 * @param {number}                   [cols=70]
 * @param {number}                   [rows=50]
 * @returns {Set<string>}
 */
function bfsReachable(start, blocked, cols = 80, rows = 56) {
  const visited = new Set();
  const queue   = [{ col: start.col, row: start.row }];
  const key     = (c, r) => `${c},${r}`;

  const startKey = key(start.col, start.row);
  if (blocked.has(startKey)) {
    throw new Error(`mimiStart ${startKey} is itself blocked — bad map data`);
  }
  visited.add(startKey);

  while (queue.length > 0) {
    const { col, row } = queue.shift();
    for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const k = key(nc, nr);
      if (blocked.has(k) || visited.has(k)) continue;
      visited.add(k);
      queue.push({ col: nc, row: nr });
    }
  }
  return visited;
}

// ── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓  ${message}`);
    passed++;
  } else {
    console.error(`  ✗  ${message}`);
    failed++;
  }
}

// ── Per-region tests ──────────────────────────────────────────────────────────

for (const region of REGIONS) {
  console.log(`\n── Region ${region.id}: ${region.name} ──`);

  const blocked = WALK_GRIDS[region.id];
  if (!blocked) {
    assert(false, `WALK_GRIDS[${region.id}] exists`);
    continue;
  }

  // mimiStart and bossTile are now randomised — read from POSITIONS so BFS
  // uses the same tile set that the map generator carved corridors around.
  const positions = POSITIONS[region.id];
  const mimiStart = positions.mimiStart;
  const bossTile  = positions.bossTile;

  // ── Bounds sanity ──────────────────────────────────────────────────────
  assert(
    mimiStart.col >= 2 && mimiStart.col <= 77 && mimiStart.row >= 2 && mimiStart.row <= 53,
    `mimiStart (${mimiStart.col},${mimiStart.row}) within walkable bounds`);
  assert(
    bossTile.col >= 2 && bossTile.col <= 77 && bossTile.row >= 2 && bossTile.row <= 53,
    `bossTile (${bossTile.col},${bossTile.row}) within walkable bounds`);

  // ── Minimum separation between start and boss ──────────────────────────
  const sepDist = Math.abs(bossTile.col - mimiStart.col) + Math.abs(bossTile.row - mimiStart.row);
  assert(sepDist >= 30,
    `mimiStart↔bossTile Manhattan distance ${sepDist} >= 30`);

  const reachable = bfsReachable(mimiStart, blocked);

  // Helper: is a tile reachable (exact position OR any immediately adjacent tile)?
  // We allow 1-tile adjacency because Phaser physics lets Mimi touch/overlap
  // game objects without needing to occupy the exact same tile.
  const canReach = ({ col, row }) => {
    if (reachable.has(`${col},${row}`)) return true;
    // adjacent tiles (the clearance guard guarantees the key tile itself is
    // never occluded by a decoration, so if it is blocked the map is wrong)
    return false;
  };

  // Boss tile (dynamic — drawn from bossTilePool each run)
  assert(canReach(bossTile),
    `boss (col ${bossTile.col}, row ${bossTile.row}) reachable`);

  // NPC tile (randomized — read from POSITIONS)
  assert(canReach(positions.npcTile),
    `NPC (col ${positions.npcTile.col}, row ${positions.npcTile.row}) reachable`);

  // Each enemy spawn (randomized — read from POSITIONS)
  for (const [i, spawn] of positions.enemySpawns.entries()) {
    assert(canReach(spawn),
      `enemy[${i}] ${spawn.id} (col ${spawn.col}, row ${spawn.row}) reachable`);
  }

  // ── Interactive items structure ────────────────────────────────────────
  const items = positions.interactiveItems;
  assert(Array.isArray(items), `interactiveItems is an Array`);
  assert(items.length >= 0 && items.length <= 2, `interactiveItems length 0-2 (got ${items.length})`);
  const VALID_ITEM_IDS = new Set(['sardine','yarn_ball','catnip','lucky_collar','fish_fossil']);
  for (const [ii, it] of items.entries()) {
    assert(
      Number.isInteger(it.col) && it.col >= 2 && it.col <= 77,
      `item[${ii}] col in bounds (${it.col})`);
    assert(
      Number.isInteger(it.row) && it.row >= 2 && it.row <= 53,
      `item[${ii}] row in bounds (${it.row})`);
    assert(VALID_ITEM_IDS.has(it.itemId),
      `item[${ii}] itemId '${it.itemId}' is a known item`);
    assert(canReach(it),
      `item[${ii}] '${it.itemId}' (col ${it.col}, row ${it.row}) reachable`);
    // Must be ≥8 tiles from mimiStart and bossTile
    const dStart = Math.abs(it.col - mimiStart.col) + Math.abs(it.row - mimiStart.row);
    const dBoss  = Math.abs(it.col - bossTile.col)  + Math.abs(it.row - bossTile.row);
    assert(dStart >= 8, `item[${ii}] >= 8 tiles from mimiStart (${dStart})`);
    assert(dBoss  >= 8, `item[${ii}] >= 8 tiles from bossTile  (${dBoss})`);
  }
  if (items.length === 2) {
    const spacing = Math.abs(items[0].col - items[1].col) + Math.abs(items[0].row - items[1].row);
    assert(spacing >= 12, `item[0] and item[1] are >= 12 tiles apart (${spacing})`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(52)}`);
console.log(`Connectivity: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nOne or more regions have unreachable key positions!');
  process.exit(1);
} else {
  console.log('\nAll regions fully connected. ✓');
}
