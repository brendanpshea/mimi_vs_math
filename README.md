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

| # | Region | Grade | Topics |
|---|--------|-------|--------|
| 0 | Sunny Village    | 1–3 | Addition, Subtraction, Comparison (ordering + word problems) |
| 1 | Windmill Village | 2   | Place Value, Addition with carrying, Subtraction with borrowing |
| 2 | Meadow Maze      | 3–5 | Times Tables, Skip Counting, Doubling & Halving, Multiplication |
| 3 | Desert Dunes     | 4–5 | Division, Division Word Problems, Missing Number |
| 4 | Frostbite Cavern | 5–6 | Fraction Comparison, Fraction Addition, Decimals |
| 5 | Shadow Castle    | 6–7 | Order of Operations, Percentages, Ratios & Proportions |

Word problems receive an automatic +8 second reading bonus on top of the base timer.

---

## Controls

| Key / Input | Action |
|-------------|--------|
| WASD / Arrow keys | Move Mimi |
| On-screen D-pad (touch) | Move Mimi (touch devices only) |
| Space / Enter | Interact (NPC, boss door) |
| 1 / 2 / 3 / 4 | Select battle answer |
| P / Esc | Pause / resume battle (opens pause overlay) |
| Esc (explore) | Return to overworld / close overlay |
| ⚙ Settings button | Open settings (title, overworld, explore, or within the pause overlay) |

---

## Settings & Accessibility

A **⚙ Settings** panel is reachable from every screen — the title, the world map, in-region exploration, and the battle pause overlay.

| Setting | Options | Notes |
|---------|---------|-------|
| ⏱ Answer Timer Speed | 1× · 1.5× · 2× · 3× | Multiplies every question's allotted time. Useful for younger players or slower readers. Saved to `localStorage` and **not** reset by New Game. |
| ♩ Music Volume | Off · Low (25%) · Med (50%) · High (75%) · Max (100%) | Adjusts BGM in real time via Tone.js. |
| ♫ SFX Volume | Off · Low (25%) · Med (50%) · High (75%) · Max (100%) | Adjusts all sound effects. |

All three preferences persist across sessions and are migrated forward when a save from an older version is loaded.

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

### Pause

Press **P** or **Esc** during a battle to open the pause overlay. The timer stops, all tweens pause, and a **▶ Resume** button is shown alongside a **⚙ Settings** shortcut. The overlay also appears as the pause button (bottom-left of the battle HUD).

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
- **Display:** `Scale.EXPAND` — fills any screen size; content column capped at 820 px so layout stays compact on 16:9 / ultrawide displays
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

## Adding a New Region (Developer Guide)

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
| `bossIntro` | `{speaker,text}[]` | Cutscene lines (≤ 6 per speaker — see text-overflow note below) |
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
| Walk frames A/B/C | 26×26 | `{id}.svg`, `{id}_b.svg`, `{id}_c.svg` |
| Battle pose | 96×96 | `{id}_battle.svg` |
| Floor tile A/B/C | 32×32 | `floor_{theme}.svg / _b / _c` |
| Wall tile | 32×32 | `wall_{theme}.svg` |
| Decorations | 32×32+ | `decoration_{name}.svg` |
| Landmark (set-piece) | ~160×128 | `landmark_{name}.svg` |
| Backdrop | 800×600 | `backdrop_{theme}.svg` |

> **Critical:** all A/B/C variants of the same floor tile must share an identical base `<rect fill="...">`. Only the accent detail layer on top should differ — otherwise seams are visible at runtime.

### 6. Asset key registry — `src/config/AssetConfig.js`

Add every new key to the correct array (`SPRITE_KEYS`, `TILE_KEYS`, `DECORATION_KEYS`, etc.) so `BootScene` preloads it.

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

### 10. Run the full test suite

```bash
node test_unlock.mjs        # 33 GameState / save-logic checks
node test_questions.mjs     # ~68 k question-sample bounds & structure checks
node test_connectivity.mjs  # BFS pathfinding for every region map
```

All three must exit with **0 failures** before shipping.

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
│   ├── scenes/              ← Boot, Title, Overworld, Explore, Battle, Story, BossIntro, Bestiary
│   ├── entities/            ← Mimi (4-frame walk cycles), Enemy (patrol/aggro AI), NPC
│   ├── math/                ← QuestionBank (17 topic generators, D1–D3), Distractors, Explanations
   ├── data/                ← regions/ (region_0–5.js + index.js barrel), enemies.js, items.js, maps.js, ProceduralMap.js
│   └── ui/                  ← HUD, DialogBox, VirtualDPad (touch), SettingsOverlay
└── assets/
    ├── sprites/             ← SVG files (walk cycles A/B/C frames, battle poses, bosses, UI)
    └── audio/
        └── samples/         ← MP3 instrument samples (piano, guitar, violin, cello)
```
