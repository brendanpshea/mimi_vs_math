/**
 * Item (power-up) definitions.
 * Items are found in treasure chests or awarded by NPCs.
 */
const ITEMS = {
  sardine: {
    id: 'sardine',
    name: 'Sardine',
    spriteKey: 'item_sardine',
    color: 0x44AAFF,
    description: 'Restore 2 HP.',
    effect: 'heal',
    value: 2,
    emoji: '🐟',
  },
  yarn_ball: {
    id: 'yarn_ball',
    name: 'Yarn Ball',
    spriteKey: 'item_yarn',
    color: 0xFF8833,
    description: '+5 seconds added to the battle timer (one battle).',
    effect: 'timerBonus',
    value: 5,
    emoji: '🧶',
  },
  catnip: {
    id: 'catnip',
    name: 'Catnip',
    spriteKey: 'item_catnip',
    color: 0x44CC44,
    description: 'Double damage on your next correct answer.',
    effect: 'doubleHit',
    value: 1,
    emoji: '🌿',
  },
  lucky_collar: {
    id: 'lucky_collar',
    name: 'Lucky Collar',
    spriteKey: 'item_collar',
    color: 0x44CCFF,
    description: 'A wrong answer does not cost HP (one battle).',
    effect: 'shield',
    value: 1,
    emoji: '💎',
  },
  fish_fossil: {
    id: 'fish_fossil',
    name: 'Fish Fossil',
    spriteKey: 'item_fossil',
    color: 0xFFDD44,
    description: 'Reveal one incorrect choice per battle (3 uses).',
    effect: 'hint',
    value: 3,
    emoji: '🦴',
  },
  math_net: {
    id: 'math_net',
    name: 'Math Net',
    spriteKey: 'item_net',
    color: 0x9955FF,
    description: 'Use in battle when enemy HP is <= 2 to capture them for your Pasture!',
    effect: 'capture',
    value: 1,
    emoji: '🕸️',
  },
};

export default ITEMS;
