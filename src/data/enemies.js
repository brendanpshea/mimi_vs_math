/**
 * Enemy definitions for all regions.
 *
 * spriteKey must match the key used in BootScene's asset loader.
 * mathTopic must match a topic in QuestionBank.
 * special: optional string describing unique battle behavior.
 *
 * â”€â”€ Timer philosophy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * timerSeconds is tuned per enemy using three principles:
 *   1. GRADE LEVEL  â€” younger students (Region 0) need more wall-clock time
 *      even for "easy" questions; older students (Region 4) work faster.
 *   2. CONCEPT NOVELTY â€” the first region that introduces a concept gives a
 *      generous buffer; review appearances get less time.
 *   3. QUESTION FORMAT â€” word problems (divisionWord) need ~10â€“15 s of extra
 *      reading time on top of the raw calculation cost.
 *      Multi-step work (fractionAdd: LCD â†’ convert â†’ add â†’ simplify) also
 *      gets extra time regardless of grade.
 *
 * Rough baselines used:
 *   Region 0 (Gr 1):  25 s simple calc, 22 s reading-heavy comparison
 *   Region 1 (Gr 2):  22 s tables/mult, 28 s sequence read+solve
 *   Region 2 (Gr 3):  20 s clean division, 20 s mult review, 30 s word
 *   Region 3 (Gr 4):  25 s fraction compare, 28 s fraction add, 20 s decimal
 *   Region 4 (Gr 5):  22 s order-of-ops, 20 s percentages, 22 s ratios
 *   Bosses: match the heaviest topic in their pool; extra time when
 *           D3 can produce multi-digit multiplication or reverse-percentage
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */
const ENEMIES = {
  // â”€â”€ Region 0: Sunny Village â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  counting_caterpillar: {
    id: 'counting_caterpillar',
    name: 'Counting Caterpillar',
    region: 0,
    hp: 6,
    damage: 1,
    xp: 8,
    mathTopic: 'addition',         // pure addition
    difficulty: 1,
    timerSeconds: 25,              // Gr 1: youngest students, counting on fingers
    color: 0x44CC66,
  },
  number_gnome: {
    id: 'number_gnome',
    name: 'Number Gnome',
    region: 0,
    hp: 6,
    damage: 1,
    xp: 10,
    mathTopic: 'subtraction',       // pure subtraction
    difficulty: 2,
    timerSeconds: 22,              // Gr 1: subtraction harder than addition
    color: 0xFF6633,
  },
  minus_mole: {
    id: 'minus_mole',
    name: 'Minus Mole',
    region: 0,
    hp: 6,
    damage: 2,
    xp: 12,
    mathTopic: 'comparison',        // number comparison (new type)
    difficulty: 2,
    timerSeconds: 26,              // Gr 1: reading-heavy word problem; +8 s wordProblem bonus â†’ ~34 s total
    color: 0x886644,
  },
  number_bee: {
    id: 'number_bee',
    name: 'Number Bee',
    region: 0,
    hp: 6,
    damage: 1,
    xp: 10,
    mathTopic: 'comparison',               // number ordering / comparison
    difficulty: 1,
    timerSeconds: 22,                      // Gr 1: pick biggest/smallest from a set
    color: 0xFFAA22,
  },
  subtraction_witch: {
    id: 'subtraction_witch',
    name: 'The Subtraction Witch',
    region: 0,
    hp: 20,
    damage: 2,
    xp: 40,
    mathTopic: 'addSub',
    mathTopics: ['addition', 'subtraction', 'comparison'],  // all Region 0 types
    difficulty: 3,
    timerSeconds: 22,              // Boss: matches heaviest R0 type (comparison)
    isBoss: true,
    color: 0x6633AA,
  },

  // â”€â”€ Region 1: Meadow Maze â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  slime_pup: {
    id: 'slime_pup',
    name: 'Slime Pup',
    region: 1,
    hp: 6,
    damage: 1,
    xp: 10,
    mathTopic: 'multTables',        // 2Ã—, 5Ã—, 10Ã— tables
    difficulty: 1,
    timerSeconds: 22,              // Gr 2: brand-new concept â€” fingers-on-the-table moment
    color: 0x44BB44,
  },
  cactus_sprite: {
    id: 'cactus_sprite',
    name: 'Cactus Sprite',
    region: 1,
    hp: 6,
    damage: 1,
    xp: 12,
    mathTopic: 'multiplication',    // full multiplication
    difficulty: 2,
    timerSeconds: 22,              // Gr 2: 8Ã—9, 7Ã—6 type combos need real recall time
    color: 0x228B22,
  },
  cloud_bully: {
    id: 'cloud_bully',
    name: 'Cloud Bully',
    region: 1,
    hp: 6,
    damage: 2,
    xp: 14,
    mathTopic: 'skipCounting',      // fill-in-the-sequence (new type)
    difficulty: 2,
    timerSeconds: 28,              // Gr 2: read all 5 items, find step, compute blank â€” 3 steps
    color: 0x8899AA,
  },
  double_bunny: {
    id: 'double_bunny',
    name: 'Double Bunny',
    region: 1,
    hp: 6,
    damage: 1,
    xp: 12,
    mathTopic: 'doubling',                // doubling & halving (new type)
    difficulty: 1,
    timerSeconds: 20,                     // Gr 2: simple double/half
    color: 0x88DD44,
  },
  count_multiplico: {
    id: 'count_multiplico',
    name: 'Count Multiplico',
    region: 1,
    hp: 30,
    damage: 2,
    xp: 60,
    mathTopic: 'multiplication',
    mathTopics: ['multTables', 'multiplication', 'skipCounting', 'doubling'],  // all Region 1 types
    difficulty: 3,
    timerSeconds: 25,              // Boss: D3 can draw 2-digitÃ—1-digit mult; Grade 2 audience
    isBoss: true,
    color: 0xCC6600,
  },

  // â”€â”€ Region 2: Desert Dunes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  sand_scarab: {
    id: 'sand_scarab',
    name: 'Sand Scarab',
    region: 2,
    hp: 6,
    damage: 1,
    xp: 12,
    mathTopic: 'division',          // clean division, no remainders
    difficulty: 1,
    timerSeconds: 20,              // Gr 3: division harder than multiplication
    color: 0xAA8833,
  },
  mummy_cat: {
    id: 'mummy_cat',
    name: 'Mummy Cat',
    region: 2,
    hp: 7,
    damage: 2,
    xp: 15,
    mathTopic: 'multiplication',    // Ã—  underpins Ã·; wrong answer heals enemy
    difficulty: 2,
    timerSeconds: 20,              // Gr 3: review, but 7Ã—8 isn't instant â€” don't punish recall
    color: 0xDDCCAA,
  },
  mirage_fox: {
    id: 'mirage_fox',
    name: 'Mirage Fox',
    region: 2,
    hp: 6,
    damage: 2,
    xp: 14,
    mathTopic: 'divisionWord',      // division word problems (new type)
    difficulty: 2,
    timerSeconds: 22,              // Gr 3: +8 s word-problem bonus applied in BattleScene â†’ ~30 s total
    color: 0xFF8844,
  },
  riddle_scarab: {
    id: 'riddle_scarab',
    name: 'Riddle Scarab',
    region: 2,
    hp: 6,
    damage: 2,
    xp: 14,
    mathTopic: 'missingNumber',            // missing number problems (new type)
    difficulty: 1,
    timerSeconds: 22,                      // Gr 3: solve for unknown
    color: 0xDD8833,
  },
  the_diviner: {
    id: 'the_diviner',
    name: 'The Diviner',
    region: 2,
    hp: 30,
    damage: 2,
    xp: 65,
    mathTopic: 'division',
    mathTopics: ['division', 'multiplication', 'divisionWord', 'missingNumber'],  // all Region 2 types
    difficulty: 3,
    timerSeconds: 22,              // Boss: elevated for word problem rounds
    isBoss: true,
    color: 0xCC9922,
  },

  // â”€â”€ Region 3: Frostbite Cavern â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ice_frog: {
    id: 'ice_frog',
    name: 'Ice Frog',
    region: 3,
    hp: 6,
    damage: 1,
    xp: 14,
    mathTopic: 'fractionCompare',   // fraction comparison only
    difficulty: 1,
    timerSeconds: 25,              // Gr 4: brand-new concept, high cognitive load
    color: 0x66AACC,
  },
  snow_golem: {
    id: 'snow_golem',
    name: 'Snow Golem',
    region: 3,
    hp: 8,
    damage: 2,
    xp: 16,
    mathTopic: 'fractionAdd',       // fraction addition & subtraction
    difficulty: 2,
    timerSeconds: 28,              // Gr 4: find LCD â†’ convert â†’ add â†’ simplify
    color: 0xCCEEFF,
  },
  crystal_bat: {
    id: 'crystal_bat',
    name: 'Crystal Bat',
    region: 3,
    hp: 7,
    damage: 2,
    xp: 15,
    mathTopic: 'decimals',          // decimal operations (new type)
    difficulty: 2,
    timerSeconds: 20,              // Gr 4: easier than fractions, decimal tenths intro
    color: 0xAA88FF,
  },
  glacius: {
    id: 'glacius',
    name: 'Glacius the Fraction Dragon',
    region: 3,
    hp: 30,
    damage: 2,
    xp: 70,
    mathTopic: 'fractions',
    mathTopics: ['fractionCompare', 'fractionAdd', 'decimals'],  // all Region 3 types
    difficulty: 3,
    timerSeconds: 25,              // Boss: elevated for fraction addition rounds
    isBoss: true,
    color: 0x44BBEE,
  },

  // â”€â”€ Region 4: Shadow Castle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  shadow_knight: {
    id: 'shadow_knight',
    name: 'Shadow Knight',
    region: 4,
    hp: 8,
    damage: 2,
    xp: 18,
    mathTopic: 'orderOfOps',        // order of operations
    difficulty: 1,
    timerSeconds: 22,              // Gr 5: PEMDAS still new; must parse carefully
    color: 0x334455,
  },
  ratio_raven: {
    id: 'ratio_raven',
    name: 'Ratio Raven',
    region: 4,
    hp: 9,
    damage: 2,
    xp: 20,
    mathTopic: 'percentages',       // percentage calculations
    difficulty: 2,
    timerSeconds: 20,              // Gr 5: practiced calculation, moderate time needed
    color: 0x221133,
  },
  percent_wraith: {
    id: 'percent_wraith',
    name: 'Percent Wraith',
    region: 4,
    hp: 10,
    damage: 2,
    xp: 22,
    mathTopic: 'ratiosProp',        // ratios & proportions (new type)
    difficulty: 2,
    timerSeconds: 22,              // Gr 5: setting up a proportion takes deliberate thought
    color: 0x6644AA,
  },
  fenwick: {
    id: 'fenwick',
    name: 'Fenwick the Sly Fox',
    region: 4,
    hp: 40,
    damage: 3,
    xp: 100,
    mathTopic: 'orderOfOps',
    mathTopics: ['orderOfOps', 'percentages', 'ratiosProp'],  // all Region 4 types
    difficulty: 3,
    timerSeconds: 25,              // Final boss: D3 includes reverse-percentage format; needs extra read time
    isBoss: true,
    color: 0x220044,
  },
};

export default ENEMIES;
