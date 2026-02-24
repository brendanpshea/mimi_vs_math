/**
 * Enemy definitions for all regions.
 *
 * spriteKey must match the key used in BootScene's asset loader.
 * mathTopic must match a topic in QuestionBank.
 * special: optional string describing unique battle behavior.
 *
 * ── Field defaults ────────────────────────────────────────────────────────
 * hp        defaults to 8.  Only include when different.
 * damage    defaults to 1.  Only include when different.
 * baseTier  (1–3) minimum adaptive-difficulty floor.  Omit when 1 (default).
 *           Bosses always tier 3.
 * timerScale multiplies the topic's canonical TOPIC_TIMERS value in BattleScene.
 *           Omit when 1.0 (default — uses topic default exactly).
 *           Examples: 1.2 gives 20 % extra time; 0.9 trims 10 %.
 * Region is derived at runtime via buildEnemyRegionMap() in bestiaryUtils.js.
 * xp is not stored here — it was never used in gameplay.
 *
 * bio: 1–2 sentence bestiary description shown on the enemy card.
 */
const ENEMIES = {
  // ── Region 0: Sunny Village ──────────────────────────────────────────────
  counting_caterpillar: {
    id: 'counting_caterpillar',
    name: 'Counting Caterpillar',
    mathTopic: 'addition',
    bio: 'A cheerful caterpillar who counts on all one hundred of its legs — which works fine until the numbers get bigger than its shoe size. Loves addition, but anything beyond ten gets a little wobbly.',
  },
  number_gnome: {
    id: 'number_gnome',
    name: 'Number Gnome',
    mathTopic: 'subtraction',
    bio: 'A grumpy little gnome who sneaks behind bushes and subtracts things when nobody is watching. His favourite trick is making the bigger number disappear just when you need it most.',
  },
  minus_mole: {
    id: 'minus_mole',
    name: 'Minus Mole',
    damage: 2,
    mathTopic: 'comparison',
    timerScale: 1.2,   // word-problem comparisons need extra reading time for Grade 1
    bio: 'A near-sighted mole who tunnels through the number line, pressing her magnifying glass against every digit she finds. She compares everything underground — the trouble is, she frequently gets "bigger" and "smaller" mixed up.',
  },
  number_bee: {
    id: 'number_bee',
    name: 'Number Bee',
    mathTopic: 'comparison',
    bio: 'An industrious bee who collects numbers and sorts them by size inside her honeycomb hive. She is very fast at ordering small sets, but large numbers make her antennae vibrate uncontrollably.',
  },
  subtraction_witch: {
    id: 'subtraction_witch',
    name: 'The Subtraction Witch',
    hp: 20,
    damage: 2,
    mathTopic: 'addSub',
    mathTopics: ['addition', 'subtraction', 'comparison'],
    baseTier: 3,
    isBoss: true,
    bio: 'The wicked overseer of Sunny Village, who has cast a spell of numerical confusion across the meadow. She hurls addition, subtraction, and comparison problems all at once — defeat her and the village will finally be able to count its apples in peace.',
  },

  // ── Region 1: Windmill Village ──────────────────────────────────────────
  gear_gnome: {
    id: 'gear_gnome',
    name: 'Gear Gnome',
    mathTopic: 'placeValue',
    bio: 'A clockwork tinkerer obsessed with putting every digit in its proper place — tens here, ones there, and absolutely no mixing. Mess up the place value and he will dismantle your answer with a tiny wrench.',
  },
  windmill_sprite: {
    id: 'windmill_sprite',
    name: 'Windmill Sprite',
    mathTopic: 'addCarry',
    bio: 'A breezy fairy who dances between the windmill blades, leaving carrying operations scattered in her wake. She giggles every time a student forgets to carry the one.',
  },
  harvest_scarecrow: {
    id: 'harvest_scarecrow',
    name: 'Harvest Scarecrow',
    damage: 2,
    mathTopic: 'subBorrow',
    baseTier: 2,
    bio: 'A creaky old scarecrow who guards the harvest by demanding you borrow from the tens column before you subtract. Students who skip the borrowing step find their answers crow-pecked to bits.',
  },
  counting_crow: {
    id: 'counting_crow',
    name: 'Counting Crow',
    mathTopic: 'rounding',
    bio: 'A clever crow who rounds every number he touches — up, down, to the nearest ten, to the nearest hundred. He insists that approximate answers are more elegant than exact ones, and he will fight you on this.',
  },
  grand_miller: {
    id: 'grand_miller',
    name: 'Grand Miller',
    hp: 20,
    damage: 2,
    mathTopic: 'addCarry',
    mathTopics: ['placeValue', 'addCarry', 'subBorrow', 'rounding'],
    baseTier: 3,
    isBoss: true,
    bio: 'The ancient master of the great windmill, who has ground wheat — and incorrect answers — to dust for three hundred years. He demands place-value precision, flawless carrying, perfect borrowing, and now rounded estimates before he will let anyone pass.',
  },

  // ── Region 2: Meadow Maze ────────────────────────────────────────────────
  slime_pup: {
    id: 'slime_pup',
    name: 'Slime Pup',
    mathTopic: 'multTables',
    bio: 'A bubbly little slime who can only count by 2s, 5s, and 10s — and is very proud of it. Its multiplication skills are limited to the easy tables, but it will bounce on you repeatedly until you answer correctly.',
  },
  cactus_sprite: {
    id: 'cactus_sprite',
    name: 'Cactus Sprite',
    mathTopic: 'multiplication',
    baseTier: 2,
    bio: 'A spiky desert spirit who fires multiplication facts like needles from her fingertips. The trickier combos — 7×8, 6×9, 8×8 — are her absolute favourites.',
  },
  cloud_bully: {
    id: 'cloud_bully',
    name: 'Cloud Bully',
    damage: 2,
    mathTopic: 'skipCounting',
    baseTier: 2,
    bio: 'A moody stormcloud who drifts through the Meadow Maze demanding you complete its number sequences. Identify the pattern, find the blank, and do it quickly — or it rains.',
  },
  double_bunny: {
    id: 'double_bunny',
    name: 'Double Bunny',
    mathTopic: 'doubling',
    bio: 'A hyperactive bunny who doubles everything it touches and immediately halves it back again just to watch you scramble. The problems are simple — if you can keep up with the speed.',
  },
  count_multiplico: {
    id: 'count_multiplico',
    name: 'Count Multiplico',
    hp: 30,
    damage: 2,
    mathTopic: 'multiplication',
    mathTopics: ['multTables', 'multiplication', 'skipCounting', 'doubling'],
    baseTier: 3,
    timerScale: 1.15,  // D3 multiplication can reach 2-digit × 1-digit; Grade 2 audience
    isBoss: true,
    bio: 'The legendary lord of the Meadow Maze, whose four arms hurl multiplication tables, skip sequences, doubles, and full-blown products all at once. He is the final exam for everything multiplication.',
  },

  // ── Region 3: Mycelium Hollow ──────────────────────────────────────────
  fungus_toad: {
    id: 'fungus_toad',
    name: 'Fungus Toad',
    mathTopic: 'multiDigitMult',
    bio: 'A warty toad who lurks in the mushroom fog, demanding teen-times-one-digit products with a wide, unblinking stare. He will sit there all day until you correctly split the tens and ones.',
  },
  mycelium_wisp: {
    id: 'mycelium_wisp',
    name: 'Mycelium Wisp',
    mathTopic: 'factorPairs',
    bio: 'A glowing spore-wisp that drifts through the dark hollow, whispering equations with a number mysteriously missing. It already knows the answer — the question is whether you do.',
  },
  spore_puff: {
    id: 'spore_puff',
    name: 'Spore Puff',
    damage: 2,
    mathTopic: 'area',
    bio: 'An unstable puffball that measures everything it touches — length, width, square units, the works. It has calculated the exact area of every surface in Mycelium Hollow and will quiz you on rectangles until you beg for mercy.',
  },
  queen_sporella: {
    id: 'queen_sporella',
    name: 'Queen Sporella',
    hp: 35,
    damage: 2,
    mathTopic: 'multiDigitMult',
    mathTopics: ['multiDigitMult', 'factorPairs', 'area', 'multTables', 'doubling'],
    baseTier: 3,
    isBoss: true,
    bio: 'The fungal queen of Mycelium Hollow, who rules from a throne of giant mushrooms and summons multi-digit multiplication, factor pairs, area calculations, and old table challenges in one overwhelming spore storm. Clear the air or face her wrath.',
  },

  // ── Region 4: Desert Dunes ───────────────────────────────────────────
  sand_scarab: {
    id: 'sand_scarab',
    name: 'Sand Scarab',
    mathTopic: 'division',
    bio: 'A gleaming desert beetle who rolls perfectly divisible numbers across the sand and demands you split them cleanly. He does not tolerate remainders, not even small ones.',
  },
  mummy_cat: {
    id: 'mummy_cat',
    name: 'Mummy Cat',
    hp: 7,
    damage: 2,
    mathTopic: 'multiplication',
    baseTier: 2,
    timerScale: 0.9,   // review context; tighter than a first-introduction
    bio: 'An ancient feline wrapped in papyrus who tests your multiplication knowledge before letting you divide anything. She knows that inside every division problem, a multiplication fact is hiding.',
  },
  mirage_fox: {
    id: 'mirage_fox',
    name: 'Mirage Fox',
    damage: 2,
    mathTopic: 'divisionWord',
    baseTier: 2,
    bio: 'A trickster fox who conjures division word problems that shimmer like mirages in the desert heat. Read every word carefully — she loves to hide the real question inside a sentence full of distractions.',
  },
  riddle_scarab: {
    id: 'riddle_scarab',
    name: 'Riddle Scarab',
    damage: 2,
    mathTopic: 'missingNumber',
    bio: 'A cryptic scarab who carves equations into sandstone with a blank square where a number should be, then waits with infinite patience for the correct answer. Patient, precise, and entirely unamused by wrong guesses.',
  },
  the_diviner: {
    id: 'the_diviner',
    name: 'The Diviner',
    hp: 30,
    damage: 2,
    mathTopic: 'division',
    mathTopics: ['division', 'multiplication', 'divisionWord', 'missingNumber'],
    baseTier: 3,
    timerScale: 1.1,   // word-problem rounds need slightly more time than the division default
    isBoss: true,
    bio: 'The oracle of the Desert Dunes, who has spent centuries dividing the sands into equal portions. She sees the answer before you have finished reading the question, and she expects you to be nearly as fast.',
  },

  // ── Region 5: Frostbite Cavern ───────────────────────────────────────────
  ice_frog: {
    id: 'ice_frog',
    name: 'Ice Frog',
    mathTopic: 'fractionCompare',
    bio: 'A frost-covered frog who slides fraction comparisons across the ice and watches them spin. Which fraction is bigger? It is never as obvious as it looks, especially at sub-zero temperatures.',
  },
  snow_golem: {
    id: 'snow_golem',
    name: 'Snow Golem',
    damage: 2,
    mathTopic: 'fractionAdd',
    baseTier: 2,
    bio: 'A lumbering ice giant who will not let you add fractions until you have found a common denominator. Slow to move, extremely quick to punish anyone who skips that step.',
  },
  crystal_bat: {
    id: 'crystal_bat',
    name: 'Crystal Bat',
    hp: 7,
    damage: 2,
    mathTopic: 'decimals',
    baseTier: 2,
    bio: 'A glittering bat who echolocates decimal problems through the dark cavern and measures the echo to one-tenth precision. Miss the decimal point and her sonar will bounce your answer right back.',
  },
  glacius: {
    id: 'glacius',
    name: 'Glacius the Fraction Dragon',
    hp: 30,
    damage: 2,
    mathTopic: 'fractions',
    mathTopics: ['fractionCompare', 'fractionAdd', 'decimals'],
    baseTier: 3,
    isBoss: true,
    bio: 'The ancient ice dragon who has guarded Frostbite Cavern since the first winter. His frozen breath turns fractions, comparisons, and decimals into a blizzard of cold hard math — master them all or remain frozen forever.',
  },

  // ── Region 6: Shadow Castle ──────────────────────────────────────────────
  shadow_knight: {
    id: 'shadow_knight',
    name: 'Shadow Knight',
    damage: 2,
    mathTopic: 'orderOfOps',
    bio: 'An armored specter who follows the strict law of PEMDAS with religious devotion — parentheses first, multiplication before addition, always. Break the order and he will break your answer.',
  },
  ratio_raven: {
    id: 'ratio_raven',
    name: 'Ratio Raven',
    hp: 9,
    damage: 2,
    mathTopic: 'percentages',
    baseTier: 2,
    bio: 'A sharp-eyed raven who picks percentage problems apart with surgical precision. Ten percent? Eighty-five percent? She calculates each one faster than most students can find a pencil.',
  },
  percent_wraith: {
    id: 'percent_wraith',
    name: 'Percent Wraith',
    hp: 10,
    damage: 2,
    mathTopic: 'ratiosProp',
    baseTier: 2,
    bio: 'A ghostly figure draped in proportion formulas who drifts through the castle halls setting up ratios with one value missing. Cross-multiply correctly or the wraith will float right through your score.',
  },
  fenwick: {
    id: 'fenwick',
    name: 'Fenwick the Sly Fox',
    hp: 40,
    damage: 3,
    mathTopic: 'orderOfOps',
    mathTopics: ['orderOfOps', 'percentages', 'ratiosProp'],
    baseTier: 3,
    timerScale: 1.15,  // D3 reverse-percentage format needs extra read time
    isBoss: true,
    bio: 'The cunning ruler of Shadow Castle, who has spent centuries weaving order-of-operations puzzles, reverse-percentage traps, and ratio mazes into a final labyrinth of mathematics. The cleverest students call him a challenge; everyone else calls him impossible.',
  },
};

export default ENEMIES;
