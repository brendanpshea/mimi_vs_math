# Mimi vs. Math — Game Specification

## Overview

Mimi vs. Math is a browser-based, Zelda-style top-down adventure game built with
**JavaScript + Phaser.js**. Mimi the cat explores a whimsical world, encounters enemies,
and defeats them by answering math questions. The game targets **middle-grade players
(ages 9–12)** and focuses on multiplication, division, and fractions.

---

## Tech Stack

| Component | Choice |
|---|---|
| Engine | Phaser 3 (JavaScript) |
| Platform | Browser (no install required) |
| Entry point | `index.html` |
| Asset format | PNG sprites, JSON tilemaps (Tiled) |
| Audio | OGG/MP3 via Phaser's audio manager |

---

## Game World & Progression

### Structure

```
Overworld Map
├── Region 1: Meadow Maze          (Multiplication)
├── Region 2: Desert Dunes         (Division)
├── Region 3: Frostbite Cavern     (Fractions & Decimals)
└── Region 4: Shadow Castle        (Mixed / Challenge)
```

Each region contains:
- A **tile-map exploration area** (8–10 screens wide)
- **3–5 enemy types** scaled to that region's math theme
- **1 boss encounter** to unlock the next region
- **2–3 NPCs** who give hints, lore, or optional side challenges
- **Treasure chests** containing power-ups

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
| HP | 6 hearts (12 HP); displayed as cat-paw icons |
| Speed | Movement speed across the tile map |
| Math Power | Multiplier applied to bonus damage for fast correct answers |

### Power-ups (collectible from chests or NPCs)

| Item | Effect |
|---|---|
| Sardine | Restore 2 HP |
| Yarn Ball | +5 seconds added to battle timer (one battle) |
| Catnip | Double damage on next correct answer |
| Lucky Collar | Wrong answer does not cost HP (one battle) |
| Fish Fossil | Reveal one incorrect choice per battle (3 uses) |

### Persistence

- Progress saved to `localStorage` (current region, HP, collected items)
- Mimi respawns at the start of the current region's entrance if HP reaches 0
  (no permanent game-over)

---

## Exploration (Zelda-style)

- **Movement:** WASD or arrow keys; 4-directional
- **Interaction:** Spacebar or Enter to talk to NPCs / open chests / read signs
- **Minimap:** Small map in top-right corner showing current room
- **Pause menu:** Esc key; shows HP, inventory, current region, controls

### Rooms & Layout

- Each region is divided into rooms connected by doorways
- Some doors are **locked** (require a key item found in a chest)
- **Puzzle rooms** exist where Mimi must answer a math question to open a door
  (no combat; just a single question with typed or multiple-choice input)

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

- Defeated enemy drops XP (shown as stars) and occasionally an item
- XP fills a level bar; leveling up increases Mimi's Math Power by 0.1×

---

## Math Content

### Region 1 — Multiplication (grades 4–5)

- Times tables: factors 2–12
- Multi-digit × single-digit (e.g., `23 × 4`)
- Word problems presented as story text above the equation

### Region 2 — Division (grades 4–5)

- Division facts derived from Region 1 tables
- Long division with remainders (quotient only required)
- Division word problems

### Region 3 — Fractions & Decimals (grades 5–6)

- Comparing fractions (which is larger?)
- Adding/subtracting fractions with like & unlike denominators
- Converting fractions ↔ decimals
- Multiplying a fraction by a whole number

### Region 4 — Mixed Challenge (grades 6–7)

- Order of operations (no exponents)
- Percentages (e.g., "What is 30% of 80?")
- Ratio & proportion
- Negative number arithmetic

### Answer Choice Generation

- 1 correct answer
- 3 plausible distractors generated procedurally:
  - Off-by-one errors
  - Common misconception answers (e.g., adding instead of multiplying)
  - Nearby round numbers

---

## Enemies

### Region 1 — Meadow Maze

| Enemy | Sprite concept | Special behavior |
|---|---|---|
| Slime Pup | Green blob with eyes | None |
| Cactus Sprite | Small cactus with arms | Presents 2 problems per turn (answer both) |
| Cloud Bully | Angry cloud | Timer is 3 s shorter |

**Boss: Count Multiplico** — Giant owl with a monocle; 30 HP; presents chained
multiplication (e.g., `(3 × 4) × 2`).

### Region 2 — Desert Dunes

| Enemy | Sprite concept | Special behavior |
|---|---|---|
| Sand Scarab | Beetle with gears | Remainders required |
| Mummy Cat | Bandaged cat | Wrong answer heals enemy by 1 |
| Mirage Fox | Shimmering fox | Choices reshuffle at 5 s mark |

**Boss: The Diviner** — Ancient sphinx; 30 HP; asks division word problems.

### Region 3 — Frostbite Cavern

| Enemy | Sprite concept | Special behavior |
|---|---|---|
| Ice Frog | Blue frog on ice | Fraction comparison only |
| Snow Golem | Snowman with claws | Two fractions, must select the sum |
| Crystal Bat | Gem-winged bat | Decimal problems; timer 12 s |

**Boss: Glacius the Fraction Dragon** — 30 HP; problems involve both fractions
and decimals.

### Region 4 — Shadow Castle

| Enemy | Sprite concept | Special behavior |
|---|---|---|
| Shadow Knight | Dark armored cat | Order of operations |
| Ratio Raven | Raven with scales | Proportion problems |
| Percent Wraith | Ghostly figure | Percentage calculations |

**Boss: Professor Negativus** — 40 HP; mixed problems across all types; no timer
displayed (hidden countdown).

---

## UI / HUD

### Exploration HUD

```
┌─────────────────────────────────────────────┐
│ [♥♥♥♥♥♥]  Region: Meadow Maze   [minimap]  │
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
├── package.json
├── src/
│   ├── main.js              # Phaser game config, scene registration
│   ├── scenes/
│   │   ├── BootScene.js     # Preload assets
│   │   ├── TitleScene.js    # Title screen, difficulty select
│   │   ├── OverworldScene.js# Region select map
│   │   ├── ExploreScene.js  # Tile-map exploration (reused per region)
│   │   └── BattleScene.js   # Math battle UI
│   ├── entities/
│   │   ├── Mimi.js          # Player sprite, movement, stats
│   │   └── Enemy.js         # Enemy base class + subclasses
│   ├── math/
│   │   ├── QuestionBank.js  # Question generation per topic
│   │   └── Distractors.js   # Procedural wrong-answer generation
│   ├── data/
│   │   ├── enemies.json     # Enemy definitions (HP, damage, math topic)
│   │   ├── items.json       # Item definitions and effects
│   │   └── regions.json     # Region metadata, unlock order
│   └── ui/
│       ├── HUD.js           # HP bars, timer, inventory display
│       └── DialogBox.js     # NPC dialogue and sign text
├── assets/
│   ├── sprites/             # Mimi, enemies, tiles, items
│   ├── maps/                # Tiled JSON map files
│   ├── audio/               # BGM and SFX
│   └── fonts/               # Bitmap or web fonts
└── GAME_SPEC.md
```

---

## Milestones

| Milestone | Deliverable |
|---|---|
| M1 | Phaser project scaffolded; Mimi moves on a placeholder tile map |
| M2 | Battle scene works end-to-end with Region 1 math questions |
| M3 | Full Region 1 complete (map, enemies, boss, items) |
| M4 | Regions 2 & 3 complete |
| M5 | Region 4 + full progression, save/load, polish |

---

## Out of Scope (v1)

- Multiplayer or leaderboards
- Sound-design beyond basic SFX placeholders
- Mobile touch controls (desktop-first)
- User accounts or server-side save data
- Procedurally generated maps
