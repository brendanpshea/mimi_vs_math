const REGION = {
    id: 0,
    name: 'Sunny Village',
    subtitle: 'Grade 1 · Addition & Subtraction',
    mathTopic: 'addSub',
    unlocked: true,
    floorColor: 0x88CC55,
    wallColor: 0xAA8855,
    accentColor: 0xFFDD44,
    bgColor: 0x7EC850,
    backdropKey: 'backdrop_village',
    auraColor:   0xFFDD33,
    bossTint:    0xFFFFF0,
    floorTile: 'floor_grass',
    wallTile: 'wall_hedge',
    // ── Map key positions ──────────────────────────────────────────────────
    mimiStart:     { col: 4, row: 26 },
    mimiStartPool: [                         // ProceduralMap picks one randomly each session
      { col: 4,  row: 26 },                  // mid-left   (default)
      { col: 4,  row: 40 },                  // south-left
      { col: 76, row: 26 },                  // mid-right
      { col: 40, row: 52 },                  // south-centre
    ],
    npcTile:   { col: 6, row: 29 },
    chestTile: { col: 75, row: 50 },
    bossTile:  { col: 76, row: 5 },
    bossTilePool: [                          // ProceduralMap picks one randomly each session
      { col: 76, row: 5  },                  // NE (default)
      { col: 4,  row: 5  },                  // NW
      { col: 40, row: 5  },                  // north-centre
      { col: 76, row: 50 },                  // SE
      { col: 4,  row: 50 },                  // SW
    ],

    // ── Enemies: 7 (intro region — all base D1; difficulty adapts via System C) ──
    bossUnlockKills: 10,
    enemySpawns: [
      { col: 20, row: 10, id: 'counting_caterpillar' },  // NW quadrant — addition
      { col: 60, row: 10, id: 'number_gnome'         },  // NE quadrant — subtraction
      { col: 40, row:  7, id: 'number_bee'           },  // north-centre — comparison
      { col: 25, row: 26, id: 'counting_caterpillar' },  // mid-left — addition
      { col: 55, row: 26, id: 'number_gnome'         },  // mid-right — subtraction
      { col: 30, row: 42, id: 'minus_mole'           },  // south-left — comparison
      { col: 60, row: 42, id: 'number_bee'           },  // south-right — comparison
    ],

    boss: 'subtraction_witch',
    bossName: 'The Subtraction Witch',
    description: 'A cheerful starting village! Practice Grade 1 skills — adding and subtracting numbers up to 20 and comparing values to help Mimi begin her quest.',
    npcHint: 'Count on from the bigger number to add faster!',
    npcBossStory: [
      'I\'m Mewton — mathematician, wizard, and the only certified cat-genius this side of the meadow.\n\nI\'ve been studying the Subtraction Witch for three years. She takes things away for sport — hats, sandwiches, my favourite theorem.\nLast Tuesday she subtracted my cloak. It hasn\'t come back.',
      'Her weakness? Number bonds to 10. She panics when someone knows them cold.\n7+3. 8+2. 6+4. Keep those sharp and she loses her rhythm completely.\n\nShe once subtracted herself out of an argument by accident.\nIt was, genuinely, the most beautiful thing I\'ve ever seen.',
    ],
    npcLesson: [
      '✨ The Bridge to 10 trick!\nTo add 8 + 5: ask what 8 needs to reach 10. Just 2!\nNow split the 5 into 2 + 3.\n8 + 2 = 10, then 10 + 3 = 13. ✓\nAlways aim for 10 first — it makes everything easier.',
      'Subtraction: bridge BACK through 10.\n13 − 7? Go 13 → 10 (that\'s –3), then 10 → 6 (that\'s –4 more).\nAnswer: 6. ✓\nOr count UP from 7: 7→10 is +3, 10→13 is +3 more. Total gap = 6.\nBoth routes, same destination.',
    ],
    npcBoon: 'sardine',
    npcQuizTopic: 'addition',
    bossIntro: [
      {
        speaker:   'The Subtraction Witch',
        side:      'right',
        spriteKey: 'subtraction_witch',
        nameColor: '#FF88CC',
        bg:        0x1A0808,
        text:      'So.  A cat has come to my tower.  They always send a cat.\nLast week: one cat.  Week before that: twelve!\nNow?  Zero.  I subtracted them all.\n\nI warned them about the arithmetic.  I really did.',
      },
      {
        speaker:   'Mimi',
        side:      'left',
        spriteKey: 'mimi_battle',
        nameColor: '#AAFFCC',
        bg:        0x1A0808,
        text:      'I\'ve been doing subtraction since I was four.\nMostly subtracting excuses from the list of reasons\nnot to be here.\n\nLet\'s see what you\'ve got.',
      },
    ],
  };

export default REGION;

