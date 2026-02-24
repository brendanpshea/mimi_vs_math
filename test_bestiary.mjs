/**
 * test_bestiary.mjs
 *
 * Validates all invariants that make the bestiary work correctly when
 * new regions and enemies are added to the data files.
 *
 * Run:  node test_bestiary.mjs
 *
 * Sections
 * ─────────
 * 1. buildCanonOrder — coverage, uniqueness, validity
 * 2. Ordering invariants — boss position, region ordering
 * 3. Dynamic labels — REGION_NAMES, GRADE_LABELS
 * 4. Colour table bounds — REGION_BG / REGION_ACCENT sizes in BestiaryScene.js
 * 5. GameState bestiary API round-trip
 */

import { readFileSync }    from 'fs';
import { fileURLToPath }   from 'url';
import { dirname, join }   from 'path';

// ── Mock browser globals before any game module is imported ────────────────
// GameState calls localStorage.setItem/getItem on save/load.
const _store = {};
globalThis.localStorage = {
  getItem:  key       => _store[key] ?? null,
  setItem:  (key, v)  => { _store[key] = v; },
  removeItem: key     => { delete _store[key]; },
};

// ── Imports ────────────────────────────────────────────────────────────────
import REGIONS              from './src/data/regions/index.js';
import ENEMIES              from './src/data/enemies.js';
import { buildCanonOrder }  from './src/data/bestiaryUtils.js';
import GameState            from './src/config/GameState.js';

// ── Helpers ────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function check(label, condition, extra = '') {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${label}${extra ? '  →  ' + extra : ''}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ── Pre-compute canonical order ────────────────────────────────────────────
const CANON_ORDER = buildCanonOrder(REGIONS, ENEMIES);

// ─────────────────────────────────────────────────────────────────────────────
// 1. buildCanonOrder — coverage, uniqueness, validity
// ─────────────────────────────────────────────────────────────────────────────
section('1. buildCanonOrder — coverage, uniqueness, validity');

// Count the enemies we expect (every ENEMIES key that has a truthy entry)
const allEnemyIds = Object.keys(ENEMIES);

check(
  'CANON_ORDER is an array',
  Array.isArray(CANON_ORDER),
);

check(
  'CANON_ORDER is non-empty',
  CANON_ORDER.length > 0,
  `got ${CANON_ORDER.length}`,
);

// Every entry in CANON_ORDER must be a valid ENEMIES key
{
  const invalid = CANON_ORDER.filter(id => !ENEMIES[id]);
  check(
    'All CANON_ORDER entries are valid ENEMIES keys',
    invalid.length === 0,
    invalid.length ? `unknown ids: ${invalid.join(', ')}` : '',
  );
}

// No duplicates
{
  const seen = new Set();
  const dupes = [];
  for (const id of CANON_ORDER) {
    if (seen.has(id)) dupes.push(id); else seen.add(id);
  }
  check(
    'CANON_ORDER has no duplicates',
    dupes.length === 0,
    dupes.length ? `duplicates: ${dupes.join(', ')}` : '',
  );
}

// Every enemy in ENEMIES should appear exactly once
{
  const orderSet   = new Set(CANON_ORDER);
  const missing    = allEnemyIds.filter(id => !orderSet.has(id));
  check(
    'Every ENEMIES key appears in CANON_ORDER',
    missing.length === 0,
    missing.length ? `missing: ${missing.join(', ')}` : '',
  );
}

check(
  'CANON_ORDER.length === Object.keys(ENEMIES).length',
  CANON_ORDER.length === allEnemyIds.length,
  `CANON_ORDER has ${CANON_ORDER.length}, ENEMIES has ${allEnemyIds.length}`,
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Ordering invariants — boss appears last in its region group, no early appearances
// ─────────────────────────────────────────────────────────────────────────────
section('2. Ordering invariants');

// Build a map from enemy id → first-index in CANON_ORDER for easy lookup
const orderIndex = {};
CANON_ORDER.forEach((id, i) => { orderIndex[id] = i; });

// For each region, check that its boss (if any) appears after all same-region
// non-boss enemies that are globally first-seen in this region.
for (let rIdx = 0; rIdx < REGIONS.length; rIdx++) {
  const region   = REGIONS[rIdx];
  const bossId   = region.boss;
  if (!bossId || !ENEMIES[bossId]) continue;

  const bossPos = orderIndex[bossId];
  check(
    `Region ${rIdx} boss "${bossId}" is in CANON_ORDER`,
    bossPos !== undefined,
  );

  // Collect the non-boss enemies whose first global appearance is this region
  for (const spawn of region.enemySpawns) {
    const id = spawn.id;
    if (!ENEMIES[id] || ENEMIES[id].isBoss) continue;
    if (orderIndex[id] === undefined) continue;   // not first in this region
    if (ENEMIES[id].region !== rIdx) continue;     // first-seen earlier

    // Skip if enemy's region field doesn't point here (may be first-seen via
    // another region's spawns object — the ordering rule is first global appearance)
    check(
      `Region ${rIdx}: non-boss "${id}" (pos ${orderIndex[id]}) appears before boss "${bossId}" (pos ${bossPos})`,
      orderIndex[id] < bossPos,
    );
  }
}

// Enemies whose ENEMIES[id].region === R should not appear before any enemy
// whose ENEMIES[id].region === R-1 (strict region ordering property).
// This uses the `region` field on each ENEMIES entry if it exists.
{
  const enemiesWithRegion = CANON_ORDER.filter(id => ENEMIES[id].region !== undefined);
  let outOfOrder = 0;
  for (let i = 0; i < enemiesWithRegion.length - 1; i++) {
    const a = enemiesWithRegion[i];
    const b = enemiesWithRegion[i + 1];
    if (ENEMIES[b].region < ENEMIES[a].region) {
      outOfOrder++;
      if (outOfOrder <= 3) {
        console.error(`  FAIL (detail): region order broken: "${a}" (r${ENEMIES[a].region}) before "${b}" (r${ENEMIES[b].region})`);
      }
    }
  }
  check(
    'Enemy region indices are non-decreasing across CANON_ORDER',
    outOfOrder === 0,
    outOfOrder ? `${outOfOrder} violation(s)` : '',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Dynamic labels — REGION_NAMES and GRADE_LABELS
// ─────────────────────────────────────────────────────────────────────────────
section('3. Dynamic labels');

const REGION_NAMES = REGIONS.map(r => r.name);
const GRADE_LABELS = REGIONS.map(r => r.subtitle.split(' · ')[0]);

check(
  'REGION_NAMES has an entry for every region',
  REGION_NAMES.length === REGIONS.length,
);

for (let i = 0; i < REGION_NAMES.length; i++) {
  check(
    `REGION_NAMES[${i}] is a non-empty string`,
    typeof REGION_NAMES[i] === 'string' && REGION_NAMES[i].trim().length > 0,
    `got: ${JSON.stringify(REGION_NAMES[i])}`,
  );
}

check(
  'GRADE_LABELS has an entry for every region',
  GRADE_LABELS.length === REGIONS.length,
);

for (let i = 0; i < GRADE_LABELS.length; i++) {
  check(
    `GRADE_LABELS[${i}] matches /^Grade \\d+/`,
    /^Grade \d+/.test(GRADE_LABELS[i]),
    `got: ${JSON.stringify(GRADE_LABELS[i])}`,
  );
}

// REGION_NAMES must all be distinct
{
  const nameSet  = new Set(REGION_NAMES);
  check(
    'All REGION_NAMES are distinct',
    nameSet.size === REGION_NAMES.length,
  );
}

// Spot-check known region names (update if region names ever change)
const EXPECTED_NAMES = [
  'Sunny Village',
  'Windmill Village',
  'Meadow Maze',
  'Desert Dunes',
  'Frostbite Cavern',
  'Shadow Castle',
];
for (let i = 0; i < EXPECTED_NAMES.length; i++) {
  if (REGIONS[i]) {
    check(
      `REGION_NAMES[${i}] === "${EXPECTED_NAMES[i]}"`,
      REGION_NAMES[i] === EXPECTED_NAMES[i],
      `got: ${JSON.stringify(REGION_NAMES[i])}`,
    );
  }
}

// Spot-check Grade labels (derived from actual region subtitle fields)
const EXPECTED_GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 3', 'Grade 4', 'Grade 5'];
for (let i = 0; i < EXPECTED_GRADES.length; i++) {
  if (REGIONS[i]) {
    check(
      `GRADE_LABELS[${i}] === "${EXPECTED_GRADES[i]}"`,
      GRADE_LABELS[i] === EXPECTED_GRADES[i],
      `got: ${JSON.stringify(GRADE_LABELS[i])}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Colour table bounds — verify REGION_BG / REGION_ACCENT in BestiaryScene.js
//    have at least REGIONS.length entries (source text inspection, no Phaser)
// ─────────────────────────────────────────────────────────────────────────────
section('4. Colour table bounds in BestiaryScene.js');

{
  const __dir = dirname(fileURLToPath(import.meta.url));
  const scenePath = join(__dir, 'src', 'scenes', 'BestiaryScene.js');
  const src = readFileSync(scenePath, 'utf8');

  // Count entries in REGION_BG array literal: matches hex literal 0x...
  const bgMatch = src.match(/const REGION_BG\s*=\s*\[([^\]]+)\]/);
  const accentMatch = src.match(/const REGION_ACCENT\s*=\s*\[([^\]]+)\]/);

  if (bgMatch) {
    const bgCount = (bgMatch[1].match(/0x[0-9A-Fa-f]+/g) || []).length;
    check(
      `REGION_BG has >= ${REGIONS.length} entries`,
      bgCount >= REGIONS.length,
      `found ${bgCount} hex literals, need ${REGIONS.length}`,
    );
  } else {
    check('REGION_BG array found in BestiaryScene.js', false, 'regex did not match');
  }

  if (accentMatch) {
    const accentCount = (accentMatch[1].match(/0x[0-9A-Fa-f]+/g) || []).length;
    check(
      `REGION_ACCENT has >= ${REGIONS.length} entries`,
      accentCount >= REGIONS.length,
      `found ${accentCount} hex literals, need ${REGIONS.length}`,
    );
  } else {
    check('REGION_ACCENT array found in BestiaryScene.js', false, 'regex did not match');
  }

  // Verify the scene imports buildCanonOrder and REGIONS (dynamic derivation is wired up)
  check(
    'BestiaryScene imports buildCanonOrder from bestiaryUtils',
    src.includes("from '../data/bestiaryUtils.js'"),
  );
  check(
    'BestiaryScene imports REGIONS from regions/index',
    src.includes("from '../data/regions/index.js'"),
  );
  check(
    'BestiaryScene uses CANON_ORDER = buildCanonOrder(REGIONS, ENEMIES)',
    /buildCanonOrder\s*\(\s*REGIONS\s*,\s*ENEMIES\s*\)/.test(src),
  );
  check(
    'BestiaryScene derives REGION_NAMES dynamically',
    /const REGION_NAMES\s*=\s*REGIONS\.map/.test(src),
  );
  check(
    'BestiaryScene derives GRADE_LABELS dynamically',
    /const GRADE_LABELS\s*=\s*REGIONS\.map/.test(src),
  );
  check(
    'BestiaryScene has DEFAULT_BG fallback constant',
    /const DEFAULT_BG\s*=/.test(src),
  );
  check(
    'BestiaryScene has DEFAULT_ACCENT fallback constant',
    /const DEFAULT_ACCENT\s*=/.test(src),
  );
  check(
    'BestiaryScene uses ?? DEFAULT_BG for colour access',
    src.includes('?? DEFAULT_BG'),
  );
  check(
    'BestiaryScene uses ?? DEFAULT_ACCENT for colour access',
    src.includes('?? DEFAULT_ACCENT'),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GameState bestiary API round-trip
// ─────────────────────────────────────────────────────────────────────────────
section('5. GameState bestiary API round-trip');

// Reset to a clean slate
GameState.reset();

const TEST_ID = CANON_ORDER[0];  // use first enemy in canonical order

// Initially: not seen, not defeated
check(
  `hasSeenEnemy("${TEST_ID}") is false before marking`,
  GameState.hasSeenEnemy(TEST_ID) === false,
);
check(
  `hasDefeatedEnemyType("${TEST_ID}") is false before marking`,
  GameState.hasDefeatedEnemyType(TEST_ID) === false,
);

// Mark seen
GameState.markEnemySeen(TEST_ID);
check(
  `hasSeenEnemy("${TEST_ID}") is true after markEnemySeen`,
  GameState.hasSeenEnemy(TEST_ID) === true,
);
check(
  `hasDefeatedEnemyType("${TEST_ID}") is still false after markEnemySeen only`,
  GameState.hasDefeatedEnemyType(TEST_ID) === false,
);

// Mark defeated (also implies seen)
const TEST_ID_2 = CANON_ORDER[1];
GameState.markEnemyDefeated(TEST_ID_2);
check(
  `hasDefeatedEnemyType("${TEST_ID_2}") is true after markEnemyDefeated`,
  GameState.hasDefeatedEnemyType(TEST_ID_2) === true,
);
check(
  `hasSeenEnemy("${TEST_ID_2}") is true after markEnemyDefeated (implies seen)`,
  GameState.hasSeenEnemy(TEST_ID_2) === true,
);

// Idempotency: marking seen again should not throw or reset defeated state
GameState.markEnemySeen(TEST_ID_2);
check(
  `hasDefeatedEnemyType("${TEST_ID_2}") stays true after redundant markEnemySeen`,
  GameState.hasDefeatedEnemyType(TEST_ID_2) === true,
);

// Reset clears everything
GameState.reset();
check(
  `hasSeenEnemy("${TEST_ID}") is false after reset`,
  GameState.hasSeenEnemy(TEST_ID) === false,
);
check(
  `hasDefeatedEnemyType("${TEST_ID_2}") is false after reset`,
  GameState.hasDefeatedEnemyType(TEST_ID_2) === false,
);

// Verify all CANON_ORDER ids can be passed to the API without throwing
let apiThrows = 0;
for (const id of CANON_ORDER) {
  try {
    GameState.markEnemySeen(id);
    GameState.markEnemyDefeated(id);
    const s = GameState.hasSeenEnemy(id);
    const d = GameState.hasDefeatedEnemyType(id);
    if (!s || !d) apiThrows++;  // should both be true after marking
  } catch (e) {
    apiThrows++;
    console.error(`  FAIL (API exception for "${id}"): ${e.message}`);
  }
}
check(
  'markEnemySeen + markEnemyDefeated + hasSeenEnemy + hasDefeatedEnemyType work for every CANON_ORDER id',
  apiThrows === 0,
  apiThrows ? `${apiThrows} id(s) failed` : '',
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
const total = passed + failed;
if (failed === 0) {
  console.log(`✓  All ${total} bestiary checks passed.`);
} else {
  console.log(`✗  ${failed} / ${total} bestiary checks FAILED.`);
  process.exitCode = 1;
}
