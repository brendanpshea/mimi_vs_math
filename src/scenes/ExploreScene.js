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
import REGIONS     from '../data/regions.js';
import ENEMIES     from '../data/enemies.js';
import MAPS        from '../data/maps.js';
import Mimi        from '../entities/Mimi.js';
import Enemy       from '../entities/Enemy.js';
import NPC         from '../entities/NPC.js';
import HUD         from '../ui/HUD.js';
import DialogBox   from '../ui/DialogBox.js';
import NPC_JOKES   from '../data/npcJokes.json' with { type: 'json' };

//  World constants 
const T     = 32;    // tile size in pixels
const MAP_W = 70;    // map width  in tiles  (~4 screens wide)
const MAP_H = 50;    // map height in tiles  (~3 screens tall)
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
    // On defeat, always restart from the region spawn — never restore battle position
    const isDefeat = data?.battleResult?.victory === false;
    this._returnX = isDefeat ? null : (data?.mimiX ?? null);
    this._returnY = isDefeat ? null : (data?.mimiY ?? null);
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // World geometry
    this._drawRoom();
    this._addDecorations();

    // Compute whether THIS battle just cleared the last enemy, BEFORE recording
    // the defeat in GameState.  If we wait until after _processBattleResult the
    // door setup already sees n===0 so the "just unlocked" flag would always be
    // false.  The test file (test_unlock.mjs) validates this formula.
    this._preBattleAllClear = false;
    if (this.battleResult?.victory && !this.battleResult?.isBoss) {
      const inst = this.battleResult.enemyInstance;
      this._preBattleAllClear = this.regionData.enemySpawns.every((spawn, i) => {
        const key = spawn.id + i;
        return key === inst || GameState.isEnemyDefeated(this.regionId, key);
      });
    }

    // Apply battle result before creating enemies (so defeated ones are skipped)
    if (this.battleResult) {
      this._processBattleResult();
    }

    // Player — restore battle-exit position if available, otherwise use spawn
    const startX = this._returnX ?? tx(this.regionData.mimiStart.col);
    const startY = this._returnY ?? ty(this.regionData.mimiStart.row);
    this.mimi = new Mimi(this, startX, startY);
    this.physics.world.setBounds(
      WALL * T, WALL * T,
      (MAP_W - WALL * 2) * T,
      (MAP_H - WALL * 2) * T,
    );
    this.mimi.sprite.setCollideWorldBounds(true);
    this.physics.add.collider(this.mimi.sprite, this._walls);
    this.physics.add.collider(this.mimi.sprite, this._decorObstacles);

    // Camera follows Mimi with slight lerp (Zelda feel)
    this.cameras.main.setBounds(0, 0, MAP_W * T, MAP_H * T);
    this.cameras.main.startFollow(this.mimi.sprite, true, 0.12, 0.12);

    // Game objects
    this._setupEnemies();
    this._setupNPC();
    this._setupBossDoor();

    // Ambient particles
    this._createAmbientParticles();

    // UI (scrollFactor(0) set inside these classes)
    this.hud    = new HUD(this, this.regionData.name);
    this.dialog = new DialogBox(this);

    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

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
    const keyPositions = [
      this.regionData.mimiStart,
      this.regionData.npcTile,
      this.regionData.bossTile,
      ...this.regionData.enemySpawns.map(s => ({ col: s.col, row: s.row })),
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

    this.regionData.enemySpawns.forEach((spawn, i) => {
      const instanceKey = spawn.id + i;
      if (GameState.isEnemyDefeated(this.regionId, instanceKey)) return;

      // difficultyOverride lets earlier enemies reappear as harder review enemies
      const base = ENEMIES[spawn.id];
      const data = spawn.difficultyOverride
        ? { ...base, difficulty: spawn.difficultyOverride }
        : base;

      const enemy = new Enemy(
        this, tx(spawn.col), ty(spawn.row), data,
        (d) => this._startBattle(d, instanceKey),
      );
      enemy.registerOverlap(this.mimi.sprite);
      this._enemies.push(enemy);
      this._liveCount++;
    });
  }

  _startBattle(enemyData, instanceKey) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('BattleScene', {
        enemy:         enemyData,
        enemyInstance: instanceKey,
        regionId:      this.regionId,
        isBoss:        false,
        returnScene:   'ExploreScene',
        returnData:    {
          regionId: this.regionId,
          mimiX:    this.mimi.x,
          mimiY:    this.mimi.y,
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
    } else {
      // Mimi was defeated — clear all enemies in this region so they respawn
      GameState.clearRegionEnemies(this.regionId);
    }
  }

  _showBattleMessages() {
    const { battleResult } = this;
    if (!battleResult || !battleResult.victory) return;

    // _preBattleAllClear was computed in create() BEFORE _processBattleResult(),
    // so it is true only when THIS battle defeated the final enemy.
    // We also guard against the boss already being defeated (re-entry).
    const justUnlocked =
      this._preBattleAllClear && !GameState.hasDefeatedBoss(this.regionId);

    // Redraw door now that state is final
    this._checkBossDoor();

    if (justUnlocked) {
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
    const px = tx(this.regionData.bossTile.col);
    const py = ty(this.regionData.bossTile.row);

    // Dimensions
    const DW       = 56;
    const DH       = 68;
    const PILLAR_W = 12;
    const OPEN_W   = DW - PILLAR_W * 2;
    const OPEN_H   = DH - 6;
    const ARCH_R   = OPEN_W / 2 + 2;
    const archCY   = py - DH / 2 + ARCH_R;
    const openX    = px - OPEN_W / 2;
    const openTopY = py - DH / 2 + 6;

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
      // Disable the physics body so Mimi can walk through
      if (this._doorBodyRect?.body) this._doorBodyRect.body.enable = false;

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
      if (this._doorBodyRect?.body) this._doorBodyRect.body.enable = true;

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
    const px = tx(this.regionData.npcTile.col);
    const py = ty(this.regionData.npcTile.row);

    this._npc = new NPC(
      this,
      px, py,
      { spriteKey: 'npc_wizard', spriteKeyB: 'npc_wizard_b' },
      (done) => {
        if (this.dialog.isOpen) return;
        // Pick a new random joke every interaction
        const joke = NPC_JOKES[Math.floor(Math.random() * NPC_JOKES.length)];
        // Page 1: setup — pause for the player to read it
        this.dialog.show(joke.setup, () => {
          // Page 2: punchline + math hint together
          const hint = this.regionData.npcHint;
          this.dialog.show(`${joke.punchline}\n\n💡 Hint: ${hint}`, done, '🧙 Wizard');
        }, '🧙 Wizard');
      },
    );
    this._npc.registerOverlap(this.mimi.sprite);
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
      if (dx * dx + dy * dy < 40 * 40) {
        this._startBossBattle();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('OverworldScene');
      });
    }
  }
}