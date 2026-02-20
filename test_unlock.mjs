/**
 * test_unlock.mjs
 * Pure-logic unit tests for the boss-door unlock system.
 * Run with:  node test_unlock.mjs
 *
 * Tests the exact key format ExploreScene uses and the GameState tracking,
 * without needing a browser or Phaser.
 */

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

// ── Region stub (mirrors regions.js enemySpawns format) ─────────────────────
const REGIONS = [
  { // Region 0 — 5 enemies (3 native + 2 harder reviews)
    enemySpawns: [
      { id: 'counting_caterpillar' },   // 0
      { id: 'number_gnome'         },   // 1
      { id: 'minus_mole'           },   // 2
      { id: 'counting_caterpillar' },   // 3  D2 review
      { id: 'number_gnome'         },   // 4  D1 review
    ],
    boss: 'subtraction_witch',
  },
  { // Region 1 — 6 enemies (3 native + 3 D3 reviews from R0)
    enemySpawns: [
      { id: 'slime_pup'            },   // 0
      { id: 'cactus_sprite'        },   // 1
      { id: 'cloud_bully'          },   // 2
      { id: 'counting_caterpillar' },   // 3  R0 review
      { id: 'number_gnome'         },   // 4  R0 review
      { id: 'minus_mole'           },   // 5  R0 review
    ],
    boss: 'count_multiplico',
  },
  { // Region 2 — 6 enemies (3 native + 3 D3 reviews from R1)
    enemySpawns: [
      { id: 'sand_scarab'   },          // 0
      { id: 'mummy_cat'     },          // 1
      { id: 'mirage_fox'    },          // 2
      { id: 'slime_pup'     },          // 3  R1 review
      { id: 'cactus_sprite' },          // 4  R1 review
      { id: 'cloud_bully'   },          // 5  R1 review
    ],
    boss: 'the_diviner',
  },
];

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
  assertEqual(instanceKey(0, 3), 'counting_caterpillar3'); // review spawn
  assertEqual(instanceKey(0, 4), 'number_gnome4');          // review spawn
});

test('instanceKey region 1 produces correct keys', () => {
  assertEqual(instanceKey(1, 0), 'slime_pup0');
  assertEqual(instanceKey(1, 1), 'cactus_sprite1');
  assertEqual(instanceKey(1, 2), 'cloud_bully2');
  assertEqual(instanceKey(1, 3), 'counting_caterpillar3'); // R0 review
  assertEqual(instanceKey(1, 4), 'number_gnome4');          // R0 review
  assertEqual(instanceKey(1, 5), 'minus_mole5');            // R0 review
});

test('instanceKey region 2 produces correct keys', () => {
  assertEqual(instanceKey(2, 0), 'sand_scarab0');
  assertEqual(instanceKey(2, 1), 'mummy_cat1');
  assertEqual(instanceKey(2, 2), 'mirage_fox2');
  assertEqual(instanceKey(2, 3), 'slime_pup3');    // R1 review
  assertEqual(instanceKey(2, 4), 'cactus_sprite4');// R1 review
  assertEqual(instanceKey(2, 5), 'cloud_bully5');  // R1 review
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

test('all 6 alive at start (region 1)', () => {
  assertEqual(remainingEnemyCount(1), 6);
});

test('count decreases as enemies die (region 1)', () => {
  GameState.defeatEnemy(1, 'slime_pup0');
  assertEqual(remainingEnemyCount(1), 5);
  GameState.defeatEnemy(1, 'cactus_sprite1');
  assertEqual(remainingEnemyCount(1), 4);
  GameState.defeatEnemy(1, 'cloud_bully2');
  assertEqual(remainingEnemyCount(1), 3);
  GameState.defeatEnemy(1, 'counting_caterpillar3');
  assertEqual(remainingEnemyCount(1), 2);
  GameState.defeatEnemy(1, 'number_gnome4');
  assertEqual(remainingEnemyCount(1), 1);
  GameState.defeatEnemy(1, 'minus_mole5');
  assertEqual(remainingEnemyCount(1), 0);
});

test('count in region 1 unaffected by region 0 defeats', () => {
  // Defeat all 6 region-0 enemies using region-0 keys
  for (let i = 0; i < REGIONS[0].enemySpawns.length; i++) {
    GameState.defeatEnemy(0, instanceKey(0, i));
  }
  assertEqual(remainingEnemyCount(1), 6, 'region 1 should still show 6 alive');
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
