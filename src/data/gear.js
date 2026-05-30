/**
 * Gear definitions for meta-progression.
 * Gear can be equipped in slots: weapon, hat, accessory.
 */
const GEAR = {
  // ── Weapons (Damage Buffs) ────────────────────────────────────────────────
  wooden_wand: {
    id: 'wooden_wand',
    name: 'Wooden Wand',
    slot: 'weapon',
    emoji: '🪄',
    description: 'A basic wooden wand. Feels lightweight, but does not add extra damage.',
    damageBonus: 0,
    cost: 0,
  },
  math_scepter: {
    id: 'math_scepter',
    name: 'Math Scepter',
    slot: 'weapon',
    emoji: '🔱',
    description: 'A glowing scepter infused with basic arithmetic. +1 damage to all math battle hits.',
    damageBonus: 1,
    cost: 15,
  },
  calculator_staff: {
    id: 'calculator_staff',
    name: 'Calculator Staff',
    slot: 'weapon',
    emoji: '🧙‍♂️',
    description: 'A powerful staff fitted with a solar-powered calculator. +2 damage to all math battle hits.',
    damageBonus: 2,
    cost: 35,
  },

  // ── Hats (Timer and Defense Buffs) ─────────────────────────────────────────
  kitty_ears: {
    id: 'kitty_ears',
    name: 'Kitty Ears',
    slot: 'hat',
    emoji: '🐱',
    description: 'Mimi\'s natural ears. Cute, but doesn\'t affect battle timers.',
    timerBonus: 0,
    damageReduction: 0,
    cost: 0,
  },
  scholar_cap: {
    id: 'scholar_cap',
    name: 'Scholar Cap',
    slot: 'hat',
    emoji: '🎓',
    description: 'Makes Mimi look incredibly scholarly. Adds +2 seconds to the math battle timer permanently.',
    timerBonus: 2,
    damageReduction: 0,
    cost: 12,
  },
  wizard_hat: {
    id: 'wizard_hat',
    name: 'Wizard Hat',
    slot: 'hat',
    emoji: '🎩',
    description: 'A starry pointed hat that bends space-time. +4 seconds to timer and reduces incoming damage by 1.',
    timerBonus: 4,
    damageReduction: 1,
    cost: 30,
  },

  // ── Accessories (Max HP and Dodge Buffs) ─────────────────────────────────────
  red_collar: {
    id: 'red_collar',
    name: 'Red Collar',
    slot: 'accessory',
    emoji: '🧣',
    description: 'A standard red collar. Very comfortable, but offers no statistical advantage.',
    hpBonus: 0,
    dodgeChance: 0,
    cost: 0,
  },
  iron_collar: {
    id: 'iron_collar',
    name: 'Iron Collar',
    slot: 'accessory',
    emoji: '⛓️',
    description: 'A heavy collar made of sturdy metal. Grants +2 Max HP (+1 heart container).',
    hpBonus: 2,
    dodgeChance: 0,
    cost: 18,
  },
  diamond_collar: {
    id: 'diamond_collar',
    name: 'Diamond Collar',
    slot: 'accessory',
    emoji: '💎',
    description: 'A sparkling diamond collar. Grants +4 Max HP (+2 heart containers) and 15% chance to dodge attacks.',
    hpBonus: 4,
    dodgeChance: 0.15,
    cost: 40,
  },
};

export default GEAR;
