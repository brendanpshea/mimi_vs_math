/**
 * test_positions.mjs
 * Unit tests for the new pool-based position randomisation and
 * interactive-item placement (Phases 8 random start/boss + decorations).
 *
 * Run with:  node test_positions.mjs
 *
 * What is checked
 * ───────────────
 * 1. regions.js pool shape — all 5 regions have mimiStartPool (≥2) and
 *    bossTilePool (≥2) arrays containing {col,row} objects.
 *
 * 2. Pool validity — every pool entry has col 2–77 and row 2–53
 *    (inside the walkable area, not on border).
 *
 * 3. Boss separation guarantee — for ALL combinations of start×boss in the
 *    pools of each region, at least one bossTile candidate is ≥30 Manhattan
 *    tiles from every mimiStart candidate.
 *
 * 4. POSITIONS shape — each entry now exposes mimiStart, bossTile, and
 *    interactiveItems (in addition to npcTile and enemySpawns).
 *
 * 5. interactiveItems content — per region, expected item IDs match the
 *    ITEM_POOLS constant defined in ProceduralMap.js.
 *
 * 6. Deterministic pool membership — the POSITIONS mimiStart and bossTile
 *    values for this run are members of the matching region pool.
 *
 * 7. Distance guarantee enforced — this session's mimiStart ↔ bossTile
 *    separation is ≥ 30 tiles (the MIN_BOSS_DIST guard in randomizePositions).
 */

import REGIONS               from './src/data/regions/index.js';
import { POSITIONS }         from './src/data/maps.js';

// ── Colour helpers (ANSI) ─────────────────────────────────────────────────
const G   = s => `\x1b[32m${s}\x1b[0m`;
const R   = s => `\x1b[31m${s}\x1b[0m`;
const B   = s => `\x1b[1m${s}\x1b[0m`;

// ── Test harness ──────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ${G('✓')}  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ${R('✗')}  ${name}`);
    console.log(`       ${R(e.message)}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg ?? 'assertion failed');
}
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg ?? `expected ${b}, got ${a}`);
}
function assertType(v, t, msg) {
  if (typeof v !== t) throw new Error(msg ?? `expected type ${t}, got ${typeof v}`);
}

// ── Pool constants (mirrors ProceduralMap.js ITEM_POOLS) ─────────────────
const ITEM_POOLS = [
  ['sardine',      'yarn_ball'],    // R0
  ['catnip',       'lucky_collar'], // R1
  ['fish_fossil',  'sardine'],      // R2
  ['yarn_ball',    'catnip'],       // R3
  ['lucky_collar', 'fish_fossil'],  // R4
];

const VALID_ITEM_IDS = new Set(['sardine', 'yarn_ball', 'catnip', 'lucky_collar', 'fish_fossil']);

function manhattan(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: regions.js pool shapes
// ─────────────────────────────────────────────────────────────────────────────
console.log(B('\nPool shape (regions.js)'));

for (const region of REGIONS) {
  test(`R${region.id} has mimiStartPool with ≥2 entries`, () => {
    assert(Array.isArray(region.mimiStartPool), 'mimiStartPool must be an array');
    assert(region.mimiStartPool.length >= 2,
      `mimiStartPool length ${region.mimiStartPool.length} should be ≥ 2`);
  });

  test(`R${region.id} has bossTilePool with ≥2 entries`, () => {
    assert(Array.isArray(region.bossTilePool), 'bossTilePool must be an array');
    assert(region.bossTilePool.length >= 2,
      `bossTilePool length ${region.bossTilePool.length} should be ≥ 2`);
  });

  test(`R${region.id} mimiStartPool entries are {col,row} objects in bounds`, () => {
    for (const [i, p] of region.mimiStartPool.entries()) {
      assertType(p.col, 'number', `entry[${i}].col must be a number`);
      assertType(p.row, 'number', `entry[${i}].row must be a number`);
      assert(p.col >= 2 && p.col <= 77, `entry[${i}].col ${p.col} out of bounds [2,77]`);
      assert(p.row >= 2 && p.row <= 53, `entry[${i}].row ${p.row} out of bounds [2,53]`);
    }
  });

  test(`R${region.id} bossTilePool entries are {col,row} objects in bounds`, () => {
    for (const [i, p] of region.bossTilePool.entries()) {
      assertType(p.col, 'number', `entry[${i}].col must be a number`);
      assertType(p.row, 'number', `entry[${i}].row must be a number`);
      assert(p.col >= 2 && p.col <= 77, `entry[${i}].col ${p.col} out of bounds [2,77]`);
      assert(p.row >= 2 && p.row <= 53, `entry[${i}].row ${p.row} out of bounds [2,53]`);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: Boss separation guarantee across all pool combinations
// ─────────────────────────────────────────────────────────────────────────────
console.log(B('\nBoss separation guarantee (≥30 Manhattan for every start in pool)'));

for (const region of REGIONS) {
  test(`R${region.id}: every mimiStart has at least one valid bossTile ≥30 away`, () => {
    for (const start of region.mimiStartPool) {
      const valid = region.bossTilePool.filter(b => manhattan(start, b) >= 30);
      assert(valid.length > 0,
        `mimiStart (${start.col},${start.row}) has no bossTile ≥30 tiles away`);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: POSITIONS shape — new fields present
// ─────────────────────────────────────────────────────────────────────────────
console.log(B('\nPOSITIONS shape (maps.js)'));

for (const region of REGIONS) {
  const pos = POSITIONS[region.id];

  test(`POSITIONS[${region.id}] has mimiStart`, () => {
    assert(pos.mimiStart !== undefined, 'mimiStart should be present');
    assertType(pos.mimiStart.col, 'number', 'mimiStart.col should be a number');
    assertType(pos.mimiStart.row, 'number', 'mimiStart.row should be a number');
  });

  test(`POSITIONS[${region.id}] has bossTile`, () => {
    assert(pos.bossTile !== undefined, 'bossTile should be present');
    assertType(pos.bossTile.col, 'number', 'bossTile.col should be a number');
    assertType(pos.bossTile.row, 'number', 'bossTile.row should be a number');
  });

  test(`POSITIONS[${region.id}] has interactiveItems array`, () => {
    assert(Array.isArray(pos.interactiveItems), 'interactiveItems should be an array');
  });

  test(`POSITIONS[${region.id}] mimiStart is a member of mimiStartPool`, () => {
    const { mimiStart } = pos;
    const inPool = region.mimiStartPool.some(
      p => p.col === mimiStart.col && p.row === mimiStart.row,
    );
    assert(inPool,
      `mimiStart (${mimiStart.col},${mimiStart.row}) not found in region.mimiStartPool`);
  });

  test(`POSITIONS[${region.id}] bossTile is a member of bossTilePool`, () => {
    const { bossTile } = pos;
    const inPool = region.bossTilePool.some(
      p => p.col === bossTile.col && p.row === bossTile.row,
    );
    assert(inPool,
      `bossTile (${bossTile.col},${bossTile.row}) not found in region.bossTilePool`);
  });

  test(`POSITIONS[${region.id}] mimiStart↔bossTile distance ≥30`, () => {
    const dist = manhattan(pos.mimiStart, pos.bossTile);
    assert(dist >= 30,
      `distance ${dist} is less than the 30-tile minimum`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: interactiveItems content
// ─────────────────────────────────────────────────────────────────────────────
console.log(B('\nInteractive items content'));

for (const region of REGIONS) {
  const pos   = POSITIONS[region.id];
  const items = pos.interactiveItems;
  const expectedPool = ITEM_POOLS[region.id];

  test(`R${region.id} interactiveItems length 0–2`, () => {
    assert(items.length >= 0 && items.length <= 2,
      `length ${items.length} out of range`);
  });

  test(`R${region.id} interactiveItems have valid itemIds`, () => {
    for (const [i, it] of items.entries()) {
      assert(VALID_ITEM_IDS.has(it.itemId),
        `item[${i}] itemId '${it.itemId}' is not a known item`);
    }
  });

  test(`R${region.id} interactiveItems match expected ITEM_POOLS`, () => {
    for (const [i, it] of items.entries()) {
      assertEqual(it.itemId, expectedPool[i],
        `item[${i}] should be '${expectedPool[i]}', got '${it.itemId}'`);
    }
  });

  test(`R${region.id} interactiveItems are within walkable bounds`, () => {
    for (const [i, it] of items.entries()) {
      assert(it.col >= 2 && it.col <= 77,
        `item[${i}] col ${it.col} out of bounds`);
      assert(it.row >= 2 && it.row <= 53,
        `item[${i}] row ${it.row} out of bounds`);
    }
  });

  test(`R${region.id} each interactiveItem ≥8 Manhattan from mimiStart and bossTile`, () => {
    const { mimiStart, bossTile } = pos;
    for (const [i, it] of items.entries()) {
      const dStart = manhattan(it, mimiStart);
      const dBoss  = manhattan(it, bossTile);
      assert(dStart >= 8,
        `item[${i}] (${it.col},${it.row}) only ${dStart} tiles from mimiStart — need ≥8`);
      assert(dBoss >= 8,
        `item[${i}] (${it.col},${it.row}) only ${dBoss} tiles from bossTile — need ≥8`);
    }
  });

  if (items.length === 2) {
    test(`R${region.id} two items are ≥12 tiles apart`, () => {
      const spacing = manhattan(items[0], items[1]);
      assert(spacing >= 12,
        `items are only ${spacing} tiles apart — need ≥12`);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(56)}`);
console.log(`Positions: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error(R('\nOne or more position tests failed!'));
  process.exit(1);
} else {
  console.log(G('\nAll position tests passed. ✓'));
}
