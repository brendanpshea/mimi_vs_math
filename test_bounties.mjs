// Mock localStorage before GameState methods are called
const _store = {};
globalThis.localStorage = {
  getItem:  key       => _store[key] ?? null,
  setItem:  (key, v)  => { _store[key] = v; },
  removeItem: key     => { delete _store[key]; },
};

import GameState from './src/config/GameState.js';

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

console.log('\n--- Bounty Board & Quests Unit Tests ---');

test('bounty generation and structure', () => {
  assertEqual(GameState.activeBounties.length, 0, 'No bounties initially');

  // Inject 3 mock bounties manually for strict logic testing
  GameState.activeBounties = [
    { id: 'b1', type: 'defeat_enemy', count: 3, target: 'slime_pup', progress: 0, completed: false, reward: 'math_net' },
    { id: 'b2', type: 'defeat_any', count: 5, progress: 0, completed: false, reward: 'sardine' },
    { id: 'b3', type: 'streak', count: 4, progress: 0, completed: false, reward: 'catnip' },
  ];

  assertEqual(GameState.activeBounties.length, 3);
  assertEqual(GameState.activeBounties[0].target, 'slime_pup');
});

test('defeat_enemy bounty progression and completion', () => {
  GameState.activeBounties = [
    { id: 'b1', type: 'defeat_enemy', count: 3, target: 'slime_pup', progress: 0, completed: false, reward: 'math_net' }
  ];

  // Defeat wrong enemy
  GameState.recordEnemyDefeated('gear_gnome');
  assertEqual(GameState.activeBounties[0].progress, 0, 'Progress should not increase for wrong enemy');

  // Defeat target enemy 1st time
  GameState.recordEnemyDefeated('slime_pup');
  assertEqual(GameState.activeBounties[0].progress, 1, 'Progress should be 1');
  assert(!GameState.activeBounties[0].completed, 'Should not be completed yet');

  // Defeat target 2nd and 3rd times
  GameState.recordEnemyDefeated('slime_pup');
  GameState.recordEnemyDefeated('slime_pup');
  assertEqual(GameState.activeBounties[0].progress, 3, 'Progress should be 3');
  assert(GameState.activeBounties[0].completed, 'Should be completed');

  // Defeat 4th time shouldn't exceed count
  GameState.recordEnemyDefeated('slime_pup');
  assertEqual(GameState.activeBounties[0].progress, 3, 'Progress capped at count');
});

test('defeat_any bounty progression', () => {
  GameState.activeBounties = [
    { id: 'b2', type: 'defeat_any', count: 3, progress: 0, completed: false, reward: 'sardine' }
  ];

  GameState.recordEnemyDefeated('slime_pup');
  GameState.recordEnemyDefeated('gear_gnome');
  assertEqual(GameState.activeBounties[0].progress, 2);
  assert(!GameState.activeBounties[0].completed);

  GameState.recordEnemyDefeated('harvest_scarecrow');
  assertEqual(GameState.activeBounties[0].progress, 3);
  assert(GameState.activeBounties[0].completed);
});

test('streak bounty progression', () => {
  GameState.activeBounties = [
    { id: 'b3', type: 'streak', count: 5, progress: 0, completed: false, reward: 'catnip' }
  ];

  GameState.recordStreakAchieved(3);
  assertEqual(GameState.activeBounties[0].progress, 0, 'Streak under count does not progress');
  assert(!GameState.activeBounties[0].completed);

  GameState.recordStreakAchieved(5);
  assertEqual(GameState.activeBounties[0].progress, 5);
  assert(GameState.activeBounties[0].completed);
});

console.log(`\nTests completed: Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
