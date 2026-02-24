const REGION = {
    id: 1,
    name: 'Windmill Village',
    subtitle: 'Grade 2 · Place Value & 2-Digit Arithmetic',
    mathTopic: 'addCarry',
    unlocked: false,
    floorColor:  0xC8A840,   // wheat gold
    wallColor:   0xD4C090,   // pale stone
    accentColor: 0xCC6633,   // terracotta
    bgColor:     0xC8943C,   // harvest amber
    backdropKey: 'backdrop_windmill',
    auraColor:   0xFFAA33,
    bossTint:    0xFFF0CC,
    floorTile: 'floor_wheat',
    wallTile:  'wall_cobble',
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
    bossUnlockKills: 10,
    enemySpawns: [
      { col: 20, row: 10, id: 'gear_gnome' },                               // D1 placeValue
      { col: 52, row:  9, id: 'windmill_sprite' },                           // D1 addCarry
      { col: 30, row: 40, id: 'harvest_scarecrow' },                         // D2 subBorrow
      { col: 40, row:  7, id: 'counting_crow' },                             // D2 addCarry
      { col: 44, row: 26, id: 'counting_caterpillar', difficultyOverride: 3 }, // D3 addition review
      { col: 14, row: 40, id: 'minus_mole',            difficultyOverride: 3 }, // D3 comparison review
      { col: 57, row: 40, id: 'number_gnome',          difficultyOverride: 3 }, // D3 subtraction review
      { col: 35, row: 26, id: 'number_bee',            difficultyOverride: 3 }, // D3 numberOrder review
      { col: 60, row: 12, id: 'gear_gnome',            difficultyOverride: 2 }, // D2 placeValue
      { col: 50, row: 42, id: 'windmill_sprite',       difficultyOverride: 2 }, // D2 addCarry
    ],

    boss: 'grand_miller',
    bossName: 'Grand Miller',
    description: 'Spin through the wheat-scented windmill fields! Master place value, and 2-digit adding and subtracting with carrying and borrowing to knock the Grand Miller off his perch.',
    npcHint: 'Break every number into TENS and ONES first — the whole mill runs on that secret.',
    npcBossStory: [
      'The Grand Miller has been here since anyone can remember. He\'s ground flour for every village in the valley — and every number that passes through gets sorted into its tens and ones.\n\nHe keeps meticulous records. Forty-seven means four tens and seven ones. He will not accept a thirty-seventeen.\n\nNo one argues with him. He has very large millstone arms.',
      'His technique: he confuses people about carrying. You think 28 + 35 is 53? That\'s "thirty-thirteen." He snorts flour and waits.\n\nThe trick is to carry the ten properly. 8+5 is 13 — write the 3, carry the 1 into the tens column. Simple once you see it.\n\nHe doesn\'t find it simple. That\'s why he fights.',
    ],
    npcLesson: [
      '2-digit place value:\n47 = 4 tens + 7 ones = 40 + 7.\nTo add 28 + 35:\n  8 + 5 = 13 → write 3, carry 1\n  2 + 3 + 1(carry) = 6\n  Answer: 63 ✓',
      'To subtract with borrowing — 42 − 17:\n  2 − 7? Can\'t do it! Borrow a ten.\n  12 − 7 = 5  (ones column)\n  3 − 1 = 2   (tens column, after borrowing)\n  Answer: 25 ✓\nThe tens digit loses 1 when you borrow.',
    ],
    npcBoon: 'yarn_ball',
    npcQuizTopic: 'addCarry',
    bossIntro: [
      {
        speaker:   'Grand Miller',
        side:      'right',
        spriteKey: 'grand_miller',
        nameColor: '#FFCC66',
        bg:        0x141004,
        text:      'Every number entering my mill sorts into TENS and ONES.\nLeft column. Right column. No exceptions.\nNo carrying errors. No sloppy borrowing.\n\nThat is FOUR tens and THREE ones.\nI will accept nothing else.',
      },
      {
        speaker:   'Mimi',
        side:      'left',
        spriteKey: 'mimi_battle',
        nameColor: '#AAFFCC',
        bg:        0x141004,
        text:      'You counted that?  All of them?\n\nDid you write them in a ledger?\n\n…Can I see the ledger?',
      },
    ],
  };

export default REGION;
