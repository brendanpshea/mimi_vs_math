/**
 * test_unlock.mjs
 * Pure-logic unit tests for the boss-door unlock system.
 * Run with:  node test_unlock.mjs
 *
 * Tests the exact key format ExploreScene uses and the GameState tracking,
 * without needing a browser or Phaser.
 *
 * REGIONS is imported from the real data file so enemy counts can never
 * silently drift out of sync with these tests.
 */

import REGIONS from './src/data/regions.js';

// ── Minimal GameState stub ─────────────────────────────────────────────────
const GameState = {
  defeatedEnemies: {},
  defeatedBosses:  [],
  isEnemyDefeated(regionId, enemyId) {
    return !!this.defeatedEnemies[`r${regionId}_${enemyId}`];
  },
  defeatEnemy(regionId, enemyId) {
    this.defeatedEnemies[`r${regionId}_${enemyId}`] = true;
  },
  hasDefeatedBoss(regionId) {
    return this.defeatedBosses.includes(regionId);
  },
  defeatBoss(regionId) {
    if (!this.defeatedBosses.includes(regionId)) this.defeatedBosses.push(regionId);
  },
  reset() {
    this.defeatedEnemies = {};
    this.defeatedBosses  = [];
  },
};

// ── Reproduces ExploreScene's key formula: spawn.id + index ─────────────────
function instanceKey(regionId, slotIndex) {
  return REGIONS[regionId].enemySpawns[slotIndex].id + slotIndex;
}

function remainingEnemyCount(regionId) {
  return REGIONS[regionId].enemySpawns.filter((spawn, i) =>
    !GameState.isEnemyDefeated(regionId, spawn.id + i),
  ).length;
}

// ── Test harness ──────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function test(name, fn) {
  GameState.reset();
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌  ${name}`);
    console.log(`       ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg ?? 'assertion failed');
}
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg ?? `expected ${b}, got ${a}`);
}

// ── Tests ──────────────────────────────────────────────────────────────────
console.log('\nGameState key format');

test('instanceKey region 0 produces correct keys', () => {
  assertEqual(instanceKey(0, 0), 'counting_caterpillar0');
  assertEqual(instanceKey(0, 1), 'number_gnome1');
  assertEqual(instanceKey(0, 2), 'minus_mole2');
  assertEqual(instanceKey(0, 3), 'counting_caterpillar3'); // D2 review
  assertEqual(instanceKey(0, 4), 'number_gnome4');          // D1 south guard
  assertEqual(instanceKey(0, 5), 'minus_mole5');            // D1 SE patrol
  // Verify count matches the live data
  assertEqual(REGIONS[0].enemySpawns.length, 6, 'R0 should have 6 spawns');
});

test('instanceKey region 1 produces correct keys', () => {
  assertEqual(instanceKey(1, 0), 'slime_pup0');
  assertEqual(instanceKey(1, 1), 'cactus_sprite1');
  assertEqual(instanceKey(1, 2), 'cloud_bully2');
  assertEqual(instanceKey(1, 3), 'counting_caterpillar3'); // R0 review
  assertEqual(instanceKey(1, 4), 'number_gnome4');          // R0 review
  assertEqual(instanceKey(1, 5), 'minus_mole5');            // R0 review
  assertEqual(instanceKey(1, 6), 'slime_pup6');             // D1 north patrol
  // Verify count matches the live data
  assertEqual(REGIONS[1].enemySpawns.length, 7, 'R1 should have 7 spawns');
});

test('instanceKey region 2 produces correct keys', () => {
  assertEqual(instanceKey(2, 0), 'sand_scarab0');
  assertEqual(instanceKey(2, 1), 'mummy_cat1');
  assertEqual(instanceKey(2, 2), 'mirage_fox2');
  assertEqual(instanceKey(2, 3), 'slime_pup3');    // R1 review
  assertEqual(instanceKey(2, 4), 'cactus_sprite4');// R1 review
  assertEqual(instanceKey(2, 5), 'cloud_bully5');  // R1 review
  assertEqual(instanceKey(2, 6), 'sand_scarab6');  // D1 north patrol
  // Verify count matches the live data
  assertEqual(REGIONS[2].enemySpawns.length, 7, 'R2 should have 7 spawns');
});

console.log('\ndefeatEnemy / isEnemyDefeated round-trip');

test('defeat and check an enemy in region 0', () => {
  GameState.defeatEnemy(0, 'counting_caterpillar0');
  assert(GameState.isEnemyDefeated(0, 'counting_caterpillar0'), 'should be defeated');
  assert(!GameState.isEnemyDefeated(0, 'number_gnome1'), 'other should not be defeated');
});

test('region 1 keys do not collide with region 0', () => {
  GameState.defeatEnemy(0, 'slime_pup0');   // would exist in region 1 too
  assert( GameState.isEnemyDefeated(0, 'slime_pup0'), 'should be defeated in r0');
  assert(!GameState.isEnemyDefeated(1, 'slime_pup0'), 'should NOT be defeated in r1');
});

console.log('\nremainingEnemyCount logic');

test('all enemies alive at start (region 1)', () => {
  const expected = REGIONS[1].enemySpawns.length;
  assertEqual(remainingEnemyCount(1), expected);
});

test('count decreases as enemies die (region 1)', () => {
  const spawns = REGIONS[1].enemySpawns;
  for (let i = 0; i < spawns.length; i++) {
    GameState.defeatEnemy(1, instanceKey(1, i));
    assertEqual(remainingEnemyCount(1), spawns.length - (i + 1),
      `after defeating spawn ${i}`);
  }
  assertEqual(remainingEnemyCount(1), 0, 'all defeated — count must be 0');
});

test('count in region 1 unaffected by region 0 defeats', () => {
  // Defeat all region-0 enemies using region-0 keys
  for (let i = 0; i < REGIONS[0].enemySpawns.length; i++) {
    GameState.defeatEnemy(0, instanceKey(0, i));
  }
  const expected = REGIONS[1].enemySpawns.length;
  assertEqual(remainingEnemyCount(1), expected, `region 1 should still show ${expected} alive`);
});

console.log('\njustUnlocked logic (the bug under test)');

test('preBattleAllClear correctly detects last-enemy scenario', () => {
  // Simulate: all enemies except the last (slot 5) already defeated
  const regionId = 1;
  const spawnCount = REGIONS[regionId].enemySpawns.length;
  const lastSlot = spawnCount - 1;
  const battleEnemyInstance = instanceKey(regionId, lastSlot);

  for (let i = 0; i < lastSlot; i++) {
    GameState.defeatEnemy(regionId, instanceKey(regionId, i));
  }
  // Last enemy NOT yet recorded — this is the state at _processBattleResult time

  // Compute preBattleAllClear BEFORE recording the defeat (mirrors the fix)
  const preBattleAllClear =
    REGIONS[regionId].enemySpawns.every((spawn, i) => {
      const key = spawn.id + i;
      return key === battleEnemyInstance || GameState.isEnemyDefeated(regionId, key);
    });

  // Now record the defeat (simulates _processBattleResult)
  GameState.defeatEnemy(regionId, battleEnemyInstance);

  assert(preBattleAllClear, 'preBattleAllClear should be true before recording');
  assertEqual(remainingEnemyCount(regionId), 0, 'remaining should be 0 after recording');
  // justUnlocked = preBattleAllClear && !hasDefeatedBoss
  assert(!GameState.hasDefeatedBoss(regionId), 'boss not yet defeated');
  const justUnlocked = preBattleAllClear && !GameState.hasDefeatedBoss(regionId);
  assert(justUnlocked, 'justUnlocked should be TRUE — this is the core fix');
});

test('preBattleAllClear is false when more than 1 enemy remains', () => {
  const regionId = 1;
  const battleEnemyInstance = instanceKey(regionId, 0); // only first one
  // No pre-existing defeats — 5 of 6 enemies still alive

  const preBattleAllClear =
    REGIONS[regionId].enemySpawns.every((spawn, i) => {
      const key = spawn.id + i;
      return key === battleEnemyInstance || GameState.isEnemyDefeated(regionId, key);
    });

  assert(!preBattleAllClear, 'should NOT unlock when 5 enemies still alive');
});

test('justUnlocked is false if boss already beaten', () => {
  const regionId = 1;
  GameState.defeatBoss(regionId);
  const spawnCount = REGIONS[regionId].enemySpawns.length;
  const lastSlot = spawnCount - 1;
  for (let i = 0; i < lastSlot; i++) {
    GameState.defeatEnemy(regionId, instanceKey(regionId, i));
  }
  const battleEnemyInstance = instanceKey(regionId, lastSlot);

  const preBattleAllClear =
    REGIONS[regionId].enemySpawns.every((spawn, i) => {
      const key = spawn.id + i;
      return key === battleEnemyInstance || GameState.isEnemyDefeated(regionId, key);
    });

  const justUnlocked = preBattleAllClear && !GameState.hasDefeatedBoss(regionId);
  assert(!justUnlocked, 'should not re-announce unlock if boss already beaten');
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests:  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
