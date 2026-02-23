# Mimi vs. Math — Game Specification

## Overview

Mimi vs. Math is a browser-based, Zelda-style top-down adventure game built with
**JavaScript + Phaser.js**. Mimi the cat explores a whimsical world, encounters enemies,
and defeats them by answering math questions. The game targets **elementary players (ages 6–11)**
and covers addition, subtraction, multiplication, division, fractions,
decimals, and mixed challenge content across six regions.

---

## Tech Stack

| Component | Choice |
|---|---|
| Engine | Phaser 3 (JavaScript) |
| Display | `Scale.EXPAND` — fills viewport; content column capped at 820 px for 16:9 / ultrawide |
| Platform | Browser (no install required) |
| Entry point | `index.html` |
| Asset format | SVG sprites |
| Audio | Tone.js (procedural BGM, 5 tracks) + Web Audio API (SFX) |

---

## Game World & Progression

### Structure

```
Overworld Map
├── Region 0: Sunny Village        (Addition, Subtraction & Comparison)
├── Region 1: Windmill Village     (Place Value, Carry Addition & Borrow Subtraction)
├── Region 2: Meadow Maze          (Multiplication)
├── Region 3: Desert Dunes         (Division)
├── Region 4: Frostbite Cavern     (Fractions & Decimals)
└── Region 5: Shadow Castle        (Order of Operations, Percentages & Ratios)
```

Each region contains:
- A **procedurally-decorated exploration area**
- **3–5 enemy types** scaled to that region’s math theme
- **1 boss encounter** to unlock the next region
- **2–3 NPCs** who give hints or lore

There are no treasure chests; items are dropped by enemies after battle.

### Overworld

- Top-down, tile-based (16×16 or 32×32 tiles)
- Mimi moves freely; collision detection prevents walking through walls/water
- Camera follows Mimi with soft boundaries
- Regions unlock sequentially; locked region entrances show a padlock until the
  previous boss is defeated

---

## Player Character: Mimi

### Stats

| Stat | Description |
|---|---|
| HP | 6 hearts (12 HP); displayed as heart icons |
| Lives | 9 lives per save; displayed as 🐾 paw icons in battle |
| Speed | Movement speed across the exploration area |

### Items (Enemy Drops)

Items drop at the end of battle (30% chance from regular enemies; 100% from bosses).
The item name and description are shown in the victory overlay.

| Item | Effect |
|---|---|
| Sardine | Restore 2 HP |
| Yarn Ball | +5 seconds added to battle timer (one battle) |
| Catnip | Double damage on next correct answer |
| Lucky Collar | Shield — blocks one hit from an enemy |
| Fish Fossil | Reveal one incorrect choice per question (3 uses) |

### Persistence

- Progress saved to `localStorage` (current region, HP, inventory, defeated bosses, math stats)
- Mimi respawns at the start of the current region's entrance if HP reaches 0 (no permanent game-over)
- **New Game** opens a world-select overlay; choosing a world auto-unlocks all prior bosses
- **Continue** loads the existing save and returns directly to the world map

### Stats Tracking

All math performance data accumulates across the entire save:

| Stat | Description |
|---|---|
| Questions Answered | Total seen across all battles |
| Correct / Incorrect | Raw counts; timeouts count as incorrect |
| Accuracy % | `correct / answered × 100` |
| Avg. Answer Time | Mean ms per answer, converted to seconds for display |
| Best Streak | Longest consecutive correct-answer run |
| Battles Won / Lost | Battle outcomes |
| Perfect Battles | Battles won with zero wrong answers or timeouts |

Stats are viewable from the title screen, the world-select overlay, and the world map.

---

## Exploration (Zelda-style)

- **Movement:** WASD or arrow keys; 4-directional. Touch devices show a semi-transparent on-screen D-pad (bottom-left). Portrait orientation triggers a rotate-to-landscape prompt.
- **Interaction:** Spacebar or Enter to talk to NPCs / interact with the boss door
- **Pause / back:** P or Esc pauses the battle and opens the pause overlay (resume, settings). Esc in explore returns to overworld or closes the current overlay.
- **Settings:** The ⚙ Settings button appears in the title screen, overworld, explore scene, and inside the battle pause overlay.

---

## Settings & Accessibility

A reusable `SettingsOverlay` component (`src/ui/SettingsOverlay.js`) renders as a modal over any Phaser scene. All values are stored in `GameState` and persisted to `localStorage`.

| Setting | Options | Accessibility purpose |
|---------|---------|----------------------|
| ⏱ Answer Timer Speed | 1× / 1.5× / 2× / 3× | Extends question time for younger or slower readers. **Not reset by New Game** — carries across saves. |
| ♩ Music Volume | Off · Low (25%) · Med (50%) · High (75%) · Max (100%) | Live BGM volume via Tone.js. |
| ♫ SFX Volume | Off · Low (25%) · Med (50%) · High (75%) · Max (100%) | Controls all battle and UI sound effects. |

The panel can be dismissed with the ✕ Close button, by clicking outside it, or by pressing Esc. Opening settings during a battle automatically suspends the timer and all tweens (handled by the pause overlay that hosts it).

---

## Battle System

### Trigger

Walking into an enemy sprite on the map initiates a battle. The screen transitions
to the **battle view** (a distinct UI overlay or scene).

### Turn Structure

Each "turn" presents one math problem:

1. **Problem displayed** — large, centered text (e.g., `7 × 8 = ?`)
2. **Four answer choices** shown as clickable buttons (also keyboard 1–4)
3. **Timer bar** counts down (default: 15 seconds)
4. Outcome:
   - **Correct + fast (< 5 s):** Mimi deals full damage + speed bonus
   - **Correct (5–15 s):** Mimi deals standard damage
   - **Wrong or timeout:** Enemy deals damage to Mimi; correct answer is shown briefly

5. Repeat until one side reaches 0 HP.

### Damage Values (base)

| Outcome | Mimi's damage | Enemy's damage |
|---|---|---|
| Correct (fast) | 3 | — |
| Correct (normal) | 2 | — |
| Wrong / timeout | — | 1–2 (varies by enemy) |

### Enemy HP range

| Enemy tier | HP |
|---|---|
| Common | 4–6 |
| Elite | 8–10 |
| Boss | 20–30 |

### Combo System

- 3 correct answers in a row → "Math Streak!" banner; next correct answer deals +1 damage
- Streak resets on a wrong answer

### Post-battle

- **Victory overlay** shows: accuracy for the battle (`N/N correct, XX%`), streak badge (if ≥3), perfect-battle badge (zero wrong answers), boss-unlock message, **star rating (1–3 ★ based on wrong-answer %)**, and any item dropped.
- **Defeat (life available):** Mimi spends one of her 9 lives. HP is fully restored; she respawns near the enemy with a humorous quip. World state (enemy positions, defeated-enemy record) is preserved for the rematch.
- **Defeat (no lives left):** HP is restored to 50 % of max; Mimi returns to the region entrance and defeated-enemy progress is reset.
- Math stats (`GameState.stats`) are updated on every answer and at battle end.

---

## Math Content

### Region 0 — Addition & Subtraction (grades 1–3)

- Single & double-digit addition and subtraction
- Number comparison: which is larger; ordering a set of numbers
- Word problems using counting-on and counting-back strategies

### Region 1 — Place Value & Regrouping (grade 2)

- Tens & ones decomposition (e.g., ‘34 = ___ tens and ___ ones’)
- 2-digit addition **with carrying**, result ≤ 59
- 2-digit subtraction **with borrowing**, minuend ≤ 49
- Word problems at grade-2 number ranges

### Region 2 — Multiplication (grades 3–5)

- Times tables: factors 2–12
- Multi-digit × single-digit (e.g., `23 × 4`)
- Word problems presented as story text above the equation

### Region 3 — Division (grades 4–5)

- Division facts derived from Region 2 times tables
- Long division with remainders (quotient only required)
- Division word problems

### Region 4 — Fractions & Decimals (grade 5)

- Comparing fractions (which is larger?)
- Adding/subtracting fractions with like & unlike denominators
- Converting fractions ↔ decimals
- Multiplying a fraction by a whole number

### Region 5 — Shadow Castle (grade 5)

- Order of operations with brackets: `(a + b) × c`, `(a − b) × c`, `a × b + c × d`, `a × b − c`
- Percentages: 10 %, 20 %, 25 %, 50 %, 75 % of a whole number
- Ratio & proportion: `a : b = ? : n`

### Answer Choice Generation

- 1 correct answer
- 3 plausible distractors generated procedurally:
  - Off-by-one errors
  - Common misconception answers (e.g., adding instead of multiplying)
  - Nearby round numbers

---

## Enemies

### Region 1 — Windmill Village

| Enemy | Sprite concept | Math topic |
|---|---|---|
| Gear Gnome | Mechanical gnome with gears | Place value (tens & ones) |
| Windmill Sprite | Tiny glowing mill-fairy | 2-digit addition with carrying |
| Harvest Scarecrow | Straw scarecrow with a pitchfork | 2-digit subtraction with borrowing |
| Counting Crow | Scholarly crow with a notebook | Addition with carrying (harder) |

**Boss: Grand Miller** — Imposing miller in a flour-dusted coat; 20 HP; mixed place-value, carry-add, and borrow-subtract at D3.

### Region 2 — Meadow Maze

| Enemy | Sprite concept | Special behavior |
|---|---|---|
| Slime Pup | Green blob with eyes | None |
| Cactus Sprite | Small cactus with arms | Presents 2 problems per turn (answer both) |
| Cloud Bully | Angry cloud | Timer is 3 s shorter |

**Boss: Count Multiplico** — Giant owl with a monocle; 30 HP; presents chained
multiplication (e.g., `(3 × 4) × 2`).

### Region 3 — Desert Dunes

| Enemy | Sprite concept | Special behavior |
|---|---|---|
| Sand Scarab | Beetle with gears | Remainders required |
| Mummy Cat | Bandaged cat | Wrong answer heals enemy by 1 |
| Mirage Fox | Shimmering fox | Choices reshuffle at 5 s mark |

**Boss: The Diviner** — Ancient sphinx; 30 HP; asks division word problems.

### Region 4 — Frostbite Cavern

| Enemy | Sprite concept | Special behavior |
|---|---|---|
| Ice Frog | Blue frog on ice | Fraction comparison only |
| Snow Golem | Snowman with claws | Two fractions, must select the sum |
| Crystal Bat | Gem-winged bat | Decimal problems; timer 12 s |

**Boss: Glacius the Fraction Dragon** — 30 HP; problems involve both fractions
and decimals.

### Region 5 — Shadow Castle

| Enemy | Sprite concept | Special behavior |
|---|---|---|
| Shadow Knight | Dark armored cat | Order of operations |
| Ratio Raven | Raven with scales | Proportion problems |
| Percent Wraith | Ghostly figure | Percentage calculations |

**Boss: Fenwick** — 40 HP; mixed problems across all types; no timer
displayed (hidden countdown).

---

## UI / HUD

### Exploration HUD

```
┌─────────────────────────────────────────────┐
│ [♥♥♥♥♥♥]  Region: Meadow Maze                   │
│      ✓ 18/22  ·  82% accuracy  ·  streak best: 5    │
│                                             │
│              (game world)                   │
│                                             │
│  [Inventory: 🐟×2  🧶×1]                   │
└─────────────────────────────────────────────┘
```

### Battle HUD

```
┌─────────────────────────────────────────────┐
│  MIMI  [♥♥♥♥]        ENEMY  [████░░]       │
│                                             │
│          7  ×  8  =  ?                      │
│                                             │
│   [1] 54    [2] 56    [3] 63    [4] 48     │
│                                             │
│  [████████████████░░░░]  Time: 12s          │
└─────────────────────────────────────────────┘
```

---

## Scene / Code Structure

```
mimi_vs_math/
├── index.html
├── src/
│   ├── main.js                # Phaser game config, scene registration
│   ├── config/
│   │   ├── AssetConfig.js     # SVG/PNG switch + texture key list
│   │   └── GameState.js       # Save/load, stats tracking, inventory helpers
│   ├── scenes/
│   │   ├── BootScene.js       # Preload assets
│   │   ├── TitleScene.js      # Title screen; New Game → world-select overlay
│   │   ├── StoryScene.js      # Intro cutscene for Region 0
│   │   ├── OverworldScene.js  # Region-select world map + stats overlay
│   │   ├── ExploreScene.js    # Top-down exploration (reused per region)
│   │   ├── BattleScene.js     # Math battle UI + stats recording
│   │   ├── BossIntroScene.js  # Animated boss-introduction cutscene
│   │   └── BestiaryScene.js   # Pokémon-style enemy encyclopedia (seen / defeated states)
│   ├── entities/
│   │   ├── Mimi.js            # Player sprite and movement
│   │   ├── Enemy.js           # Enemy base class
│   │   └── NPC.js             # NPC interaction
│   ├── math/
│   │   ├── QuestionBank.js    # Question generation per topic
│   │   ├── Distractors.js     # Procedural wrong-answer generation
│   │   └── Explanations.js    # Post-answer explanation text
│   ├── data/
│   │   ├── enemies.js         # Enemy definitions (HP, damage, math topic)
│   │   ├── items.js           # Item definitions and effects
│   │   ├── regions/           # Per-region metadata (region_0.js – region_5.js + index.js barrel)
│   │   ├── ProceduralMap.js   # Tile-fn, accent layers, set-pieces & item pools per region
│   │   ├── maps.js            # Procedural decoration data per region
│   │   └── npcJokes.json      # NPC dialogue lines
│   ├── ui/
│   │   ├── HUD.js             # Hearts, accuracy stats, inventory pills
│   │   ├── DialogBox.js       # NPC dialogue display (text + multi-option menus)
│   │   ├── VirtualDPad.js     # On-screen D-pad (rendered only on touch devices)
│   │   └── SettingsOverlay.js # Pause-menu settings (timer speed, music/SFX volume)
└── assets/sprites/            # SVG files (walk cycles, battle pose, bosses, UI)
```

---

## Replay Incentives

### Star Ratings

Every boss battle earns a star rating (1–3 ★) stored in `GameState.regionStars`:

| Stars | Condition |
|-------|-----------|
| ★★★ | 0 wrong answers |
| ★★☆ | ≤25 % wrong answers |
| ★☆☆ | Any other win |

Stars are shown on each overworld node and in the victory overlay. Ratings only improve—replaying never reduces the count.

### Hard Mode Rematch

After defeating a region's boss, a **⚔ Hard Mode** button appears in the node popup:

- Enemy/boss question **difficulty +1 level** (D1→D2, D2→D3; capped at D3)
- **Timer −5 seconds** per question (floor: 8 s)
- A **🗡 HARD MODE** banner displays on Mimi's side of the battle HUD
- Completion is stored in `GameState.regionHardModeCleared[ ]` and shown as a ⚔ badge on the overworld node
- Hard mode and normal mode runs are tracked independently

---

## Milestones

| Milestone | Status | Deliverable |
|---|---|---|
| M1 | ✅ Done | Phaser project scaffolded; Mimi moves in procedurally-decorated regions |
| M2 | ✅ Done | Battle scene works end-to-end with Region 0 math questions |
| M3 | ✅ Done | All 6 regions with enemies, bosses, boss-intro cutscenes, item drops |
| M4 | ✅ Done | Full progression, save/load, world-select, stats tracking |
| M5 | ✅ Done | 9 lives, star ratings, hard-mode rematch, BGM/SFX, heart HUD |
| M6 | ✅ Done | Bestiary, adaptive difficulty, interactive decorations, NPC Mewton, teacher-reviewed question bank |
| M7 | ✅ Done | `Scale.EXPAND` responsive layout (content capped at 820 px), virtual D-pad for touch, portrait rotation prompt, settings & accessibility overlay |
| M8 | 🔄 In progress | Accessibility polish |

---

## Out of Scope (v1)

- Multiplayer or leaderboards
- User accounts or server-side save data

---

## Adding a New Region (Developer Checklist)

Regions are self-contained data modules. The steps below cover everything needed to ship a new region. Follow them in order — the test suite at step 10 will catch any gaps.

### 1. Region data file — `src/data/regions/region_N.js`

Export one object per region. Required fields:

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Zero-based region index |
| `name` | string | Display name shown in HUD and overworld |
| `gradeLabel` | string | e.g. `'Grade 2'` |
| `floorTile` | string | Base floor texture key |
| `wallTile` | string | Wall texture key |
| `enemies` | string[] | Non-boss enemy IDs from `enemies.js` |
| `boss` | string | Boss enemy ID |
| `npcLines` | string[][] | One sub-array of lines per NPC |
| `bossIntro` | `{speaker,text}[]` | Intro cutscene dialogue |
| `mapSeed` | number | Integer seed for procedural layout |
| `mimiStart` | `{col,row}` | Mimi's spawn tile |
| `bossTile` | `{col,row}` | Boss door tile |
| `npcTiles` | `{col,row}[]` | One per NPC |
| `items` | `{itemId,col,row}[]` | Exactly 2; each ≥ 8 tiles from Mimi spawn, boss, and each other |

> **Text-overflow rule:** `BossIntroScene` renders text at 17 px with 8 px line spacing = 25 px/line into a box with ~166 px of vertical space → **maximum 6 lines per `bossIntro` entry**. Count each `\n` as one line break.

Re-export from the barrel: `src/data/regions/index.js`.

### 2. Enemy definitions — `src/data/enemies.js`

One entry per enemy (including the boss):

```js
my_enemy: {
  id: 'my_enemy',
  name: 'My Enemy',
  region: N,
  hp: 6,            // common: 4–6  ·  elite: 8–10  ·  boss: 20–30
  damage: 1,
  xp: 10,
  mathTopic: 'myTopic',       // must match a key in QuestionBank's TOPIC_MAP
  difficulty: 1,              // 1–3
  timerSeconds: 22,           // see timer-philosophy comments in enemies.js
  color: 0xRRGGBB,
},
```

Tuning `timerSeconds`: Grade 1–2 simple: ~25 s · Grade 3–4 multi-step: ~22 s · Word problems add ~8 s automatically · Boss D3: match the heaviest topic in the pool.

### 3. Question generators — `src/math/QuestionBank.js`

Add `myTopicD1()`, `myTopicD2()`, `myTopicD3()` (each returns `{ text, answer, answerDisplay, topic }`).  
Register them in the `TOPIC_MAP` object at the bottom of the file.

Grade-appropriate number ranges:

| Grade | Range guideline |
|-------|----------------|
| 1–2 | Single/double-digit; sums ≤ 59 |
| 3–4 | Two-digit × one-digit; quotients ≤ 20 |
| 5 | Unlike-denominator fractions; decimals to hundredths |
| 5 | Order-of-ops with brackets; %-of-whole; ratios |

### 4. Distractor & explanation coverage

- **`Distractors.js`** — add `case 'myTopic':` if the generic ±1/±2 distractors produce implausible choices.
- **`Explanations.js`** — add `case 'myTopic':` so students see worked solutions after a wrong answer.

### 5. SVG assets — `assets/sprites/`

| Asset | Dimensions | Filename convention |
|-------|-----------|---------------------|
| Walk frames A / B / C | 26×26 | `{id}.svg`, `{id}_b.svg`, `{id}_c.svg` |
| Battle pose | 96×96 | `{id}_battle.svg` |
| Floor tile A / B / C | 32×32 | `floor_{theme}.svg / _b / _c` |
| Wall tile | 32×32 | `wall_{theme}.svg` |
| Decoration (accent) | 32×32+ | `decoration_{name}.svg` |
| Landmark (set-piece) | ~160×128 | `landmark_{name}.svg` |
| Backdrop | 800×600 | `backdrop_{theme}.svg` |

> **Tile-blending rule:** All A/B/C variants of the same floor tile **must use an identical base `<rect fill="…">`**. Only accent layers drawn on top of the base rect should differ — otherwise tile seams render as visible colour bands at runtime.

### 6. Asset key registry — `src/config/AssetConfig.js`

Add every new texture key to the correct array (`SPRITE_KEYS`, `TILE_KEYS`, `DECORATION_KEYS`, …) so `BootScene` preloads it before the region is entered.

### 7. Procedural map data — `src/data/ProceduralMap.js`

Four arrays are indexed **by region ID**. Insert a new entry at index N (all later entries shift automatically; no existing region breaks):

| Array | What to add |
|-------|-------------|
| `TILE_FN` | `(h) => key` — picks a floor tile variant by noise height `h` |
| `ACCENT_LAYERS` | `[{ key, freq, threshold, seed }, …]` — scattered decoration passes |
| `SET_PIECES` | `{ key, tilesW, tilesH, blocking, margin }` — the region landmark |
| `ITEM_POOLS` | `['itemId1', 'itemId2']` — fallback loot when enemy has no drop |

### 8. Decoration scales — `src/scenes/ExploreScene.js`

In `_addDecorations()` find the `SCALES` map and add an entry for each new decoration/landmark key (e.g., `decoration_windmill: 1.20`). Omitting a key defaults to `1.0`.

### 9. Bestiary — `src/scenes/BestiaryScene.js`

- Append enemy IDs to `CANON_ORDER` in the correct region block comment.
- Push one entry each to `REGION_NAMES`, `GRADE_LABELS`, `REGION_BG`, `REGION_ACCENT`.
- Recalculate `COLS`, `CARD_W`, `CARD_H`, `GAP_X`, `GAP_Y`, `GRID_START_Y` to keep the full grid within 600 px tall (aim for 4 rows max at current enemy count).
- Update the count badge string.

### 10. Run the full test suite

```bash
node test_unlock.mjs        # 33 GameState / save-logic checks
node test_questions.mjs     # ~68 k question-sample bounds & structure checks
node test_connectivity.mjs  # BFS pathfinding for every region map
```

All three must exit with **0 failures** before the region is shippable.
