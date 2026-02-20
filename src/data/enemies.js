/**
 * Enemy definitions for all regions.
 *
 * spriteKey must match the key used in BootScene's asset loader.
 * mathTopic must match a topic in QuestionBank.
 * special: optional string describing unique battle behavior.
 *
 * ── Timer philosophy ──────────────────────────────────────────────────────
 * timerSeconds is tuned per enemy using three principles:
 *   1. GRADE LEVEL  — younger students (Region 0) need more wall-clock time
 *      even for "easy" questions; older students (Region 4) work faster.
 *   2. CONCEPT NOVELTY — the first region that introduces a concept gives a
 *      generous buffer; review appearances get less time.
 *   3. QUESTION FORMAT — word problems (divisionWord) need ~10–15 s of extra
 *      reading time on top of the raw calculation cost.
 *      Multi-step work (fractionAdd: LCD → convert → add → simplify) also
 *      gets extra time regardless of grade.
 *
 * Rough baselines used:
 *   Region 0 (Gr 1–3):  25 s simple calc, 22 s reading-heavy comparison
 *   Region 1 (Gr 3–5):  18–20 s tables/mult, 25 s sequence read+solve
 *   Region 2 (Gr 4–5):  20 s clean division, 16 s mult review, 30 s word
 *   Region 3 (Gr 5–6):  25 s fraction compare, 28 s fraction add, 20 s decimal
 *   Region 4 (Gr 6–7):  22 s order-of-ops, 20 s percentages, 22 s ratios
 *   Bosses: match the heaviest topic in their pool
 * ─────────────────────────────────────────────────────────────────────────
 */
const ENEMIES = {
  // ── Region 0: Sunny Village ──────────────────────────────────────────────
  counting_caterpillar: {
    id: 'counting_caterpillar',
    name: 'Counting Caterpillar',
    spriteKey: 'counting_caterpillar',
    region: 0,
    hp: 4,
    damage: 1,
    xp: 8,
    mathTopic: 'addition',         // pure addition
    difficulty: 1,
    timerSeconds: 25,              // Gr 1–2: youngest students, counting on fingers
    special: 'Addition problems only',
    color: 0x44CC66,
  },
  number_gnome: {
    id: 'number_gnome',
    name: 'Number Gnome',
    spriteKey: 'number_gnome',
    region: 0,
    hp: 5,
    damage: 1,
    xp: 10,
    mathTopic: 'subtraction',       // pure subtraction
    difficulty: 2,
    timerSeconds: 22,              // Gr 2–3: subtraction harder than addition
    special: 'Subtraction problems only',
    color: 0xFF6633,
  },
  minus_mole: {
    id: 'minus_mole',
    name: 'Minus Mole',
    spriteKey: 'minus_mole',
    region: 0,
    hp: 6,
    damage: 2,
    xp: 12,
    mathTopic: 'comparison',        // number comparison (new type)
    difficulty: 2,
    timerSeconds: 22,              // Gr 2–3: reading-heavy question format
    special: 'Number comparison problems',
    color: 0x886644,
  },
  subtraction_witch: {
    id: 'subtraction_witch',
    name: 'The Subtraction Witch',
    spriteKey: 'subtraction_witch',
    region: 0,
    hp: 20,
    damage: 2,
    xp: 40,
    mathTopic: 'addSub',
    mathTopics: ['addition', 'subtraction', 'comparison'],  // all Region 0 types
    difficulty: 3,
    timerSeconds: 22,              // Boss: matches heaviest R0 type (comparison)
    special: 'Boss: Addition, subtraction & comparisons',
    isBoss: true,
    color: 0x6633AA,
  },

  // ── Region 1: Meadow Maze ────────────────────────────────────────────────
  slime_pup: {
    id: 'slime_pup',
    name: 'Slime Pup',
    spriteKey: 'slime_pup',
    region: 1,
    hp: 4,
    damage: 1,
    xp: 10,
    mathTopic: 'multTables',        // 2×, 5×, 10× tables
    difficulty: 1,
    timerSeconds: 18,              // Gr 3–4: easy tables but brand-new concept
    special: 'Times-table problems (2s, 5s, 10s)',
    color: 0x44BB44,
  },
  cactus_sprite: {
    id: 'cactus_sprite',
    name: 'Cactus Sprite',
    spriteKey: 'cactus_sprite',
    region: 1,
    hp: 6,
    damage: 1,
    xp: 12,
    mathTopic: 'multiplication',    // full multiplication
    difficulty: 2,
    timerSeconds: 20,              // Gr 4–5: harder recall (6×7, 8×9 etc.)
    special: 'Harder multiplication problems',
    color: 0x228B22,
  },
  cloud_bully: {
    id: 'cloud_bully',
    name: 'Cloud Bully',
    spriteKey: 'cloud_bully',
    region: 1,
    hp: 5,
    damage: 2,
    xp: 14,
    mathTopic: 'skipCounting',      // fill-in-the-sequence (new type)
    difficulty: 2,
    timerSeconds: 25,              // Gr 4–5: read 5-item sequence + find pattern
    special: 'Skip counting sequences',
    color: 0x8899AA,
  },
  count_multiplico: {
    id: 'count_multiplico',
    name: 'Count Multiplico',
    spriteKey: 'count_multiplico',
    region: 1,
    hp: 30,
    damage: 2,
    xp: 60,
    mathTopic: 'multiplication',
    mathTopics: ['multTables', 'multiplication', 'skipCounting'],  // all Region 1 types
    difficulty: 3,
    timerSeconds: 20,              // Boss: matches heaviest R1 type (multiplication)
    special: 'Boss: Tables, multiplication & sequences',
    isBoss: true,
    color: 0xCC6600,
  },

  // ── Region 2: Desert Dunes ───────────────────────────────────────────────
  sand_scarab: {
    id: 'sand_scarab',
    name: 'Sand Scarab',
    spriteKey: 'sand_scarab',
    region: 2,
    hp: 5,
    damage: 1,
    xp: 12,
    mathTopic: 'division',          // clean division, no remainders
    difficulty: 1,
    timerSeconds: 20,              // Gr 4–5: division harder than multiplication
    special: 'Basic division problems',
    color: 0xAA8833,
  },
  mummy_cat: {
    id: 'mummy_cat',
    name: 'Mummy Cat',
    spriteKey: 'mummy_cat',
    region: 2,
    hp: 7,
    damage: 2,
    xp: 15,
    mathTopic: 'multiplication',    // ×  underpins ÷; wrong answer heals enemy
    difficulty: 2,
    timerSeconds: 16,              // Gr 4–5: review topic — full region of practice behind them
    special: 'Multiplication review; wrong answer heals enemy by 1',
    color: 0xDDCCAA,
  },
  mirage_fox: {
    id: 'mirage_fox',
    name: 'Mirage Fox',
    spriteKey: 'mirage_fox',
    region: 2,
    hp: 6,
    damage: 2,
    xp: 14,
    mathTopic: 'divisionWord',      // division word problems (new type)
    difficulty: 2,
    timerSeconds: 30,              // Gr 4–5: 3-line word problem — reading + solving
    special: 'Division word problems; answers shuffle at 5 s',
    color: 0xFF8844,
  },
  the_diviner: {
    id: 'the_diviner',
    name: 'The Diviner',
    spriteKey: 'the_diviner',
    region: 2,
    hp: 30,
    damage: 2,
    xp: 65,
    mathTopic: 'division',
    mathTopics: ['division', 'multiplication', 'divisionWord'],  // all Region 2 types
    difficulty: 3,
    timerSeconds: 22,              // Boss: elevated for word problem rounds
    special: 'Boss: Division, multiplication & word problems',
    isBoss: true,
    color: 0xCC9922,
  },

  // ── Region 3: Frostbite Cavern ───────────────────────────────────────────
  ice_frog: {
    id: 'ice_frog',
    name: 'Ice Frog',
    spriteKey: 'ice_frog',
    region: 3,
    hp: 6,
    damage: 1,
    xp: 14,
    mathTopic: 'fractionCompare',   // fraction comparison only
    difficulty: 1,
    timerSeconds: 25,              // Gr 5: brand-new concept, high cognitive load
    special: 'Fraction comparison problems',
    color: 0x66AACC,
  },
  snow_golem: {
    id: 'snow_golem',
    name: 'Snow Golem',
    spriteKey: 'snow_golem',
    region: 3,
    hp: 8,
    damage: 2,
    xp: 16,
    mathTopic: 'fractionAdd',       // fraction addition & subtraction
    difficulty: 2,
    timerSeconds: 28,              // Gr 5–6: find LCD → convert → add → simplify
    special: 'Fraction addition & subtraction',
    color: 0xCCEEFF,
  },
  crystal_bat: {
    id: 'crystal_bat',
    name: 'Crystal Bat',
    spriteKey: 'crystal_bat',
    region: 3,
    hp: 7,
    damage: 2,
    xp: 15,
    mathTopic: 'decimals',          // decimal operations (new type)
    difficulty: 2,
    timerSeconds: 20,              // Gr 5–6: easier than fractions, but still grade 5
    special: 'Decimal problems',
    color: 0xAA88FF,
  },
  glacius: {
    id: 'glacius',
    name: 'Glacius the Fraction Dragon',
    spriteKey: 'glacius',
    region: 3,
    hp: 30,
    damage: 2,
    xp: 70,
    mathTopic: 'fractions',
    mathTopics: ['fractionCompare', 'fractionAdd', 'decimals'],  // all Region 3 types
    difficulty: 3,
    timerSeconds: 25,              // Boss: elevated for fraction addition rounds
    special: 'Boss: Fraction compare, addition & decimals',
    isBoss: true,
    color: 0x44BBEE,
  },

  // ── Region 4: Shadow Castle ──────────────────────────────────────────────
  shadow_knight: {
    id: 'shadow_knight',
    name: 'Shadow Knight',
    spriteKey: 'shadow_knight',
    region: 4,
    hp: 8,
    damage: 2,
    xp: 18,
    mathTopic: 'orderOfOps',        // order of operations
    difficulty: 1,
    timerSeconds: 22,              // Gr 6–7: PEMDAS still new; must parse carefully
    special: 'Order of operations problems',
    color: 0x334455,
  },
  ratio_raven: {
    id: 'ratio_raven',
    name: 'Ratio Raven',
    spriteKey: 'ratio_raven',
    region: 4,
    hp: 9,
    damage: 2,
    xp: 20,
    mathTopic: 'percentages',       // percentage calculations
    difficulty: 2,
    timerSeconds: 20,              // Gr 6–7: older faster students; practiced calculation
    special: 'Percentage problems',
    color: 0x221133,
  },
  percent_wraith: {
    id: 'percent_wraith',
    name: 'Percent Wraith',
    spriteKey: 'percent_wraith',
    region: 4,
    hp: 10,
    damage: 2,
    xp: 22,
    mathTopic: 'ratiosProp',        // ratios & proportions (new type)
    difficulty: 2,
    timerSeconds: 22,              // Gr 6–7: setting up a proportion takes deliberate thought
    special: 'Ratio & proportion problems',
    color: 0x6644AA,
  },
  fenwick: {
    id: 'fenwick',
    name: 'Fenwick the Sly Fox',
    spriteKey: 'fenwick',
    region: 4,
    hp: 40,
    damage: 3,
    xp: 100,
    mathTopic: 'mixed',
    mathTopics: ['orderOfOps', 'percentages', 'ratiosProp'],  // all Region 4 types
    difficulty: 3,
    timerSeconds: 22,              // Final boss: tense but fair — matches heaviest R4 type
    special: 'Boss: Order of ops, percentages & ratios',
    isBoss: true,
    color: 0x220044,
  },
};

export default ENEMIES;
