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
| Space / Enter | Interact (NPC, chest) |
| 1 / 2 / 3 / 4 | Select battle answer |
| Esc | Return to overworld |

---

## Tech Stack

- **Engine:** [Phaser 3](https://phaser.io/) — loaded from CDN, no build step
- **Assets:** SVG sprites (created inline; see `assets/sprites/`)
- **Persistence:** `localStorage`
- **Hosting:** GitHub Pages (static files from repo root)

---

## Swapping SVG → PNG Assets

1. Open `src/config/AssetConfig.js`
2. Change `ASSET_TYPE` from `'svg'` to `'png'`
3. Place PNG files at the same paths as the SVG files (same name, `.png` extension)
   - Character sprites: **64×64 px** · Boss sprites: **96×96 px** · UI icons: **32×32 px**

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
│   │   └── GameState.js
│   ├── scenes/              ← Boot, Title, Overworld, Explore, Battle
│   ├── entities/            ← Mimi, Enemy
│   ├── math/                ← QuestionBank, Distractors
│   ├── data/                ← regions.js, enemies.js, items.js
│   └── ui/                  ← HUD, DialogBox
└── assets/sprites/          ← SVG files (one per character/boss + ui/)
```
