/**
 * Region definitions for Mimi vs. Math.
 *
 * Each region carries all per-region key positions so ExploreScene.js
 * never needs hardcoded tile coordinates.
 *
 * ── Map skeleton (70 × 50 tiles, tile = 32 px) ───────────────────────────
 *
 *  NORTH ZONE (rows 3-14)
 *    E1 (col 20, row 10)  ← north-left
 *    E2 (col 52, row  9)  ← north-right
 *    E7 (col 35, row  7)  ← north-mid patrol (regions 1-4 only)
 *    BOSS (col 66, row 5) ← far NE corner
 *
 *  ═══ Wall A: rows 15-16 ═══ gap @ cols 9-12 (NW) ═══ gap @ cols 41-44 (NE) ═══
 *
 *  MID ZONE (rows 17-30)
 *    MIMI_START (col 4,  row 23)
 *    NPC        (col 6,  row 26)
 *    E4         (col 44, row 23)  ← mid-right
 *
 *  ═══ Wall B: rows 31-32 ═══ cols 9-32 and 37-55 ═══ gap @ cols 33-36 ═══
 *     (cols 3-8 always open; cols 56-66 always open for chest corridor)
 *
 *  SOUTH ZONE (rows 33-46)
 *    E5    (col 14, row 37)  ← far-left
 *    E3    (col 30, row 37)  ← center-left
 *    E6    (col 57, row 36)  ← right (all regions)
 *    CHEST (col 65, row 44)  ← SE corner (unused — kept as landmark)
 *
 * ── enemySpawns ──────────────────────────────────────────────────────────
 *   { col, row, id, difficultyOverride? }
 *   Positions are fully randomized by ProceduralMap.randomizePositions().
 *   difficultyOverride replaces data.difficulty — changes tint + question difficulty
 *   for "hard review" versions of enemies from earlier regions.
 */
const REGIONS = [
  {
    id: 0,
    name: 'Sunny Village',
    subtitle: 'Grade 1 · Addition & Subtraction',
    mathTopic: 'addSub',
    unlocked: true,
    floorColor: 0x88CC55,
    wallColor: 0xAA8855,
    accentColor: 0xFFDD44,
    bgColor: 0x7EC850,
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

    // ── Enemies: 10 (intro region — native types at rising difficulties) ──
    enemySpawns: [
      { col: 20, row: 10, id: 'counting_caterpillar' },                       // D1 addition
      { col: 52, row:  9, id: 'number_gnome' },                               // D1 subtraction
      { col: 30, row: 40, id: 'minus_mole' },                                 // D1 comparison
      { col: 40, row:  7, id: 'number_bee' },                                 // D1 numberOrder (NEW)
      { col: 44, row: 26, id: 'counting_caterpillar', difficultyOverride: 2 },// D2 addition
      { col: 14, row: 40, id: 'number_gnome',         difficultyOverride: 2 },// D2 subtraction
      { col: 57, row: 40, id: 'minus_mole',           difficultyOverride: 2 },// D2 comparison
      { col: 35, row: 26, id: 'number_bee',           difficultyOverride: 2 },// D2 numberOrder
      { col: 60, row: 12, id: 'counting_caterpillar', difficultyOverride: 3 },// D3 addition
      { col: 50, row: 42, id: 'minus_mole',           difficultyOverride: 3 },// D3 comparison
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
  },
  {
    id: 1,
    name: 'Meadow Maze',
    subtitle: 'Grade 2 · Skip Counting & Times Tables',
    mathTopic: 'multiplication',
    unlocked: false,
    floorColor: 0x5FA827,
    wallColor: 0x4A7A1E,
    accentColor: 0x90EE90,
    bgColor: 0x5FA827,
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
  },
  {
    id: 2,
    name: 'Desert Dunes',
    subtitle: 'Grade 3 · Multiplication & Division',
    mathTopic: 'division',
    unlocked: false,
    floorColor: 0xD4A044,
    wallColor: 0xAA7722,
    accentColor: 0xFFCC66,
    bgColor: 0xC8943C,
    floorTile: 'floor_sand',
    wallTile: 'wall_sandstone',
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

    // ── Enemies: 10 — 4 native + 4 hard reviews from R1 + 2 native D2 ──
    enemySpawns: [
      { col: 20, row: 10, id: 'sand_scarab' },                                // D1 division
      { col: 52, row:  9, id: 'mummy_cat' },                                  // D2 mult review
      { col: 30, row: 40, id: 'mirage_fox' },                                 // D2 divisionWord
      { col: 40, row:  7, id: 'riddle_scarab' },                              // D1 missingNumber (NEW)
      { col: 44, row: 26, id: 'slime_pup',     difficultyOverride: 3 },       // D3 multTables review
      { col: 14, row: 40, id: 'cactus_sprite', difficultyOverride: 3 },       // D3 multiplication review
      { col: 57, row: 40, id: 'cloud_bully',   difficultyOverride: 3 },       // D3 skipCounting review
      { col: 35, row: 26, id: 'double_bunny',  difficultyOverride: 3 },       // D3 doubling review
      { col: 60, row: 12, id: 'sand_scarab',   difficultyOverride: 2 },       // D2 division
      { col: 50, row: 42, id: 'riddle_scarab', difficultyOverride: 2 },       // D2 missingNumber
    ],

    boss: 'the_diviner',
    bossName: 'The Diviner',
    description: 'Trek through scorching sands and master Grade 3 skills — complete multiplication tables, learn division as the inverse of multiplication, and solve division word problems to reveal the ancient Diviner!',
    npcHint: 'Division is just multiplication in reverse — if 4 × 3 = 12, then 12 ÷ 4 = 3!',
    npcBossStory: [
      'The Diviner has been sitting in this desert for four hundred years, dividing everything into equal parts. Sand dunes. Scholarly debates. Visiting academics.\n\nI sent her a letter proposing a collaboration. She replied: \'Your methodology divides into errors and more errors.\' Rude. Accurate, that particular week. But rude.',
      'Her trick: she reframes multiplication as a missing number.\n\'4 × ☐ = 28\' — it\'s designed to seem mysterious.\nIt isn\'t. Ask: what times 4 is 28? Seven.\nDivision is multiplication in a different hat. She knows that. Now so do you.',
    ],
    npcLesson: [
      'Division = multiplication backwards.\n42 ÷ 6 = ?   Ask yourself: 6 × ? = 42.\nYou know 6 × 7 = 42. Answer: 7. ✓\nFact family: 6×7=42, 7×6=42, 42÷6=7, 42÷7=6.\nFour facts. One set of numbers. Learn one, get three free.',
      'For word problems:\n① What is being shared? (the large number)\n② Into how many groups? (the divisor)\n③ How many in each? (your answer)\n\'24 biscuits, 8 cats: 24 ÷ 8 = 3 each.\'\nAlways verify: 3 × 8 = 24 ✓.',
    ],
    npcBoon: 'fish_fossil',
    npcQuizTopic: 'divisionWord',
    bossIntro: [
      {
        speaker:   'The Diviner',
        side:      'right',
        spriteKey: 'the_diviner',
        nameColor: '#DDBB44',
        bg:        0x1A1205,
        text:      'Long have I studied the art of division.\nKingdoms divided.  Armies halved.  Hopes quartered.\n\nI have divided more things than you have ever counted, little cat.\nWhat could you possibly divide ME by?',
      },
      {
        speaker:   'Mimi',
        side:      'left',
        spriteKey: 'mimi_battle',
        nameColor: '#AAFFCC',
        bg:        0x1A1205,
        text:      'How about dividing you from that throne?\n\n… that sounded better in my head.\n\nCome on.  Let\'s fight.',
      },
    ],
  },
  {
    id: 3,
    name: 'Frostbite Cavern',
    subtitle: 'Grade 4 · Fractions & Decimals',
    mathTopic: 'fractions',
    unlocked: false,
    floorColor: 0x99C8DD,
    wallColor: 0x5588AA,
    accentColor: 0xCCEEFF,
    bgColor: 0x7AB4CC,
    floorTile: 'floor_snow',
    wallTile: 'wall_ice',
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

    // ── Enemies: 10 — 4 native + 4 hard reviews from R2 + 2 native D3 ──
    enemySpawns: [
      { col: 20, row: 10, id: 'ice_frog' },                                   // D1 fractionCompare
      { col: 52, row:  9, id: 'snow_golem' },                                 // D2 fractionAdd
      { col: 30, row: 40, id: 'crystal_bat' },                                // D2 decimals
      { col: 40, row:  7, id: 'ice_frog',      difficultyOverride: 2 },       // D2 fractionCompare
      { col: 44, row: 26, id: 'sand_scarab',   difficultyOverride: 3 },       // D3 division review
      { col: 14, row: 40, id: 'mummy_cat',     difficultyOverride: 3 },       // D3 mult review
      { col: 57, row: 40, id: 'mirage_fox',    difficultyOverride: 3 },       // D3 word-problem review
      { col: 35, row: 26, id: 'riddle_scarab', difficultyOverride: 3 },       // D3 missingNumber review
      { col: 60, row: 12, id: 'snow_golem',    difficultyOverride: 3 },       // D3 fractionAdd
      { col: 50, row: 42, id: 'crystal_bat',   difficultyOverride: 3 },       // D3 decimals
    ],

    boss: 'glacius',
    bossName: 'Glacius the Fraction Dragon',
    description: 'Brave the icy depths and conquer Grade 4 skills — compare and add fractions, and work with decimal tenths to prove to Glacius that fractions hold no fear!',
    npcHint: 'To compare fractions, find a common denominator first!',
    npcBossStory: [
      'Glacius. I have complicated feelings about Glacius.\nLast visit, she froze half my notes into solid ice. Said it was \'technically still information, just a different phase.\' She isn\'t wrong. That\'s the problem.\n\nShe thinks in fractions. Everything must divide into equal, exact parts. Decimals offend her — except tenths. She tolerates tenths.',
      'Her weakness: a correct common denominator. She respects the process.\n½ + ⅓ = 5/6? She won\'t dispute that. She can\'t.\n\nPanic around fractions and she\'ll sense it. She froze my left ear once because I said \'roughly a half.\'\'Roughly\' has no place in mathematics, Mewton.\'\n\nShe\'s not wrong about that either.',
    ],
    npcLesson: [
      'Comparing fractions: give them the same denominator.\n⅔ vs ½?  Multiply up → 4/6 vs 3/6.  So ⅔ > ½. ✓\nRule: find the smallest number both denominators divide into.\n2 and 3 → 6.  3 and 4 → 12.  This is called the LCD.',
      'Adding fractions:\nSame denominator → just add the tops: ¼ + ¾ = 4/4 = 1. ✓\nDifferent denominators → find common denom first:\n½ + ⅓: use 6.  3/6 + 2/6 = 5/6. ✓\nDecimals: 0.1 = 1/10.  0.7 = 7/10.  Think in tenths.',
    ],
    npcBoon: 'lucky_collar',
    npcQuizTopic: 'fractionCompare',
    bossIntro: [
      {
        speaker:   'Glacius the Fraction Dragon',
        side:      'right',
        spriteKey: 'glacius',
        nameColor: '#AADDFF',
        bg:        0x060E1A,
        text:      'Half a hero arrives.\nThree-quarters prepared, at generous rounding.\nYour fraction of courage is precisely… insufficient.\n\nThis cavern has frozen far greater champions than you.',
      },
      {
        speaker:   'Mimi',
        side:      'left',
        spriteKey: 'mimi_battle',
        nameColor: '#AAFFCC',
        bg:        0x060E1A,
        text:      'I once ate exactly half my dinner and saved the rest for later.\nAdmittedly I ate the rest immediately.\nBut I UNDERSTAND fractions.\n\nReady when you are.',
      },
    ],
  },
  {
    id: 4,
    name: 'Shadow Castle',
    subtitle: 'Grade 5 · Percentages, Ratios & Operations',
    mathTopic: 'mixed',
    unlocked: false,
    floorColor: 0x3D2B5E,
    wallColor: 0x1E1232,
    accentColor: 0x9966FF,
    bgColor: 0x2D1B4E,
    floorTile: 'floor_stone',
    wallTile: 'wall_obsidian',
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

    // ── Enemies: 10 — 4 native + 4 hard reviews from R3 + 2 native D3 ──
    enemySpawns: [
      { col: 20, row: 10, id: 'shadow_knight' },                              // D1 orderOfOps
      { col: 52, row:  9, id: 'ratio_raven' },                                // D2 percentages
      { col: 30, row: 40, id: 'percent_wraith' },                             // D2 ratiosProp
      { col: 40, row:  7, id: 'shadow_knight', difficultyOverride: 2 },       // D2 orderOfOps
      { col: 44, row: 26, id: 'ice_frog',      difficultyOverride: 3 },       // D3 fractionCompare review
      { col: 14, row: 40, id: 'snow_golem',    difficultyOverride: 3 },       // D3 fractionAdd review
      { col: 57, row: 40, id: 'crystal_bat',   difficultyOverride: 3 },       // D3 decimals review
      { col: 35, row: 26, id: 'ratio_raven',   difficultyOverride: 3 },       // D3 percentages
      { col: 60, row: 12, id: 'percent_wraith', difficultyOverride: 3 },      // D3 ratiosProp
      { col: 50, row: 42, id: 'shadow_knight', difficultyOverride: 3 },       // D3 orderOfOps
    ],

    boss: 'fenwick',
    bossName: 'Fenwick, the Sly Fox',
    description: 'Fenwick the Sly Fox lurks at the top of his Shadow Castle. Prove your Grade 5 mastery — order of operations, percentages, and ratios — then topple the Sly Fox himself to reclaim Mimi\'s yarn ball!',
    npcHint: 'Order of operations: multiply and divide before you add or subtract!',
    npcBossStory: [
      'FENWICK. I have been tracking that fox for six years.\nHe stole Mimi\'s yarn ball, yes — but he also stole my proof of the commutative property and hung it in his trophy room between a stuffed fish and a certificate in \'Creative Accounting.\' It is not decoration. It is mathematics.\n\nI am not calm about this.',
      'His trick: he writes 2 + 3 × 4 on a wall and bets you say 20.\nThe answer is 14. Multiplication before addition. He KNOWS this.\nHe just enjoys watching the panic.\n\nDo not give him the satisfaction. BEDMAS: Brackets, Exponents, Divide\/Multiply, then Add\/Subtract. Left to right. Every time.',
    ],
    npcLesson: [
      'Order of operations — BEDMAS:\nB = Brackets (always first).\nE = Exponents.\nDM = Divide and Multiply (left to right).\nAS = Add and Subtract (left to right, last).\n2 + 3 × 4 = 2 + 12 = 14.\nNot 20. Never, ever 20.',
      'Percentages:\n10% of 60 = 6. So 30% = 6 × 3 = 18. ✓\nRatios: 2:3 means 5 total parts.\nIf the total is 25: each part = 25 ÷ 5 = 5.\nSo 2 parts = 10, 3 parts = 15.\nCheck: 10 + 15 = 25 ✓.',
    ],
    npcBoon: 'catnip',
    npcQuizTopic: 'orderOfOps',
    bossIntro: [
      {
        speaker:   'Fenwick the Sly Fox',
        side:      'right',
        spriteKey: 'fenwick',
        nameColor: '#FF9944',
        bg:        0x080314,
        text:      'Well.  You actually made it.\nI designed those five kingdoms to be completely impassable.\nI am somewhere between impressed and professionally embarrassed.\n\nHow — HOW — did you get past the Diviner?\nHe\'s been doing that for centuries.',
      },
      {
        speaker:   'Mimi',
        side:      'left',
        spriteKey: 'mimi_battle',
        nameColor: '#AAFFCC',
        bg:        0x080314,
        text:      'Give me my yarn ball.',
      },
      {
        speaker:   'Fenwick the Sly Fox',
        side:      'right',
        spriteKey: 'fenwick',
        nameColor: '#FF9944',
        bg:        0x0A0418,
        text:      'It\'s on my desk.  I\'ve been using it as a paperweight, actually.\nDo you have any idea how many forms the Shadow Empire\ngenerates per week?  It\'s unconscionable.\n\nRegardless.  We fight.  I\'ve rehearsed.\nIt\'ll be very dramatic.  Try to look surprised.',
      },
    ],
  },
];

export default REGIONS;
