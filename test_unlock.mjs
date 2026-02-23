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

import REGIONS from './src/data/regions/index.js';

// ── Minimal GameState stub ─────────────────────────────────────────────────
const GameState = {
  defeatedEnemies:       {},
  defeatedBosses:        [],
  regionStars:           {},
  regionHardModeCleared: [],
  collectedItems:        {},
  lives:                 9,
  maxLives:              9,
  hp:                    12,
  maxHP:                 12,

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
  useLife() {
    if (this.lives <= 0) return false;
    this.lives = Math.max(0, this.lives - 1);
    this.hp = this.maxHP;
    return true;
  },
  getRegionStars(regionId) {
    return this.regionStars[regionId] ?? 0;
  },
  setRegionStars(regionId, stars) {
    const prev = this.regionStars[regionId] ?? 0;
    if (stars > prev) this.regionStars[regionId] = stars;
  },
  hasDefeatedBossHardMode(regionId) {
    return this.regionHardModeCleared.includes(regionId);
  },
  defeatBossHardMode(regionId) {
    if (!this.regionHardModeCleared.includes(regionId)) {
      this.regionHardModeCleared.push(regionId);
    }
  },
  reset() {
    this.defeatedEnemies       = {};
    this.defeatedBosses        = [];
    this.regionStars           = {};
    this.regionHardModeCleared = [];
    this.collectedItems        = {};
    this.lives                 = 9;
    this.hp                    = 12;
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
  assertEqual(instanceKey(0, 3), 'number_bee3');            // D1 numberOrder
  assertEqual(instanceKey(0, 4), 'counting_caterpillar4'); // D2 addition review
  assertEqual(instanceKey(0, 5), 'number_gnome5');          // D2 subtraction review
  assertEqual(instanceKey(0, 6), 'minus_mole6');            // D2 comparison review
  assertEqual(instanceKey(0, 7), 'number_bee7');            // D2 numberOrder review
  assertEqual(instanceKey(0, 8), 'counting_caterpillar8'); // D3 addition review
  assertEqual(instanceKey(0, 9), 'minus_mole9');            // D3 comparison review
  // Verify count matches the live data
  assertEqual(REGIONS[0].enemySpawns.length, 10, 'R0 should have 10 spawns');
});

test('instanceKey region 1 produces correct keys', () => {
  assertEqual(instanceKey(1, 0), 'slime_pup0');
  assertEqual(instanceKey(1, 1), 'cactus_sprite1');
  assertEqual(instanceKey(1, 2), 'cloud_bully2');
  assertEqual(instanceKey(1, 3), 'double_bunny3');          // D1 doubling
  assertEqual(instanceKey(1, 4), 'counting_caterpillar4'); // D3 addition review
  assertEqual(instanceKey(1, 5), 'number_gnome5');          // D3 subtraction review
  assertEqual(instanceKey(1, 6), 'minus_mole6');            // D3 comparison review
  assertEqual(instanceKey(1, 7), 'number_bee7');            // D3 numberOrder review
  assertEqual(instanceKey(1, 8), 'slime_pup8');             // D2 multTables
  assertEqual(instanceKey(1, 9), 'double_bunny9');          // D2 doubling
  // Verify count matches the live data
  assertEqual(REGIONS[1].enemySpawns.length, 10, 'R1 should have 10 spawns');
});

test('instanceKey region 2 produces correct keys', () => {
  assertEqual(instanceKey(2, 0), 'sand_scarab0');
  assertEqual(instanceKey(2, 1), 'mummy_cat1');
  assertEqual(instanceKey(2, 2), 'mirage_fox2');
  assertEqual(instanceKey(2, 3), 'riddle_scarab3');  // D1 missingNumber
  assertEqual(instanceKey(2, 4), 'slime_pup4');      // D3 multTables review
  assertEqual(instanceKey(2, 5), 'cactus_sprite5');  // D3 multiplication review
  assertEqual(instanceKey(2, 6), 'cloud_bully6');    // D3 skipCounting review
  assertEqual(instanceKey(2, 7), 'double_bunny7');   // D3 doubling review
  assertEqual(instanceKey(2, 8), 'sand_scarab8');    // D2 division
  assertEqual(instanceKey(2, 9), 'riddle_scarab9');  // D2 missingNumber
  // Verify count matches the live data
  assertEqual(REGIONS[2].enemySpawns.length, 10, 'R2 should have 10 spawns');
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

// ── 9 Lives / useLife ────────────────────────────────────────────────────
console.log('\n9 Lives — useLife()');

test('useLife returns true and decrements lives', () => {
  GameState.lives = 3;
  const result = GameState.useLife();
  assert(result === true, 'should return true when lives > 0');
  assertEqual(GameState.lives, 2, 'lives should decrement by 1');
});

test('useLife restores hp to maxHP', () => {
  GameState.hp    = 4;
  GameState.lives = 2;
  GameState.useLife();
  assertEqual(GameState.hp, GameState.maxHP, 'hp should be restored to maxHP');
});

test('useLife returns false and does not go below 0', () => {
  GameState.lives = 0;
  const result = GameState.useLife();
  assert(result === false, 'should return false when lives = 0');
  assertEqual(GameState.lives, 0, 'lives should stay at 0, not go negative');
});

test('useLife stops at 0 exactly on last life', () => {
  GameState.lives = 1;
  const result = GameState.useLife();
  assert(result === true, 'should succeed consuming the last life');
  assertEqual(GameState.lives, 0, 'lives should be exactly 0 after last life used');
  const second = GameState.useLife();
  assert(second === false, 'next call should return false — no lives left');
});

// ── Star ratings ──────────────────────────────────────────────────────────
console.log('\nStar Ratings — setRegionStars / getRegionStars');

test('getRegionStars returns 0 for unseen region', () => {
  assertEqual(GameState.getRegionStars(0), 0, 'default should be 0');
  assertEqual(GameState.getRegionStars(4), 0, 'default should be 0 for any region');
});

test('setRegionStars stores and getRegionStars retrieves', () => {
  GameState.setRegionStars(0, 2);
  assertEqual(GameState.getRegionStars(0), 2, 'should store and return 2');
});

test('setRegionStars only improves — never decreases', () => {
  GameState.setRegionStars(1, 3);
  GameState.setRegionStars(1, 1);  // attempt to downgrade
  assertEqual(GameState.getRegionStars(1), 3, 'should stay at 3, not drop to 1');
});

test('setRegionStars allows improvement from lower to higher', () => {
  GameState.setRegionStars(2, 1);
  GameState.setRegionStars(2, 3);
  assertEqual(GameState.getRegionStars(2), 3, 'should upgrade from 1 to 3');
});

test('star ratings are independent per region', () => {
  GameState.setRegionStars(0, 3);
  GameState.setRegionStars(1, 1);
  assertEqual(GameState.getRegionStars(0), 3, 'region 0 should have 3 stars');
  assertEqual(GameState.getRegionStars(1), 1, 'region 1 should have 1 star');
  assertEqual(GameState.getRegionStars(2), 0, 'region 2 untouched should be 0');
});

// ── Star cutoff logic (mirrors BattleScene._endBattle) ───────────────────
console.log('\nStar Cutoffs (BattleScene logic mirror)');

function calcStars(totalQuestions, wrongAnswers) {
  const wrRatio = totalQuestions > 0 ? wrongAnswers / totalQuestions : 0;
  return wrRatio === 0 ? 3 : wrRatio <= 0.25 ? 2 : 1;
}

test('0 wrong → 3 stars', () => {
  assertEqual(calcStars(5, 0), 3);
  assertEqual(calcStars(1, 0), 3);
});

test('≤25% wrong → 2 stars', () => {
  assertEqual(calcStars(4, 1), 2,  '1/4 = 25% → 2 stars');   // exactly 25%
  assertEqual(calcStars(8, 2), 2,  '2/8 = 25% → 2 stars');   // exactly 25%
  assertEqual(calcStars(10, 2), 2, '2/10 = 20% → 2 stars');  // under 25%
});

test('>25% wrong → 1 star', () => {
  assertEqual(calcStars(4, 2), 1,  '2/4 = 50% → 1 star');
  assertEqual(calcStars(3, 1), 1,  '1/3 = 33% → 1 star');
});

test('empty battle (0 questions) → 3 stars', () => {
  assertEqual(calcStars(0, 0), 3, 'edge case: no questions defaults to 0% wrong = 3 stars');
});

// ── Hard-mode tracking ────────────────────────────────────────────────────
console.log('\nHard Mode — defeatBossHardMode / hasDefeatedBossHardMode');

test('hasDefeatedBossHardMode returns false before clear', () => {
  assert(!GameState.hasDefeatedBossHardMode(0), 'should be false before any clear');
  assert(!GameState.hasDefeatedBossHardMode(4), 'should be false for all regions');
});

test('defeatBossHardMode marks the region and persists', () => {
  GameState.defeatBossHardMode(0);
  assert(GameState.hasDefeatedBossHardMode(0), 'region 0 should be marked cleared');
  assert(!GameState.hasDefeatedBossHardMode(1), 'region 1 should remain uncleard');
});

test('defeatBossHardMode is idempotent — no duplicates', () => {
  GameState.defeatBossHardMode(2);
  GameState.defeatBossHardMode(2);
  const count = GameState.regionHardModeCleared.filter(id => id === 2).length;
  assertEqual(count, 1, 'region 2 should appear exactly once in the array');
});

test('hard-mode clears are independent per region', () => {
  GameState.defeatBossHardMode(0);
  GameState.defeatBossHardMode(3);
  assert( GameState.hasDefeatedBossHardMode(0), 'region 0 cleared');
  assert(!GameState.hasDefeatedBossHardMode(1), 'region 1 not cleared');
  assert(!GameState.hasDefeatedBossHardMode(2), 'region 2 not cleared');
  assert( GameState.hasDefeatedBossHardMode(3), 'region 3 cleared');
  assert(!GameState.hasDefeatedBossHardMode(4), 'region 4 not cleared');
});

test('reset() clears hard-mode state and stars', () => {
  GameState.defeatBossHardMode(0);
  GameState.setRegionStars(0, 3);
  GameState.lives = 3;
  GameState.reset();
  assert(!GameState.hasDefeatedBossHardMode(0), 'hard-mode cleared after reset');
  assertEqual(GameState.getRegionStars(0), 0, 'stars cleared after reset');
  assertEqual(GameState.lives, 9, 'lives restored to 9 after reset');
});

// ── collectedItems key format (mirrors ExploreScene._collectItem) ─────────
console.log('\ncollectedItems — pickup key format');

test('collectedItems starts empty', () => {
  assert(Object.keys(GameState.collectedItems).length === 0, 'should be empty after reset');
});

test('pickup key format: regionId_col_row', () => {
  const key = `0_4_26`;
  GameState.collectedItems[key] = true;
  assert(GameState.collectedItems[key] === true, 'key stored correctly');
  assert(!GameState.collectedItems['1_4_26'], 'different region key is independent');
  assert(!GameState.collectedItems['0_5_26'], 'different col key is independent');
});

test('two items in same region have independent keys', () => {
  const k1 = `2_15_20`;
  const k2 = `2_40_35`;
  GameState.collectedItems[k1] = true;
  assert( GameState.collectedItems[k1], 'first item key set');
  assert(!GameState.collectedItems[k2], 'second item key not yet set');
  GameState.collectedItems[k2] = true;
  assert( GameState.collectedItems[k1], 'first key still set after second added');
  assert( GameState.collectedItems[k2], 'second key now set');
});

test('reset() clears collectedItems', () => {
  GameState.collectedItems['0_10_10'] = true;
  GameState.reset();
  assert(Object.keys(GameState.collectedItems).length === 0, 'collectedItems cleared by reset');
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests:  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
