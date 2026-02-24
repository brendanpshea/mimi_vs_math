const REGION = {
    id: 3,
    name: 'Mycelium Hollow',
    subtitle: 'Grade 3 · Multi-Digit Multiplication',
    mathTopic: 'multiDigitMult',
    unlocked: false,
    floorColor: 0x2D4A2D,
    wallColor: 0x1A2E1A,
    accentColor: 0x88FFAA,
    bgColor: 0x243824,
    backdropKey: 'backdrop_hollow',
    auraColor:   0xAAFF88,
    bossTint:    0xFFEEFF,
    floorTile: 'floor_moss',
    wallTile:  'wall_mycelium',

    // ── Map generation config ──────────────────────────────────────────────
    blockingTiles: [
      { key: 'decoration_vine' },
      { key: 'decoration_mushroom' },
    ],
    accentLayers: [
      { key: 'decoration_lily',     freq: 0.13, threshold: 0.80, seed: 550 },
      { key: 'decoration_mushroom', freq: 0.09, threshold: 0.86, seed: 650 },
    ],
    landmark: { key: 'landmark_mushroom_circle', tilesW: 5, tilesH: 4, blocking: false, margin: 2 },
    itemPool:  ['yarn_ball', 'catnip'],

    mimiStart:     { col: 4, row: 26 },
    mimiStartPool: [
      { col: 4,  row: 26 }, { col: 4,  row: 40 },
      { col: 76, row: 26 }, { col: 40, row: 52 },
    ],
    npcTile:   { col: 6, row: 29 },
    chestTile: { col: 75, row: 50 },
    bossTile:  { col: 76, row: 5 },
    bossTilePool: [
      { col: 76, row: 5  }, { col: 4,  row: 5  }, { col: 40, row: 5  },
      { col: 76, row: 50 }, { col: 4,  row: 50 },
    ],

    // ── Enemies: 10 — 3 native types + 2 hard reviews from R2 ────────────
    bossUnlockKills: 10,
    enemySpawns: [
      { id: 'fungus_toad'                              },  // D1 multiDigitMult
      { id: 'mycelium_wisp'                            },  // D1 factorPairs
      { id: 'spore_puff'                               },  // D2 multiDigitMult
      { id: 'fungus_toad'   },  // multiDigitMult
      { id: 'mycelium_wisp' },  // factorPairs
      { id: 'spore_puff'    },  // multiDigitMult
      { id: 'mycelium_wisp' },  // factorPairs (word problem)
      { id: 'slime_pup',      difficultyOverride: 3    },  // D3 multTables review
      { id: 'double_bunny',   difficultyOverride: 3    },  // D3 doubling review
      { id: 'fungus_toad'   },  // multiDigitMult
    ],

    boss: 'queen_sporella',
    bossName: 'Queen Sporella',
    description: 'Deep in the bioluminescent Mycelium Hollow, Queen Sporella has grown a network of spores that blocks the path forward. Master multi-digit multiplication and factor pairs to break through her spore network and continue the quest!',
    npcHint: 'Break big multiplication into parts — 14 × 3 is just (10 × 3) + (4 × 3) = 42!',
    npcBossStory: [
      'Queen Sporella.\nI have studied her mycelium network for three years. Every spore connects to every other spore. Every branch multiplies into more branches.\n\nShe does not fight with claws. She fights with mathematics. Specifically: with the distributive property.\n\nI once saw her decompose a 47 × 6 problem in her head in two seconds. I am still embarrassed about this.',
      'Her trick: she makes 2-digit multiplication feel enormous.\nIt isn\'t.\n47 × 6 = (40 × 6) + (7 × 6) = 240 + 42 = 282.\nBreak the big number into tens and ones. Multiply each part. Add the pieces.\n\nShe can\'t stop you once you see the pattern.',
    ],
    npcLesson: [
      'Multi-digit multiplication:\nSplit the number into tens and ones!\n14 × 3:\n  10 × 3 = 30\n  4 × 3  = 12\n  30 + 12 = 42 ✓\n\n23 × 4:\n  20 × 4 = 80\n  3 × 4  = 12\n  80 + 12 = 92 ✓',
      'Factor pairs — × and ÷ are inverses:\nIf 6 × 8 = 48, then:\n  48 ÷ 6 = 8  and  48 ÷ 8 = 6.\n\n"? × 7 = 56" — ask yourself:\nWhat times 7 is 56? You know 7 × 8 = 56.\nAnswer: 8. ✓\n\nKnowing your tables means you can always find the missing factor.',
    ],
    npcBoon: 'yarn_ball',
    npcQuizTopic: 'multiDigitMult',
    bossIntro: [
      {
        speaker:   'Queen Sporella',
        side:      'right',
        spriteKey: 'queen_sporella',
        nameColor: '#FFAADD',
        bg:        0x0A1A0A,
        text:      'Another visitor.\nMy spores have already counted you — your heartbeats, your hesitations, the exact number of steps you took through my hollow.\n\nSixty-three. I was expecting a round number.\nYou are already imprecise.',
      },
      {
        speaker:   'Mimi',
        side:      'left',
        spriteKey: 'mimi_battle',
        nameColor: '#AAFFCC',
        bg:        0x0A1A0A,
        text:      'I stopped to smell a mushroom.\nSeveral mushrooms, actually.\nThey were very interesting mushrooms.',
      },
      {
        speaker:   'Queen Sporella',
        side:      'right',
        spriteKey: 'queen_sporella',
        nameColor: '#FFAADD',
        bg:        0x0C1E0C,
        text:      'Those mushrooms are part of my network.\nThey reported back.\n\nRegardless. You\'ve made it this deep into my hollow, which means you can multiply.\nLet\'s see how you handle the bigger numbers.\n\nI do hope you know your distributive property.',
      },
    ],
  };

export default REGION;
