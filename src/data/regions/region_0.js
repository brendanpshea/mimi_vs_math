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
    wallTile:  'wall_hedge',

    colorGrade:      0xFFDD88,  // warm gold colour-grade overlay
    gateAccentColor: 0xFFDD33,  // golden arch highlights on boss door
    weather: (camW, camH) => ({
      texture: '_wx_line', depth: 22,
      config: {
        x: { min: -20, max: camW + 20 }, y: -12,
        speedX: { min: 55, max: 95 },
        speedY: { min: 280, max: 420 },
        lifespan: 1800,
        quantity: 2, frequency: 45,
        alpha: { start: 0.30, end: 0 },
        scale: { start: 0.9, end: 0.9 },
        tint: 0xBBDDFF,
        rotate: 12,
        gravityY: 0, maxParticles: 0,
      },
    }),
    animatedEffects: [
      { type: 'campfire' },
      { type: 'ripples', color: 0x66BBFF },
    ],

    // ── Map generation config ──────────────────────────────────────────────
    blockingTiles: [
      { key: 'decoration_tree' },
      { key: 'decoration_tree_b' },
    ],
    accentLayers: [
      { key: 'decoration_flower',   freq: 0.12, threshold: 0.82, seed: 100 },
      { key: 'decoration_hay_bale', freq: 0.08, threshold: 0.86, seed: 200 },
    ],
    landmark: { key: 'landmark_pond', tilesW: 5, tilesH: 4, blocking: true, margin: 2 },
    itemPool:  ['sardine', 'yarn_ball'],

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
      { id: 'counting_caterpillar' },  // addition
      { id: 'number_gnome'         },  // subtraction
      { id: 'number_bee'           },  // comparison
      { id: 'counting_caterpillar' },  // addition
      { id: 'number_gnome'         },  // subtraction
      { id: 'minus_mole'           },  // comparison
      { id: 'number_bee'           },  // comparison
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

