# Fixes Applied - Summary

## ✅ Fix 1: Boss battles now unlock next region
**File**: `src/scenes/ExploreScene.js`
- Added code in `_processBattleResult()` to call `GameState.defeatBoss()` when a boss is defeated
- Next region auto-unlocks via `OverworldScene._isUnlocked()` check (detects if previous boss was defeated)

## ✅ Fix 2: Boss difficulty adjusted for grade appropriateness  
**File**: `src/scenes/BattleScene.js`
- Boss battles now use difficulty level 1 (easiest) regardless of player level
- Regular enemies still scale with player level
- Makes first boss accessible to first-graders with simpler addition problems

**Example**: 
- Regular enemy at level 3: Gets harder questions
- Boss at level 3: Still gets level 1 questions (easier for grade level)

## ✅ Fix 3: NPC rendered as SVG
**Files**: 
- Created `assets/sprites/npc_wizard.svg` - friendly wizard character with hat, staff, and robe
- Updated `src/config/AssetConfig.js` - Added NPC to TERRAIN_DEFS
- Updated `src/scenes/ExploreScene.js` - Changed from 'tile_npc' to 'npc_wizard'
- Removed text label that said "NPC"

## ✅ Fix 4: Removed enemy name labels from exploration map
**File**: `src/entities/Enemy.js`
- Removed name label text that appeared above enemies
- Kept HP bar for visual feedback
- Labels still appear in battle screen as intended
- Cleaner, less cluttered exploration view

## Testing
All 49 static analysis tests pass ✅

---

## ✅ Fix 5: Enemy bob-tween teleport (Enemy.js)
- Bob tween is now stopped and recreated at `sprite.y` when going idle — prevents snap back to spawn Y after the enemy has moved.
- `_stepBobOffset` cleared in `_enterMoveAnim()` to avoid residual offset accumulating.

## ✅ Fix 6: Mewton roaming NPC wall-walking (NPC.js)
- Removed `setImmovable(true)` which was blocking Arcade physics wall separation.
- Added `body.blocked.*` detection — changes direction within 350 ms of hitting a wall.
- `_thinkTimer` stored as a reference so it can be cancelled before a forced direction change.

## ✅ Fix 7: Run-away re-trigger (ExploreScene.js)
- `returnData` now includes `enemyHomeX/Y`.
- On `ranAway: true` return, Mimi spawns 96 px away from the enemy's home tile instead of right next to it.

## ✅ Fix 8: Pokémon-style Bestiary (BestiaryScene.js + GameState.js)
- `GameState` tracks `seenEnemies` (entered battle) and `defeatedEnemyTypes` (won battle).
- Grid of all 23 enemies with three card states: unknown / seen (silhouette) / defeated (full colour + star count).
- Detail panel shows name, region, HP, special ability, and math topic.
- Accessible from the OverworldScene player card via a 📖 Bestiary button.

## ✅ Fix 9: Teacher-reviewed question bank (QuestionBank.js + Explanations.js)
Ten improvements aligned with Grade 1–7 curriculum expectations:

1. `fractionAddD3` — replaced mislabelled subtraction with **unlike-denominator addition**
2. Comparison explanation — replaced generic "more means ADD" with template-specific step-by-step working
3. `decimalsD1` — replaced 9-row lookup table with a **procedural generator**
4. Addition explanation — **bridging-through-tens** scaffolding for addends > 10
5. `missingNumberD1/D2` — two-digit addends; D2 extended to include `÷ ?` variant (inverse division)
6. `comparisonD3` — added **"how many MORE/FEWER?"** subtraction word problems (50 % rate)
7. `orderOfOpsD2/D3` — added subtraction templates (`a × b − c` and `(a − b) × c`)
8. `fractionCompareD3` — 30 % chance of **fraction-of-a-set** word problem (e.g. "Mimi uses 1/4 of 12 fish — how many?")
9. Removed `mixed` and `numberOrder` from public generator map; `fenwick` boss → `mathTopic: 'orderOfOps'`
10. `number_bee` enemy → `mathTopic: 'comparison'`; `subtraction_witch` boss pool trimmed; `BattleScene` topic label map expanded to all 17 live topics

**Test results after all changes:**
- `test_questions.mjs`    — 58,875 / 58,875 ✅
- `test_unlock.mjs`       — 33 / 33 ✅
- `test_connectivity.mjs` — 150 / 150 ✅

---

## ✅ Refactor 1: Per-region display data moved into regions.js
**File**: `src/data/regions.js`
- `backdropKey`, `auraColor`, and `bossTint` added to every region object.
- `BattleScene.js` — removed three hardcoded positional arrays; all three values now read from `REGIONS[this.regionId]`.

## ✅ Refactor 2: Removed redundant `spriteKey` from enemy definitions
**Files**: `src/data/enemies.js`, `src/entities/Enemy.js`, `src/scenes/BattleScene.js`, `src/scenes/BestiaryScene.js`
- `spriteKey` was always identical to `id` — the field is now deleted from all 23 enemy objects.
- Every call site that previously read `data.spriteKey` / `this.enemyData.spriteKey` now reads `.id` directly (6 locations across 3 files).

## ✅ Refactor 3: Frames array on SPRITE_DEFS (AssetConfig.js)
**File**: `src/config/AssetConfig.js`
- Added optional `frames: ['b']` or `frames: ['b', 'c']` to each enemy entry in `SPRITE_DEFS` instead of listing separate `key_b` / `key_c` entries.
- Removed the 31-line Frame-B + Frame-C sections and the standalone `fenwick_b` entry.
- `loadAllAssets()` now auto-expands frame variants from the `frames` array — adding a new animated enemy only requires annotating its base entry.

## ✅ Refactor 4: Removed stale `special:` strings from enemies.js
**File**: `src/data/enemies.js`
- Deleted the `special:` field from all 23 enemy definitions.
- Special behaviours had already been superseded by the BattleScene logic; the field was unused dead data.

## ✅ Refactor 5: Split regions.js into per-region files
**Files**: `src/data/regions/region_0.js` – `region_4.js`, `src/data/regions/index.js`
- The 420-line monolithic `src/data/regions.js` is replaced by five focused files (one per region, ~80 lines each) and a barrel `index.js` that exports the same default array.
- All importers updated: `TitleScene`, `OverworldScene`, `ExploreScene`, `BattleScene`, `maps.js`, and all test files.
- `test_data.mjs` source-text scan updated to concatenate the five individual files.
- `analyze.js` file-existence check updated to `src/data/regions/index.js`.

**Test results after all refactors:**
- `test_questions.mjs`    — 58,875 / 58,875 ✅
- `test_unlock.mjs`       — 33 / 33 ✅
- `test_connectivity.mjs` — 150 / 150 ✅
