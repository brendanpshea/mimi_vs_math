const REGION = {
    id: 1,
    name: 'Meadow Maze',
    subtitle: 'Grade 2 · Skip Counting & Times Tables',
    mathTopic: 'multiplication',
    unlocked: false,
    floorColor: 0x5FA827,
    wallColor: 0x4A7A1E,
    accentColor: 0x90EE90,
    bgColor: 0x5FA827,
    backdropKey: 'backdrop_meadow',
    auraColor:   0x44FF88,
    bossTint:    0xF0FFF4,
    floorTile: 'floor_grass',
    wallTile: 'wall_hedge',
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

    // ── Enemies: 10 — 4 native + 4 hard reviews from R0 + 2 native D2 ──
    enemySpawns: [
      { col: 20, row: 10, id: 'slime_pup' },                                  // D1 multTables
      { col: 52, row:  9, id: 'cactus_sprite' },                              // D2 multiplication
      { col: 30, row: 40, id: 'cloud_bully' },                                // D2 skipCounting
      { col: 40, row:  7, id: 'double_bunny' },                               // D1 doubling (NEW)
      { col: 44, row: 26, id: 'counting_caterpillar', difficultyOverride: 3 },// D3 addition review
      { col: 14, row: 40, id: 'number_gnome',         difficultyOverride: 3 },// D3 subtraction review
      { col: 57, row: 40, id: 'minus_mole',           difficultyOverride: 3 },// D3 comparison review
      { col: 35, row: 26, id: 'number_bee',           difficultyOverride: 3 },// D3 numberOrder review
      { col: 60, row: 12, id: 'slime_pup',            difficultyOverride: 2 },// D2 multTables
      { col: 50, row: 42, id: 'double_bunny',         difficultyOverride: 2 },// D2 doubling
    ],

    boss: 'count_multiplico',
    bossName: 'Count Multiplico',
    description: 'Navigate the winding meadow paths and build Grade 2 skills — skip counting by 2s, 5s, and 10s, and tackle the first multiplication tables to defeat the Count!',
    npcHint: 'Skip counting by 2s, 5s, and 10s is the secret to fast multiplication!',
    npcBossStory: [
      'I got lost in this maze for eleven days once. Count Multiplico kept doubling the hedgerows every time I found the exit.\nSix became twelve. Twelve became twenty-four. I eventually gave up and climbed over the whole thing.\n\nThe Count finds this hilarious. He would.',
      'His weakness: skip-counting patterns. Show him you know your 2s, 5s, and 10s and he\'ll flinch.\nOdd numbers make him uncomfortable too — I\'ve never asked why, but I have documented evidence.\n\nDon\'t let his speeches distract you. He rehearses them. They\'re very long.',
    ],
    npcLesson: [
      'The skip-counting shortcuts:\n×2 = just double!  7 × 2 = 7+7 = 14.\n×5 = always ends in 0 or 5. Count by fives: 5, 10, 15…\n×10 = slip a zero on the end. 8 × 10 = 80.\nThat last one is genuinely that easy.',
      'For trickier tables — build from what you know:\n6 × 7?  Think (5 × 7) + (1 × 7) = 35 + 7 = 42. ✓\n6 × 8?  = (6 × 4) × 2 = 24 × 2 = 48. ✓\nDoubling and adding one extra group is your emergency kit.',
    ],
    npcBoon: 'yarn_ball',
    npcQuizTopic: 'skipCounting',
    bossIntro: [
      {
        speaker:   'Count Multiplico',
        side:      'right',
        spriteKey: 'count_multiplico',
        nameColor: '#FFAA44',
        bg:        0x081408,
        text:      'My glory shall MULTIPLY across every meadow and mountain!\nTwo kingdoms, then four, then EIGHT, then ALL OF THEM!\n\nI\'ve been practising this speech for weeks.\nCan you tell?  I feel like you can tell.',
      },
      {
        speaker:   'Mimi',
        side:      'left',
        spriteKey: 'mimi_battle',
        nameColor: '#AAFFCC',
        bg:        0x081408,
        text:      'I can tell.\n\nYou\'ve got a lovely cape, though.\nShame about what\'s going to happen to it.',
      },
    ],
  };

export default REGION;

