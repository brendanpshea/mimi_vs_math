# Mimi vs. Math — Claude Code Guide

## Project Overview

Educational browser-based adventure game for elementary students (Grades 1–5). Players explore a top-down world as Mimi the cat, defeating enemies by answering math questions. Built with Phaser 3 and Tone.js, no build step required.

## Tech Stack

- **Engine:** Phaser 3 (ES module import from CDN via importmap in `index.html`)
- **Language:** JavaScript (ES6+ modules)
- **Audio:** Tone.js (procedural BGM) + Web Audio API (SFX)
- **Persistence:** `localStorage`
- **Build:** None — pure ES modules, no bundler
- **Hosting:** GitHub Pages (static files)
- **Testing:** Node.js `.mjs` test files

## Running the Project

**Requires a local HTTP server** (ES modules won't load over `file://`):

```bash
python -m http.server 8080
# Open http://localhost:8080
```

## Running Tests

```bash
node test_questions.mjs    # ~75k checks: QuestionBank + Distractors
node test_unlock.mjs       # 37 checks: boss-unlock, lives, stars, hard mode, bestiary
node test_connectivity.mjs # 210 checks: BFS pathfinding for all 7 regions
node test_data.mjs         # 579 checks: data integrity
```

Tests use pure Node.js with no browser or server required. They import live source files directly.

## Project Structure

```
src/
├── config/
│   ├── AssetConfig.js     # SVG/PNG switch; all texture key definitions
│   └── GameState.js       # Single source of truth for all save data (localStorage)
├── scenes/                # 8 Phaser scenes (Boot, Title, Story, BossIntro, Overworld, Explore, Battle, Bestiary)
│   ├── ExploreScene.js    # Top-down exploration — reused for all 7 regions
│   └── BattleScene.js     # Math battle UI + turn logic
├── entities/              # Mimi (player), Enemy, NPC
├── math/
│   ├── QuestionBank.js    # 19 question generators × 3 difficulty levels
│   ├── Distractors.js     # Procedural wrong-answer generation
│   └── Explanations.js    # Worked solutions shown after wrong answers
├── data/
│   ├── enemies.js         # All enemy definitions (HP, damage, math topic, timer)
│   ├── items.js           # Power-up item definitions
│   ├── regions/           # region_0.js – region_6.js + index.js
│   └── ProceduralMap.js   # Tile functions, accent layers, set-pieces per region
├── ui/                    # HUD, DialogBox, VirtualDPad, SettingsOverlay, MewtonDialogue, BossDoor
└── audio/
    └── BGM.js             # Tone.js procedural track manager
```

## Key Architecture

- **GameState.js** is the single source of truth. Import it anywhere; it auto-persists to `localStorage` on mutation.
- **ExploreScene** is reused for all 7 regions — region config is passed via Phaser's `scene.init()` data.
- **Data-driven:** New regions/enemies require no gameplay code changes — add a `region_N.js` and update `enemies.js`.
- **Math content is isolated:** `QuestionBank` / `Distractors` / `Explanations` are pure functions, testable without Phaser.

## Important Files

| File | When to Edit |
|------|-------------|
| `src/config/GameState.js` | New save fields, stats tracking |
| `src/math/QuestionBank.js` | New math topics or question generators |
| `src/data/enemies.js` | Add/modify enemies |
| `src/data/regions/region_N.js` | Add/modify regions |
| `src/scenes/BattleScene.js` | Battle rules (damage, streak, timing) |
| `src/scenes/ExploreScene.js` | Exploration mechanics |
| `src/ui/MewtonDialogue.js`   | Mewton NPC conversation logic |
| `src/ui/BossDoor.js`         | Boss door visuals, physics, and state machine |

## Adding a New Region

Follow the step-by-step guide in `README.md`. At a minimum:
1. Create `src/data/regions/region_N.js` (copy an existing region as template)
2. Add enemies to `src/data/enemies.js`
3. Export the new region from `src/data/regions/index.js`

## Asset Pipeline

- SVG by default (`src/config/AssetConfig.js`, `ASSET_TYPE = 'svg'`)
- To switch to PNG: change `ASSET_TYPE` to `'png'` — no other code changes needed
- Sprite sizes: walk cycles 26×26 px, battle poses 96×96 px, tiles 32×32 px

## Save System

- `SAVE_VERSION = 4` in `GameState.js`
- Version mismatch clears `defeatedEnemies` only; all other progress is preserved

## Game Mechanics Reference

- **Difficulty levels:** D1 (common), D2 (elite), D3 (boss/hard mode)
- **Damage:** Correct + fast (<1/3 timer) = 3 dmg; normal = 2 dmg; 3-streak = +1 bonus
- **9 Lives:** Each defeat costs 1 life (HP restored). On 9th death, respawn at region entrance with 50% HP
- **Stars:** ★★★ = perfect (0 wrong), ★★☆ = ≤25% wrong, ★☆☆ = any win — only improve on replay
- **Hard Mode:** Unlocks after beating a region; +1 difficulty, −5 s timer (min 8 s)
- **Item drop rate:** 30% from regular enemies, 100% from bosses

## Regions

| # | Name | Grade | Math Topic |
|---|------|-------|-----------|
| 0 | Sunny Village | 1 | Addition & Subtraction |
| 1 | Windmill Village | 2 | Place Value & Regrouping |
| 2 | Meadow Maze | 2.5 | Times Tables & Doubling |
| 3 | Mycelium Hollow | 3 | Multi-Digit Multiplication |
| 4 | Desert Dunes | 3.5 | Division |
| 5 | Frostbite Cavern | 4 | Fractions & Decimals |
| 6 | Shadow Castle | 5 | Order of Operations, Percentages, Ratios |
