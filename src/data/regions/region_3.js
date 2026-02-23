const REGION = {
    id: 3,
    name: 'Frostbite Cavern',
    subtitle: 'Grade 4 · Fractions & Decimals',
    mathTopic: 'fractions',
    unlocked: false,
    floorColor: 0x99C8DD,
    wallColor: 0x5588AA,
    accentColor: 0xCCEEFF,
    bgColor: 0x7AB4CC,
    backdropKey: 'backdrop_ice',
    auraColor:   0x44CCFF,
    bossTint:    0xEEF8FF,
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
  };

export default REGION;

