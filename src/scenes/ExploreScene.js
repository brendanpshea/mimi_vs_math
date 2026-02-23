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
import REGIONS     from '../data/regions.js';
import ENEMIES     from '../data/enemies.js';
import MAPS, { LANDMARKS, POSITIONS } from '../data/maps.js';
import Mimi        from '../entities/Mimi.js';
import Enemy       from '../entities/Enemy.js';
import NPC         from '../entities/NPC.js';
import HUD         from '../ui/HUD.js';
import DialogBox   from '../ui/DialogBox.js';
import NPC_JOKES            from '../data/npcJokes.json' with { type: 'json' };
import { generateQuestion } from '../math/QuestionBank.js';
import { getChoices }       from '../math/Distractors.js';
import ITEMS                from '../data/items.js';

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
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    BGM.play('explore');

    // World geometry
    this._drawRoom();
    this._placeLandmarks();
    this._addDecorations();

    // Compute whether THIS battle just cleared the last enemy, BEFORE recording
    // the defeat in GameState.  If we wait until after _processBattleResult the
    // door setup already sees n===0 so the "just unlocked" flag would always be
    // false.  The test file (test_unlock.mjs) validates this formula.
    this._preBattleAllClear = false;
    if (this.battleResult?.victory && !this.battleResult?.isBoss) {
      const inst = this.battleResult.enemyInstance;
      const spawns = POSITIONS[this.regionId].enemySpawns;
      this._preBattleAllClear = spawns.every((spawn, i) => {
        const key = spawn.id + i;
        return key === inst || GameState.isEnemyDefeated(this.regionId, key);
      });
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

    if (this.battleResult) {
      this.hud.refresh();
    }
    if (this.battleResult) {
      this.time.delayedCall(200, () => this._showBattleMessages());
    }
  }

  //  Room drawing 

  _drawRoom() {
    const { floorColor, wallColor, floorTile, wallTile } = this.regionData;
    const worldW = MAP_W * T;
    const worldH = MAP_H * T;

    // Tiled floor — randomised multi-variant grid for a 'bathroom tile' look.
    // Each cell independently draws the A (60%), B (25%), or C (15%) variant.
    if (floorTile && this.textures.exists(floorTile)) {
      const FLOOR_VARIANTS = {
        floor_grass: ['floor_grass', 'floor_grass_b', 'floor_grass_c'],
        floor_sand:  ['floor_sand',  'floor_sand_b',  'floor_sand_c' ],
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
      for (let row = 0; row < MAP_H; row++) {
        for (let col = 0; col < MAP_W; col++) {
          const variant = pickVariant();
          const key = this.textures.exists(variant) ? variant : pool[0];
          this.add.image(col * T + T / 2, row * T + T / 2, key).setDepth(0);
        }
      }
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
    };

    for (const item of deduped) {
      if (!this.textures.exists(item.key)) continue;

      const px    = tx(item.col);
      const py    = ty(item.row);
      const scale = SCALES[item.key] ?? 1.0;

      // y-sort depth so objects lower on screen render in front
      const depth = 3 + (item.row / MAP_H) * 6;
      this.add.image(px, py, item.key).setDepth(depth).setScale(scale);

      if (item.blocking) {
        const hitW = T * 0.75;
        const hitH = T * 0.35;
        const body = this.add.rectangle(px, py + T * 0.25, hitW, hitH, 0, 0);
        this.physics.add.existing(body, true);
        this._decorObstacles.add(body);
      }
    }
  }

  //  Enemies 

  _setupEnemies() {
    this._enemies   = [];
    this._liveCount = 0;

    POSITIONS[this.regionId].enemySpawns.forEach((spawn, i) => {
      const instanceKey = spawn.id + i;
      if (GameState.isEnemyDefeated(this.regionId, instanceKey)) return;

      // difficultyOverride lets earlier enemies reappear as harder review enemies
      const base = ENEMIES[spawn.id];
      const data = spawn.difficultyOverride
        ? { ...base, difficulty: spawn.difficultyOverride }
        : base;

      const enemyHomeX = tx(spawn.col);
      const enemyHomeY = ty(spawn.row);
      const enemy = new Enemy(
        this, enemyHomeX, enemyHomeY, data,
        (d) => this._startBattle(d, instanceKey, enemyHomeX, enemyHomeY),
      );
      enemy.registerOverlap(this.mimi.sprite);
      enemy.setMimi(this.mimi.sprite);
      this._enemies.push(enemy);
      this._liveCount++;
    });
  }

  _startBattle(enemyData, instanceKey, enemyHomeX, enemyHomeY) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('BattleScene', {
        enemy:         enemyData,
        enemyInstance: instanceKey,
        regionId:      this.regionId,
        isBoss:        false,
        returnScene:   'ExploreScene',
        returnData:    {
          regionId:   this.regionId,
          mimiX:      this.mimi.x,
          mimiY:      this.mimi.y,
          enemyHomeX: enemyHomeX ?? this.mimi.x,
          enemyHomeY: enemyHomeY ?? this.mimi.y,
          npcX:       this._npc?.sprite.x ?? null,
          npcY:       this._npc?.sprite.y ?? null,
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
      if (key !== undefined) {
        GameState.defeatEnemy(this.regionId, key);
      }
    } else if (!battleResult.usedLife && !battleResult.ranAway) {
      // Hard defeat (no lives left) — clear enemies so they respawn at entrance
      GameState.clearRegionEnemies(this.regionId);
    }
    // usedLife / ranAway: enemy positions and progress are preserved
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

    // _preBattleAllClear was computed in create() BEFORE _processBattleResult(),
    // so it is true only when THIS battle defeated the final enemy.
    // We also guard against the boss already being defeated (re-entry).
    const justUnlocked =
      this._preBattleAllClear && !GameState.hasDefeatedBoss(this.regionId);

    // Redraw door now that state is final
    this._checkBossDoor();

    if (justUnlocked) {
      this.sound.play('sfx_level_up', { volume: 0.80 });
      this.dialog.show(
        `All enemies defeated!\nThe boss seal is broken — enter when ready.`,
        null,
        '\u2728 Seal Broken!',
      );
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
          const n = this._remainingEnemyCount();
          this.dialog.show(
            `The boss seal is unbroken.\nDefeat the ${n} remaining enemi${n === 1 ? 'y' : 'es'} to enter.`,
            () => { this.time.delayedCall(2500, () => { this._doorMsgCooldown = false; }); },
            '\uD83D\uDD12 Sealed',
          );
        }
      },
    );

    // Stash geometry for _checkBossDoor redraws
    this._doorGeom = { px, py, openX, openTopY, OPEN_W, OPEN_H };

    // Evaluate initial state
    this._bossOpen = GameState.hasDefeatedBoss(this.regionId);
    this._checkBossDoor();
  }

  /** How many region enemies are not yet defeated. */
  _remainingEnemyCount() {
    return this.regionData.enemySpawns.filter((spawn, i) =>
      !GameState.isEnemyDefeated(this.regionId, spawn.id + i),
    ).length;
  }

  /**
   * Recompute open/locked state and redraw the door visuals.
   * Safe to call at any point (including during create() before dialog exists).
   */
  _checkBossDoor() {
    const n = this._remainingEnemyCount();
    this._bossOpen = (n === 0) || GameState.hasDefeatedBoss(this.regionId);

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

      this._enemyCountText
        .setText(`${n} of ${this.regionData.enemySpawns.length} enemies remain`)
        .setVisible(true);
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
        regionId: this.regionId,
        mimiX:    this.mimi.x,
        mimiY:    this.mimi.y,
        npcX:     this._npc?.sprite.x ?? null,
        npcY:     this._npc?.sprite.y ?? null,
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

        const rd          = this.regionData;
        const bossBeaten  = GameState.hasDefeatedBoss(regionId);
        const boonGot     = !!GameState.npcBoonReceived?.[regionId];
        const spawns      = POSITIONS[regionId].enemySpawns;
        const allClear    = spawns.every((s, i) =>
          GameState.isEnemyDefeated(regionId, s.id + i));

        this._mewtonMenu(done, rd, { bossBeaten, boonGot, allClear });
      },
    );
    this._npc.registerOverlap(this.mimi.sprite);

    // Prevent the wizard from wandering through walls, objects, and landmarks
    this.physics.add.collider(this._npc.sprite, this._walls);
    this.physics.add.collider(this._npc.sprite, this._decorObstacles);
    this.physics.add.collider(this._npc.sprite, this._landmarkObstacles);
  }

  // ── Ambient particles ──────────────────────────────────────────────────

  _createAmbientParticles() {
    const worldW = MAP_W * T;
    const worldH = MAP_H * T;
    const PARTICLE_COUNT = 40;

    // Region-themed particle configs
    const configs = [
      // R0 Sunny Village — floating leaves and pollen
      { colors: [0x88CC44, 0xAADD66, 0xFFDD44], sizeMin: 2, sizeMax: 4, speedY: [8, 25], speedX: [-12, 12], alpha: [0.3, 0.7] },
      // R1 Meadow Maze — fireflies and pollen
      { colors: [0xFFFFAA, 0xAAFF88, 0xFFEE66], sizeMin: 1.5, sizeMax: 3.5, speedY: [-8, 8], speedX: [-6, 6], alpha: [0.2, 0.8] },
      // R2 Desert Dunes — sand particles
      { colors: [0xD4A044, 0xE8C868, 0xC89838], sizeMin: 1, sizeMax: 3, speedY: [5, 15], speedX: [10, 30], alpha: [0.2, 0.5] },
      // R3 Frostbite Cavern — snowflakes
      { colors: [0xFFFFFF, 0xCCEEFF, 0xAADDFF], sizeMin: 2, sizeMax: 5, speedY: [10, 30], speedX: [-8, 8], alpha: [0.3, 0.8] },
      // R4 Shadow Castle — purple magic motes
      { colors: [0x9944FF, 0xBB66FF, 0x6622CC], sizeMin: 1.5, sizeMax: 4, speedY: [-15, 15], speedX: [-10, 10], alpha: [0.2, 0.7] },
    ];
    const cfg = configs[this.regionId] ?? configs[0];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
      const size = Phaser.Math.FloatBetween(cfg.sizeMin, cfg.sizeMax);
      const alpha = Phaser.Math.FloatBetween(cfg.alpha[0], cfg.alpha[1]);

      const px = Phaser.Math.Between(0, worldW);
      const py = Phaser.Math.Between(0, worldH);
      const particle = this.add.circle(px, py, size, color, alpha).setDepth(20);

      const vx = Phaser.Math.FloatBetween(cfg.speedX[0], cfg.speedX[1]);
      const vy = Phaser.Math.FloatBetween(cfg.speedY[0], cfg.speedY[1]);

      // Drift + fade cycle
      this.tweens.add({
        targets: particle,
        x: particle.x + vx * 20,
        y: particle.y + vy * 20,
        alpha: { from: alpha, to: alpha * 0.2 },
        duration: Phaser.Math.Between(4000, 9000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      });
    }
  }

  //  Scene lifecycle

  update() {
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
      if (this._exitConfirm) {
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
    const qText = this.add.text(px, orbY - 14, '?', {
      fontSize: '14px', color: '#FFDD44',
      fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setDepth(23).setScrollFactor(1);

    this.tweens.add({
      targets: [orb, qText], y: '-=6',
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: orb, alpha: { from: 0.55, to: 0.95 },
      duration: 900, yoyo: true, repeat: -1,
    });
    return [orb, qText];
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
   * @param {object}   rd          - regionData
   * @param {object}   flags       - { bossBeaten, boonGot, allClear }
   */
  _mewtonMenu(done, rd, { bossBeaten, boonGot, allClear }) {
    const SPEAKER  = '🧙 Mewton';
    const PORTRAIT = 'npc_wizard';
    const rid      = this.regionId;

    // Mark visited
    if (!GameState.npcVisited) GameState.npcVisited = {};
    GameState.npcVisited[rid] = true;
    GameState.save();

    // Context-aware greeting
    let greeting;
    if (bossBeaten) {
      greeting = `You defeated ${rd.bossName ?? 'the boss'}! I knew you would manage it.\n\n...I also had a contingency plan. We do not need to discuss the contingency plan.`;
    } else if (allClear) {
      greeting = 'Every enemy cleared — well done! The boss door is open.\n\nI predicted this outcome. I said 50% probability, but that still counts.';
    } else if (boonGot) {
      greeting = `Back again? Good. The boss won't defeat itself.\n\nCan I help with anything?`;
    } else {
      greeting = `Ah — Mimi! I'm Mewton. Mathematician, wizard, and the only certified cat-genius in this region.\n\nWhat can I do for you?`;
    }

    this.dialog.show(greeting, () => {
      const labels = [
        '😂 Tell me a joke',
        '📖 About the boss',
        '✏️ Lesson + challenge',
        '👋 All good, thanks!',
      ];
      this.dialog.showChoice('What would you like to know?', labels, (idx) => {
        if      (idx === 0) this._mewtonJoke(done);
        else if (idx === 1) this._mewtonBossStory(done, rd);
        else if (idx === 2) this._mewtonLesson(done, rd, boonGot);
        else                done();
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
   * Lesson pages → practice question (if boon not yet awarded) → boon → done.
   * If boon already received, shows the lesson pages followed by the hint.
   */
  _mewtonLesson(done, rd, boonAlreadyGot) {
    const SPEAKER  = '🧙 Mewton';
    const PORTRAIT = 'npc_wizard';
    this._dialogChain(rd.npcLesson ?? [], SPEAKER, PORTRAIT, () => {
      if (boonAlreadyGot) {
        this.dialog.show(`💡 Refresher: ${rd.npcHint}`, done, SPEAKER, PORTRAIT);
      } else {
        this._mewtonPracticeQuestion(rd.npcQuizTopic, (correct) => {
          this._mewtonAwardBoon(rd.npcBoon, correct, SPEAKER, PORTRAIT, done);
        });
      }
    });
  }

  /**
   * Mini quiz overlay (4-button MCQ) separate from the DialogBox.
   * Generates a question from the given topic, shows a centred panel,
   * and calls onResult(isCorrect) after the answer animation completes.
   * @param {string}   topic
   * @param {Function} onResult
   */
  _mewtonPracticeQuestion(topic, onResult) {
    const W      = this.cameras.main.width;
    const FONT   = "'Nunito', Arial, sans-serif";
    const DEPTH  = 90;
    const panelX = W / 2;
    const panelY = 262;
    const PW     = 544;
    const PH     = 284;
    const panelTop = panelY - PH / 2;   // ≈ 120

    const q       = generateQuestion(topic, 1);
    const choices = getChoices(q);
    const objs    = [];
    const make    = (o) => { objs.push(o); return o; };

    make(this.add.rectangle(panelX, panelY, PW, PH, 0x000C22, 0.97)
      .setScrollFactor(0).setDepth(DEPTH).setStrokeStyle(2, 0xFFCC44));

    make(this.add.text(panelX, panelTop + 22, '⚡ Mewton\'s Challenge!', {
      fontSize: '16px', color: '#FFCC44', fontFamily: FONT, fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH + 1));

    make(this.add.rectangle(panelX, panelTop + 47, PW - 32, 1, 0x4488FF)
      .setScrollFactor(0).setDepth(DEPTH + 1));

    // Question text — bright contrasting yellow, stroke, top-anchored origin so
    // word-wrap expands downward predictably rather than shifting the anchor.
    make(this.add.text(panelX, panelTop + 60, q.prompt, {
      fontSize: '17px', color: '#FFFF66', fontFamily: FONT, fontStyle: 'bold',
      wordWrap: { width: PW - 56 },
      stroke: '#001133', strokeThickness: 3,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 3));

    const feedbackText = make(this.add.text(panelX, panelTop + 256, '', {
      fontSize: '14px', fontStyle: 'bold', color: '#FFFFFF', fontFamily: FONT,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH + 2));

    const btnPositions = [
      [panelX - 132, panelTop + 170],
      [panelX + 132, panelTop + 170],
      [panelX - 132, panelTop + 224],
      [panelX + 132, panelTop + 224],
    ];

    const btnBgs  = [];
    const btnTxts = [];
    let answered  = false;

    choices.forEach((choice, i) => {
      const [bx, by] = btnPositions[i];
      const bg = make(this.add.rectangle(bx, by, 242, 36, 0x0A1A44)
        .setScrollFactor(0).setDepth(DEPTH + 1).setStrokeStyle(1, 0x4488FF)
        .setInteractive({ useHandCursor: true }));
      const txt = make(this.add.text(bx, by, choice.text, {
        fontSize: '14px', color: '#FFFFFF', fontFamily: FONT,
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH + 2));

      btnBgs.push(bg);
      btnTxts.push(txt);

      bg.on('pointerover', () => { if (!answered) bg.setFillStyle(0x1A3A77); });
      bg.on('pointerout',  () => { if (!answered) bg.setFillStyle(0x0A1A44); });
      bg.on('pointerdown', () => {
        if (answered) return;
        answered = true;

        if (choice.correct) {
          bg.setFillStyle(0x114411).setStrokeStyle(2, 0x44FF44);
          txt.setColor('#88FF88');
          feedbackText.setText('✓ Correct! Well done, Mimi!').setColor('#88FF88');
        } else {
          bg.setFillStyle(0x441111).setStrokeStyle(2, 0xFF4444);
          txt.setColor('#FF8888');
          choices.forEach((c, j) => {
            if (c.correct) {
              btnBgs[j].setFillStyle(0x114411).setStrokeStyle(2, 0x44FF44);
              btnTxts[j].setColor('#88FF88');
            }
          });
          feedbackText.setText('✗ Not quite — the boon is yours either way!').setColor('#FF8888');
        }

        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: objs, alpha: 0, duration: 350, ease: 'Sine.easeIn',
            onComplete: () => { objs.forEach(o => o.destroy()); onResult(choice.correct); },
          });
        });
      });
    });
  }

  /**
   * Award the region boon item, mark npcBoonReceived, refresh HUD, then show
   * a dialog confirming the gift before calling done().
   * @param {string}   boonId
   * @param {boolean}  wasCorrect
   * @param {string}   speaker
   * @param {string}   portrait
   * @param {Function} done
   */
  _mewtonAwardBoon(boonId, wasCorrect, speaker, portrait, done) {
    const item = ITEMS[boonId];
    if (!item) { done(); return; }

    const rid = this.regionId;
    GameState.addItem(boonId);
    if (!GameState.npcBoonReceived) GameState.npcBoonReceived = {};
    GameState.npcBoonReceived[rid] = true;
    GameState.save();

    this._showPickupToast(boonId);
    this.hud.refresh();

    const intro = wasCorrect
      ? 'Excellent! You answered correctly.\n\nAs promised — here is your reward:'
      : 'Not to worry — learning was the real achievement.\n\nEither way, this belongs to you:';

    this.dialog.show(
      `${intro}\n\n${item.emoji ?? '✨'} ${item.name} — ${item.description}`,
      done, speaker, portrait,
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