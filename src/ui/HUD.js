/**
 * HUD — exploration scene heads-up display.
 *
 * Shows:  ♥ hearts  |  Region name  |  Kill-count progress  |  Inventory pills
 *
 * Call update() each frame so the kill count stays current.
 */
import * as Phaser from 'phaser';
import GameState from '../config/GameState.js';

const HEART_COLOR   = 0xFF4466;
const EMPTY_COLOR   = 0x444444;
const PANEL_COLOR   = 0x000000;
const PANEL_ALPHA   = 0.55;

export default class HUD {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} regionData  - full region object from regions.js
   */
  constructor(scene, regionData) {
    this.scene      = scene;
    this.regionData = regionData;
    this.regionName = regionData.name;

    const W = scene.cameras.main.width;

    // Background panel
    this._panel = scene.add.rectangle(W / 2, 30, W, 60, PANEL_COLOR, PANEL_ALPHA)
      .setScrollFactor(0).setDepth(50);

    // Hearts (max 6 shown) — use pre-generated image textures from BootScene
    this._hearts = [];
    for (let i = 0; i < 6; i++) {
      const h = scene.add.image(20 + i * 26, 20, 'heart_full')
        .setDisplaySize(20, 20).setScrollFactor(0).setDepth(51);
      this._hearts.push(h);
    }

    // Region label
    this._regionLabel = scene.add.text(W / 2, 10, this.regionName, {
      fontSize: '14px', color: '#FFEEAA', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51);

    // Kill-count / enemies-defeated progress indicator
    this._statsText = scene.add.text(W / 2, 30, '', {
      fontSize: '13px', color: '#AADDFF', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51);

    // Inventory icon slots (top-right, one badge per item type, right-anchored)
    const ITEM_SLOTS = [
      { key: 'item_fossil',  id: 'fish_fossil'   },
      { key: 'item_collar',  id: 'lucky_collar'  },
      { key: 'item_catnip',  id: 'catnip'        },
      { key: 'item_yarn',    id: 'yarn_ball'      },
      { key: 'item_sardine', id: 'sardine'        },
    ];
    this._invSlots = ITEM_SLOTS.map((item, i) => {
      const cx = W - 18 - i * 36;   // badge centre x (right-anchored)
      const bg = scene.add.rectangle(cx, 17, 34, 20, 0x00001C, 0.65)
        .setScrollFactor(0).setDepth(50);
      const img = scene.add.image(cx - 9, 17, item.key)
        .setDisplaySize(16, 16).setOrigin(0.5).setScrollFactor(0).setDepth(51);
      const lbl = scene.add.text(cx + 3, 17, '', {
        fontSize: '13px', color: '#FFFFFF',
        fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
      return { img, lbl, bg, id: item.id };
    });

    this.refresh();
  }

  refresh() {
    const { hp, inventory } = GameState;

    // Hearts
    const fullHearts = Math.floor(hp / 2);
    const halfHeart  = hp % 2 === 1;
    for (let i = 0; i < 6; i++) {
      if (i < fullHearts)                        this._hearts[i].setTexture('heart_full');
      else if (i === fullHearts && halfHeart)    this._hearts[i].setTexture('heart_half');
      else                                       this._hearts[i].setTexture('heart_empty');
    }

    // Kill-count progress (⚔ K / N defeated) — or legacy remaining count
    const unlockKills = this.regionData.bossUnlockKills;
    let enemyStr;
    if (unlockKills != null) {
      if (GameState.hasDefeatedBoss(this.regionData.id)) {
        enemyStr = '⚔ Boss defeated!';
      } else {
        // _killCount lives on the ExploreScene instance (this.scene)
        const killCount = this.scene._killCount ?? 0;
        enemyStr = `⚔ ${killCount} / ${unlockKills} defeated`;
      }
    } else {
      // Legacy fallback: count enemies not yet flagged as defeated
      const remaining = this.regionData.enemySpawns.filter(
        (spawn, i) => !GameState.isEnemyDefeated(this.regionData.id, spawn.id + i),
      ).length;
      enemyStr = remaining > 0 ? `⚔ ${remaining} left` : '⚔ all clear';
    }
    this._statsText.setText(enemyStr);

    // Inventory icon slots
    this._invSlots.forEach(slot => {
      const count = inventory[slot.id] || 0;
      const show  = count > 0;
      slot.bg.setVisible(show);
      slot.img.setVisible(show);
      slot.lbl.setText(show ? `×${count}` : '').setVisible(show);
    });
  }

  update() {
    this.refresh();
  }
}

