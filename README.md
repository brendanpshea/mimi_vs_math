# Mimi vs. Math

Mimi the cat goes on Zelda-style adventures and battles enemies by answering math questions.

**Grades 1–5 · Browser-based · No install required**

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

| # | Region | Grades | Topic |
|---|--------|--------|-------|
| 0 | Sunny Village | 1–3 | Addition & Subtraction |
| 1 | Meadow Maze | 4–5 | Multiplication |
| 2 | Desert Dunes | 4–5 | Division |
| 3 | Frostbite Cavern | 5–6 | Fractions & Decimals |
| 4 | Shadow Castle | 6–7 | Mixed Challenge |

---

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow keys | Move Mimi |
| Space / Enter | Interact (NPC, boss door) |
| 1 / 2 / 3 / 4 | Select battle answer |
| Esc | Return to overworld / close overlay |

---

## Progression

- Select **New Game** from the title screen to choose a starting world (all prior worlds unlock automatically).
- Each region has 3–5 enemies and a boss. Defeat all enemies to unseal the boss door.
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

- Question difficulty is raised by one level (D1→D2, D2→D3, etc.)
- Timer is reduced by 5 seconds per question
- A **🗡 HARD MODE** banner appears in the battle HUD
- Completion marks the node with a ⚔ badge

### 9 Lives

Mimi has **9 lives** per save. Each defeat in battle uses one life — the world is preserved and Mimi re-enters near the enemy with HP fully restored. Once all 9 lives are spent, she retreats to the region entrance with HP half-restored.

---

## Stats Tracking

Mimi's math performance is tracked throughout the entire save and is visible from:

- The **world map** (📊 Full Stats button in the player card and auto-shown after a boss defeat)
- The **title screen** (📊 View Stats button, shown once any questions have been answered)
- The **world-select overlay** (same Stats button)

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
│   ├── config/
│   │   ├── AssetConfig.js   ← SVG/PNG switch lives here
│   │   └── GameState.js     ← save/load + stats tracking
│   ├── scenes/              ← Boot, Title, Overworld, Explore, Battle, Story, BossIntro
│   ├── entities/            ← Mimi, Enemy, NPC
│   ├── math/                ← QuestionBank, Distractors, Explanations
│   ├── data/                ← regions.js, enemies.js, items.js, maps.js
│   └── ui/                  ← HUD (accuracy display), DialogBox
└── assets/sprites/          ← SVG files (walk cycles, battle pose, bosses, UI)
```
