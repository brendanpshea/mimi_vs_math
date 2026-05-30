// Mock localStorage before GameState methods are called
const _store = {};
globalThis.localStorage = {
  getItem:  key       => _store[key] ?? null,
  setItem:  (key, v)  => { _store[key] = v; },
  removeItem: key     => { delete _store[key]; },
};

import GameState from './src/config/GameState.js';
import GEAR from './src/data/gear.js';

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

console.log('\n--- Equippable Gear System Unit Tests ---');

test('default gear initialization and stats', () => {
  assertEqual(GameState.equippedGear.weapon, 'wooden_wand');
  assertEqual(GameState.equippedGear.hat, 'kitty_ears');
  assertEqual(GameState.equippedGear.accessory, 'red_collar');

  assertEqual(GameState.getPlayerDamage(2), 2, 'Default damage should be unchanged');
  assertEqual(GameState.getPlayerTimerBonus(), 0, 'Default timer bonus should be 0');
  assertEqual(GameState.getPlayerMaxHP(), 12, 'Default Max HP should be 12 (6 hearts)');
  assertEqual(GameState.getPlayerDodgeChance(), 0, 'Default dodge chance should be 0');
  assertEqual(GameState.getPlayerDamageReduction(), 0, 'Default damage reduction should be 0');
});

test('dynamic damage bonuses for weapons', () => {
  GameState.equippedGear.weapon = 'math_scepter';
  assertEqual(GameState.getPlayerDamage(2), 3, 'Math Scepter should add +1 damage');
  assertEqual(GameState.getPlayerDamage(3), 4, 'Math Scepter should add +1 damage');

  GameState.equippedGear.weapon = 'calculator_staff';
  assertEqual(GameState.getPlayerDamage(2), 4, 'Calculator Staff should add +2 damage');
});

test('dynamic timer and defense bonuses for hats', () => {
  GameState.equippedGear.hat = 'scholar_cap';
  assertEqual(GameState.getPlayerTimerBonus(), 2, 'Scholar Cap should add +2s to timer');
  assertEqual(GameState.getPlayerDamageReduction(), 0, 'Scholar Cap has no damage reduction');

  GameState.equippedGear.hat = 'wizard_hat';
  assertEqual(GameState.getPlayerTimerBonus(), 4, 'Wizard Hat should add +4s to timer');
  assertEqual(GameState.getPlayerDamageReduction(), 1, 'Wizard Hat should reduce damage by 1');
});

test('dynamic HP and dodge bonuses for accessories', () => {
  GameState.equippedGear.accessory = 'iron_collar';
  assertEqual(GameState.getPlayerMaxHP(), 14, 'Iron Collar should grant 14 Max HP');
  assertEqual(GameState.getPlayerDodgeChance(), 0, 'Iron Collar has no dodge chance');

  GameState.equippedGear.accessory = 'diamond_collar';
  assertEqual(GameState.getPlayerMaxHP(), 16, 'Diamond Collar should grant 16 Max HP');
  assertEqual(GameState.getPlayerDodgeChance(), 0.15, 'Diamond Collar should grant 15% dodge chance');
});

test('unlocking gear item helper', () => {
  assert(!GameState.unlockedGear.includes('math_scepter'), 'Math Scepter should be locked initially');
  
  const unlocked = GameState.unlockGearItem('math_scepter');
  assert(unlocked === true, 'unlockGearItem should return true on new unlock');
  assert(GameState.unlockedGear.includes('math_scepter'), 'Math Scepter should now be unlocked');

  const duplicate = GameState.unlockGearItem('math_scepter');
  assert(duplicate === false, 'unlockGearItem should return false on duplicate unlock');
  assertEqual(GameState.unlockedGear.filter(g => g === 'math_scepter').length, 1, 'Math Scepter should only appear once');
});

console.log(`\nTests completed: Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
