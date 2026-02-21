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
    wallTile: 'wall_brick',
    // ── Map key positions ──────────────────────────────────────────────────
    mimiStart: { col: 4, row: 26 },
    npcTile:   { col: 6, row: 29 },
    chestTile: { col: 75, row: 50 },
    bossTile:  { col: 76, row: 5 },

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
    wallTile: 'wall_brick',
    mimiStart: { col: 4, row: 26 },
    npcTile:   { col: 6, row: 29 },
    chestTile: { col: 75, row: 50 },
    bossTile:  { col: 76, row: 5 },

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
    wallTile: 'wall_brick',
    mimiStart: { col: 4, row: 26 },
    npcTile:   { col: 6, row: 29 },
    chestTile: { col: 75, row: 50 },
    bossTile:  { col: 76, row: 5 },

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
    mimiStart: { col: 4, row: 26 },
    npcTile:   { col: 6, row: 29 },
    chestTile: { col: 75, row: 50 },
    bossTile:  { col: 76, row: 5 },

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
    wallTile: 'wall_brick',
    mimiStart: { col: 4, row: 26 },
    npcTile:   { col: 6, row: 29 },
    chestTile: { col: 75, row: 50 },
    bossTile:  { col: 76, row: 5 },

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
