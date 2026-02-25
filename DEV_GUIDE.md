# Mimi vs. Math — Developer Guide

Complete developer documentation for extending and modifying the game.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Running Locally](#running-locally)
- [Asset Pipeline](#asset-pipeline)
- [Test Suite](#test-suite)
- [Architecture](#architecture)
- [Adding a New Region](#adding-a-new-region)
- [Project Structure](#project-structure)

---

## Prerequisites

- **Python 3** (for local HTTP server)
- **Node.js 14+** (for asset conversion tools, optional)

---

## Running Locally

```bash
# Start local HTTP server (required for ES modules)
python -m http.server 8080
# Open http://localhost:8080
```

---

## Asset Pipeline

### Using SVG (Default)

By default, the game loads 176 individual SVG files at runtime. This is simple and works well for development.

### Using PNG (Better Performance)

For better performance, convert SVGs to PNGs:

1. **Install Node.js dependencies:** `npm install`
2. **Convert SVGs to PNGs:** `npm run convert`
   - This parses `AssetConfig.js` to get exact sizes and converts all SVGs to PNGs using Sharp
3. **Update AssetConfig.js:** Change `ASSET_TYPE` from `'svg'` to `'png'`

### Using Texture Atlases (Best Performance) ⚡

For production, use texture atlases to reduce HTTP requests from **176 files → 10 files**:

1. **Install dependencies:** `npm install`
2. **Convert SVGs to PNGs:** `npm run convert`
3. **Pack into atlases:** `npm run pack`
4. **Enable atlas mode:** In `src/config/AssetConfig.js`, set:
   ```js
   export const ASSET_TYPE = 'png';
   export const ATLAS_MODE = true;
   ```

This creates 3 texture atlases:
- `atlas_characters.png/json` — 91 character/enemy sprites
- `atlas_terrain.png/json` — 68 floor/wall/decoration sprites  
- `atlas_ui.png/json` — 10 UI icons

Backdrops (7 files) remain individual due to their large size (800×600px each).

**Performance gain:** ~90% fewer HTTP requests, faster initial load, better caching.

---

## Test Suite

Run the comprehensive test suite to validate game logic:

```bash
# Question generation & distractor logic (~75k samples)
node test_questions.mjs

# Game state, boss unlocks, lives, stars, hard mode (37 checks)
node test_unlock.mjs

# Map connectivity via BFS pathfinding (210 checks across 7 regions)
node test_connectivity.mjs

# Data integrity: enemies, regions, items (579 checks)
node test_data.mjs

# Bestiary layout & enemy positioning
node test_bestiary.mjs

# Spawn point validation (enemies, NPCs, items, Mimi)
node test_positions.mjs
```

All tests use pure Node.js with no browser required. They import live source files directly via ES modules.

**Before shipping:** All tests must pass with 0 failures.

---

## Architecture

### Data-Driven Design

- **Regions** are self-contained modules (`src/data/regions/region_N.js`)
- **Enemies** are defined in `src/data/enemies.js` with math topic links
- **Questions** are pure functions in `src/math/QuestionBank.js` (testable without Phaser)
- **No hardcoded content** — add a region by adding data files, no code changes needed

### Single Source of Truth

**`src/config/GameState.js`** manages all save data:
- Auto-persists to `localStorage` on mutation
- Tracks progress, stats, items, defeated enemies, unlocks
- Version migration for save compatibility
- Import anywhere: `import GameState from './config/GameState.js'`

### Scene Architecture

**8 Phaser scenes:**
1. **BootScene** — Asset loading, initial setup
2. **TitleScene** — Main menu, new game, continue
3. **StoryScene** — Opening narrative
4. **OverworldScene** — World map with region nodes
5. **ExploreScene** — Top-down exploration (reused for all 7 regions)
6. **BattleScene** — Math battle UI and turn logic
7. **BossIntroScene** — Pre-boss cutscene dialogue
8. **BestiaryScene** — Enemy collection gallery

**ExploreScene** is region-agnostic — region config is passed via `scene.start('explore', regionData)`.

### Key Components

| Component | Purpose |
|-----------|---------|
| `src/config/AssetConfig.js` | Central asset registry; SVG/PNG/atlas switching |
| `src/config/GameState.js` | Save data, stats tracking, localStorage persistence |
| `src/scenes/ExploreScene.js` | Top-down exploration, collision, enemy spawning |
| `src/scenes/BattleScene.js` | Math battle loop, damage calculation, item effects |
| `src/ui/BossDoor.js` | Boss gate component (physics, state, animations) |
| `src/ui/HUD.js` | Health bar, lives, items, pause button |
| `src/ui/DialogBox.js` | NPC dialogue with typewriter effect |
| `src/ui/VirtualDPad.js` | Touch controls for mobile devices |
| `src/ui/SettingsOverlay.js` | Timer speed, music, SFX settings |
| `src/math/QuestionBank.js` | 19 math topics × 3 difficulty levels (57 generators) |
| `src/math/Distractors.js` | Procedural wrong-answer generation |
| `src/math/Explanations.js` | Worked solutions for incorrect answers |
| `src/data/ProceduralMap.js` | Tile generation, decoration placement, landmarks |
| `src/entities/Mimi.js` | Player character (4-frame walk cycle, collision) |
| `src/entities/Enemy.js` | Patrol/aggro AI, collision detection |
| `src/entities/NPC.js` | Stationary NPCs with dialogue |
| `src/audio/BGM.js` | Tone.js procedural music (5 tracks, 4 instruments) |

### Asset Sizes Reference

| Asset Type | Size | File Pattern |
|-----------|------|--------------|
| Walk cycles (A/B/C/D frames) | 64×64 px | `{enemy}.svg`, `_b.svg`, `_c.svg`, `_d.svg` |
| Battle poses | 96×96 px | `{enemy}_battle.svg` |
| Floor tiles (A/B/C variants) | 32×32 px | `floor_{theme}.svg`, `_b.svg`, `_c.svg` |
| Wall tiles | 32×32 px | `wall_{type}.svg` |
| Decorations | 32×32 to 32×48 px | `decoration_{name}.svg` |
| Landmarks | ~160×128 px | `landmark_{name}.svg` |
| Battle backdrops | 800×600 px | `backdrop_{theme}.svg` |
| UI icons | 32×32 px | `ui/{icon}.svg` |
| HUD hearts | 20×20 px | `heart_{full/half/empty}.svg` |

---

## Adding a New Region

Regions are self-contained data modules. Follow these steps to add Region N.

### 1. Region data file — `src/data/regions/region_N.js`

Export a single object with:

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Region index (0-based) |
| `name` | string | Display name |
| `gradeLabel` | string | e.g. `'Grade 2'` |
| `floorTile` | string | Base floor texture key |
| `wallTile` | string | Wall texture key |
| `enemies` | string[] | Enemy IDs from `enemies.js` (non-boss) |
| `boss` | string | Boss enemy ID |
| `npcLines` | string[][] | Dialogue for each NPC |
| `bossIntro` | `{speaker,text}[]` | Cutscene lines (≤ 6 per speaker) |
| `mapSeed` | number | Integer seed for procedural layout |
| `mimiStart` | `{col,row}` | Mimi's spawn tile |
| `bossTile` | `{col,row}` | Boss door tile |
| `npcTiles` | `{col,row}[]` | One entry per NPC |
| `items` | `{itemId,col,row}[]` | 2 items; each ≥ 8 tiles from Mimi, boss, and each other |

> **Text-overflow rule:** `BossIntroScene` has ~166 px of text space at 25 px/line → **max 6 lines** per `bossIntro` entry. Count each `\n` as a line break.

Then re-export it from the barrel: `src/data/regions/index.js`.

### 2. Enemy definitions — `src/data/enemies.js`

Add an entry for every enemy (including the boss):

```js
my_enemy: {
  id: 'my_enemy',
  name: 'My Enemy',
  region: N,
  hp: 6,           // common: 4–6 · elite: 8–10 · boss: 20–30
  damage: 1,
  xp: 10,
  mathTopic: 'myTopic',       // must match a QuestionBank key
  difficulty: 1,              // 1–3
  timerSeconds: 22,           // see timer-tuning notes in enemies.js header
  color: 0xRRGGBB,
},
```

### 3. Question generators — `src/math/QuestionBank.js`

Add `myTopicD1()`, `myTopicD2()`, `myTopicD3()` functions following the existing pattern (each returns `{ text, answer, answerDisplay, topic }`). Register them in the `TOPIC_MAP` at the bottom of the file.

Grade-appropriate number ranges:
- **Gr 1–2:** keep single/double-digit; sums ≤ 59
- **Gr 3–4:** two-digit × one-digit; quotients ≤ 20 with remainders
- **Gr 5+:** fractions with unlike denominators; decimals to hundredths

### 4. Distractor & explanation coverage

- **`Distractors.js`** — add a `case 'myTopic':` block if the generic ±1/±2 distractors produce implausible choices.
- **`Explanations.js`** — add a `case 'myTopic':` block so students see worked solutions on a wrong answer.

### 5. SVG assets — `assets/sprites/`

| Asset | Size | Filename pattern |
|-------|------|------------------|
| Walk frames A/B/C/D | 64×64 px | `{id}.svg`, `{id}_b.svg`, `{id}_c.svg`, `{id}_d.svg` |
| Battle pose | 96×96 px | `{id}_battle.svg` |
| Floor tile A/B/C | 32×32 px | `floor_{theme}.svg / _b.svg / _c.svg` |
| Wall tile | 32×32 px | `wall_{theme}.svg` |
| UI heart icons | 20×20 px | `heart_full.svg`, `heart_half.svg`, `heart_empty.svg` |
| Decorations | 32×32 to 32×48 px | `decoration_{name}.svg` |
| Landmark (set-piece) | ~160×128 px | `landmark_{name}.svg` |
| Backdrop | 800×600 px | `backdrop_{theme}.svg` |

> **Critical:** all A/B/C variants of the same floor tile must share an identical base `<rect fill="...">`. Only the accent detail layer on top should differ — otherwise seams are visible at runtime.

### 6. Asset key registry — `src/config/AssetConfig.js`

Add every new key to the correct array:
- `SPRITE_DEFS` — Characters, enemies, NPCs (walk cycles + battle poses)
- `UI_DEFS` — UI icons, hearts, items
- `TERRAIN_DEFS` — Floor tiles, wall tiles, decorations, landmarks, NPCs
- `BACKDROP_DEFS` — Battle background images (800×600px)

Each entry needs: `key` (texture name), `file` (path relative to `assets/sprites/`), `size` (pixels), and optionally `frames` (array of suffixes like `['b', 'c']`).

After adding assets, regenerate PNGs and atlases:
```bash
npm run convert  # SVG → PNG
npm run pack     # PNG → atlases
```

### 7. Procedural map data — `src/data/ProceduralMap.js`

Four arrays are indexed by region ID. **Insert** a new entry at index N (all later entries shift automatically — existing regions stay correct):

| Array | What to add |
|-------|-------------|
| `TILE_FN` | `(h) => key` — picks a floor tile variant by noise height |
| `ACCENT_LAYERS` | `[{ key, freq, threshold, seed }, …]` — scattered decorations |
| `SET_PIECES` | `{ key, tilesW, tilesH, blocking, margin }` — the landmark |
| `ITEM_POOLS` | `['itemId1', 'itemId2']` — fallback loot pool |

### 8. Decoration scales — `src/scenes/ExploreScene.js`

In `_addDecorations()` find the `SCALES` map and add an entry for each new decoration/landmark key. Omitting a key defaults to scale `1.0`, but most assets look best at `1.0–1.3`.

### 9. Bestiary — `src/scenes/BestiaryScene.js`

- Add enemy IDs to `CANON_ORDER` inside the correct region block comment.
- Push one entry each to `REGION_NAMES`, `GRADE_LABELS`, `REGION_BG`, and `REGION_ACCENT`.
- Recalculate `COLS`, `CARD_W`, `CARD_H`, `GAP_X`, `GAP_Y`, `GRID_START_Y` so the full grid fits within 600 px. Update the count badge text.

### 10. Run the test suite

```bash
node test_questions.mjs
node test_unlock.mjs
node test_connectivity.mjs
node test_data.mjs
node test_bestiary.mjs
node test_positions.mjs
```

All tests must exit with **0 failures** before shipping.

---

## Project Structure

```
mimi_vs_math/
├── index.html               ← Entry point (ES module imports via importmap)
├── .nojekyll                ← GitHub Pages: serve ES modules correctly
├── package.json             ← npm scripts for asset conversion tools
├── .gitignore               ← Excludes node_modules, .venv, build artifacts
│
├── src/
│   ├── main.js              ← Phaser game config, scene registration
│   │
│   ├── config/
│   │   ├── AssetConfig.js   ← Asset registry, SVG/PNG/atlas switching
│   │   └── GameState.js     ← Save data, stats, localStorage persistence
│   │
│   ├── scenes/
│   │   ├── BootScene.js     ← Asset loading, initial setup
│   │   ├── TitleScene.js    ← Main menu
│   │   ├── StoryScene.js    ← Opening narrative
│   │   ├── OverworldScene.js ← World map
│   │   ├── ExploreScene.js  ← Top-down exploration (all regions)
│   │   ├── BattleScene.js   ← Math battle loop
│   │   ├── BossIntroScene.js ← Pre-boss cutscenes
│   │   └── BestiaryScene.js ← Enemy gallery
│   │
│   ├── entities/
│   │   ├── Mimi.js          ← Player (4-frame walk cycles, collision)
│   │   ├── Enemy.js         ← Enemy AI (patrol, aggro, collision)
│   │   └── NPC.js           ← Stationary NPCs with dialogue
│   │
│   ├── ui/
│   │   ├── HUD.js           ← Health, lives, items, pause button
│   │   ├── DialogBox.js     ← NPC dialogue with typewriter effect
│   │   ├── VirtualDPad.js   ← Touch controls for mobile
│   │   ├── SettingsOverlay.js ← Timer speed, music, SFX settings
│   │   └── BossDoor.js      ← Boss gate component (physics, visuals)
│   │
│   ├── math/
│   │   ├── QuestionBank.js  ← 19 topics × 3 difficulties (57 generators)
│   │   ├── Distractors.js   ← Procedural wrong-answer generation
│   │   └── Explanations.js  ← Worked solutions for wrong answers
│   │
│   ├── data/
│   │   ├── enemies.js       ← All enemy definitions (HP, damage, topic, timer)
│   │   ├── items.js         ← Power-up item definitions
│   │   ├── maps.js          ← Overworld map layout constants
│   │   ├── npcJokes.json    ← Mewton NPC dialogue pool
│   │   ├── bestiaryUtils.js ← Bestiary layout calculations
│   │   ├── ProceduralMap.js ← Tile gen, decorations, landmarks per region
│   │   └── regions/
│   │       ├── index.js     ← Barrel export for all regions
│   │       ├── region_0.js  ← Sunny Village
│   │       ├── region_1.js  ← Windmill Village
│   │       ├── region_2.js  ← Meadow Maze
│   │       ├── region_3.js  ← Mycelium Hollow
│   │       ├── region_4.js  ← Desert Dunes
│   │       ├── region_5.js  ← Frostbite Cavern
│   │       └── region_6.js  ← Shadow Castle
│   │
│   └── audio/
│       └── BGM.js           ← Tone.js procedural music manager
│
├── assets/
│   ├── sprites/             ← 176 SVG files (auto-converted to PNG)
│   │   └── ui/              ← UI icons subset
│   ├── atlases/             ← Generated texture atlases (3 PNG + 3 JSON)
│   └── audio/
│       ├── samples/         ← MP3 instrument samples (piano, guitar, violin, cello)
│       └── *.wav            ← Sound effects
│
├── tools/
│   ├── svg_to_png.js        ← Convert SVGs → PNGs using Sharp
│   ├── pack_atlases.js      ← Pack PNGs into texture atlases
│   ├── download_samples.py  ← Download audio samples (legacy)
│   └── generate_audio.py    ← Audio file generation (legacy)
│
└── tests/
    ├── test_questions.mjs   ← Question generation (~75k samples)
    ├── test_unlock.mjs      ← Boss unlocks, lives, stars (37 checks)
    ├── test_connectivity.mjs ← Map pathfinding (210 checks)
    ├── test_data.mjs        ← Data integrity (579 checks)
    ├── test_bestiary.mjs    ← Bestiary layout validation
    └── test_positions.mjs   ← Spawn point validation
```

---

## GitHub Pages Setup

1. Push to GitHub
2. **Settings → Pages → Source:** branch `main`, folder `/ (root)`
3. The `.nojekyll` file in the root ensures ES modules are served correctly
