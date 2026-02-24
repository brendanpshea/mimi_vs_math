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
  defeatedEnemies:           {},
  defeatedBosses:            [],
  regionStars:               {},
  regionHardModeCleared:     [],
  collectedItems:            {},
  bestiaryHighestDifficulty: {},
  regionMaxDifficulty:       {},
  topicTier:                 {},   // persisted per-topic difficulty tier
  topicPerfectStreak:        {},   // session-only consecutive perfect count
  lives:                     9,
  maxLives:                  9,
  hp:                        12,
  maxHP:                     12,

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
  recordEnemyHighestDifficulty(enemyId, diff) {
    const prev = this.bestiaryHighestDifficulty[enemyId] ?? 0;
    if (diff > prev) this.bestiaryHighestDifficulty[enemyId] = diff;
  },
  getEnemyHighestDifficulty(enemyId) {
    return this.bestiaryHighestDifficulty?.[enemyId] ?? 0;
  },
  recordRegionMaxDifficulty(regionId, diff) {
    const prev = this.regionMaxDifficulty[regionId] ?? 0;
    if (diff > prev) this.regionMaxDifficulty[regionId] = diff;
  },
  getRegionMaxDifficulty(regionId) {
    return this.regionMaxDifficulty?.[regionId] ?? 0;
  },

  getTopicTier(topic, floor = 1) {
    return Math.max(this.topicTier[topic] ?? 1, floor);
  },
  recordTopicBattle(topic, tier, perfect) {
    const currentTier = this.topicTier[topic] ?? 1;
    if (tier < currentTier) return;
    if (perfect) {
      const streak = (this.topicPerfectStreak[topic] ?? 0) + 1;
      if (streak >= 3 && currentTier < 3) {
        this.topicTier[topic]          = currentTier + 1;
        this.topicPerfectStreak[topic] = 0;
      } else {
        this.topicPerfectStreak[topic] = streak;
      }
    } else {
      this.topicPerfectStreak[topic] = 0;
    }
  },
  regressTopicTier(topic) {
    const currentTier = this.topicTier[topic] ?? 1;
    if (currentTier > 1) {
      this.topicTier[topic]          = currentTier - 1;
      this.topicPerfectStreak[topic] = 0;
    }
  },

  reset() {
    this.defeatedEnemies           = {};
    this.defeatedBosses            = [];
    this.regionStars               = {};
    this.regionHardModeCleared     = [];
    this.collectedItems            = {};
    this.bestiaryHighestDifficulty = {};
    this.regionMaxDifficulty       = {};
    this.topicTier                 = {};
    this.topicPerfectStreak        = {};
    this.lives                     = 9;
    this.hp                        = 12;
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
  assertEqual(instanceKey(0, 0), 'counting_caterpillar0');  // NW addition
  assertEqual(instanceKey(0, 1), 'number_gnome1');           // NE subtraction
  assertEqual(instanceKey(0, 2), 'number_bee2');             // north-centre comparison
  assertEqual(instanceKey(0, 3), 'counting_caterpillar3');  // mid-left addition
  assertEqual(instanceKey(0, 4), 'number_gnome4');           // mid-right subtraction
  assertEqual(instanceKey(0, 5), 'minus_mole5');             // south-left comparison
  assertEqual(instanceKey(0, 6), 'number_bee6');             // south-right comparison
  // Verify count and bossUnlockKills match the live data
  assertEqual(REGIONS[0].enemySpawns.length, 7, 'R0 should have 7 spawns');
  assertEqual(REGIONS[0].bossUnlockKills, 10, 'R0 bossUnlockKills should be 10');
});

test('instanceKey region 1 produces correct keys', () => {
  assertEqual(instanceKey(1, 0), 'gear_gnome0');
  assertEqual(instanceKey(1, 1), 'windmill_sprite1');
  assertEqual(instanceKey(1, 2), 'harvest_scarecrow2');
  assertEqual(instanceKey(1, 3), 'counting_crow3');             // D2 addCarry
  assertEqual(instanceKey(1, 4), 'counting_caterpillar4');     // D3 addition review
  assertEqual(instanceKey(1, 5), 'minus_mole5');               // D3 comparison review
  assertEqual(instanceKey(1, 6), 'number_gnome6');             // D3 subtraction review
  assertEqual(instanceKey(1, 7), 'number_bee7');               // D3 numberOrder review
  assertEqual(instanceKey(1, 8), 'gear_gnome8');               // D2 placeValue
  assertEqual(instanceKey(1, 9), 'windmill_sprite9');          // D2 addCarry
  // Verify count matches the live data
  assertEqual(REGIONS[1].enemySpawns.length, 10, 'R1 should have 10 spawns');
});

test('instanceKey region 2 produces correct keys', () => {
  assertEqual(instanceKey(2, 0), 'slime_pup0');
  assertEqual(instanceKey(2, 1), 'cactus_sprite1');
  assertEqual(instanceKey(2, 2), 'cloud_bully2');
  assertEqual(instanceKey(2, 3), 'double_bunny3');          // D1 doubling
  assertEqual(instanceKey(2, 4), 'counting_caterpillar4'); // D3 addition review
  assertEqual(instanceKey(2, 5), 'number_gnome5');          // D3 subtraction review
  assertEqual(instanceKey(2, 6), 'minus_mole6');            // D3 comparison review
  assertEqual(instanceKey(2, 7), 'number_bee7');            // D3 numberOrder review
  assertEqual(instanceKey(2, 8), 'slime_pup8');             // D2 multTables
  assertEqual(instanceKey(2, 9), 'double_bunny9');          // D2 doubling
  // Verify count matches the live data
  assertEqual(REGIONS[2].enemySpawns.length, 10, 'R2 should have 10 spawns');
});

test('instanceKey region 3 produces correct keys', () => {
  assertEqual(instanceKey(3, 0), 'fungus_toad0');              // D1 multiDigitMult
  assertEqual(instanceKey(3, 1), 'mycelium_wisp1');            // D1 factorPairs
  assertEqual(instanceKey(3, 2), 'spore_puff2');               // D2 multiDigitMult
  assertEqual(instanceKey(3, 3), 'fungus_toad3');              // D2 multiDigitMult
  assertEqual(instanceKey(3, 4), 'mycelium_wisp4');            // D2 factorPairs
  assertEqual(instanceKey(3, 5), 'spore_puff5');               // D3 multiDigitMult
  assertEqual(instanceKey(3, 6), 'mycelium_wisp6');            // D3 factorPairs word
  assertEqual(instanceKey(3, 7), 'slime_pup7');                // D3 multTables review
  assertEqual(instanceKey(3, 8), 'double_bunny8');             // D3 doubling review
  assertEqual(instanceKey(3, 9), 'fungus_toad9');              // D3 multiDigitMult
  assertEqual(REGIONS[3].enemySpawns.length, 10, 'R3 should have 10 spawns');
});

test('instanceKey region 4 produces correct keys', () => {
  assertEqual(instanceKey(4, 0), 'sand_scarab0');              // D1 division
  assertEqual(instanceKey(4, 1), 'mummy_cat1');                // D2 mult review
  assertEqual(instanceKey(4, 2), 'mirage_fox2');               // D2 divisionWord
  assertEqual(instanceKey(4, 3), 'riddle_scarab3');            // D1 missingNumber
  assertEqual(instanceKey(4, 4), 'slime_pup4');                // D3 multTables review
  assertEqual(instanceKey(4, 5), 'cactus_sprite5');            // D3 multiplication review
  assertEqual(instanceKey(4, 6), 'cloud_bully6');              // D3 skipCounting review
  assertEqual(instanceKey(4, 7), 'double_bunny7');             // D3 doubling review
  assertEqual(instanceKey(4, 8), 'sand_scarab8');              // D2 division
  assertEqual(instanceKey(4, 9), 'riddle_scarab9');            // D2 missingNumber
  assertEqual(REGIONS[4].enemySpawns.length, 10, 'R4 should have 10 spawns');
});

test('instanceKey region 5 produces correct keys', () => {
  assertEqual(instanceKey(5, 0), 'ice_frog0');                 // D1 fractionCompare
  assertEqual(instanceKey(5, 1), 'snow_golem1');               // D2 fractionAdd
  assertEqual(instanceKey(5, 2), 'crystal_bat2');              // D2 decimals
  assertEqual(instanceKey(5, 3), 'ice_frog3');                 // D2 fractionCompare
  assertEqual(instanceKey(5, 4), 'sand_scarab4');              // D3 division review
  assertEqual(instanceKey(5, 5), 'mummy_cat5');                // D3 mult review
  assertEqual(instanceKey(5, 6), 'mirage_fox6');               // D3 divisionWord review
  assertEqual(instanceKey(5, 7), 'riddle_scarab7');            // D3 missingNumber review
  assertEqual(instanceKey(5, 8), 'snow_golem8');               // D3 fractionAdd
  assertEqual(instanceKey(5, 9), 'crystal_bat9');              // D3 decimals
  assertEqual(REGIONS[5].enemySpawns.length, 10, 'R5 should have 10 spawns');
});

test('instanceKey region 6 produces correct keys', () => {
  assertEqual(instanceKey(6, 0), 'shadow_knight0');            // D1 orderOfOps
  assertEqual(instanceKey(6, 1), 'ratio_raven1');              // D2 percentages
  assertEqual(instanceKey(6, 2), 'percent_wraith2');           // D2 ratiosProp
  assertEqual(instanceKey(6, 3), 'shadow_knight3');            // D2 orderOfOps
  assertEqual(instanceKey(6, 4), 'ice_frog4');                 // D3 fractionCompare review
  assertEqual(instanceKey(6, 5), 'snow_golem5');               // D3 fractionAdd review
  assertEqual(instanceKey(6, 6), 'crystal_bat6');              // D3 decimals review
  assertEqual(instanceKey(6, 7), 'ratio_raven7');              // D3 percentages
  assertEqual(instanceKey(6, 8), 'percent_wraith8');           // D3 ratiosProp
  assertEqual(instanceKey(6, 9), 'shadow_knight9');            // D3 orderOfOps
  assertEqual(REGIONS[6].enemySpawns.length, 10, 'R6 should have 10 spawns');
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

console.log('\njustUnlockedBoss logic (kill-count threshold)');

// Mirrors the formula in ExploreScene.create():
//   _justUnlockedBoss = killCount + 1 >= unlockKills && killCount < unlockKills && !hasDefeatedBoss
function calcJustUnlocked(regionId, killCount) {
  const unlockKills = REGIONS[regionId].bossUnlockKills;
  if (unlockKills == null) return false;
  return (
    killCount + 1 >= unlockKills &&
    killCount < unlockKills &&
    !GameState.hasDefeatedBoss(regionId)
  );
}

test('justUnlockedBoss is true when kill count crosses the threshold', () => {
  const regionId    = 0;
  const unlockKills = REGIONS[regionId].bossUnlockKills; // 10
  assert(calcJustUnlocked(regionId, unlockKills - 1), 'should unlock at count = threshold - 1');
});

test('justUnlockedBoss is false before the threshold - 1 kill', () => {
  const regionId    = 0;
  const unlockKills = REGIONS[regionId].bossUnlockKills;
  assert(!calcJustUnlocked(regionId, unlockKills - 2), 'should NOT unlock at count = threshold - 2');
  assert(!calcJustUnlocked(regionId, 0),                'should NOT unlock at count = 0');
});

test('justUnlockedBoss is false if boss already beaten', () => {
  const regionId    = 0;
  GameState.defeatBoss(regionId);
  const unlockKills = REGIONS[regionId].bossUnlockKills;
  assert(!calcJustUnlocked(regionId, unlockKills - 1), 'should not re-announce if boss already beaten');
});

test('bossOpen uses kill count threshold for all regions', () => {
  for (let r = 0; r <= 6; r++) {
    GameState.reset();
    const unlockKills = REGIONS[r].bossUnlockKills;
    assert(unlockKills != null, `region ${r} should have bossUnlockKills`);
    assertEqual(unlockKills, 10, `region ${r} bossUnlockKills should be 10`);

    // Door closed before threshold
    const closedAt = (unlockKills - 1 >= unlockKills) || GameState.hasDefeatedBoss(r);
    assert(!closedAt, `door should be closed at kill count ${unlockKills - 1} for region ${r}`);

    // Door open at threshold
    const openAt = (unlockKills >= unlockKills) || GameState.hasDefeatedBoss(r);
    assert(openAt, `door should be open at kill count ${unlockKills} for region ${r}`);
  }
});

// ── Respawn behaviour (kill-count regions) ────────────────────────────────
console.log('\nRespawn behaviour — enemies respawn in kill-count regions');

// Mirrors the _setupEnemies skip logic (respawn + rolling cooldown):
//   kill-count region → skip justDefeated key AND any key in recentDefeats
//   legacy region     → skip any enemy flagged by isEnemyDefeated
const COOLDOWN_WINDOW = 2;  // must match ExploreScene constant

function shouldSkipEnemy(regionId, iKey, justDefeated, recentDefeats) {
  const usesKillCount = REGIONS[regionId].bossUnlockKills != null;
  if (usesKillCount) {
    if (iKey === justDefeated)          return true;  // just killed
    if (recentDefeats.includes(iKey))  return true;  // in cooldown
    return false;
  }
  return GameState.isEnemyDefeated(regionId, iKey);
}

function spawnsInRegion(regionId, justDefeated, recentDefeats = []) {
  return REGIONS[regionId].enemySpawns.filter((spawn, i) =>
    !shouldSkipEnemy(regionId, spawn.id + i, justDefeated, recentDefeats),
  ).length;
}

// Mirrors _processBattleResult: kill-count regions do NOT call defeatEnemy
// for regular enemies (only bosses / legacy regions do).
function shouldCallDefeatEnemy(regionId, isBoss) {
  const usesKillCount = REGIONS[regionId].bossUnlockKills != null;
  return !usesKillCount || isBoss;
}

test('all 7 enemies spawn on fresh entry (no exclusions)', () => {
  assertEqual(spawnsInRegion(0, null, []), 7, 'all 7 spawn on fresh entry');
});

test('just-defeated enemy is excluded on immediate return', () => {
  const killed0 = instanceKey(0, 0);
  assertEqual(spawnsInRegion(0, killed0, []), 6, '6 after killing slot 0');
  const killed6 = instanceKey(0, 6);
  assertEqual(spawnsInRegion(0, killed6, []), 6, '6 after killing slot 6');
});

test('recentDefeats window also excludes recently killed enemies', () => {
  const keyA = instanceKey(0, 0);
  const keyB = instanceKey(0, 1);
  // Kill A then B: recentDefeats=[B,A] on next return, justDefeated=C
  const keyC = instanceKey(0, 2);
  const recent = [keyB, keyA];  // window after A then B
  // Only C+D+E+F available (A, B in recent; C is justDefeated)
  assertEqual(spawnsInRegion(0, keyC, recent), 4,
    '4 available when 3 enemies excluded (jd + 2 recent)');
});

test('cooldown expires: enemy available again after window passes', () => {
  const keyA = instanceKey(0, 0);
  const keyB = instanceKey(0, 1);
  const keyC = instanceKey(0, 2);
  const keyD = instanceKey(0, 3);
  // Kill A, B, C in sequence — after killing C: recent=[C,B], jd=D
  // A has fallen off the window → available
  const recent = [keyC, keyB];
  assert(!recent.includes(keyA), 'A has dropped off window after 2 subsequent kills');
  assertEqual(
    spawnsInRegion(0, keyD, recent),
    REGIONS[0].enemySpawns.length - recent.length - 1,  // total − recent − justDefeated
    'correct count with expired cooldown',
  );
});

test('cannot alternate AB — must involve a 3rd enemy (anti-camping)', () => {
  const keyA = instanceKey(0, 0);
  const keyB = instanceKey(0, 1);

  // Kill A → recentDefeats becomes [A]
  let recent = [keyA];
  // Kill B (justDefeated=B, recent=[A]) → A still in recent → A excluded
  assert(recent.includes(keyA), 'A still excluded when B is killed (AB blocked)');

  // Kill B → recentDefeats becomes [B, A]
  recent = [keyB, ...recent].slice(0, COOLDOWN_WINDOW);
  // Try A again (justDefeated=A) — A is in recent=[B,A] so excluded ✓
  assert(recent.includes(keyA), 'A still in cooldown after AB sequence');

  // Now kill a 3rd enemy (C): recentDefeats = [C, B]
  const keyC = instanceKey(0, 2);
  recent = [keyC, ...recent].slice(0, COOLDOWN_WINDOW);
  // A has dropped off — available again
  assert(!recent.includes(keyA), 'A back after 3rd kill (cooldown expired)');
});

test('10 kills reachable: at least 4 enemies always available after warmup', () => {
  const spawns     = REGIONS[0].enemySpawns;
  const totalSlots = spawns.length;  // 7
  let recentDefeats = [];

  for (let kill = 0; kill < REGIONS[0].bossUnlockKills; kill++) {
    const slotKilled = kill % totalSlots;
    const jdk        = instanceKey(0, slotKilled);
    const available  = spawnsInRegion(0, jdk, recentDefeats);

    assert(available >= 1, `kill ${kill + 1}: at least 1 enemy must be available`);
    // After warmup (kill ≥ COOLDOWN_WINDOW) exactly totalSlots−(1+window) are present
    if (kill >= COOLDOWN_WINDOW) {
      assertEqual(available, totalSlots - (1 + COOLDOWN_WINDOW),
        `kill ${kill + 1}: expected ${totalSlots - (1 + COOLDOWN_WINDOW)} enemies`);
    }

    // Advance the rolling window (mirrors _processBattleResult)
    recentDefeats = [jdk, ...recentDefeats].slice(0, COOLDOWN_WINDOW);
  }
});

test('defeatEnemy NOT called for regular enemy in kill-count region', () => {
  assert(!shouldCallDefeatEnemy(0, false), 'R0 regular → no defeatEnemy');
  assert(!shouldCallDefeatEnemy(1, false), 'R1 regular → no defeatEnemy');
  assert(!shouldCallDefeatEnemy(6, false), 'R6 regular → no defeatEnemy');
});

test('defeatEnemy IS called for boss even in kill-count region', () => {
  assert(shouldCallDefeatEnemy(0, true), 'R0 boss → defeatEnemy called');
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

// ── bestiaryHighestDifficulty / regionMaxDifficulty ──────────────────────
console.log('\nbestiaryHighestDifficulty — recordEnemyHighestDifficulty / getEnemyHighestDifficulty');

test('getEnemyHighestDifficulty returns 0 for unseen enemy', () => {
  assertEqual(GameState.getEnemyHighestDifficulty('counting_caterpillar'), 0);
  assertEqual(GameState.getEnemyHighestDifficulty('any_unknown'), 0);
});

test('recordEnemyHighestDifficulty stores and retrieves', () => {
  GameState.recordEnemyHighestDifficulty('counting_caterpillar', 2);
  assertEqual(GameState.getEnemyHighestDifficulty('counting_caterpillar'), 2);
});

test('recordEnemyHighestDifficulty only improves — never decreases', () => {
  GameState.recordEnemyHighestDifficulty('minus_mole', 3);
  GameState.recordEnemyHighestDifficulty('minus_mole', 1);  // attempt downgrade
  assertEqual(GameState.getEnemyHighestDifficulty('minus_mole'), 3, 'should stay at 3');
});

test('recordEnemyHighestDifficulty allows improvement from lower to higher', () => {
  GameState.recordEnemyHighestDifficulty('number_gnome', 1);
  GameState.recordEnemyHighestDifficulty('number_gnome', 3);
  assertEqual(GameState.getEnemyHighestDifficulty('number_gnome'), 3, 'should upgrade to 3');
});

test('bestiaryHighestDifficulty is independent per enemy type', () => {
  GameState.recordEnemyHighestDifficulty('number_bee', 2);
  GameState.recordEnemyHighestDifficulty('minus_mole', 1);
  assertEqual(GameState.getEnemyHighestDifficulty('number_bee'), 2);
  assertEqual(GameState.getEnemyHighestDifficulty('minus_mole'), 1);
  assertEqual(GameState.getEnemyHighestDifficulty('counting_caterpillar'), 0, 'untouched = 0');
});

test('reset() clears bestiaryHighestDifficulty', () => {
  GameState.recordEnemyHighestDifficulty('number_bee', 3);
  GameState.reset();
  assertEqual(GameState.getEnemyHighestDifficulty('number_bee'), 0, 'cleared after reset');
});

console.log('\nregionMaxDifficulty — recordRegionMaxDifficulty / getRegionMaxDifficulty');

test('getRegionMaxDifficulty returns 0 with no data', () => {
  assertEqual(GameState.getRegionMaxDifficulty(0), 0);
  assertEqual(GameState.getRegionMaxDifficulty(5), 0);
});

test('recordRegionMaxDifficulty stores highest value', () => {
  GameState.recordRegionMaxDifficulty(0, 2);
  assertEqual(GameState.getRegionMaxDifficulty(0), 2);
  GameState.recordRegionMaxDifficulty(0, 3);
  assertEqual(GameState.getRegionMaxDifficulty(0), 3, 'should upgrade to 3');
  GameState.recordRegionMaxDifficulty(0, 1);
  assertEqual(GameState.getRegionMaxDifficulty(0), 3, 'should NOT decrease');
});

test('regionMaxDifficulty is independent per region', () => {
  GameState.recordRegionMaxDifficulty(0, 3);
  GameState.recordRegionMaxDifficulty(1, 1);
  assertEqual(GameState.getRegionMaxDifficulty(0), 3);
  assertEqual(GameState.getRegionMaxDifficulty(1), 1);
  assertEqual(GameState.getRegionMaxDifficulty(2), 0, 'untouched region = 0');
});

test('reset() clears regionMaxDifficulty', () => {
  GameState.recordRegionMaxDifficulty(0, 3);
  GameState.reset();
  assertEqual(GameState.getRegionMaxDifficulty(0), 0, 'cleared after reset');
});

// ── star ceiling using regionMaxDifficulty (mirrors BattleScene logic) ───
console.log('\nStar ceiling — difficulty-based cap on boss stars');

function calcStarsCeiled(totalQuestions, wrongAnswers, maxDiff) {
  const wrRatio      = totalQuestions > 0 ? wrongAnswers / totalQuestions : 0;
  const accuracyStars = wrRatio === 0 ? 3 : wrRatio <= 0.25 ? 2 : 1;
  const starCeiling  = maxDiff >= 3 ? 3 : maxDiff >= 2 ? 2 : 1;
  return Math.min(accuracyStars, starCeiling);
}

test('D1-only run caps stars at 1 regardless of accuracy', () => {
  assertEqual(calcStarsCeiled(5, 0, 1), 1, 'perfect accuracy, D1 only → 1 star');
  assertEqual(calcStarsCeiled(8, 1, 1), 1, '≤25% wrong, D1 only → 1 star');
});

test('D2 run caps stars at 2', () => {
  assertEqual(calcStarsCeiled(5, 0, 2), 2, 'perfect accuracy, D2 max → 2 stars');
  assertEqual(calcStarsCeiled(4, 2, 2), 1, '>25% wrong, D2 max → 1 star');
});

test('D3 run allows full 3 stars', () => {
  assertEqual(calcStarsCeiled(5, 0, 3), 3, 'perfect accuracy, D3 → 3 stars');
  assertEqual(calcStarsCeiled(8, 2, 3), 2, '≤25% wrong, D3 → 2 stars');
  assertEqual(calcStarsCeiled(4, 2, 3), 1, '>25% wrong, D3 → 1 star');
});

// ── Adaptive difficulty tier system ───────────────────────────────────────
console.log('\nAdaptive difficulty — getTopicTier / recordTopicBattle / regressTopicTier');

test('getTopicTier returns 1 by default for any topic', () => {
  assertEqual(GameState.getTopicTier('addition'),    1, 'unknown topic → 1');
  assertEqual(GameState.getTopicTier('subtraction'), 1, 'unknown topic → 1');
});

test('getTopicTier respects floor — returns max(tier, floor)', () => {
  // No data yet: tier defaults to 1; floor=2 wins
  assertEqual(GameState.getTopicTier('addition', 2), 2, 'floor 2 beats default tier 1');
  assertEqual(GameState.getTopicTier('addition', 3), 3, 'floor 3 beats default tier 1');
  // Once player earns D2, floor of 1 shouldn't drag it down
  GameState.topicTier['addition'] = 2;
  assertEqual(GameState.getTopicTier('addition', 1), 2, 'earned tier 2 beats floor 1');
  assertEqual(GameState.getTopicTier('addition', 3), 3, 'floor 3 beats earned tier 2');
});

test('3 consecutive perfect battles at D1 advance topic to D2', () => {
  GameState.recordTopicBattle('addition', 1, true);
  assertEqual(GameState.topicPerfectStreak['addition'], 1, 'streak = 1 after 1 perfect');
  assertEqual(GameState.getTopicTier('addition'),       1, 'still D1 at streak 1');

  GameState.recordTopicBattle('addition', 1, true);
  assertEqual(GameState.topicPerfectStreak['addition'], 2, 'streak = 2 after 2 perfect');
  assertEqual(GameState.getTopicTier('addition'),       1, 'still D1 at streak 2');

  GameState.recordTopicBattle('addition', 1, true);
  assertEqual(GameState.getTopicTier('addition'),        2, 'advanced to D2 after 3 perfect');
  assertEqual(GameState.topicPerfectStreak['addition'],  0, 'streak reset to 0 on tier advance');
});

test('non-perfect battle resets streak, does not change tier', () => {
  GameState.recordTopicBattle('subtraction', 1, true);
  GameState.recordTopicBattle('subtraction', 1, true);
  assertEqual(GameState.topicPerfectStreak['subtraction'], 2, 'streak at 2');

  GameState.recordTopicBattle('subtraction', 1, false);
  assertEqual(GameState.topicPerfectStreak['subtraction'], 0, 'streak reset on non-perfect');
  assertEqual(GameState.getTopicTier('subtraction'),        1, 'tier unchanged');

  // Must earn 3 more perfects from scratch
  GameState.recordTopicBattle('subtraction', 1, true);
  GameState.recordTopicBattle('subtraction', 1, true);
  assertEqual(GameState.getTopicTier('subtraction'), 1, 'still D1 at 2 (needs 3 again)');
  GameState.recordTopicBattle('subtraction', 1, true);
  assertEqual(GameState.getTopicTier('subtraction'), 2, 'D2 after 3 fresh perfects');
});

test('battles below current tier do not count toward advancement', () => {
  GameState.topicTier['comparison'] = 2;   // already D2
  // Fighting D1 battles should not advance toward D3
  GameState.recordTopicBattle('comparison', 1, true);
  GameState.recordTopicBattle('comparison', 1, true);
  GameState.recordTopicBattle('comparison', 1, true);
  assertEqual(GameState.getTopicTier('comparison'), 2, 'D1 battles do not advance D2 player');
  assertEqual(GameState.topicPerfectStreak['comparison'] ?? 0, 0, 'streak untouched by below-tier battles');
});

test('3 perfect battles at D2 advance topic to D3', () => {
  GameState.topicTier['addition'] = 2;
  GameState.recordTopicBattle('addition', 2, true);
  GameState.recordTopicBattle('addition', 2, true);
  GameState.recordTopicBattle('addition', 2, true);
  assertEqual(GameState.getTopicTier('addition'), 3, 'D2 → D3 after 3 perfects at D2');
});

test('tier cannot advance beyond D3', () => {
  GameState.topicTier['addition'] = 3;
  GameState.recordTopicBattle('addition', 3, true);
  GameState.recordTopicBattle('addition', 3, true);
  GameState.recordTopicBattle('addition', 3, true);
  assertEqual(GameState.getTopicTier('addition'), 3, 'tier stays at D3 — no D4');
});

test('regressTopicTier drops D2 → D1', () => {
  GameState.topicTier['subtraction'] = 2;
  GameState.regressTopicTier('subtraction');
  assertEqual(GameState.getTopicTier('subtraction'), 1, 'D2 → D1 on regression');
});

test('regressTopicTier drops D3 → D2', () => {
  GameState.topicTier['comparison'] = 3;
  GameState.regressTopicTier('comparison');
  assertEqual(GameState.getTopicTier('comparison'), 2, 'D3 → D2 on regression');
});

test('regressTopicTier at D1 does nothing', () => {
  GameState.regressTopicTier('addition');   // no tier set → defaults to D1
  assertEqual(GameState.getTopicTier('addition'), 1, 'D1 cannot regress further');
});

test('regressTopicTier resets the perfect streak', () => {
  GameState.topicTier['addition']         = 2;
  GameState.topicPerfectStreak['addition'] = 2;   // mid-progress toward D3
  GameState.regressTopicTier('addition');
  assertEqual(GameState.topicPerfectStreak['addition'], 0, 'streak reset on regression');
});

test('reset() clears topicTier and topicPerfectStreak', () => {
  GameState.topicTier['addition']         = 3;
  GameState.topicPerfectStreak['addition'] = 2;
  GameState.reset();
  assertEqual(GameState.getTopicTier('addition'), 1, 'topicTier cleared by reset');
  assertEqual(GameState.topicPerfectStreak['addition'] ?? 0, 0, 'topicPerfectStreak cleared by reset');
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests:  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
