const REGION = {
    id: 6,
    name: 'Shadow Castle',
    subtitle: 'Grade 5 · Percentages, Ratios & Operations',
    mathTopic: 'mixed',
    unlocked: false,
    floorColor: 0x3D2B5E,
    wallColor: 0x1E1232,
    accentColor: 0x9966FF,
    bgColor: 0x2D1B4E,
    backdropKey: 'backdrop_shadow',
    auraColor:   0xAA44FF,
    bossTint:    0xF8F0FF,
    floorTile: 'floor_stone',
    wallTile: 'wall_obsidian',
    mimiStart:     { col: 4, row: 26 },
    mimiStartPool: [
      { col: 4,  row: 26 }, { col: 4,  row: 40 },
      { col: 76, row: 26 }, { col: 40, row: 52 },
    ],
    npcTile:   { col: 6, row: 29 },
    chestTile: { col: 75, row: 50 },
    bossTile:  { col: 4, row: 5 },
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
        text:      'Well.  You actually made it.\nI designed those six kingdoms to be completely impassable.\nI am somewhere between impressed and professionally embarrassed.\n\nHow — HOW — did you get past the Diviner?\nHe\'s been doing that for centuries.',
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
  };

export default REGION;

