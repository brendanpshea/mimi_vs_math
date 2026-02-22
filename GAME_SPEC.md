# Mimi vs. Math — Game Specification

## Overview

Mimi vs. Math is a browser-based, Zelda-style top-down adventure game built with
**JavaScript + Phaser.js**. Mimi the cat explores a whimsical world, encounters enemies,
and defeats them by answering math questions. The game targets **elementary and middle-grade
players (ages 6–13)** and covers addition, subtraction, multiplication, division, fractions,
decimals, and mixed challenge content across five regions.

---

## Tech Stack

| Component | Choice |
|---|---|
| Engine | Phaser 3 (JavaScript) |
| Platform | Browser (no install required) |
| Entry point | `index.html` |
| Asset format | SVG sprites |
| Audio | Not yet implemented |

---

## Game World & Progression

### Structure

```
Overworld Map
├── Region 0: Sunny Village        (Addition & Subtraction)
├── Region 1: Meadow Maze          (Multiplication)
├── Region 2: Desert Dunes         (Division)
├── Region 3: Frostbite Cavern     (Fractions & Decimals)
└── Region 4: Shadow Castle        (Mixed / Challenge)
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

- **Movement:** WASD or arrow keys; 4-directional
- **Interaction:** Spacebar or Enter to talk to NPCs / interact with the boss door
- **Pause / back:** Esc returns to overworld or closes the current overlay

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
│   │   └── BossIntroScene.js  # Animated boss-introduction cutscene
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
│   │   ├── regions.js         # Region metadata, unlock order
│   │   ├── maps.js            # Procedural decoration data per region
│   │   └── npcJokes.json      # NPC dialogue lines
│   └── ui/
│       ├── HUD.js             # Hearts, accuracy stats, inventory pills
│       └── DialogBox.js       # NPC dialogue display
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
| M3 | ✅ Done | All 5 regions with enemies, bosses, boss-intro cutscenes, item drops |
| M4 | ✅ Done | Full progression, save/load, world-select, stats tracking |
| M5 | ✅ Done | 9 lives, star ratings, hard-mode rematch, BGM/SFX, heart HUD |
| M6 | 🔄 In progress | Mobile touch controls, accessibility polish |

---

## Out of Scope (v1)

- Multiplayer or leaderboards
- Audio beyond basic SFX placeholders
- Mobile touch controls (desktop-first)
- User accounts or server-side save data
