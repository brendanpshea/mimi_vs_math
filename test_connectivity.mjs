/**
 * test_connectivity.mjs
 * Structural reachability tests for all five ExploreScene regions.
 *
 * Uses WALK_GRIDS — the exact blocked-tile Sets produced by the procedural
 * map generator — to run BFS from mimiStart and assert that every key
 * position (enemies, NPC, chest, boss) is reachable.
 *
 * Run with:  node test_connectivity.mjs
 */

import MAPS, { WALK_GRIDS } from './src/data/maps.js';
import REGIONS               from './src/data/regions.js';

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
function bfsReachable(start, blocked, cols = 70, rows = 50) {
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

  const reachable = bfsReachable(region.mimiStart, blocked);

  // Helper: is a tile reachable (exact position OR any immediately adjacent tile)?
  // We allow 1-tile adjacency because Phaser physics lets Mimi touch/overlap
  // game objects without needing to occupy the exact same tile.
  const canReach = ({ col, row }) => {
    if (reachable.has(`${col},${row}`)) return true;
    // adjacent tiles (the clearance guard guarantees the key tile itself is
    // never occluded by a decoration, so if it is blocked the map is wrong)
    return false;
  };

  // Boss tile
  assert(canReach(region.bossTile),
    `boss (col ${region.bossTile.col}, row ${region.bossTile.row}) reachable`);

  // Chest tile
  assert(canReach(region.chestTile),
    `chest (col ${region.chestTile.col}, row ${region.chestTile.row}) reachable`);

  // NPC tile
  assert(canReach(region.npcTile),
    `NPC (col ${region.npcTile.col}, row ${region.npcTile.row}) reachable`);

  // Each enemy spawn
  for (const [i, spawn] of region.enemySpawns.entries()) {
    assert(canReach(spawn),
      `enemy[${i}] ${spawn.id} (col ${spawn.col}, row ${spawn.row}) reachable`);
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
