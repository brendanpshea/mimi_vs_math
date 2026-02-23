const REGION = {
    id: 3,
    name: 'Desert Dunes',
    subtitle: 'Grade 3 · Multiplication & Division',
    mathTopic: 'division',
    unlocked: false,
    floorColor: 0xD4A044,
    wallColor: 0xAA7722,
    accentColor: 0xFFCC66,
    bgColor: 0xC8943C,
    backdropKey: 'backdrop_desert',
    auraColor:   0xFF8833,
    bossTint:    0xFFF5EE,
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
  };

export default REGION;

