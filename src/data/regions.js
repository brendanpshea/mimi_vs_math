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
 *    E6    (col 57, row 36)  ← right (regions 1-4 only)
 *    CHEST (col 65, row 44)  ← SE corner
 *
 * ── enemySpawns ──────────────────────────────────────────────────────────
 *   { col, row, id, difficultyOverride? }
 *   difficultyOverride replaces data.difficulty — changes tint + question difficulty
 *   for "hard review" versions of enemies from earlier regions.
 */
const REGIONS = [
  {
    id: 0,
    name: 'Sunny Village',
    subtitle: 'Grades 1–3 · Addition & Subtraction',
    mathTopic: 'addSub',
    unlocked: true,
    floorColor: 0x88CC55,
    wallColor: 0xAA8855,
    accentColor: 0xFFDD44,
    bgColor: 0x7EC850,
    floorTile: 'floor_grass',
    wallTile: 'wall_brick',
    // ── Map key positions ──────────────────────────────────────────────────
    mimiStart: { col: 4, row: 23 },
    npcTile:   { col: 6, row: 26 },
    chestTile: { col: 65, row: 44 },
    bossTile:  { col: 66, row: 5 },

    // ── Enemies: 5 (intro region — native types only, one harder review) ──
    enemySpawns: [
      { col: 20, row: 10, id: 'counting_caterpillar' },                       // D1 addition
      { col: 52, row:  9, id: 'number_gnome' },                               // D2 subtraction
      { col: 30, row: 37, id: 'minus_mole' },                                 // D2 comparison
      { col: 44, row: 23, id: 'counting_caterpillar', difficultyOverride: 2 },// D2 review (mid)
      { col: 14, row: 37, id: 'number_gnome',          difficultyOverride: 1 },// D1 south guard
    ],

    boss: 'subtraction_witch',
    bossName: 'The Subtraction Witch',
    description: 'A cheerful starting village! Solve addition and subtraction problems to help Mimi on her journey.',
    npcHint: 'Add the numbers together to find the total!',
  },
  {
    id: 1,
    name: 'Meadow Maze',
    subtitle: 'Grades 4–5 · Multiplication',
    mathTopic: 'multiplication',
    unlocked: false,
    floorColor: 0x5FA827,
    wallColor: 0x4A7A1E,
    accentColor: 0x90EE90,
    bgColor: 0x5FA827,
    floorTile: 'floor_grass',
    wallTile: 'wall_brick',
    mimiStart: { col: 4, row: 23 },
    npcTile:   { col: 6, row: 26 },
    chestTile: { col: 65, row: 44 },
    bossTile:  { col: 66, row: 5 },

    // ── Enemies: 6 — 3 native + 3 hard reviews from R0 ──────────────────
    enemySpawns: [
      { col: 20, row: 10, id: 'slime_pup' },                                  // D1 multTables
      { col: 52, row:  9, id: 'cactus_sprite' },                              // D2 multiplication
      { col: 30, row: 37, id: 'cloud_bully' },                                // D2 skipCounting
      { col: 44, row: 23, id: 'counting_caterpillar', difficultyOverride: 3 },// D3 addition review
      { col: 14, row: 37, id: 'number_gnome',          difficultyOverride: 3 },// D3 subtraction review
      { col: 57, row: 36, id: 'minus_mole',            difficultyOverride: 3 },// D3 comparison review
    ],

    boss: 'count_multiplico',
    bossName: 'Count Multiplico',
    description: 'Navigate the winding meadow paths and master multiplication to defeat the Count!',
    npcHint: 'Remember: multiplication is repeated addition!',
  },
  {
    id: 2,
    name: 'Desert Dunes',
    subtitle: 'Grades 4–5 · Division',
    mathTopic: 'division',
    unlocked: false,
    floorColor: 0xD4A044,
    wallColor: 0xAA7722,
    accentColor: 0xFFCC66,
    bgColor: 0xC8943C,
    floorTile: 'floor_sand',
    wallTile: 'wall_brick',
    mimiStart: { col: 4, row: 23 },
    npcTile:   { col: 6, row: 26 },
    chestTile: { col: 65, row: 44 },
    bossTile:  { col: 66, row: 5 },

    // ── Enemies: 6 — 3 native + 3 hard reviews from R1 ──────────────────
    enemySpawns: [
      { col: 20, row: 10, id: 'sand_scarab' },                                // D1 division
      { col: 52, row:  9, id: 'mummy_cat' },                                  // D2 mult review
      { col: 30, row: 37, id: 'mirage_fox' },                                 // D2 divisionWord
      { col: 44, row: 23, id: 'slime_pup',     difficultyOverride: 3 },       // D3 multTables review
      { col: 14, row: 37, id: 'cactus_sprite', difficultyOverride: 3 },       // D3 multiplication review
      { col: 57, row: 36, id: 'cloud_bully',   difficultyOverride: 3 },       // D3 skipCounting review
    ],

    boss: 'the_diviner',
    bossName: 'The Diviner',
    description: 'Trek through scorching sands and solve division mysteries to reveal the ancient Sphinx!',
    npcHint: 'Division is the opposite of multiplication — think backwards!',
  },
  {
    id: 3,
    name: 'Frostbite Cavern',
    subtitle: 'Grades 5–6 · Fractions & Decimals',
    mathTopic: 'fractions',
    unlocked: false,
    floorColor: 0x99C8DD,
    wallColor: 0x5588AA,
    accentColor: 0xCCEEFF,
    bgColor: 0x7AB4CC,
    floorTile: 'floor_snow',
    wallTile: 'wall_ice',
    mimiStart: { col: 4, row: 23 },
    npcTile:   { col: 6, row: 26 },
    chestTile: { col: 65, row: 44 },
    bossTile:  { col: 66, row: 5 },

    // ── Enemies: 6 — 3 native + 3 hard reviews from R2 ──────────────────
    enemySpawns: [
      { col: 20, row: 10, id: 'ice_frog' },                                   // D1 fractionCompare
      { col: 52, row:  9, id: 'snow_golem' },                                 // D2 fractionAdd
      { col: 30, row: 37, id: 'crystal_bat' },                                // D2 decimals
      { col: 44, row: 23, id: 'sand_scarab',  difficultyOverride: 3 },        // D3 division review
      { col: 14, row: 37, id: 'mummy_cat',    difficultyOverride: 3 },        // D3 mult review
      { col: 57, row: 36, id: 'mirage_fox',   difficultyOverride: 3 },        // D3 word-problem review
    ],

    boss: 'glacius',
    bossName: 'Glacius the Fraction Dragon',
    description: 'Brave the icy depths and master fractions and decimals to thaw the frozen dragon!',
    npcHint: 'To compare fractions, find a common denominator!',
  },
  {
    id: 4,
    name: 'Shadow Castle',
    subtitle: 'Grades 6–7 · Mixed Challenge',
    mathTopic: 'mixed',
    unlocked: false,
    floorColor: 0x3D2B5E,
    wallColor: 0x1E1232,
    accentColor: 0x9966FF,
    bgColor: 0x2D1B4E,
    floorTile: 'floor_stone',
    wallTile: 'wall_brick',
    mimiStart: { col: 4, row: 23 },
    npcTile:   { col: 6, row: 26 },
    chestTile: { col: 65, row: 44 },
    bossTile:  { col: 66, row: 5 },

    // ── Enemies: 6 — 3 native + 3 hard reviews from R3 ──────────────────
    enemySpawns: [
      { col: 20, row: 10, id: 'shadow_knight' },                              // D1 orderOfOps
      { col: 52, row:  9, id: 'ratio_raven' },                                // D2 percentages
      { col: 30, row: 37, id: 'percent_wraith' },                             // D2 ratiosProp
      { col: 44, row: 23, id: 'ice_frog',      difficultyOverride: 3 },       // D3 fractionCompare review
      { col: 14, row: 37, id: 'snow_golem',    difficultyOverride: 3 },       // D3 fractionAdd review
      { col: 57, row: 36, id: 'crystal_bat',   difficultyOverride: 3 },       // D3 decimals review
    ],

    boss: 'professor_negativus',
    bossName: 'Professor Negativus',
    description: 'Face the ultimate mixed challenge in the shadow realm — only the sharpest math mind will prevail!',
    npcHint: 'Remember order of operations: multiplication before addition!',
  },
];

export default REGIONS;
