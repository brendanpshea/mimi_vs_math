const REGION = {
    id: 4,
    name: 'Desert Dunes',
    subtitle: 'Grade 3.5 · Division & Word Problems',
    unlocked: false,
    floorColor: 0xD4A044,
    wallColor: 0xAA7722,
    accentColor: 0xFFCC66,
    bgColor: 0xC8943C,
    backdropKey: 'backdrop_desert',
    auraColor:   0xFF8833,
    bossTint:    0xFFF5EE,
    floorTile: 'floor_sand',
    wallTile:  'wall_sandstone',

    colorGrade:      0xFFAA44,  // warm amber colour-grade overlay
    gateAccentColor: 0xFFCC44,  // gold sun-baked arch highlights on boss door
    weather: (camW, camH) => ({
      texture: '_wx_line', depth: 22,
      config: {
        x: -8, y: { min: 0, max: camH },
        speedX: { min: 340, max: 520 },
        speedY: { min: -18, max: 18 },
        lifespan: { min: 650, max: 1050 },
        quantity: 2, frequency: 30,
        alpha: { start: 0.45, end: 0 },
        scale: { start: 1.3, end: 0.5 },
        tint: 0xD4A844,
        rotate: 90,
        gravityY: 0, maxParticles: 0,
      },
    }),
    animatedEffects: [],

    // ── Map generation config ──────────────────────────────────────────────
    blockingTiles: [
      { key: 'decoration_rock' },
      { key: 'decoration_rock_b' },
    ],
    accentLayers: [
      { key: 'decoration_bones',      freq: 0.11, threshold: 0.82, seed: 500 },
      { key: 'decoration_tumbleweed', freq: 0.09, threshold: 0.84, seed: 600 },
    ],
    landmark: { key: 'landmark_lava_pool', tilesW: 5, tilesH: 4, blocking: true, margin: 2 },
    itemPool:  ['lucky_collar', 'fish_fossil'],

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

    // ── Sub-Levels ─────────────────────────────────────────────────────────
    levels: [
      {
        id: '4-1',
        name: 'Scorching Sands',
        mathTopic: 'division',
        colorGrade: 0xFFE0AA,
        weather: null,
        bossUnlockKills: 3,
        enemySpawns: [
          { id: 'sand_scarab' },
          { id: 'riddle_scarab' },
          { id: 'sand_scarab' }
        ]
      },
      {
        id: '4-2',
        name: 'The Oasis',
        mathTopic: 'division',
        colorGrade: 0xCCFFDD,
        weather: (camW, camH) => ({
          texture: '_wx_line', depth: 22,
          config: {
            x: -8, y: { min: 0, max: camH },
            speedX: { min: 340, max: 520 },
            speedY: { min: -18, max: 18 },
            lifespan: { min: 650, max: 1050 },
            quantity: 2, frequency: 30,
            alpha: { start: 0.45, end: 0 },
            scale: { start: 1.3, end: 0.5 },
            tint: 0xD4A844,
            rotate: 90,
            gravityY: 0, maxParticles: 0,
          },
        }),
        bossUnlockKills: 4,
        enemySpawns: [
          { id: 'mummy_cat' },
          { id: 'mirage_fox' },
          { id: 'mummy_cat' },
          { id: 'slime_pup', difficultyOverride: 3 } // Review
        ]
      },
      {
        id: '4-3',
        name: 'Ancient Ruins',
        mathTopic: 'missingNumber',
        colorGrade: 0xFFBBAA,
        weather: null,
        bossUnlockKills: 5,
        enemySpawns: [
          { id: 'riddle_scarab' },
          { id: 'mirage_fox' },
          { id: 'cactus_sprite', difficultyOverride: 3 }, // Review
          { id: 'cloud_bully', difficultyOverride: 3 },   // Review
          { id: 'double_bunny', difficultyOverride: 3 }   // Review
        ]
      },
      {
        id: '4-boss',
        name: 'The Diviner\'s Pyramid',
        mathTopic: 'division',
        colorGrade: 0x884422,
        weather: null,
        isBossLevel: true,
        bossUnlockKills: 0,
        enemySpawns: []
      }
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
  };

export default REGION;

