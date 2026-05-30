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

console.log('\n--- Pasture Capture & Idle Rewards Unit Tests ---');

test('capturing enemies', () => {
  assertEqual(GameState.capturedEnemies.length, 0, 'No captured enemies initially');

  GameState.captureEnemy('slime_pup', 'Slimey');
  assertEqual(GameState.capturedEnemies.length, 1);
  assertEqual(GameState.capturedEnemies[0].id, 'slime_pup');
  assertEqual(GameState.capturedEnemies[0].name, 'Slimey');
});

test('calculatePastureRewards with zero elapsed time', () => {
  GameState.captureEnemy('slime_pup', 'Slimey');
  GameState.lastPastureCheck = Date.now();

  const rewards = GameState.calculatePastureRewards();
  assertEqual(rewards.length, 0, 'No rewards should be generated with zero elapsed time');
});

test('calculatePastureRewards with elapsed time generates items', () => {
  GameState.captureEnemy('slime_pup', 'Slimey');
  
  // Set last check to 24 hours ago (86400 seconds)
  GameState.lastPastureCheck = Date.now() - 24 * 3600 * 1000;

  const rewards = GameState.calculatePastureRewards();
  assertEqual(rewards.length, 1, 'Should generate 1 reward entry');
  assertEqual(rewards[0].enemyName, 'Slimey');
  assertEqual(rewards[0].itemId, 'sardine');
  assertEqual(rewards[0].count, 2, '24 hours / 12h rate = 2 Sardines');

  // Verify inventory incremented
  assertEqual(GameState.inventory.sardine, 2, 'Sardines should be added to inventory');
});

test('calculatePastureRewards reward capping works', () => {
  GameState.captureEnemy('slime_pup', 'Slimey');
  
  // Set last check to 10 days ago. Cap is 3 days (72 hours = 6 Sardines)
  GameState.lastPastureCheck = Date.now() - 10 * 24 * 3600 * 1000;

  const rewards = GameState.calculatePastureRewards();
  assertEqual(rewards.length, 1);
  assertEqual(rewards[0].count, 6, 'Rewards should cap at 3 days (6 items)');
});

console.log(`\nTests completed: Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
