/**
 * test_data.mjs
 * Data integrity, schema, and source-text contract tests.
 *
 * Catches:
 *   • Missing or mistyped fields in regions.js / enemies.js
 *   • Enemy ID cross-references (spawns and bosses referencing non-existent entries)
 *   • Map / walkability grid coverage gaps
 *   • Duplicate key positions within a region
 *   • Call-site contract violations — e.g. constructor parameter renames that
 *     leave stale bare variable references (direct cause of the regionName black screen)
 *
 * Run with:  node test_data.mjs
 */

import { readFileSync } from 'fs';
import REGIONS          from './src/data/regions/index.js';
import ENEMIES          from './src/data/enemies.js';
import MAPS, { WALK_GRIDS } from './src/data/maps.js';
import { MAP_COLS, MAP_ROWS, MAP_BORDER } from './src/data/ProceduralMap.js';

// ── Colour helpers (ANSI) ──────────────────────────────────────────────────
const G   = s => `\x1b[32m${s}\x1b[0m`;
const R   = s => `\x1b[31m${s}\x1b[0m`;
const B   = s => `\x1b[1m${s}\x1b[0m`;
const DIM = s => `\x1b[2m${s}\x1b[0m`;

let passed = 0, failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    console.log(`  ${G('✓')}  ${message}`);
    passed++;
  } else {
    console.error(`  ${R('✗')}  ${R(message)}`);
    if (detail) console.error(`       ${DIM(detail)}`);
    failed++;
  }
}

// ── Map bounds — sourced from ProceduralMap constants, never hand-typed ──────
const COLS = MAP_COLS, ROWS = MAP_ROWS, BORDER = MAP_BORDER;
const inBounds = ({ col, row }) =>
  col >= BORDER && col < COLS - BORDER &&
  row >= BORDER && row < ROWS - BORDER;

// ── Required region fields ─────────────────────────────────────────────────
const REQUIRED_REGION_FIELDS = [
  'id', 'name', 'subtitle', 'mathTopic', 'floorTile', 'wallTile',
  'mimiStart', 'npcTile', 'bossTile', 'enemySpawns',
  'boss', 'bossName', 'description', 'npcHint', 'bossIntro',
];

const TILE_FIELDS = ['mimiStart', 'npcTile', 'bossTile'];

// ══════════════════════════════════════════════════════════════════════════════
// 1.  Region schema
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n${B('── 1. Region schema ──')}`);

assert(Array.isArray(REGIONS) && REGIONS.length === 7,
  `regions.js exports 7 regions (got ${REGIONS?.length})`);  // bump when adding a region

for (const region of REGIONS) {
  const tag = `Region ${region.id} (${region.name ?? '?'})`;

  // id matches array position
  assert(region.id === REGIONS.indexOf(region),
    `${tag}: id (${region.id}) matches array index`);

  // Required fields present
  for (const field of REQUIRED_REGION_FIELDS) {
    assert(field in region,
      `${tag}: has required field "${field}"`);
  }

  // Tile positions are {col, row} and within map bounds
  for (const fieldName of TILE_FIELDS) {
    const tile = region[fieldName];
    const hasShape = tile && typeof tile.col === 'number' && typeof tile.row === 'number';
    assert(hasShape, `${tag}.${fieldName} has {col, row}`);
    if (hasShape) {
      assert(inBounds(tile),
        `${tag}.${fieldName} within map bounds`,
        `col:${tile.col} row:${tile.row} (valid range col 2–67, row 2–47)`);
    }
  }

  // enemySpawns is a non-empty array
  const spawns = region.enemySpawns;
  assert(Array.isArray(spawns) && spawns.length > 0,
    `${tag}: enemySpawns is non-empty array (${spawns?.length ?? 0} entries)`);

  // Each spawn has a valid id (col/row are assigned procedurally, not stored here)
  if (Array.isArray(spawns)) {
    for (const [i, spawn] of spawns.entries()) {
      assert(typeof spawn.id === 'string' && spawn.id.length > 0,
        `${tag}.enemySpawns[${i}] has a non-empty id string`,
        `got: ${JSON.stringify(spawn)}`);
    }
  }

  // bossIntro is an array with at least 2 panels (one per combatant)
  assert(Array.isArray(region.bossIntro) && region.bossIntro.length >= 2,
    `${tag}: bossIntro has ≥2 panels (${region.bossIntro?.length ?? 0})`);
}

// ══════════════════════════════════════════════════════════════════════════════
// 2.  Enemy cross-references
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n${B('── 2. Enemy cross-references ──')}`);

const enemyKeys = new Set(Object.keys(ENEMIES));

for (const region of REGIONS) {
  const tag = `Region ${region.id}`;

  // Boss must exist in enemies.js
  assert(enemyKeys.has(region.boss),
    `${tag}: boss "${region.boss}" exists in enemies.js`);

  // Every spawn id must exist in enemies.js
  if (Array.isArray(region.enemySpawns)) {
    for (const [i, spawn] of region.enemySpawns.entries()) {
      if (typeof spawn.id === 'string') {
        assert(enemyKeys.has(spawn.id),
          `${tag}.enemySpawns[${i}] id "${spawn.id}" exists in enemies.js`);
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 3.  Map and walk-grid coverage
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n${B('── 3. Map and walk-grid coverage ──')}`);

assert(Array.isArray(MAPS) && MAPS.length === REGIONS.length,
  `MAPS has one entry per region (${MAPS.length} / ${REGIONS.length})`);

assert(Array.isArray(WALK_GRIDS) && WALK_GRIDS.length === REGIONS.length,
  `WALK_GRIDS has one entry per region (${WALK_GRIDS.length} / ${REGIONS.length})`);

for (const region of REGIONS) {
  const id = region.id;

  assert(Array.isArray(MAPS[id]) && MAPS[id].length > 0,
    `MAPS[${id}] (${region.name}) is a non-empty decoration array`);

  assert(WALK_GRIDS[id] instanceof Set && WALK_GRIDS[id].size > 0,
    `WALK_GRIDS[${id}] (${region.name}) is a non-empty Set`);

  // Sanity: decoration array should have blocking items (walls) and non-blocking (accents)
  if (Array.isArray(MAPS[id])) {
    const blocking    = MAPS[id].filter(d => d.blocking).length;
    const nonBlocking = MAPS[id].filter(d => !d.blocking).length;
    assert(blocking > 0,
      `MAPS[${id}] contains blocking tiles (${blocking} found)`);
    assert(nonBlocking > 0,
      `MAPS[${id}] contains accent tiles (${nonBlocking} found)`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 4.  No duplicate key positions within a region
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n${B('── 4. No duplicate key positions ──')}`);

for (const region of REGIONS) {
  const tag  = `Region ${region.id} (${region.name})`;
  const seen = new Map();  // tileKey → field name (first occurrence)

  const keyPositions = [
    ...(region.mimiStart ? [{ field: 'mimiStart', ...region.mimiStart }] : []),
    ...(region.npcTile   ? [{ field: 'npcTile',   ...region.npcTile   }] : []),
    ...(region.bossTile  ? [{ field: 'bossTile',  ...region.bossTile  }] : []),
    // enemySpawns positions are procedurally assigned — not checked here
  ];

  for (const pos of keyPositions) {
    if (typeof pos.col !== 'number') continue;
    const k = `${pos.col},${pos.row}`;
    if (seen.has(k)) {
      assert(false,
        `${tag}: duplicate tile at (${pos.col},${pos.row}) — ${pos.field} vs ${seen.get(k)}`);
    } else {
      seen.set(k, pos.field);
    }
  }
  // If we get here with no duplicates, log a single pass
  assert(true, `${tag}: all ${seen.size} key positions are unique`);
}

// ══════════════════════════════════════════════════════════════════════════════
// 5.  Source-text call-site contracts
//
//  This section reads source files as plain text and checks that constructor
//  signatures and their internal usages remain consistent after refactors.
//  It is designed to catch exactly the class of bug that caused the black
//  screen: a constructor parameter was renamed (regionName → regionData) but
//  one internal usage still referenced the old bare variable name.
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n${B('── 5. Source-text call-site contracts ──')}`);

const src = path => readFileSync(path, 'utf8');

// ── 5a. HUD.js — no stale bare variable references in constructor ──────────
//
// The HUD constructor was refactored from (scene, regionName) to
// (scene, regionData).  Any remaining bare `regionName` reference inside the
// constructor body (other than the safe assignment `this.regionName = ...`) is
// a ReferenceError at runtime.
{
  const hudSrc = src('./src/ui/HUD.js');

  // Extract the constructor body using brace matching
  const ctorStart = hudSrc.indexOf('constructor(');
  let depth = 0, i = ctorStart, ctorClose = hudSrc.length;
  while (i < hudSrc.length) {
    if      (hudSrc[i] === '{') depth++;
    else if (hudSrc[i] === '}') { depth--; if (depth === 0) { ctorClose = i + 1; break; } }
    i++;
  }
  const ctorBody = hudSrc.slice(ctorStart, ctorClose);

  // Lines that contain bare `regionName` — NOT `this.regionName` and NOT the
  // assignment `this.regionName = ...` and NOT comments.
  const badLines = ctorBody.split('\n').filter(line => {
    if (/^\s*\/\//.test(line))          return false;  // comment
    if (/this\.regionName\s*=/.test(line)) return false;  // safe assignment
    // After stripping known safe usages, flag any remaining bare `regionName`
    const stripped = line.replace(/this\.regionName/g, '__SAFE__');
    return /\bregionName\b/.test(stripped);
  });

  assert(
    badLines.length === 0,
    'HUD constructor: no stale bare regionName refs (was renamed to regionData)',
    badLines.length ? `Suspicious line: ${badLines[0].trim()}` : '',
  );

  // The constructor parameter must be `regionData`, not `regionName`
  const ctorSignature = hudSrc.slice(ctorStart, hudSrc.indexOf('{', ctorStart));
  assert(
    ctorSignature.includes('regionData') && !ctorSignature.includes('regionName'),
    'HUD constructor parameter is regionData (not the old regionName)',
    `Signature: ${ctorSignature.trim()}`,
  );
}

// ── 5b. ExploreScene.js — HUD call site passes a regionData object ────────
//
// If `new HUD(this, this.regionData.name)` is written instead of
// `new HUD(this, this.regionData)`, the HUD constructor receives a string and
// will throw TypeError when it tries to access .enemySpawns on it.
{
  const exploreSrc = src('./src/scenes/ExploreScene.js');
  const hudCallLines = exploreSrc.split('\n').filter(l => /new HUD\s*\(/.test(l));

  assert(hudCallLines.length >= 1,
    `ExploreScene.js has at least one HUD constructor call (found ${hudCallLines.length})`);

  for (const line of hudCallLines) {
    // Fail if the second argument ends with .name — that is a string, not regionData
    const passingString = /new HUD\s*\([^,]+,\s*[^)]+\.name[\s,)]\s*/.test(line);
    assert(
      !passingString,
      'HUD call site passes full regionData object, not a .name string',
      `Call: ${line.trim()}`,
    );
  }
}

// ── 5c. ExploreScene.js — _addDecorations clearance guard excludes chestTile ─
//
// chestTile was removed from the MST/glade system.  The clearance guard in
// _addDecorations must NOT reference chestTile (dead code that would silently
// block a glade for a feature that no longer exists).
{
  const exploreSrc = src('./src/scenes/ExploreScene.js');

  // Find _addDecorations body
  const fnStart = exploreSrc.indexOf('_addDecorations()');
  const fnClose = (() => {
    let depth = 0, i = exploreSrc.indexOf('{', fnStart);
    while (i < exploreSrc.length) {
      if      (exploreSrc[i] === '{') depth++;
      else if (exploreSrc[i] === '}') { depth--; if (depth === 0) return i + 1; }
      i++;
    }
    return exploreSrc.length;
  })();
  const fnBody = exploreSrc.slice(fnStart, fnClose);

  const hasChestInClearance = /chestTile/.test(fnBody);
  assert(
    !hasChestInClearance,
    '_addDecorations clearance guard does not reference the removed chestTile',
  );
}

// ── 5d. ProceduralMap.js — chestTile removed from nodes array ─────────────
{
  const procSrc = src('./src/data/ProceduralMap.js');
  // Find the nodes = [...] block
  const nodesStart = procSrc.indexOf('const nodes = [');
  const nodesClose = procSrc.indexOf('];', nodesStart) + 2;
  const nodesBlock = procSrc.slice(nodesStart, nodesClose);

  assert(
    !nodesBlock.includes('chestTile'),
    'ProceduralMap.js nodes array does not include chestTile',
    'chestTile was removed from the MST — the SE corner no longer gets a carved corridor',
  );
}

// ── 5e. GameState.js — SAVE_VERSION is defined and is a positive integer ───
//
// SAVE_VERSION must be bumped whenever region enemy layouts change.
// If it is missing or not a number the migration logic silently breaks.
{
  const gsSrc = src('./src/config/GameState.js');

  const versionMatch = gsSrc.match(/const\s+SAVE_VERSION\s*=\s*(\d+)/);
  assert(
    versionMatch !== null,
    'GameState.js defines SAVE_VERSION as a numeric constant',
    'Add: const SAVE_VERSION = <N>;  (bump N whenever enemy layouts change)',
  );
  if (versionMatch) {
    const v = Number(versionMatch[1]);
    assert(
      Number.isInteger(v) && v >= 1,
      `SAVE_VERSION is a positive integer (got ${v})`,
    );
  }
}

// ── 5f. regions.js enemy counts match the header comments ─────────────────
//
// The comment "Enemies: N" above each enemySpawns array must match the actual
// array length. Mismatches mean the code was edited without updating the docs,
// which erodes trust in comments and can hide merge conflicts.
// IMPORTANT: if you change enemy counts, also bump SAVE_VERSION in GameState.js.
{
  const regionsSrc = [0,1,2,3,4,5,6].map(i => src(`./src/data/regions/region_${i}.js`)).join('\n');  // keep in sync with REGIONS
  const commentPattern = /\/\/.*?Enemies:\s*(\d+)/g;
  let commentMatch;
  let commentIdx = 0;

  for (const region of REGIONS) {
    // Find the Enemies comment for this region
    commentMatch = commentPattern.exec(regionsSrc);
    if (!commentMatch) {
      assert(false, `Region ${region.id}: found an "Enemies: N" comment`);
      continue;
    }
    const commentCount = Number(commentMatch[1]);
    const actualCount  = region.enemySpawns.length;
    assert(
      commentCount === actualCount,
      `Region ${region.id} (${region.name}): "Enemies: ${commentCount}" comment matches spawn array length (${actualCount})`,
    );
  }
}

// ── 5g. OverworldScene.js — per-region arrays stay in sync with REGIONS ──────
//
// Three arrays in OverworldScene.js are indexed by region id and must each
// have exactly REGIONS.length entries.  When a new region is added and these
// are forgotten the scene crashes at runtime with "can't access property x,
// pos is undefined" (the exact bug that prompted this check).
//
// Checked arrays:
//   NODE_POSITIONS  — { x, y } objects, one per region node
//   TERRAIN_COLORS  — 0xRRGGBB hex tints, one per region
//   bossKeys        — string texture keys inside _getBossKey(), one per region
//
// Technique: regex-count array literal entries from the source text, then
// compare to REGIONS.length.  This requires no browser / Phaser context.
{
  const owSrc = src('./src/scenes/OverworldScene.js');

  // Count entries in NODE_POSITIONS: each node is a `{ x: N, y: N }` object.
  // We grab the literal from const NODE_POSITIONS = [ ... ]; up to the closing ];
  const nodeBlock = owSrc.match(/const\s+NODE_POSITIONS\s*=\s*\[([\s\S]*?)\];/);
  const nodeCount = nodeBlock ? (nodeBlock[1].match(/\{\s*x:/g) || []).length : -1;
  assert(
    nodeCount === REGIONS.length,
    `OverworldScene: NODE_POSITIONS has ${nodeCount} entries (need ${REGIONS.length})`,
    nodeCount < REGIONS.length
      ? `Add ${REGIONS.length - nodeCount} more { x, y } entry/entries for the new region(s).`
      : `Remove ${nodeCount - REGIONS.length} extra entry/entries.`,
  );

  // Count entries in TERRAIN_COLORS: each entry is a hex literal 0xRRGGBB.
  const terrainBlock = owSrc.match(/const\s+TERRAIN_COLORS\s*=\s*\[([\s\S]*?)\];/);
  const terrainCount = terrainBlock ? (terrainBlock[1].match(/0x[0-9A-Fa-f]+/g) || []).length : -1;
  assert(
    terrainCount === REGIONS.length,
    `OverworldScene: TERRAIN_COLORS has ${terrainCount} entries (need ${REGIONS.length})`,
    terrainCount < REGIONS.length
      ? `Add ${REGIONS.length - terrainCount} more 0xRRGGBB colour(s) for the new region(s).`
      : `Remove ${terrainCount - REGIONS.length} extra colour(s).`,
  );

  // Count entries in _getBossKey's bossKeys array: each entry is a quoted string.
  const bossBlock = owSrc.match(/_getBossKey[\s\S]*?const\s+bossKeys\s*=\s*\[([\s\S]*?)\];/);
  const bossCount = bossBlock ? (bossBlock[1].match(/'[^']*'/g) || []).length : -1;
  assert(
    bossCount === REGIONS.length,
    `OverworldScene: _getBossKey bossKeys has ${bossCount} entries (need ${REGIONS.length})`,
    bossCount < REGIONS.length
      ? `Add ${REGIONS.length - bossCount} more boss texture key(s) for the new region(s).`
      : `Remove ${bossCount - REGIONS.length} extra key(s).`,
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Summary
// ══════════════════════════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(54)}`);
console.log(`Data tests: ${G(passed + ' passed')}, ${failed > 0 ? R(failed + ' failed') : '0 failed'}`);
if (failed > 0) {
  console.error(R('\nOne or more data integrity checks failed.'));
  process.exit(1);
} else {
  console.log(G('\nAll data integrity checks passed. ✓'));
}
