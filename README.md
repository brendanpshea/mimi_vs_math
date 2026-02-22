# Mimi vs. Math

Mimi the cat goes on Zelda-style adventures and battles enemies by answering math questions.

**Grades 1–7 · Browser-based · No install required**

---

## Play

Open `index.html` via a local HTTP server (required for ES modules):

```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

Or host via **GitHub Pages** — see setup notes below.

---

## Regions & Math Topics

Each region has multiple enemy types, each with its own question sub-type(s) and difficulty. Three difficulty levels (D1–D3) apply within every topic.

| # | Region | Grades | Topics |
|---|--------|--------|--------|
| 0 | Sunny Village | 1–3 | Addition, Subtraction, Number Comparison, Number Ordering |
| 1 | Meadow Maze | 3–5 | Times Tables, Skip Counting, Doubling & Halving, Multiplication |
| 2 | Desert Dunes | 4–5 | Division, Division Word Problems, Missing Number |
| 3 | Frostbite Cavern | 5–6 | Fraction Comparison, Fraction Addition, Decimals |
| 4 | Shadow Castle | 6–7 | Order of Operations, Percentages, Ratios & Proportions, Mixed |

Word problems receive an automatic +8 second reading bonus on top of the base timer.

---

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow keys | Move Mimi |
| Space / Enter | Interact (NPC, boss door) |
| 1 / 2 / 3 / 4 | Select battle answer |
| Esc | Run away from battle / return to overworld / close overlay |

---

## Battle System

Walking into an enemy starts a turn-based math battle:

- A question is displayed with four answer choices and a countdown timer.
- **Correct (fast, < ⅓ of timer):** deal 3 damage + an ⚡FAST! bonus flash.
- **Correct (normal):** deal 2 damage.
- **3-answer streak:** all subsequent correct answers deal +1 bonus damage.
- **Wrong or timeout:** enemy deals 1–2 damage; the correct answer is revealed; an explanation overlay shows the working-out.
- **Run away** (non-boss only, [Esc] or the on-screen button): exit at a cost of 1 HP.

Visual feedback on every event: floating damage numbers, enemy squash-and-bounce, camera shake, screen flash, HP bars animated with a colour drain (green → yellow → red).

### Difficulty levels per enemy

All question generators have three difficulty levels:

| Level | Used for |
|-------|---------|
| D1 | Common enemies in early encounters |
| D2 | Elite enemies and mid-region common enemies |
| D3 | Boss battles and Hard Mode |

### Post-battle

The victory overlay shows accuracy, streak badge (if ≥ 3 consecutive), perfect-battle badge, star rating, any item dropped, and a boss-unlock message where applicable.

---

## Progression

- Select **New Game** from the title screen to choose a starting world (all prior worlds unlock automatically).
- Each region has a set of regular enemies and a boss door sealed until all regular enemies are defeated.
- Beating a boss unlocks the next region, awards a **star rating (1–3 ★)**, and opens the Stats overview.
- Select **Continue** to return to the world map from a save.

### Star Ratings

Every boss battle earns a star rating shown on the world-map node and the victory overlay:

| Stars | Condition |
|-------|-----------|
| ★★★ | Zero wrong answers (perfect battle) |
| ★★☆ | ≤25 % wrong answers |
| ★☆☆ | Any other win |

Ratings only improve — replaying a boss can never lower your star count.

### Hard Mode Rematch

After clearing a region, click its overworld node and choose **⚔ Hard Mode (Boss Rematch)**:

- Question difficulty is raised by one level (D1→D2, D2→D3, capped at D3)
- Timer is reduced by 5 seconds per question (floor: 8 s)
- A **🗡 HARD MODE** banner appears in the battle HUD
- Completion marks the node with a ⚔ badge

### 9 Lives

Mimi has **9 lives** per save. Each defeat in battle uses one life — the world is preserved and Mimi re-enters near the enemy with HP fully restored. Once all 9 lives are spent, she retreats to the region entrance with HP half-restored.

---

## Audio

All music is generated in real time via **Tone.js** using sampled piano, guitar, violin, and cello.

| Track | Plays during |
|-------|-------------|
| Title | Title screen |
| Overworld | World map |
| Explore | Exploration (in-region walking) |
| Battle | Regular enemy battles |
| Boss | Boss battles |

Sound effects cover: battle start, correct answer, wrong answer, hitting the enemy, taking damage, timer warning (at 5 seconds), and level-up / victory fanfares.

---

## Stats Tracking

Mimi's math performance is tracked throughout the entire save and is visible from:

- The **world map** (📊 Full Stats button in the player card, auto-shown after a boss defeat)
- The **title screen** (📊 View Stats, shown once any questions have been answered)
- The **world-select overlay**

Tracked stats:

| Stat | Description |
|------|-------------|
| Questions Answered | Total questions seen across all battles |
| Correct / Incorrect | Raw counts |
| Accuracy % | `correct / answered × 100` |
| Avg. Answer Time | Mean time in seconds per question |
| Best Streak | Longest run of consecutive correct answers |
| Battles Won / Lost | Battle outcomes |
| Perfect Battles | Won with zero wrong answers or timeouts |

---

## Items (Enemy Drops)

Enemies drop items at the end of battle (30% chance for regular enemies, 100% for bosses). The item's name and description are shown in the victory overlay.

| Item | Effect |
|------|--------|
| 🐟 Sardine | Restore 2 HP |
| 🧶 Yarn Ball | +5 seconds added to battle timer (one battle) |
| 🌿 Catnip | Double damage on next correct answer |
| 💎 Lucky Collar | Shield — blocks one hit from an enemy |
| 🦴 Fish Fossil | Reveal one incorrect choice per question (3 uses) |

---

## Tech Stack

- **Engine:** [Phaser 3](https://phaser.io/) — loaded from CDN, no build step
- **Music:** [Tone.js](https://tonejs.github.io/) — procedural BGM using sampled instruments
- **Assets:** SVG sprites (see `assets/sprites/`)
- **Persistence:** `localStorage`
- **Hosting:** GitHub Pages (static files from repo root)

---

## Swapping SVG → PNG Assets

1. Open `src/config/AssetConfig.js`
2. Change `ASSET_TYPE` from `'svg'` to `'png'`
3. Place PNG files at the same paths as the SVG files (same name, `.png` extension)
   - Character sprites: **64×64 px** · Boss sprites: **96×96 px** · Battle sprite: **96×96 px** · UI icons: **32×32 px**

No other code changes needed — all scenes reference texture keys only.

---

## GitHub Pages Setup

1. Push to GitHub
2. **Settings → Pages → Source:** branch `main`, folder `/ (root)`
3. The `.nojekyll` file in the root ensures ES modules are served correctly

---

## Project Structure

```
mimi_vs_math/
├── index.html               ← entry point (GitHub Pages root)
├── .nojekyll
├── src/
│   ├── main.js
│   ├── audio/
│   │   └── BGM.js           ← Tone.js BGM manager (5 tracks, 4 instruments)
│   ├── config/
│   │   ├── AssetConfig.js   ← SVG/PNG switch lives here
│   │   └── GameState.js     ← save/load + stats tracking
│   ├── scenes/              ← Boot, Title, Overworld, Explore, Battle, Story, BossIntro
│   ├── entities/            ← Mimi (4-frame walk cycles), Enemy (patrol/aggro AI), NPC
│   ├── math/                ← QuestionBank (18+ topic generators, D1–D3), Distractors, Explanations
│   ├── data/                ← regions.js, enemies.js, items.js, maps.js
│   └── ui/                  ← HUD, DialogBox
└── assets/
    ├── sprites/             ← SVG files (walk cycles A/B/C frames, battle poses, bosses, UI)
    └── audio/
        └── samples/         ← MP3 instrument samples (piano, guitar, violin, cello)
```
