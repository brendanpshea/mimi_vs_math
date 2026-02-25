# Mimi vs. Math

**Zelda-style adventure + math battles for elementary students (Grades 1–5).**

🎮 **[Play Now →](https://brendanpshea.github.io/mimi_vs_math/)**

---

## About This Project

All of the code and asssets for this project were developed using AI models (**Claude Sonnet 4.6** and **Claude Opus 4.6**) as an exploration of what modern AI systems can create with appropriate guidance. I (Brendan) have very limited Phaser/JavaScript/Node.js experience, though I do have experience in software engineering more generally. This project was meant--in part--as a test of how AI capability to handle full-stack game development for relative novices, including:

**What AI built:**
- ✨ **Game engine code** — Phaser 3 scene architecture, collision detection, entity AI
- 🎵 **Procedural audio** — Tone.js music generator with 5 dynamic tracks + sound effects
- 🎨 **176 SVG sprites** — All characters, enemies, tiles, UI elements (via detailed prompting)
- 🧪 **Test suites** — 6 test files with 75,000+ automated validation checks
- ⚡ **Build tools** — SVG→PNG conversion and texture atlas packing (Node.js)
- 📊 **Math content** — 57 question generators (19 topics × 3 difficulty levels)
- 🗺️ **Procedural maps** — Perlin noise terrain, decoration placement, pathfinding validation

All code, asset definitions, test logic, and documentation were AI-generated.

---

## Game Features

### 7 Regions × Progressive Math Curriculum

| Region | Grade | Topics |
|--------|-------|--------|
| Sunny Village | 1 | Addition, Subtraction, Comparison |
| Windmill Village | 2 | Place Value, Regrouping |
| Meadow Maze | 2.5 | Times Tables, Doubling |
| Mycelium Hollow | 3 | Multi-Digit Multiplication |
| Desert Dunes | 3.5 | Division, Word Problems |
| Frostbite Cavern | 4 | Fractions, Decimals |
| Shadow Castle | 5 | Order of Operations, Percentages, Ratios |

### Turn-Based Math Battles

- **Timed questions** with4 multiple-choice answers
- **Dynamic difficulty** — 3 levels per topic (common/elite/boss)
- **Performance bonuses** — Fast answers (<⅓ timer) deal extra damage
- **Streak system** — 3+ consecutive correct = permanent +1 damage boost
- **Worked solutions** — Wrong answers show step-by-step explanations
- **Pause-friendly** — Timer stops, settings accessible mid-battle

### Progression & Replayability

- **Star ratings** — Earn 1–3 ★ per boss based on accuracy
- **Hard Mode** — Replay bosses with:
  - +1 difficulty level (D1→D2, D2→D3)
  - −5 seconds per question (min 8s timer)
  - ⚔ Badge on completion
- **9 Lives system** — Multiple attempts per battle; respawn mechanics
- **Bestiary** — Track all encountered enemies
- **Stats dashboard** — Accuracy, streaks, perfect battles, avg answer time

### Accessibility Features

- **Timer speed control** — 1×, 1.5×, 2×, 3× multipliers (persists across saves)
- **Volume controls** — Adjustable or mute music/SFX
- **Touch support** — On-screen D-pad for mobile devices
- **Keyboard shortcuts** — WASD/arrows + number keys for answers

### Power-Up Items

| Item | Effect |
|------|--------|
| 🐟 Sardine | Restore 2 HP |
| 🧶 Yarn Ball | +5 seconds to timer (one battle) |
| 🌿 Catnip | 2× damage on next correct answer |
| 💎 Lucky Collar | Block one enemy hit |
| 🦴 Fish Fossil | Reveal one wrong answer (3 uses) |

---

## Tech Stack

- **Engine:** Phaser 3 (loaded from CDN, no build step required)
- **Language:** JavaScript ES6+ modules (no transpilation)
- **Audio:** Tone.js procedural music + Web Audio API SFX
- **Assets:** 176 SVG sprites (optional PNG/atlas conversion)
- **Storage:** localStorage with auto-save & version migration
- **Testing:** Node.js `.mjs` test files (pure ESM, no browser)
- **Hosting:** GitHub Pages (static files)

---

## For Developers

### Quick Start

```bash
# Run locally
python -m http.server 8080
# Open http://localhost:8080

# Run tests (Node.js required)
node test_questions.mjs    # 75k math content checks
node test_unlock.mjs       # Game state logic (37 checks)
node test_connectivity.mjs # Map pathfinding (210 checks)
node test_data.mjs         # Data integrity (579 checks)
```

### Asset Optimization (Optional)

```bash
npm install        # Install dependencies
npm run convert    # SVG → PNG (using Sharp)
npm run pack       # Create texture atlases (176 files → 10)
```

Then in `src/config/AssetConfig.js`:
```js
export const ASSET_TYPE = 'png';   // Switch from SVG
export const ATLAS_MODE = true;    // Enable atlases (~90% fewer HTTP requests)
```

### Documentation

📖 **[DEV_GUIDE.md](DEV_GUIDE.md)** — Complete developer documentation:
- Architecture overview & key components
- Adding new regions (step-by-step guide)
- Asset pipeline details (SVG→PNG→atlases)
- Test suite reference
- Project structure

📋 **[CLAUDE.md](CLAUDE.md)** — AI-assisted development notes

---

## Controls

| Input | Action |
|-------|--------|
| WASD / Arrow keys | Move Mimi |
| Space / Enter | Interact (NPCs, boss doors) |
| 1 / 2 / 3 / 4 | Select battle answer |
| P / Esc | Pause (battle) / Return to overworld |
| On-screen D-pad | Touch controls (mobile) |
| ⚙ Settings button | Timer speed, music, SFX |

---

## Project Structure

```
mimi_vs_math/
├── src/
│   ├── scenes/          # 8 Phaser scenes (Boot, Title, Overworld, Explore, Battle, etc.)
│   ├── entities/        # Player (Mimi), Enemy AI, NPCs
│   ├── math/            # QuestionBank, Distractors, Explanations (57 generators)
│   ├── ui/              # HUD, DialogBox, VirtualDPad, Settings, BossDoor
│   ├── data/
│   │   ├── regions/     # 7 region data modules
│   │   ├── enemies.js   # All enemy definitions
│   │   └── ProceduralMap.js  # Terrain generation, decorations, landmarks
│   ├── config/
│   │   ├── AssetConfig.js    # Asset registry, SVG/PNG/atlas switching
│   │   └── GameState.js      # Save data, localStorage persistence
│   └── audio/           # Tone.js BGM manager
├── assets/
│   ├── sprites/         # 176 SVG files (or generated PNGs)
│   ├── atlases/         # Generated texture atlases (optional)
│   └── audio/           # Sound effects + sampled instruments
├── tools/
│   ├── svg_to_png.js    # Asset conversion (Node.js + Sharp)
│   └── pack_atlases.js  # Texture atlas packing
└── tests/               # 6 test suites (75k+ checks)
```

---

## License

See [LICENSE](LICENSE)
