/**
 * ExploreScene — top-down room exploration for a single region.
 *
 * Layout per region:
 *   • Floor + wall border drawn via Phaser Graphics
 *   • 3 roaming enemy sprites (static physics); touching one starts a battle
 *   • 1 NPC with a hint
 *   • 1 treasure chest (awards a random item)
 *   • Boss door in the top-right corner — opens when all 3 enemies are defeated
 *
 * Scene data expected:  { regionId: number }
 * Returns to OverworldScene (boss cleared) or stays in region otherwise.
 */
import GameState   from '../config/GameState.js';
import REGIONS     from '../data/regions.js';
import ENEMIES     from '../data/enemies.js';
import Mimi        from '../entities/Mimi.js';
import Enemy       from '../entities/Enemy.js';
import HUD         from '../ui/HUD.js';
import DialogBox   from '../ui/DialogBox.js';

// Tile size and room dimensions
const T  = 32;     // tile size px
const RW = 24;     // room width  in tiles
const RH = 17;     // room height in tiles
const WALL = 2;    // wall thickness in tiles

// Convert tile coords to pixel coords (top-left of canvas is 0,0)
const tx = col  => col * T + T / 2;
const ty = row  => row * T + T / 2 + 60;   // +60 for HUD

// Enemy starting positions (tile coords, excluding HUD offset handled by ty)
const ENEMY_TILES = [
  { col: 6,  row: 6  },
  { col: 18, row: 4  },
  { col: 10, row: 12 },
];
const NPC_TILE    = { col: 4,  row: 12 };
const CHEST_TILE  = { col: 20, row: 12 };
const BOSS_TILE   = { col: 22, row: 2  };
const MIMI_START  = { col: 3,  row: 8  };

export default class ExploreScene extends Phaser.Scene {
  constructor() { super({ key: 'ExploreScene' }); }

  init(data) {
    this.regionId   = data?.regionId ?? GameState.currentRegion;
    this.regionData = REGIONS[this.regionId];
    // If returning from a battle, process the result
    this.battleResult = data?.battleResult ?? null;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this._drawRoom(W, H);
    this._addDecorations();

    // Create Mimi
    this.mimi = new Mimi(this, tx(MIMI_START.col), ty(MIMI_START.row));
    this.physics.world.setBounds(
      WALL * T, 60 + WALL * T,
      (RW - WALL * 2) * T, (RH - WALL * 2) * T,
    );
    this.mimi.sprite.setCollideWorldBounds(true);
    // Add wall collider now that both mimi and walls exist
    this.physics.add.collider(this.mimi.sprite, this._walls);

    // Enemies
    this._setupEnemies();

    // NPC
    this._setupNPC();

    // Chest
    this._setupChest();

    // Boss door
    this._setupBossDoor();

    // HUD
    this.hud = new HUD(this, this.regionData.name);

    // Dialog box
    this.dialog = new DialogBox(this);

    // Pause key
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Handle any pending battle result
    if (this.battleResult) {
      this.time.delayedCall(200, () => this._handleBattleResult());
    }
  }

  // ── Room drawing ─────────────────────────────────────────────────────────

  _drawRoom(W, H) {
    const { floorColor, wallColor } = this.regionData;

    // HUD bar area
    this.add.rectangle(W / 2, 30, W, 60, 0x000000, 0.5).setDepth(50);

    // Floor
    this.add.rectangle(
      (RW / 2) * T, 60 + (RH / 2) * T,
      RW * T, RH * T,
      floorColor,
    );

    // Walls (top, bottom, left, right)
    const wallRects = [
      { x: RW / 2 * T,      y: 60 + WALL / 2 * T,       w: RW * T,      h: WALL * T },
      { x: RW / 2 * T,      y: 60 + (RH - WALL / 2) * T, w: RW * T,      h: WALL * T },
      { x: WALL / 2 * T,    y: 60 + RH / 2 * T,          w: WALL * T,    h: RH * T   },
      { x: (RW - WALL / 2) * T, y: 60 + RH / 2 * T,      w: WALL * T,    h: RH * T   },
    ];

    const wallGfx = this.add.graphics();
    for (const r of wallRects) {
      wallGfx.fillStyle(wallColor);
      wallGfx.fillRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h);
    }

    // Static physics walls
    this._walls = this.physics.add.staticGroup();
    for (const r of wallRects) {
      const rect = this.add.rectangle(r.x, r.y, r.w, r.h, wallColor, 0);
      this.physics.add.existing(rect, true);
      this._walls.add(rect);
    }
    // Collider with Mimi added in create() after Mimi is instantiated
  }

  _addDecorations() {
    // A few simple decorative elements (trees/rocks) depending on region
    const { accentColor } = this.regionData;
    const gfx = this.add.graphics();
    const spots = [
      { col: 8, row: 3 }, { col: 15, row: 3 }, { col: 6, row: 14 },
      { col: 20, row: 6 }, { col: 12, row: 14 },
    ];
    for (const s of spots) {
      const px = tx(s.col);
      const py = ty(s.row);
      // Tree trunk
      gfx.fillStyle(0x8B6B4A);
      gfx.fillRect(px - 4, py, 8, 12);
      // Foliage
      gfx.fillStyle(accentColor);
      gfx.fillCircle(px, py - 4, 14);
    }
  }

  // ── Enemies ───────────────────────────────────────────────────────────────

  _setupEnemies() {
    this._enemies     = [];
    this._liveCount   = 0;
    const enemyKeys   = this.regionData.enemies;

    ENEMY_TILES.forEach((tile, i) => {
      const key  = enemyKeys[i % enemyKeys.length];
      const data = ENEMIES[key];

      // Skip if already defeated in this save
      if (GameState.isEnemyDefeated(this.regionId, key + i)) return;

      const enemy = new Enemy(
        this, tx(tile.col), ty(tile.row), data,
        (d) => this._startBattle(d, key + i),
      );
      enemy.registerOverlap(this.mimi.sprite);
      this._enemies.push(enemy);
      this._liveCount++;
    });
  }

  _startBattle(enemyData, instanceKey) {
    this.scene.start('BattleScene', {
      enemy:        enemyData,
      enemyInstance: instanceKey,
      regionId:     this.regionId,
      isBoss:       false,
      returnScene:  'ExploreScene',
      returnData:   { regionId: this.regionId },
    });
  }

  _handleBattleResult() {
    const { battleResult } = this;
    if (!battleResult) return;

    if (battleResult.victory) {
      const key = battleResult.enemyInstance;
      if (key !== undefined) {
        GameState.defeatEnemy(this.regionId, key);
        this._liveCount = Math.max(0, this._liveCount - 1);
      }

      if (battleResult.isBoss) {
        // Boss beaten → return to overworld
        GameState.defeatBoss(this.regionId);
        this.time.delayedCall(300, () => {
          this.dialog.show(
            `You defeated ${this.regionData.bossName}!\n\nThe path to the next region is now open!`,
            () => this.scene.start('OverworldScene', { bossDefeated: true, regionId: this.regionId }),
            '🎉 Victory!',
          );
        });
      } else {
        this._checkBossDoor();
      }

      // Level-up notification
      if (battleResult.leveledUp) {
        this.time.delayedCall(600, () => {
          this.dialog.show(
            `Level Up! Mimi is now Level ${GameState.level}.\nMath Power increased!`,
            null, '⭐ Level Up!',
          );
        });
      }
    }

    // HP sync
    this.hud.refresh();
  }

  // ── Boss door ─────────────────────────────────────────────────────────────

  _setupBossDoor() {
    const px = tx(BOSS_TILE.col);
    const py = ty(BOSS_TILE.row);
    const gfx = this.add.graphics();

    // Draw door graphic
    gfx.fillStyle(0x442266);
    gfx.fillRect(px - 20, py - 28, 40, 56);
    gfx.fillStyle(0x6633AA);
    gfx.fillRect(px - 14, py - 28, 28, 56);
    gfx.lineStyle(2, 0xFFDD44, 1);
    gfx.strokeRect(px - 14, py - 28, 28, 56);

    // Padlock symbol (shown while locked)
    this._bossLockText = this.add.text(px, py, '🔒', { fontSize: '22px' }).setOrigin(0.5).setDepth(10);

    this._bossLabel = this.add.text(px, py + 34, `Boss:\n${this.regionData.bossName}`, {
      fontSize: '10px', color: '#FF99FF', fontFamily: 'Arial', align: 'center',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(10);

    // Boss door overlap zone
    this._bossDoorZone = this.add.zone(px, py, 40, 56).setDepth(5);
    this.physics.world.enable(this._bossDoorZone);
    this._bossDoorZone.body.setAllowGravity(false);
    this._bossDoorZone.body.setImmovable(true);

    this._bossOpen = GameState.hasDefeatedBoss(this.regionId);
    this._checkBossDoor();

    // Overlap check for entering boss fight
    this.physics.add.overlap(this.mimi.sprite, this._bossDoorZone, () => {
      if (this._bossOpen) this._startBossBattle();
    });
  }

  _checkBossDoor() {
    // Open door only when all enemies in the region are defeated
    const allCleared = ENEMY_TILES.every((tile, i) => {
      const key = this.regionData.enemies[i % this.regionData.enemies.length] + i;
      return GameState.isEnemyDefeated(this.regionId, key);
    });

    this._bossOpen = allCleared || GameState.hasDefeatedBoss(this.regionId);

    if (this._bossOpen) {
      this._bossLockText.setVisible(false);
      this._bossLabel.setColor('#FFDD44');
    }
  }

  _startBossBattle() {
    if (this._bossBattleStarted) return;
    this._bossBattleStarted = true;

    const bossKey  = this.regionData.boss;
    const bossData = ENEMIES[bossKey];
    this.scene.start('BattleScene', {
      enemy:       bossData,
      enemyInstance: 'boss',
      regionId:    this.regionId,
      isBoss:      true,
      returnScene: 'ExploreScene',
      returnData:  { regionId: this.regionId },
    });
  }

  // ── NPC ───────────────────────────────────────────────────────────────────

  _setupNPC() {
    const px = tx(NPC_TILE.col);
    const py = ty(NPC_TILE.row);

    const npc = this.add.image(px, py, 'tile_npc').setDepth(8);
    this.tweens.add({ targets: npc, y: py - 4, duration: 800, yoyo: true, repeat: -1 });

    this.add.text(px, py + 20, 'NPC', {
      fontSize: '10px', color: '#FFE8A0', fontFamily: 'Arial',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(9);

    // Interaction zone
    const zone = this.add.zone(px, py, 48, 48).setDepth(5);
    this.physics.world.enable(zone);
    zone.body.setAllowGravity(false);

    let canInteract = true;
    this.physics.add.overlap(this.mimi.sprite, zone, () => {
      if (canInteract && !this.dialog.isOpen) {
        canInteract = false;
        this.dialog.show(this.regionData.npcHint, () => {
          this.time.delayedCall(1000, () => { canInteract = true; });
        }, '🐾 Hint');
      }
    });
  }

  // ── Treasure chest ────────────────────────────────────────────────────────

  _setupChest() {
    if (GameState.isEnemyDefeated(this.regionId, 'chest')) return;

    const px = tx(CHEST_TILE.col);
    const py = ty(CHEST_TILE.row);
    const chest = this.add.image(px, py, 'tile_chest').setDepth(8);

    const zone = this.add.zone(px, py, 40, 40).setDepth(5);
    this.physics.world.enable(zone);
    zone.body.setAllowGravity(false);

    const items = ['sardine', 'yarn_ball', 'catnip', 'lucky_collar', 'fish_fossil'];
    let opened = false;

    this.physics.add.overlap(this.mimi.sprite, zone, () => {
      if (opened) return;
      opened = true;
      const item = items[Phaser.Math.Between(0, items.length - 1)];
      GameState.addItem(item);
      GameState.defeatEnemy(this.regionId, 'chest');
      chest.setTint(0x666666);

      const ITEM_NAMES = {
        sardine: 'Sardine 🐟 (+2 HP)',
        yarn_ball: 'Yarn Ball 🧶 (+5s timer)',
        catnip: 'Catnip 🌿 (double hit)',
        lucky_collar: 'Lucky Collar 💎 (shield)',
        fish_fossil: 'Fish Fossil 🦴 (hint)',
      };
      this.dialog.show(
        `You opened a chest!\nFound: ${ITEM_NAMES[item]}`,
        null, '📦 Treasure!',
      );
      this.hud.refresh();
    });
  }

  // ── Scene lifecycle ───────────────────────────────────────────────────────

  update() {
    if (this.dialog.isOpen) {
      this.mimi.freeze();
      this.dialog.update();
      return;
    }
    this.mimi.unfreeze();
    this.mimi.update();
    this.hud.update();

    // Pause → overworld
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.scene.start('OverworldScene');
    }
  }
}
