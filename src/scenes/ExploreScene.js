/**
 * ExploreScene  scrolling top-down world exploration.
 *
 * Zelda / FF style: world is larger than the viewport; the camera follows
 * Mimi.  All HUD elements use setScrollFactor(0) in their own classes, so
 * they stay fixed to the screen automatically.
 *
 * Scene data expected:  { regionId: number }
 */
import * as Phaser from 'phaser';
import GameState   from '../config/GameState.js';
import BGM         from '../audio/BGM.js';
import REGIONS     from '../data/regions/index.js';
import ENEMIES     from '../data/enemies.js';
import MAPS, { LANDMARKS, POSITIONS, ANIMATED_DECORATIONS } from '../data/maps.js';
import Mimi        from '../entities/Mimi.js';
import Enemy       from '../entities/Enemy.js';
import NPC         from '../entities/NPC.js';
import HUD         from '../ui/HUD.js';
import DialogBox   from '../ui/DialogBox.js';
import NPC_JOKES from '../data/npcJokes.json' with { type: 'json' };
import ITEMS     from '../data/items.js';
import { openSettings, closeSettings } from '../ui/SettingsOverlay.js';
import VirtualDPad from '../ui/VirtualDPad.js';

//  World constants 
const T     = 32;    // tile size in pixels
const MAP_W = 80;    // map width  in tiles  (~5 screens wide)
const MAP_H = 56;    // map height in tiles  (~3.5 screens tall)
const WALL  = 2;     // border wall thickness in tiles

// World-space pixel helpers (no HUD offset  camera handles that)
const tx = col => col * T + T / 2;
const ty = row => row * T + T / 2;

// Key positions are now per-region — read from regionData.mimiStart / .npcTile / .chestTile / .bossTile / .enemySpawns

export default class ExploreScene extends Phaser.Scene {
  constructor() { super({ key: 'ExploreScene' }); }

  init(data) {
    this.regionId     = data?.regionId ?? GameState.currentRegion;
    this.regionData   = REGIONS[this.regionId];
    this.battleResult = data?.battleResult ?? null;
    // Hard defeat (no lives left, not ran away) → reset to spawn so position is
    // not restored. Soft defeat (usedLife) and ran-away restore world/position.
    const isHardDefeat = data?.battleResult?.victory === false
                      && !data?.battleResult?.usedLife
                      && !data?.battleResult?.ranAway;

    // Kill count — session-local, carried through battle roundtrips via returnData.
    // No killCount in data means fresh entry to the region → start at 0 and
    // clear stale defeatedEnemies so enemies spawn fresh on every new visit.
    const freshEntry = data?.killCount == null;
    // On a hard defeat OR fresh entry, fully reset enemy-exclusion state so
    // all enemies respawn at their home positions.
    const resetState = freshEntry || isHardDefeat;
    this._killCount     = resetState ? 0 : (data.killCount ?? 0);
    // Rolling defeat cooldown — keeps the last N enemy instance-keys the
    // player defeated so _setupEnemies can exclude them until they "cool down".
    // This prevents camping the same 1-2 enemies for all 10 kills.
    this._recentDefeats = resetState ? [] : (data?.recentDefeats ?? []);
    if (freshEntry) {
      GameState.clearRegionEnemies(this.regionId);
      if (GameState.regionMaxDifficulty) {
        delete GameState.regionMaxDifficulty[this.regionId];
      }
    }

    // On a run-away, push Mimi 96 px away from the enemy so she doesn't
    // immediately re-trigger the same battle the moment she returns.
    let returnX = isHardDefeat ? null : (data?.mimiX ?? null);
    let returnY = isHardDefeat ? null : (data?.mimiY ?? null);
    if (data?.battleResult?.ranAway && data?.enemyHomeX != null && returnX != null) {
      const FLEE_DIST = 96;
      const dx = (data.mimiX - data.enemyHomeX) || 0;
      const dy = (data.mimiY - data.enemyHomeY) || 1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      returnX = data.mimiX + (dx / len) * FLEE_DIST;
      returnY = data.mimiY + (dy / len) * FLEE_DIST;
    }
    this._returnX    = returnX;
    this._returnY    = returnY;
    this._returnNpcX = isHardDefeat ? null : (data?.npcX ?? null);
    this._returnNpcY = isHardDefeat ? null : (data?.npcY ?? null);
    // Phaser reuses the same scene instance across scene.start() calls, so
    // instance properties set in a previous run persist into the next.
    // Explicitly reset every flag that guards per-run behaviour.
    this._bossBattleStarted = false;
    this._bossOpen          = false;
    this._exitConfirm       = null;
    this._treatGiven        = false;
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    BGM.play('explore');

    // World geometry
    this._drawRoom();
    this._placeLandmarks();
    this._addDecorations();
    this._placeAnimatedDecorations();
    this._addColorGrade();

    // Compute whether THIS battle just crossed the kill-count threshold.
    // Use the pre-increment _killCount (set in init(), before _processBattleResult).
    this._justUnlockedBoss = false;
    if (this.battleResult?.victory && !this.battleResult?.isBoss) {
      const unlockKills = this.regionData.bossUnlockKills;
      if (unlockKills != null) {
        this._justUnlockedBoss =
          this._killCount + 1 >= unlockKills &&
          this._killCount < unlockKills &&
          !GameState.hasDefeatedBoss(this.regionId);
      }
    }

    // Apply battle result before creating enemies (so defeated ones are skipped)
    if (this.battleResult) {
      this._processBattleResult();
    }

    // Player — restore battle-exit position if available, otherwise use randomised spawn
    const dynStart = POSITIONS[this.regionId].mimiStart ?? this.regionData.mimiStart;
    const startX = this._returnX ?? tx(dynStart.col);
    const startY = this._returnY ?? ty(dynStart.row);
    this.mimi = new Mimi(this, startX, startY);
    this.physics.world.setBounds(
      WALL * T, WALL * T,
      (MAP_W - WALL * 2) * T,
      (MAP_H - WALL * 2) * T,
    );
    this.mimi.sprite.setCollideWorldBounds(true);
    this.physics.add.collider(this.mimi.sprite, this._walls);
    this.physics.add.collider(this.mimi.sprite, this._decorObstacles);
    this.physics.add.collider(this.mimi.sprite, this._landmarkObstacles);

    // Camera follows Mimi with slight lerp (Zelda feel)
    this.cameras.main.setBounds(0, 0, MAP_W * T, MAP_H * T);
    this.cameras.main.startFollow(this.mimi.sprite, true, 0.12, 0.12);

    // Game objects
    this._setupEnemies();
    this._setupNPC();
    this._setupBossDoor();
    this._setupInteractiveItems();

    // Ambient particles
    this._createAmbientParticles();

    // UI (scrollFactor(0) set inside these classes)
    this.hud    = new HUD(this, this.regionData);
    this.dialog = new DialogBox(this);

    // Virtual D-pad — shown on touch-capable devices, hidden on keyboard-only
    this._dpad = new VirtualDPad(this);
    this.mimi.setDPad(this._dpad);
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!hasTouch) this._dpad.setVisible(false);

    this.pauseKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── "Return to Map" button in the HUD strip ─────────────────────────────
    const mapBtn = this.add.rectangle(52, 48, 88, 22, 0x0A1A0A, 0.9)
      .setScrollFactor(0).setDepth(52)
      .setStrokeStyle(1, 0x44AA44)
      .setInteractive({ useHandCursor: true });
    const mapTxt = this.add.text(52, 48, '🗺 Map', {
      fontSize: '12px', color: '#88EE88', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(53);
    mapBtn.on('pointerover', () => { mapBtn.setFillStyle(0x153015); mapTxt.setColor('#AAFFAA'); });
    mapBtn.on('pointerout',  () => { mapBtn.setFillStyle(0x0A1A0A, 0.9); mapTxt.setColor('#88EE88'); });
    mapBtn.on('pointerdown', () => this._showExitConfirm());

    // Settings button — sits just right of the Map button
    const setBtn = this.add.rectangle(156, 48, 86, 22, 0x0A0A1C, 0.9)
      .setScrollFactor(0).setDepth(52).setStrokeStyle(1, 0x4466AA)
      .setInteractive({ useHandCursor: true });
    const setTxt = this.add.text(156, 48, '⚙ Settings', {
      fontSize: '12px', color: '#99BBDD', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(53);
    setBtn.on('pointerover', () => { setBtn.setFillStyle(0x1A2050, 0.9); setTxt.setColor('#CCDDFF'); });
    setBtn.on('pointerout',  () => { setBtn.setFillStyle(0x0A0A1C, 0.9); setTxt.setColor('#99BBDD'); });
    setBtn.on('pointerdown', () => openSettings(this, 60));

    // Fullscreen toggle — only shown on touch devices (phones/tablets).
    // On Android Chrome this triggers true browser fullscreen.
    // On iOS, share the URL via the browser and tap “Add to Home Screen”
    // to launch permanently fullscreen as a web app (see apple-mobile-web-app-capable meta).
    if (this.sys.game.device.input.touch) {
      const fsBtn = this.add.rectangle(250, 48, 82, 22, 0x0A1A0A, 0.9)
        .setScrollFactor(0).setDepth(52).setStrokeStyle(1, 0x44AA44)
        .setInteractive({ useHandCursor: true });
      const fsTxt = this.add.text(250, 48, '⛶ Full', {
        fontSize: '12px', color: '#88EE88', fontFamily: "'Nunito', Arial, sans-serif",
      }).setOrigin(0.5).setScrollFactor(0).setDepth(53);
      fsBtn.on('pointerover', () => { fsBtn.setFillStyle(0x153015, 0.9); fsTxt.setColor('#AAFFAA'); });
      fsBtn.on('pointerout',  () => { fsBtn.setFillStyle(0x0A1A0A, 0.9); fsTxt.setColor('#88EE88'); });
      fsBtn.on('pointerdown', () => {
        if (this.scale.isFullscreen) { this.scale.stopFullscreen(); }
        else                         { this.scale.startFullscreen(); }
      });
      this.scale.on('enterfullscreen', () => { if (fsTxt?.active) fsTxt.setText('⛶ Exit'); });
      this.scale.on('leavefullscreen', () => { if (fsTxt?.active) fsTxt.setText('⛶ Full'); });
    }

    if (this.battleResult) {
      this.hud.refresh();
    }
    if (this.battleResult) {
      this.time.delayedCall(200, () => this._showBattleMessages());
    }
  }

  //  Room drawing 

  /**
   * Full-world colour-grade overlay — a single very-transparent rectangle that
   * tints the entire scene with a region-specific hue.  Placed at depth 25 so
   * it sits above sprites but below the HUD (depth 52+).
   * Alpha 0.08 is intentionally imperceptible in isolation; the effect is
   * "something changed" rather than an obvious filter.
   */
  _addColorGrade() {
    const worldW = MAP_W * T;
    const worldH = MAP_H * T;
    const TINTS = [
      0xFFDD88,  // R0 Sunny Village    — very slight warm gold
      0xFFEE88,  // R1 Windmill Village — pale golden
      0x99EE66,  // R2 Meadow Maze      — cool leafy green
      0xFFAA44,  // R3 Desert Dunes     — warm amber
      0x88CCFF,  // R4 Frostbite Cavern — ice blue
      0x440077,  // R5 Shadow Castle    — deep purple
    ];
    this.add.rectangle(worldW / 2, worldH / 2, worldW, worldH,
      TINTS[this.regionId] ?? TINTS[0], 0.08).setDepth(25);
  }

  _drawRoom() {
    const { floorColor, wallColor, floorTile, wallTile } = this.regionData;
    const worldW = MAP_W * T;
    const worldH = MAP_H * T;

    // Tiled floor — randomised multi-variant grid for a 'bathroom tile' look.
    // Each cell independently draws the A (60%), B (25%), or C (15%) variant.
    // Canvas baking is only beneficial in WebGL mode — in Canvas renderer mode
    // (Phaser fallback when WebGL is unavailable, e.g. Firefox without GPU) the
    // large offscreen canvas causes rendering issues, so we skip it entirely.
    const useCanvasBake = (this.game.renderer.type === Phaser.WEBGL);

    if (floorTile && this.textures.exists(floorTile) && useCanvasBake) {
      // Bake the tiled floor into one Canvas texture, then cache it by region.
      // Canvas 2D ctx.drawImage() is a CPU-side operation and ~10-50× faster
      // than individual WebGL framebuffer draws (RenderTexture.drawFrame).
      // On return from battle (the hot path) textures.exists() is true and the
      // entire bake is skipped — cost is a single add.image() call.
      const cacheKey = `__floorBaked_${this.regionId}`;
      if (!this.textures.exists(cacheKey)) {
        const FLOOR_VARIANTS = {
          floor_grass: ['floor_grass', 'floor_grass_b', 'floor_grass_c'],
          floor_wheat: ['floor_wheat', 'floor_wheat_b', 'floor_wheat_c'],
          floor_sand:  ['floor_sand',  'floor_sand_b',  'floor_sand_c' ],
          floor_moss:  ['floor_moss',  'floor_moss_b',  'floor_moss_c' ],
          floor_snow:  ['floor_snow',  'floor_snow_b',  'floor_snow_c' ],
          floor_stone: ['floor_stone', 'floor_stone_b', 'floor_stone_c'],
        };
        const pool = FLOOR_VARIANTS[floorTile] ?? [floorTile];
        const pickVariant = () => {
          const r = Math.random();
          if (r < 0.60) return pool[0];
          if (r < 0.85) return pool[1];
          return pool[2];
        };
        try {
          const canvas = document.createElement('canvas');
          canvas.width  = worldW;
          canvas.height = worldH;
          const ctx = canvas.getContext('2d');
          for (let row = 0; row < MAP_H; row++) {
            for (let col = 0; col < MAP_W; col++) {
              const variant = pickVariant();
              const key = this.textures.exists(variant) ? variant : pool[0];
              ctx.drawImage(this.textures.get(key).getSourceImage(), col * T, row * T, T, T);
            }
          }
          this.textures.addCanvas(cacheKey, canvas);
        } catch (e) {
          console.warn('[ExploreScene] Floor canvas bake failed:', e.message ?? e);
        }
      }
      if (this.textures.exists(cacheKey)) {
        this.add.image(worldW / 2, worldH / 2, cacheKey).setOrigin(0.5, 0.5).setDepth(0);
      } else {
        this.add.rectangle(worldW / 2, worldH / 2, worldW, worldH, floorColor).setDepth(0);
      }
    } else if (floorTile && this.textures.exists(floorTile)) {
      // Canvas renderer fallback: tile sprites (no large offscreen canvas).
      this.add.tileSprite(worldW / 2, worldH / 2, worldW, worldH, floorTile).setDepth(0);
    } else {
      this.add.rectangle(worldW / 2, worldH / 2, worldW, worldH, floorColor).setDepth(0);
    }

    // Border wall rects
    const wallRects = [
      { x: worldW / 2,             y: WALL * T / 2,            w: worldW,   h: WALL * T  },
      { x: worldW / 2,             y: worldH - WALL * T / 2,   w: worldW,   h: WALL * T  },
      { x: WALL * T / 2,           y: worldH / 2,              w: WALL * T, h: worldH    },
      { x: worldW - WALL * T / 2,  y: worldH / 2,              w: WALL * T, h: worldH    },
    ];

    if (wallTile && this.textures.exists(wallTile)) {
      for (const r of wallRects) {
        this.add.tileSprite(r.x, r.y, r.w, r.h, wallTile).setDepth(1);
      }
    } else {
      const g = this.add.graphics().setDepth(1);
      for (const r of wallRects) {
        g.fillStyle(wallColor);
        g.fillRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h);
      }
    }

    // Invisible static bodies for wall collision
    this._walls = this.physics.add.staticGroup();
    for (const r of wallRects) {
      const rect = this.add.rectangle(r.x, r.y, r.w, r.h, 0, 0);
      this.physics.add.existing(rect, true);
      this._walls.add(rect);
    }
  }
  // ── Landmarks (standalone multi-tile obstacles) ────────────────────────────────

  /**
   * Place large multi-tile landmark set-pieces BEFORE decorations.
   * These bypass the decoration pipeline (clearance guard / dedup) entirely
   * because ProceduralMap already guarantees safe placement with margin.
   */
  _placeLandmarks() {
    this._landmarkObstacles = this.physics.add.staticGroup();
    const list = LANDMARKS[this.regionId];
    if (!list || list.length === 0) return;

    for (const lm of list) {
      if (!this.textures.exists(lm.key)) {
        console.warn(`Landmark texture missing: ${lm.key}`);
        continue;
      }
      const lw = (lm.tilesW || 1) * T;
      const lh = (lm.tilesH || 1) * T;
      const lx = tx(lm.col) + lw / 2 - T / 2;
      const ly = ty(lm.row) + lh / 2 - T / 2;
      const depth = 3 + (lm.row / MAP_H) * 6;

      this.add.image(lx, ly, lm.key)
        .setDepth(depth)
        .setDisplaySize(lw, lh);

      if (lm.blocking) {
        const body = this.add.rectangle(lx, ly, lw * 0.9, lh * 0.7, 0, 0);
        this.physics.add.existing(body, true);
        this._landmarkObstacles.add(body);
      }
    }
  }
  // ── Decorations ───────────────────────────────────────────────────────────

  /**
   * Place hand-designed decorations from maps.js.
   *
   * - Runtime clearance guard: skips any item that lands within CLEAR_R tiles
   *   of a key game position (Mimi spawn, NPC, enemies, boss).  This
   *   is a safety net on top of the hand-designed layouts so enemies / NPCs
   *   can never be obscured or physically blocked by a decoration.
   * - Deduplicates same-tile positions so rocks and trees never stack.
   * - Per-type scale factors make adjacent same-type items overlap and merge
   *   into clusters (trees 1.35×, rocks 1.20×, mushrooms 1.15×).
   * - Blocking decorations get a slim static physics body at their base.
   */
  _addDecorations() {
    this._decorObstacles = this.physics.add.staticGroup();
    const useCanvasBake = (this.game.renderer.type === Phaser.WEBGL);
    const layout = MAPS[this.regionId];
    if (!layout || layout.length === 0) return;

    // --- Clearance guard ---------------------------------------------------
    const CLEAR_R = 3;  // tile radius to keep clear around key positions
    const positions = POSITIONS[this.regionId];
    const keyPositions = [
      positions.mimiStart ?? this.regionData.mimiStart,
      positions.npcTile,
      positions.bossTile ?? this.regionData.bossTile,
      ...positions.enemySpawns.map(s => ({ col: s.col, row: s.row })),
    ];
    const isClear = (col, row) => keyPositions.every(
      p => Math.abs(col - p.col) > CLEAR_R || Math.abs(row - p.row) > CLEAR_R,
    );

    // --- Deduplication: first item wins at each tile -----------------------
    const occupied = new Set();
    const deduped  = [];
    for (const item of layout) {
      if (!isClear(item.col, item.row)) continue;  // too close to a key pos
      const tileKey = `${item.col},${item.row}`;
      if (!occupied.has(tileKey)) {
        occupied.add(tileKey);
        deduped.push(item);
      }
    }

    // --- Per-type scale factors (make clusters merge visually) -------------
    const SCALES = {
      decoration_tree:          1.35,
      decoration_tree_b:        1.35,
      decoration_tree_meadow:   1.35,
      decoration_tree_meadow_b: 1.35,
      decoration_rock:          1.20,
      decoration_rock_b:        1.20,
      decoration_mushroom:      1.15,
      decoration_icicle:        1.25,
      decoration_icicle_b:      1.25,
      decoration_pillar:        1.15,
      decoration_pillar_b:      1.15,
      decoration_vine:          1.25,
      decoration_well:          1.10,
      decoration_ice_crystal:   1.20,
      decoration_chains:        1.15,
      decoration_bookshelf:     1.15,
      // Region 1 — Windmill Village
      decoration_windmill:      1.10,
      decoration_hay_bale:      1.00,
      decoration_hay_bale_b:    1.00,
      decoration_wheat_stalk:   1.10,
      decoration_sunflower:     1.15,
    };

    // Bake decoration sprites into a cached Canvas texture.
    // The decoration layout from ProceduralMap is deterministic per region,
    // so it is generated once per session and reused on every re-entry.
    // Physics bodies are still created each launch (physics world resets).
    const decorCacheKey = `__decorBaked_${this.regionId}`;
    if (useCanvasBake && !this.textures.exists(decorCacheKey)) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = MAP_W * T;
        canvas.height = MAP_H * T;
        const ctx = canvas.getContext('2d');
        // Sort ascending by row: items lower on screen are drawn last → appear on top.
        const sortedDecor = [...deduped].sort((a, b) => a.row - b.row);
        for (const item of sortedDecor) {
          if (!this.textures.exists(item.key)) continue;
          const src    = this.textures.get(item.key).getSourceImage();
          const texSrc = this.textures.get(item.key).source[0];
          const scale  = SCALES[item.key] ?? 1.0;
          const dw     = texSrc.width  * scale;
          const dh     = texSrc.height * scale;
          const px     = tx(item.col);
          const py     = ty(item.row);
          ctx.drawImage(src, px - dw / 2, py - dh / 2, dw, dh);
        }
        this.textures.addCanvas(decorCacheKey, canvas);
      } catch (e) {
        console.warn('[ExploreScene] Decoration canvas bake failed:', e.message ?? e);
      }
    }
    if (useCanvasBake && this.textures.exists(decorCacheKey)) {
      this.add.image(MAP_W * T / 2, MAP_H * T / 2, decorCacheKey)
        .setOrigin(0.5, 0.5).setDepth(3);
    } else {
      // Canvas renderer path (or bake failed): individual images, depth-sorted by row.
      const sortedDecor = [...deduped].sort((a, b) => a.row - b.row);
      for (const item of sortedDecor) {
        if (!this.textures.exists(item.key)) continue;
        const scale = SCALES[item.key] ?? 1.0;
        const depth = 3 + (item.row / MAP_H) * 6;
        this.add.image(tx(item.col), ty(item.row), item.key)
          .setScale(scale)
          .setDepth(depth);
      }
    }

    // Physics bodies for blocking decorations — must be created each scene launch.
    for (const item of deduped) {
      if (!item.blocking) continue;
      const px   = tx(item.col);
      const py   = ty(item.row);
      const hitW = T * 0.75;
      const hitH = T * 0.35;
      const body = this.add.rectangle(px, py + T * 0.25, hitW, hitH, 0, 0);
      this.physics.add.existing(body, true);
      this._decorObstacles.add(body);
    }
  }

  // ── Animated decorations (torches, crystals, etc.) ─────────────────────

  /**
   * Place live sprite objects for animated decorations — things that cannot
   * be baked into the static canvas texture because they need tweens.
   *
   * Torch positions come from ANIMATED_DECORATIONS (ProceduralMap corridor elbows).
   * Campfires (R0, R2) and water/ice ripples (R0, R4) are derived from LANDMARKS.
   */
  _placeAnimatedDecorations() {
    // ── Corridor-elbow torches (R5 Shadow Castle) ─────────────
    const items = ANIMATED_DECORATIONS[this.regionId];
    if (items?.length) {
      for (const item of items) {
        if (item.type === 'torch') this._spawnTorch(tx(item.col), ty(item.row));
      }
    }

    // ── Landmark-anchored effects ─────────────────────────────
    const lms = LANDMARKS[this.regionId];
    if (!lms?.length) return;
    const lm    = lms[0];
    const lw    = lm.tilesW * T;
    const lh    = lm.tilesH * T;
    const lmCx  = tx(lm.col) + lw / 2 - T / 2;
    const lmCy  = ty(lm.row) + lh / 2 - T / 2;
    const lmDepth = 3 + (lm.row / MAP_H) * 6;

    // Campfire just below and left of the landmark bottom edge (R0 pond, R2 flower ring).
    if (this.regionId === 0 || this.regionId === 2) {
      this._spawnCampfire(
        lmCx - lw * 0.20,
        lmCy + lh * 0.5 + T * 0.7,
        lmDepth + 1,
      );
    }

    // Water / ice ripples centred on the water surface (R0 pond, R4 frozen lake).
    if (this.regionId === 0 || this.regionId === 4) {
      const rippleColor = this.regionId === 4 ? 0xAADDFF : 0x66BBFF;
      this._spawnWaterRipples(lmCx, lmCy, lw * 0.38, lh * 0.22, rippleColor, lmDepth + 0.5);
    }
  }

  /** Wall sconce: static torch sprite + slow outer corona + fast inner flicker. */
  _spawnTorch(px, py) {
    this.add.image(px, py - 4, 'decoration_torch').setDepth(5);
    const corona = this.add.ellipse(px, py - 10, 24, 24, 0xFF8800, 0).setDepth(4);
    this.tweens.add({
      targets: corona,
      alpha:  { from: 0.0,  to: 0.28  },
      scaleX: { from: 0.8,  to: 1.18  },
      scaleY: { from: 0.8,  to: 1.18  },
      duration: Phaser.Math.Between(700, 960),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 600),
    });
    const flame = this.add.ellipse(px, py - 13, 8, 8, 0xFFDD88, 0.75).setDepth(6);
    this.tweens.add({
      targets: flame,
      alpha:  { from: 0.50, to: 0.95  },
      scaleX: { from: 0.82, to: 1.12  },
      scaleY: { from: 0.82, to: 1.12  },
      duration: Phaser.Math.Between(180, 290),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 220),
    });
  }

  /** Ground campfire: logs sprite + warm corona + fast flame flicker. */
  _spawnCampfire(cx, cy, depth) {
    this.add.image(cx, cy, 'decoration_campfire').setDepth(depth);
    const corona = this.add.ellipse(cx, cy - 8, 32, 32, 0xFF6600, 0).setDepth(depth - 0.5);
    this.tweens.add({
      targets: corona,
      alpha:  { from: 0.0,  to: 0.38  },
      scaleX: { from: 0.8,  to: 1.28  },
      scaleY: { from: 0.8,  to: 1.28  },
      duration: Phaser.Math.Between(580, 880),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 400),
    });
    const flame = this.add.ellipse(cx, cy - 15, 12, 12, 0xFFDD44, 0.85).setDepth(depth + 0.5);
    this.tweens.add({
      targets: flame,
      alpha:  { from: 0.55, to: 1.0   },
      scaleX: { from: 0.70, to: 1.20  },
      scaleY: { from: 0.70, to: 1.20  },
      duration: Phaser.Math.Between(145, 245),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 180),
    });
  }

  /**
   * Concentric expanding ripple rings on a water or ice surface.
   * Three rings staggered evenly in time so they ripple outward sequentially.
   */
  _spawnWaterRipples(cx, cy, rw, rh, color, depth) {
    const RING_COUNT = 3;
    const duration  = 2600;
    for (let i = 0; i < RING_COUNT; i++) {
      const ring = this.add.ellipse(cx, cy, rw * 2, rh * 2, 0, 0)
        .setStrokeStyle(1.5, color, 0.6)
        .setDepth(depth)
        .setScale(0.15);
      this.tweens.add({
        targets: ring,
        scaleX: 1, scaleY: 1,
        alpha:  { from: 0.6, to: 0 },
        duration,
        repeat: -1,
        ease:   'Sine.easeIn',
        delay:  (duration / RING_COUNT) * i,
      });
    }
  }

  //  Enemies 

  _setupEnemies() {
    this._enemies    = [];
    this._liveCount  = 0;
    // Destroy any orbiting-dot auras from a previous call before resetting the list
    if (this._enemyAuras?.length) {
      this._enemyAuras.forEach(pair => pair.dots?.forEach(d => d.destroy()));
    }
    this._enemyAuras = [];   // { enemy, dots, speed, angle } pairs for orbit update()

    // Kill-count regions (bossUnlockKills set): enemies respawn every visit.
    // Two layers of exclusion prevent camping:
    //   1. justDefeated   – the single enemy just killed (never shown immediately)
    //   2. _recentDefeats – a rolling window of the last 2 kills (cooldown period)
    // Together these force the player to seek a 3rd distinct enemy before
    // revisiting any one spawn, eliminating simple back-and-forth farming.
    // Legacy regions (no bossUnlockKills) keep the old per-session tracking.
    const usesKillCount = this.regionData.bossUnlockKills != null;
    const justDefeated  = usesKillCount
      ? (this.battleResult?.enemyInstance ?? null)
      : null;

    POSITIONS[this.regionId].enemySpawns.forEach((spawn, i) => {
      const instanceKey = spawn.id + i;
      if (usesKillCount) {
        if (instanceKey === justDefeated)              return;  // just killed
        if (this._recentDefeats.includes(instanceKey)) return;  // in cooldown
      } else {
        if (GameState.isEnemyDefeated(this.regionId, instanceKey)) return;
      }

      const base = ENEMIES[spawn.id];
      // Adaptive spawn difficulty: use the player's earned topic tier.
      // spawn.difficultyOverride (if set) acts as a hard floor — used in later
      // regions to ensure review enemies are always at their intended tier.
      // getTopicTier applies the floor internally via Math.max.
      const floor     = Math.max(spawn.difficultyOverride ?? 1, base.baseTier ?? 1);
      const spawnDiff = GameState.getTopicTier(base.mathTopic, floor);
      const data = spawnDiff !== (base.baseTier ?? 1)
        ? { ...base, baseTier: spawnDiff }
        : base;

      const enemyHomeX = tx(spawn.col);
      const enemyHomeY = ty(spawn.row);
      const enemy = new Enemy(
        this, enemyHomeX, enemyHomeY, data,
        (d) => this._startBattle(d, instanceKey, enemyHomeX, enemyHomeY),
      );
      enemy.registerOverlap(this.mimi.sprite);
      enemy.setMimi(this.mimi.sprite);
      this.physics.add.collider(enemy.sprite, this._walls);
      this.physics.add.collider(enemy.sprite, this._decorObstacles);
      this.physics.add.collider(enemy.sprite, this._landmarkObstacles);
      this._enemies.push(enemy);
      this._liveCount++;

      // Aura glow for D2 (amber) and D3 (purple) enemies
      if (spawnDiff >= 2) {
        const auraData = this._addDifficultyAura(enemy, spawnDiff);
        if (auraData) this._enemyAuras.push({ enemy, ...auraData });
      }
    });
  }

  /**
   * Create orbiting-dot auras around an enemy sprite to signal adaptive difficulty.
   * D2 = 2 amber dots, D3 = 3 purple dots orbiting faster.
   * Returns { dots, speed, angle } for the update() orbit loop.
   */
  _addDifficultyAura(enemy, difficulty) {
    const isD3   = difficulty >= 3;
    const color  = isD3 ? 0xCC33FF : 0xFFAA33;
    const count  = isD3 ? 3 : 2;
    const dotR   = 4;
    const orbitR = 20;
    const speed  = isD3 ? 0.032 : 0.018;   // radians per frame (~60 fps)
    const depth  = enemy.sprite.depth + 0.5;

    const dots = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const dot = this.add.circle(
        enemy.sprite.x + Math.cos(a) * orbitR,
        enemy.sprite.y + Math.sin(a) * orbitR,
        dotR, color, 0.9,
      ).setDepth(depth);
      dots.push(dot);
    }
    return { dots, speed, angle: 0 };
  }

  _startBattle(enemyData, instanceKey, enemyHomeX, enemyHomeY) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('BattleScene', {
        enemy:          enemyData,
        enemyInstance:  instanceKey,
        enemyTypeId:    enemyData.id,           // used in result for bestiary tracking
        spawnDifficulty: enemyData.baseTier ?? 1,  // the adaptive tier used this encounter
        regionId:       this.regionId,
        isBoss:         false,
        returnScene:    'ExploreScene',
        returnData:     {
          regionId:      this.regionId,
          mimiX:         this.mimi.x,
          mimiY:         this.mimi.y,
          enemyHomeX:    enemyHomeX ?? this.mimi.x,
          enemyHomeY:    enemyHomeY ?? this.mimi.y,
          npcX:          this._npc?.sprite.x ?? null,
          npcY:          this._npc?.sprite.y ?? null,
          killCount:     this._killCount,        // carried through the battle roundtrip
          recentDefeats: this._recentDefeats,    // cooldown window for anti-camping
        },
      });
    });
  }

  _handleBattleResult() {
    this._processBattleResult();
    this._showBattleMessages();
  }

  _processBattleResult() {
    const { battleResult } = this;
    if (!battleResult) return;
    if (battleResult.victory) {
      const key = battleResult.enemyInstance;
      // Kill-count regions: regular enemies respawn, so do NOT mark them as
      // permanently defeated (defeatEnemy).  Only bosses and enemies in legacy
      // regions (no bossUnlockKills) are permanently removed from the world.
      const usesKillCount = this.regionData.bossUnlockKills != null;
      if (key !== undefined && (!usesKillCount || battleResult.isBoss)) {
        GameState.defeatEnemy(this.regionId, key);
      }
      if (!battleResult.isBoss) {
        this._killCount++;
        // Rolling defeat cooldown: prepend the killed key and trim to 2.
        // This is consumed by _setupEnemies on the NEXT battle return to
        // prevent the player farming the same 1-2 nearby enemies.
        if (key !== undefined && usesKillCount) {
          this._recentDefeats = [key, ...this._recentDefeats].slice(0, 2);
        }
        // Record session high-water mark and persistent bestiary difficulty
        const diff = battleResult.spawnDifficulty ?? 1;
        GameState.recordRegionMaxDifficulty(this.regionId, diff);
        if (battleResult.enemyTypeId) {
          GameState.recordEnemyHighestDifficulty(battleResult.enemyTypeId, diff);
        }
        // Adaptive difficulty: record per-topic battle outcome.
        // Perfect = zero wrong answers (timeouts already counted as wrong in BattleScene).
        const topic = battleResult.enemyTypeId
          ? ENEMIES[battleResult.enemyTypeId]?.mathTopic
          : null;
        if (topic) {
          const perfect = (battleResult.battleWrongAnswers ?? 0) === 0;
          GameState.recordTopicBattle(topic, diff, perfect);
        }
      }
    } else if (!battleResult.usedLife && !battleResult.ranAway) {
      // Hard defeat (HP hit 0) — reset exploration state so enemies respawn
      // fresh and the boss door re-locks.
      GameState.clearRegionEnemies(this.regionId);
      this._killCount     = 0;
      this._recentDefeats = [];
      // Regress topic tier if the enemy that killed the player was D2 or D3.
      const topic = battleResult.enemyTypeId
        ? ENEMIES[battleResult.enemyTypeId]?.mathTopic
        : null;
      if (topic && (battleResult.spawnDifficulty ?? 1) >= 2) {
        GameState.regressTopicTier(topic);
      }
    }
    // usedLife / ranAway: enemy positions, kill progress, and topic tiers are preserved
  }

  _showBattleMessages() {
    const { battleResult } = this;
    if (!battleResult) return;

    // Ran away — brief floating quip
    if (battleResult.ranAway) {
      const RAN_QUIPS = [
        'Mimi retreated. Boldly.',
        'Discretion: the better part of valour.',
        'She\'ll be back. Probably.',
        'Strategic repositioning complete.',
        'The enemy is still out there. Waiting.',
      ];
      const quip = RAN_QUIPS[Math.floor(Math.random() * RAN_QUIPS.length)];
      const W = this.cameras.main.width;
      const toast = this.add.text(W / 2, 80, `🏃 ${quip}`, {
        fontSize: '15px', color: '#AACCFF', fontFamily: "'Nunito', Arial, sans-serif",
        fontStyle: 'italic', stroke: '#000', strokeThickness: 3, align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
      this.tweens.add({
        targets: toast, y: 50, alpha: 0,
        delay: 1800, duration: 800, ease: 'Sine.easeIn',
        onComplete: () => toast.destroy(),
      });
      return;
    }

    // Life-used respawn — brief floating quip so the world reinforces the event
    if (battleResult.usedLife) {
      const RESPAWN_QUIPS = [
        'Back on her paws.',
        'Cats are difficult to keep down.',
        'She\'s fine. Mostly fine.',
        'Mimi shakes it off with great style.',
        'Ready for round two.',
      ];
      const quip = RESPAWN_QUIPS[Math.floor(Math.random() * RESPAWN_QUIPS.length)];
      const W = this.cameras.main.width;
      const toast = this.add.text(W / 2, 80, `🐾 ${quip}`, {
        fontSize: '15px', color: '#FFCC88', fontFamily: "'Nunito', Arial, sans-serif",
        fontStyle: 'italic', stroke: '#000', strokeThickness: 3, align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
      this.tweens.add({
        targets: toast, y: 50, alpha: 0,
        delay: 1800, duration: 800, ease: 'Sine.easeIn',
        onComplete: () => toast.destroy(),
      });
      return;
    }

    if (!battleResult.victory) return;

    // _justUnlockedBoss was computed in create() using the pre-increment kill count,
    // so it is true only when THIS battle crossed the bossUnlockKills threshold.
    // Fires on every run — re-entering after a prior boss clear is treated as a new run.
    const justUnlocked = this._justUnlockedBoss;

    // Redraw door now that state is final
    this._checkBossDoor();

    if (justUnlocked) {
      this.sound.play('sfx_level_up', { volume: 0.80 });
      const unlockKills = this.regionData.bossUnlockKills;
      const msg = unlockKills != null
        ? `${unlockKills} enemies defeated!\nThe boss seal is broken — enter when ready.`
        : `All enemies defeated!\nThe boss seal is broken — enter when ready.`;
      this.dialog.show(msg, null, '\u2728 Seal Broken!');
    }
  }

  //  Boss door 

  /**
   * Draws an ornate stone-arch boss door.
   *
   * Physics design (no overlap/blocker conflict):
   *  LOCKED  – a static body in its own group (_doorGroup) blocks Mimi.
   *             A collider callback on that group fires the locked dialog.
   *  OPEN    – the static body is disabled; update() does a distance check
   *             and fires _startBossBattle when Mimi is close enough.
   *             This avoids fighting between overlap zones and blockers.
   */
  _setupBossDoor() {
    const _pos = POSITIONS[this.regionId];
    const px = tx((_pos.bossTile ?? this.regionData.bossTile).col);
    const py = ty((_pos.bossTile ?? this.regionData.bossTile).row);

    // Dimensions — the gate is intentionally large and imposing
    const DW       = 88;
    const DH       = 100;
    const PILLAR_W = 14;
    const OPEN_W   = DW - PILLAR_W * 2;
    const OPEN_H   = DH - 6;
    const ARCH_R   = OPEN_W / 2 + 2;
    const archCY   = py - DH / 2 + ARCH_R;
    const openX    = px - OPEN_W / 2;
    const openTopY = py - DH / 2 + 6;
    // Region-specific accent colour for arch highlights, turrets, and keystone gem
    const GATE_ACCENTS = [0xFFDD33, 0x44EE88, 0xFF9933, 0x44CCFF, 0xCC66FF];
    const accentColor  = GATE_ACCENTS[this.regionId] ?? GATE_ACCENTS[0];

    // ── Static stone frame (never changes) ────────────────────────────────
    const frame = this.add.graphics().setDepth(4);

    frame.fillStyle(0x000000, 0.3);
    frame.fillEllipse(px, py + DH / 2 + 3, DW + 12, 8);

    frame.fillStyle(0x1E1E26);
    frame.fillRect(px - DW / 2 - 3, py + DH / 2 - 8, DW + 6, 12);
    frame.fillStyle(0x3E3E4E);
    frame.fillRect(px - DW / 2 - 3, py + DH / 2 - 8, DW + 6, 4);

    const lpx = px - DW / 2;
    frame.fillStyle(0x1E1E26);
    frame.fillRect(lpx - 3, py - DH / 2 - 3, PILLAR_W + 3, DH + 3);
    frame.fillStyle(0x3C3C4C);
    frame.fillRect(lpx, py - DH / 2, PILLAR_W, DH);
    frame.fillStyle(0x545468, 0.85);
    frame.fillRect(lpx + 1, py - DH / 2, 3, DH);
    frame.fillStyle(0x18181E, 0.7);
    frame.fillRect(lpx + PILLAR_W - 3, py - DH / 2, 3, DH);
    frame.lineStyle(1, 0x14141A, 0.55);
    for (let sy = py - DH / 2; sy < py + DH / 2; sy += 10) {
      frame.lineBetween(lpx, sy, lpx + PILLAR_W, sy);
    }

    const rpx = px + DW / 2 - PILLAR_W;
    frame.fillStyle(0x1E1E26);
    frame.fillRect(rpx, py - DH / 2 - 3, PILLAR_W + 3, DH + 3);
    frame.fillStyle(0x3C3C4C);
    frame.fillRect(rpx, py - DH / 2, PILLAR_W, DH);
    frame.fillStyle(0x545468, 0.85);
    frame.fillRect(rpx + 1, py - DH / 2, 3, DH);
    frame.fillStyle(0x18181E, 0.7);
    frame.fillRect(rpx + PILLAR_W - 3, py - DH / 2, 3, DH);
    frame.lineStyle(1, 0x14141A, 0.55);
    for (let sy = py - DH / 2; sy < py + DH / 2; sy += 10) {
      frame.lineBetween(rpx, sy, rpx + PILLAR_W, sy);
    }

    frame.fillStyle(0x1E1E26);
    frame.fillCircle(px, archCY, ARCH_R + 3);
    frame.fillStyle(0x3C3C4C);
    frame.fillCircle(px, archCY, ARCH_R);
    frame.fillStyle(0x3C3C4C);
    frame.fillRect(lpx - 1, archCY, DW + 2, ARCH_R + 4);

    // ── Battlements: twin turrets flanking the gate ─────────────────────────────
    const TURR_W = PILLAR_W + 4;   // turret slightly wider than its pillar
    const TURR_H = 28;
    const MRL_W = 5; const MRL_H = 8; const MRL_GAP = 3;
    const numMrl = Math.floor((TURR_W - 2) / (MRL_W + MRL_GAP));
    for (const bx of [lpx - 2, rpx - 2]) {
      // Turret body
      frame.fillStyle(0x1E1E26);
      frame.fillRect(bx, py - DH / 2 - TURR_H, TURR_W, TURR_H + 2);
      frame.fillStyle(0x3C3C4C);
      frame.fillRect(bx + 1, py - DH / 2 - TURR_H + 1, TURR_W - 2, TURR_H);
      frame.fillStyle(0x545468, 0.65);
      frame.fillRect(bx + 1, py - DH / 2 - TURR_H + 1, 3, TURR_H);
      // Accent stripe
      frame.fillStyle(accentColor, 0.25);
      frame.fillRect(bx + 1, py - DH / 2 - TURR_H + TURR_H * 0.6, TURR_W - 2, 4);
      // Merlons (crenellations) atop the turret
      for (let m = 0; m < numMrl; m++) {
        const mx = bx + 1 + m * (MRL_W + MRL_GAP);
        frame.fillStyle(0x1E1E26);
        frame.fillRect(mx, py - DH / 2 - TURR_H - MRL_H, MRL_W, MRL_H + 1);
        frame.fillStyle(0x3C3C4C);
        frame.fillRect(mx + 1, py - DH / 2 - TURR_H - MRL_H + 1, MRL_W - 2, MRL_H);
      }
    }

    // Central finial — pointed peak above the arch crown
    const finY = archCY - ARCH_R - 1;
    frame.fillStyle(0x1E1E26);
    frame.fillTriangle(px - 8, finY, px + 8, finY, px, finY - 14);
    frame.fillStyle(0x3C3C4C);
    frame.fillTriangle(px - 6, finY - 1, px + 6, finY - 1, px, finY - 11);

    // Accent: glowing arch outline + keystone gem
    frame.lineStyle(1.5, accentColor, 0.8);
    frame.strokeCircle(px, archCY, ARCH_R);
    frame.fillStyle(accentColor, 0.92);
    frame.fillCircle(px, archCY - ARCH_R + 5, 5);   // gem
    frame.fillStyle(0xFFFFFF, 0.5);
    frame.fillCircle(px - 1, archCY - ARCH_R + 3, 2); // gem shine

    // Boss name label
    this._bossLabel = this.add.text(
      px, py + DH / 2 + 10, this.regionData.bossName,
      { fontSize: '9px', color: '#CC88FF', fontFamily: "'Nunito', Arial, sans-serif",
        fontStyle: 'bold', align: 'center', stroke: '#000', strokeThickness: 2 },
    ).setOrigin(0.5, 0).setDepth(10);

    // Remaining-enemies counter (shown when locked)
    this._enemyCountText = this.add.text(
      px, py - DH / 2 - 14, '',
      { fontSize: '9px', color: '#FF9999', fontFamily: "'Nunito', Arial, sans-serif",
        align: 'center', stroke: '#000', strokeThickness: 2 },
    ).setOrigin(0.5, 1).setDepth(10);

    // ── Dynamic layers (redrawn on state change) ──────────────────────────
    this._doorFill = this.add.graphics().setDepth(5);
    this._doorDeco = this.add.graphics().setDepth(6);

    // ── Physics: ONE static body in its own group ─────────────────────────
    // When LOCKED  : body is enabled  → blocks Mimi; collider callback fires dialog
    // When OPEN    : body is disabled → Mimi can enter; update() checks distance
    this._doorGroup = this.physics.add.staticGroup();
    const blocker   = this.add.rectangle(px, py, OPEN_W, DH, 0, 0);
    this.physics.add.existing(blocker, true);
    this._doorGroup.add(blocker);
    this._doorBodyRect = blocker;  // keep reference for enable/disable

    // Collider fires the locked message (Mimi bumps door → dialog)
    this._doorMsgCooldown = false;
    this.physics.add.collider(
      this.mimi.sprite, this._doorGroup,
      () => {
        if (!this._bossOpen && !this._doorMsgCooldown && !this.dialog.isOpen) {
          this._doorMsgCooldown = true;
          const unlockKills = this.regionData.bossUnlockKills;
          let msg;
          if (unlockKills != null) {
            const need = unlockKills - this._killCount;
            msg = `The boss seal is unbroken.\nDefeat ${need} more enem${need === 1 ? 'y' : 'ies'} to enter.`;
          } else {
            const n = this._remainingEnemyCount();
            msg = `The boss seal is unbroken.\nDefeat the ${n} remaining enemi${n === 1 ? 'y' : 'es'} to enter.`;
          }
          this.dialog.show(
            msg,
            () => { this.time.delayedCall(2500, () => { this._doorMsgCooldown = false; }); },
            '\uD83D\uDD12 Sealed',
          );
        }
      },
    );

    // Stash geometry for _checkBossDoor redraws
    this._doorGeom = { px, py, openX, openTopY, OPEN_W, OPEN_H };

    // Evaluate initial state — always start locked; kill count must be earned each run.
    this._bossOpen = false;
    this._checkBossDoor();
  }

  /** How many region enemies are not yet defeated. */
  _remainingEnemyCount() {
    return POSITIONS[this.regionId].enemySpawns.filter((spawn, i) =>
      !GameState.isEnemyDefeated(this.regionId, spawn.id + i),
    ).length;
  }

  /**
   * Recompute open/locked state and redraw the door visuals.
   * Safe to call at any point (including during create() before dialog exists).
   */
  _checkBossDoor() {
    const unlockKills = this.regionData.bossUnlockKills;
    const n = unlockKills == null ? this._remainingEnemyCount() : 0;
    this._bossOpen = unlockKills != null
      ? (this._killCount >= unlockKills)
      : (n === 0);

    const { px, py, openX, openTopY, OPEN_W, OPEN_H } = this._doorGeom;
    this._doorFill.clear();
    this._doorDeco.clear();

    if (this._bossOpen) {
      // Disable the physics body so Mimi can walk through.
      // Use all available mechanisms: enable flag + checkCollision.none + group refresh.
      if (this._doorBodyRect?.body) {
        this._doorBodyRect.body.enable = false;
        this._doorBodyRect.body.checkCollision.none = true;
        this._doorGroup.refresh();
      }

      // Purple portal glow
      this._doorFill.fillStyle(0x110022);
      this._doorFill.fillRect(openX, openTopY, OPEN_W, OPEN_H);
      this._doorFill.fillStyle(0x5500AA, 0.7);
      this._doorFill.fillEllipse(px, py, OPEN_W * 0.82, OPEN_H * 0.76);
      this._doorFill.fillStyle(0xAA44FF, 0.45);
      this._doorFill.fillEllipse(px, py - 4, OPEN_W * 0.45, OPEN_H * 0.45);
      this._doorDeco.lineStyle(2, 0xFFDD44, 1);
      this._doorDeco.strokeRect(openX + 1, openTopY + 1, OPEN_W - 2, OPEN_H - 2);

      // Pulsing tween (only add once)
      if (!this._doorPulseTween) {
        this._doorPulseTween = this.tweens.add({
          targets: this._doorFill, alpha: 0.65, duration: 900, yoyo: true, repeat: -1,
        });
      }

      this._bossLabel.setColor('#FFDD44').setFontStyle('bold');
      this._enemyCountText.setVisible(false);

    } else {
      // Re-enable physics body if it was disabled (shouldn't happen, but safe)
      if (this._doorBodyRect?.body) {
        this._doorBodyRect.body.enable = true;
        this._doorBodyRect.body.checkCollision.none = false;
        this._doorGroup.refresh();
      }

      // Stone door fill
      this._doorFill.fillStyle(0x2A2A36);
      this._doorFill.fillRect(openX, openTopY, OPEN_W, OPEN_H);
      this._doorFill.fillStyle(0x38384A);
      this._doorFill.fillRect(openX + 2, openTopY + 2, OPEN_W - 4, OPEN_H / 3);
      this._doorFill.lineStyle(1, 0x1A1A24, 0.6);
      for (let sy = openTopY + 10; sy < openTopY + OPEN_H; sy += 11) {
        this._doorFill.lineBetween(openX + 2, sy, openX + OPEN_W - 2, sy);
      }
      this._doorFill.lineStyle(1, 0x1A1A24, 0.5);
      this._doorFill.lineBetween(px, openTopY + 2, px, openTopY + OPEN_H - 2);

      // Padlock
      const lx = px, ly = py - 2;
      this._doorDeco.fillStyle(0x997700);
      this._doorDeco.fillRoundedRect(lx - 9, ly - 2, 18, 14, 2);
      this._doorDeco.fillStyle(0xFFCC22);
      this._doorDeco.fillRoundedRect(lx - 7, ly, 14, 11, 2);
      this._doorDeco.lineStyle(4, 0xAA8800, 1);
      this._doorDeco.strokeCircle(lx, ly - 2, 6);
      this._doorDeco.fillStyle(0x2A2A36);
      this._doorDeco.fillRect(lx - 10, ly - 2, 20, 7);
      this._doorDeco.fillStyle(0x6E5500);
      this._doorDeco.fillCircle(lx, ly + 5, 2.5);
      this._doorDeco.fillTriangle(lx - 2, ly + 7, lx + 2, ly + 7, lx, ly + 11);

      if (unlockKills != null) {
        this._enemyCountText
          .setText(`${this._killCount} / ${unlockKills} defeated`)
          .setVisible(true);
      } else {
        this._enemyCountText
          .setText(`${n} of ${POSITIONS[this.regionId].enemySpawns.length} enemies remain`)
          .setVisible(true);
      }
      this._bossLabel.setColor('#CC88FF');
    }
  }

  _startBossBattle() {
    if (this._bossBattleStarted) return;
    this._bossBattleStarted = true;

    const bossData   = ENEMIES[this.regionData.boss];
    const battleData = {
      enemy:         bossData,
      enemyInstance: 'boss',
      regionId:      this.regionId,
      isBoss:        true,
      returnScene:   'ExploreScene',
      returnData:    {
        regionId:      this.regionId,
        mimiX:         this.mimi.x,
        mimiY:         this.mimi.y,
        npcX:          this._npc?.sprite.x ?? null,
        npcY:          this._npc?.sprite.y ?? null,
        killCount:     this._killCount,     // preserve kill progress through boss roundtrip
        recentDefeats: this._recentDefeats, // preserve cooldown state
      },
    };

    // Show boss intro cutscene the first time only
    const introSeen = GameState.bossIntroSeen.includes(this.regionId);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (!introSeen && this.regionData.bossIntro?.length) {
        this.scene.start('BossIntroScene', {
          panels:    this.regionData.bossIntro,
          regionId:  this.regionId,
          nextScene: 'BattleScene',
          nextData:  battleData,
        });
      } else {
        this.scene.start('BattleScene', battleData);
      }
    });
  }

  //  NPC 

  _setupNPC() {
    const npc       = POSITIONS[this.regionId].npcTile;
    const px        = this._returnNpcX ?? tx(npc.col);
    const py        = this._returnNpcY ?? ty(npc.row);
    const regionId  = this.regionId;

    // Pulsing beacon if Mewton hasn't been visited this region yet
    if (!GameState.npcVisited?.[regionId]) {
      this._mewtonBeacon = this._createMewtonBeacon(px, py);
    }

    this._npc = new NPC(
      this,
      px, py,
      { spriteKey: 'npc_wizard', spriteKeyB: 'npc_wizard_b' },
      (done) => {
        if (this.dialog.isOpen) return;

        // Dismiss beacon on first contact
        if (this._mewtonBeacon) {
          this._mewtonBeacon.forEach(o => o.destroy());
          this._mewtonBeacon = null;
        }

        // Freeze Mewton and all enemies so nothing wanders off during conversation
        this._npc.freeze();
        this._enemies.forEach(e => e.freeze());
        const wrappedDone = () => {
          this._npc.unfreeze();
          this._enemies.forEach(e => e.unfreeze());
          done();
        };

        const rd         = this.regionData;
        const bossBeaten  = GameState.hasDefeatedBoss(regionId);
        const unlockKills = this.regionData.bossUnlockKills;
        const allClear    = unlockKills != null
          ? this._killCount >= unlockKills
          : POSITIONS[regionId].enemySpawns.every((s, i) =>
              GameState.isEnemyDefeated(regionId, s.id + i));

        this._mewtonMenu(wrappedDone, rd, { bossBeaten, allClear });
      },
    );
    this._npc.registerOverlap(this.mimi.sprite);

    // Prevent the wizard from wandering through walls, objects, and landmarks
    this.physics.add.collider(this._npc.sprite, this._walls);
    this.physics.add.collider(this._npc.sprite, this._decorObstacles);
    this.physics.add.collider(this._npc.sprite, this._landmarkObstacles);
  }

  // ── Weather / precipitation layer ────────────────────────────────────────

  /**
   * Replaces the old tween-driven dot particles with a proper Phaser 3.60
   * ParticleEmitter per region.  All emitters use setScrollFactor(0) so they
   * are screen-space — weather always fills the viewport regardless of where
   * the camera has scrolled.
   *
   * Two shared 1-frame textures are generated once per session:
   *   _wx_line — 2×8 white rectangle  (rain streaks, sand, snow)
   *   _wx_dot  — 6×6 white circle     (chaff, snow, smoke motes)
   */
  _createAmbientParticles() {
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;

    // ── Generate textures once per browser session ─────────────────────
    if (!this.textures.exists('_wx_line')) {
      const g = this.add.graphics();
      g.fillStyle(0xFFFFFF, 1).fillRect(0, 0, 2, 8);
      g.generateTexture('_wx_line', 2, 8);
      g.destroy();
    }
    if (!this.textures.exists('_wx_dot')) {
      const g = this.add.graphics();
      g.fillStyle(0xFFFFFF, 1).fillCircle(3, 3, 3);
      g.generateTexture('_wx_dot', 6, 6);
      g.destroy();
    }

    // ── Per-region emitter definitions ─────────────────────────────────
    // Each entry: { texture, depth, config }  where config is the full
    // Phaser 3.60 ParticleEmitter config object.
    const WEATHER = [
      // R0 Sunny Village — gentle angled rain
      {
        texture: '_wx_line', depth: 22,
        config: {
          x: { min: -20, max: camW + 20 }, y: -12,
          speedX: { min: 55, max: 95 },
          speedY: { min: 280, max: 420 },
          lifespan: 1800,
          quantity: 2, frequency: 45,
          alpha: { start: 0.30, end: 0 },
          scale: { start: 0.9, end: 0.9 },
          tint: 0xBBDDFF,
          rotate: 12,
          gravityY: 0, maxParticles: 0,
        },
      },
      // R1 Windmill Village — drifting wheat chaff
      {
        texture: '_wx_dot', depth: 22,
        config: {
          x: { min: 0, max: camW }, y: { min: 0, max: camH },
          speedX: { min: 18, max: 55 },
          speedY: { min: -25, max: 25 },
          lifespan: { min: 4000, max: 7000 },
          quantity: 1, frequency: 220,
          alpha: { start: 0.55, end: 0 },
          scale: { start: 0.35, end: 0.12 },
          tint: 0xF0D060,
          gravityY: 18, maxParticles: 0,
        },
      },
      // R2 Meadow Maze — lighter angled rain
      {
        texture: '_wx_line', depth: 22,
        config: {
          x: { min: -20, max: camW + 20 }, y: -12,
          speedX: { min: 35, max: 70 },
          speedY: { min: 200, max: 320 },
          lifespan: 2200,
          quantity: 1, frequency: 70,
          alpha: { start: 0.25, end: 0 },
          scale: { start: 0.75, end: 0.75 },
          tint: 0xCCEEBB,
          rotate: 10,
          gravityY: 0, maxParticles: 0,
        },
      },
      // R3 Desert Dunes — horizontal sand-grain streaks
      {
        texture: '_wx_line', depth: 22,
        config: {
          x: -8, y: { min: 0, max: camH },
          speedX: { min: 340, max: 520 },
          speedY: { min: -18, max: 18 },
          lifespan: { min: 650, max: 1050 },
          quantity: 2, frequency: 30,
          alpha: { start: 0.45, end: 0 },
          scale: { start: 1.3, end: 0.5 },
          tint: 0xD4A844,
          rotate: 90,
          gravityY: 0, maxParticles: 0,
        },
      },
      // R4 Frostbite Cavern — slowly drifting snowflakes with alpha fade
      {
        texture: '_wx_dot', depth: 22,
        config: {
          x: { min: -20, max: camW + 20 }, y: -8,
          speedX: { min: -28, max: 28 },
          speedY: { min: 35, max: 90 },
          lifespan: { min: 5000, max: 9000 },
          quantity: 1, frequency: 100,
          alpha: { start: 0.80, end: 0 },
          scale: { start: 0.3, end: 0.65 },
          tint: 0xDDEEFF,
          gravityY: 0, maxParticles: 0,
        },
      },
      // R5 Shadow Castle — rising dark smoke motes
      {
        texture: '_wx_dot', depth: 22,
        config: {
          x: { min: 0, max: camW }, y: camH + 8,
          speedX: { min: -22, max: 22 },
          speedY: { min: -75, max: -28 },
          lifespan: { min: 3200, max: 5800 },
          quantity: 1, frequency: 140,
          alpha: { start: 0.55, end: 0 },
          scale: { start: 0.55, end: 1.30 },
          tint: 0x6622AA,
          gravityY: 0, maxParticles: 0,
        },
      },
    ];

    const weatherCfg = WEATHER[this.regionId];
    if (!weatherCfg) return;

    const emitter = this.add.particles(0, 0, weatherCfg.texture, weatherCfg.config);
    emitter.setScrollFactor(0).setDepth(weatherCfg.depth);
  }

  //  Scene lifecycle

  update() {
    // Guard: world construction is deferred via delayedCall(0) in create(), so
    // it fires during PRE_UPDATE of the first tick — before this method runs.
    // This check is a safety net for any edge-case ordering difference.
    if (!this.mimi) return;
    if (this.dialog.isOpen) {
      this.mimi.freeze();
      this.dialog.update();
      return;
    }
    this.mimi.unfreeze();
    this.mimi.update();
    this.hud.update();

    // Tick enemy wander AI
    for (const enemy of this._enemies) {
      if (enemy.alive) enemy.update();
    }

    // Orbit difficulty-aura dots around their patrolling enemies
    if (this._enemyAuras?.length) {
      const ORBIT_R = 20;
      for (const pair of this._enemyAuras) {
        if (!pair.enemy.alive) {
          pair.dots.forEach(d => d.destroy());
          continue;
        }
        pair.angle += pair.speed;
        const ex = pair.enemy.sprite.x;
        const ey = pair.enemy.sprite.y;
        pair.dots.forEach((dot, i) => {
          const a = pair.angle + (i / pair.dots.length) * Math.PI * 2;
          dot.setPosition(
            ex + Math.cos(a) * ORBIT_R,
            ey + Math.sin(a) * ORBIT_R,
          );
        });
      }
      // Prune dead pairs
      this._enemyAuras = this._enemyAuras.filter(p => p.enemy.alive);
    }

    // Tick NPC wander AI
    if (this._npc) this._npc.update();

    // Boss door — check proximity when open (collision handles the locked case)
    if (this._bossOpen && !this._bossBattleStarted && this._doorGeom) {
      const { px, py } = this._doorGeom;
      const dx = this.mimi.x - px;
      const dy = this.mimi.y - py;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 40 * 40) {
        this._startBossBattle();
      }
    }

    // Interactive items — auto-collect on proximity
    if (this._interactiveItems?.length) {
      for (const item of this._interactiveItems) {
        if (item.collected) continue;
        const dist = Phaser.Math.Distance.Between(this.mimi.x, this.mimi.y, tx(item.col), ty(item.row));
        if (dist < 38) this._collectItem(item);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      if (this._settingsItems) {
        closeSettings(this);           // ESC closes settings first
      } else if (this._exitConfirm) {
        this._closeExitConfirm(); // ESC while confirm open = cancel
      } else {
        this._showExitConfirm();
      }
    }
  }

  // ── Exit confirm overlay ──────────────────────────────────────────────────

  _showExitConfirm() {
    if (this._exitConfirm) return;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const items = this._exitConfirm = [];
    const add = o => { items.push(o); return o; };

    add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(80).setInteractive()); // blocks world clicks

    add(this.add.rectangle(W / 2, H / 2, 360, 170, 0x0C0C24)
      .setScrollFactor(0).setDepth(81).setStrokeStyle(2, 0x4488FF));

    add(this.add.text(W / 2, H / 2 - 50, 'Return to World Map?', {
      fontSize: '20px', color: '#FFFFFF',
      fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(82));

    add(this.add.text(W / 2, H / 2 - 20, 'Progress in this region is saved.', {
      fontSize: '13px', color: '#AADDFF', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(82));

    const yb = add(this.add.rectangle(W / 2 - 72, H / 2 + 38, 128, 40, 0x0A3A0A)
      .setScrollFactor(0).setDepth(82).setStrokeStyle(2, 0x44AA44).setInteractive({ useHandCursor: true }));
    const yt = add(this.add.text(W / 2 - 72, H / 2 + 38, '✓  Yes, go to Map', {
      fontSize: '14px', color: '#88FF88', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(83));
    yb.on('pointerover', () => { yb.setFillStyle(0x155A15); yt.setColor('#AAFFAA'); });
    yb.on('pointerout',  () => { yb.setFillStyle(0x0A3A0A); yt.setColor('#88FF88'); });
    yb.on('pointerdown', () => {
      this._closeExitConfirm();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('OverworldScene'));
    });

    const nb = add(this.add.rectangle(W / 2 + 72, H / 2 + 38, 104, 40, 0x2A0A0A)
      .setScrollFactor(0).setDepth(82).setStrokeStyle(2, 0xAA4444).setInteractive({ useHandCursor: true }));
    const nt = add(this.add.text(W / 2 + 72, H / 2 + 38, '✕  Stay', {
      fontSize: '14px', color: '#FF8888', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(83));
    nb.on('pointerover', () => { nb.setFillStyle(0x401515); nt.setColor('#FFAAAA'); });
    nb.on('pointerout',  () => { nb.setFillStyle(0x2A0A0A); nt.setColor('#FF8888'); });
    nb.on('pointerdown', () => this._closeExitConfirm());
  }

  _closeExitConfirm() {
    if (!this._exitConfirm) return;
    this._exitConfirm.forEach(o => o.destroy());
    this._exitConfirm = null;
  }

  // ── Interactive item pickups ─────────────────────────────────────────────

  /** Map itemId → registered spriteKey (SVG asset key). */
  static get ITEM_SPRITE_KEYS() {
    return {
      sardine:      'item_sardine',
      yarn_ball:    'item_yarn',
      catnip:       'item_catnip',
      lucky_collar: 'item_collar',
      fish_fossil:  'item_fossil',
    };
  }

  /** Create pulsing orbs for every uncollected interactive item in this region. */
  _setupInteractiveItems() {
    this._interactiveItems = [];

    const items = POSITIONS[this.regionId]?.interactiveItems ?? [];
    const ORB_COLORS = {
      sardine:      0x44AAFF,
      yarn_ball:    0xFF8833,
      catnip:       0x44CC44,
      lucky_collar: 0x44CCFF,
      fish_fossil:  0xFFDD44,
    };

    for (const item of items) {
      const key = `${this.regionId}_${item.col}_${item.row}`;
      if (GameState.collectedItems?.[key]) continue;  // already picked up

      const px    = tx(item.col);
      const py    = ty(item.row);
      const color = ORB_COLORS[item.itemId] ?? 0xFFDD44;

      // Glow orb (Graphics)
      const gfx = this.add.graphics().setDepth(8);
      gfx.fillStyle(color, 0.28);
      gfx.fillCircle(0, 0, 18);
      gfx.fillStyle(color, 1.0);
      gfx.fillCircle(0, 0, 8);
      gfx.fillStyle(0xFFFFFF, 0.80);
      gfx.fillCircle(-2, -2, 3);
      gfx.setPosition(px, py);

      // Sprite icon on top of orb
      const spriteKey = ExploreScene.ITEM_SPRITE_KEYS[item.itemId];
      const icon = spriteKey && this.textures.exists(spriteKey)
        ? this.add.image(px, py, spriteKey).setDisplaySize(20, 20).setDepth(9)
        : null;

      // Pulse tween
      this.tweens.add({
        targets: gfx, scaleX: 1.35, scaleY: 1.35, alpha: 0.65,
        duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      if (icon) {
        this.tweens.add({
          targets: icon, y: py - 4,
          duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }

      this._interactiveItems.push({ col: item.col, row: item.row, itemId: item.itemId, gfx, icon, key, collected: false });
    }
  }

  _collectItem(item) {
    if (item.collected) return;
    item.collected = true;

    // Persist pickup across sessions
    if (!GameState.collectedItems) GameState.collectedItems = {};
    GameState.collectedItems[item.key] = true;
    GameState.addItem(item.itemId);
    GameState.save();

    this.sound.play('sfx_chest_open', { volume: 0.75 });

    // Burst sparkle then destroy orb
    const bx = item.gfx.x, by = item.gfx.y;
    item.gfx.destroy();
    item.icon?.destroy();
    for (let i = 0; i < 8; i++) {
      const spark = this.add.circle(bx, by, 3, 0xFFFFAA, 1).setDepth(30);
      const angle = (i / 8) * Math.PI * 2;
      this.tweens.add({
        targets: spark,
        x: bx + Math.cos(angle) * 30,
        y: by + Math.sin(angle) * 30,
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: 500, ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
    this._showPickupToast(item.itemId);
    this.hud.refresh();
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  Mewton NPC helpers
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Creates a pulsing gold orb + "?" floating above the wizard's initial
   * tile so the player can spot him before making first contact.
   * @returns {Phaser.GameObjects.GameObject[]} objects to destroy on contact
   */
  _createMewtonBeacon(px, py) {
    const orbY = py - 28;
    const orb = this.add.circle(px, orbY, 6, 0xFFDD44, 0.85)
      .setDepth(22).setScrollFactor(1);

    this.tweens.add({
      targets: orb, y: orbY - 6,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: orb, alpha: { from: 0.55, to: 0.95 },
      duration: 900, yoyo: true, repeat: -1,
    });
    return [orb];
  }

  /**
   * Chains an array of dialog pages (shows them sequentially) then calls onDone.
   * @param {string[]} pages
   * @param {string}   speaker
   * @param {string}   portrait
   * @param {Function} onDone
   */
  _dialogChain(pages, speaker, portrait, onDone) {
    if (!pages || pages.length === 0) { onDone?.(); return; }
    const [first, ...rest] = pages;
    this.dialog.show(first,
      () => this._dialogChain(rest, speaker, portrait, onDone),
      speaker, portrait);
  }

  /**
   * Shows a context-aware greeting then the player-driven topic menu.
   * @param {Function} done
   * @param {object}   rd     - regionData
   * @param {object}   flags  - { bossBeaten, allClear }
   */
  _mewtonMenu(done, rd, { bossBeaten, allClear }) {
    const SPEAKER  = '🧙 Mewton';
    const PORTRAIT = 'npc_wizard';
    const rid      = this.regionId;

    const firstVisit = !GameState.npcVisited?.[rid];

    // Mark visited
    if (!GameState.npcVisited) GameState.npcVisited = {};
    GameState.npcVisited[rid] = true;
    GameState.save();

    // Context-aware greeting
    let greeting;
    if (bossBeaten) {
      greeting = `You defeated ${rd.bossName ?? 'the boss'}! I knew you would manage it.\n\n...I had a contingency plan. We do not need to discuss the contingency plan.`;
    } else if (allClear) {
      greeting = `Every enemy cleared — boss door is open.\n\nI predicted this. 50% probability still counts.`;
    } else if (firstVisit) {
      greeting = `Ah — Mimi! I'm Mewton. Wizard and cat-genius.\n\nWhat can I do for you?`;
    } else {
      greeting = `Back again? The boss won't defeat itself.\n\nCan I help?`;
    }

    this.dialog.show(greeting, () => {
      const labels = [
        '😂 Tell me a joke',
        '📖 About the boss',
        ...(!this._treatGiven ? ['🐟 Can I have a treat?'] : []),
        '👋 All good, thanks!',
      ];
      this.dialog.showChoice('What would you like to know?', labels, (idx) => {
        const treatIdx = this._treatGiven ? -1 : 2;
        const byeIdx   = labels.length - 1;
        if      (idx === 0)       this._mewtonJoke(done);
        else if (idx === 1)       this._mewtonBossStory(done, rd);
        else if (idx === treatIdx) this._mewtonTreat(done, rd);
        else if (idx === byeIdx)  done();
        else                      done();
      }, SPEAKER, PORTRAIT);
    }, SPEAKER, PORTRAIT);
  }

  /** Tells a random joke then calls done. */
  _mewtonJoke(done) {
    const SPEAKER  = '🧙 Mewton';
    const PORTRAIT = 'npc_wizard';
    const joke = NPC_JOKES[Math.floor(Math.random() * NPC_JOKES.length)];
    this.dialog.show(joke.setup, () => {
      this.dialog.show(joke.punchline, done, SPEAKER, PORTRAIT);
    }, SPEAKER, PORTRAIT);
  }

  /** Shows the 2-page boss background story then calls done. */
  _mewtonBossStory(done, rd) {
    const SPEAKER  = '🧙 Mewton';
    const PORTRAIT = 'npc_wizard';
    this._dialogChain(rd.npcBossStory ?? [rd.npcHint], SPEAKER, PORTRAIT, done);
  }

  /**
   * Give Mimi the region boon item as a treat — once per ExploreScene visit.
   * Tracked via this._treatGiven (scene-local, resets on re-entry).
   * @param {Function} done
   * @param {object}   rd - regionData
   */
  _mewtonTreat(done, rd) {
    const SPEAKER  = '🧙 Mewton';
    const PORTRAIT = 'npc_wizard';
    const boonId   = rd.npcBoon;
    const item     = ITEMS[boonId];

    if (!item) {
      this.dialog.show(
        "Hmm — I seem to have misplaced my treat supply. Come back another time!",
        done, SPEAKER, PORTRAIT,
      );
      return;
    }

    this._treatGiven = true;
    GameState.addItem(boonId);
    GameState.save();
    this._showPickupToast(boonId);
    this.hud.refresh();

    this.dialog.show(
      `Here — take this. Don't tell anyone I'm a soft touch.\n\n${item.emoji ?? '✨'} ${item.name} — ${item.description}`,
      done, SPEAKER, PORTRAIT,
    );
  }

  _showPickupToast(itemId) {
    const INFO = {
      sardine:      { name: 'Sardine',       desc: 'Heals 2 HP at battle start.' },
      yarn_ball:    { name: 'Yarn Ball',     desc: '+5 seconds on the battle timer.' },
      catnip:       { name: 'Catnip',        desc: 'Next correct answer deals ×2 damage.' },
      lucky_collar: { name: 'Lucky Collar',  desc: 'Block one hit in battle.' },
      fish_fossil:  { name: 'Fish Fossil',   desc: 'Reveal a wrong choice (×3 uses).' },
    };
    const info = INFO[itemId] ?? { name: itemId, desc: '' };
    const W    = this.cameras.main.width;
    const FONT = "'Nunito', Arial, sans-serif";
    const objs = [];

    objs.push(this.add.rectangle(W / 2, 80, 296, 48, 0x000C22, 0.92)
      .setScrollFactor(0).setDepth(65).setStrokeStyle(1.5, 0xFFCC44));
    objs.push(this.add.text(W / 2, 64, `✨ Found: ${info.name}!`, {
      fontSize: '14px', color: '#FFD700', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(66));
    objs.push(this.add.text(W / 2, 84, info.desc, {
      fontSize: '11px', color: '#AADDFF', fontFamily: FONT,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(66));

    this.tweens.add({
      targets: objs, alpha: 0,
      delay: 2200, duration: 500, ease: 'Sine.easeIn',
      onComplete: () => objs.forEach(o => o.destroy()),
    });
  }
}