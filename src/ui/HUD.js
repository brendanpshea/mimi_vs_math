/**
 * HUD — exploration scene heads-up display.
 *
 * Shows:  ♥ hearts  |  Region name  |  Accuracy stat  |  Inventory pills
 *
 * Call update() each frame so the accuracy stays current.
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

    // Hearts (max 6 shown)
    this._hearts = [];
    for (let i = 0; i < 6; i++) {
      const h = scene.add.text(16 + i * 26, 14, '♥', {
        fontSize: '22px', color: '#FF4466', fontFamily: "'Nunito', Arial, sans-serif",
      }).setScrollFactor(0).setDepth(51);
      this._hearts.push(h);
    }

    // Region label
    this._regionLabel = scene.add.text(W / 2, 10, this.regionName, {
      fontSize: '14px', color: '#FFEEAA', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51);

    // Accuracy stat + enemies remaining
    this._statsText = scene.add.text(W / 2, 30, '', {
      fontSize: '11px', color: '#AADDFF', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51);

    // Inventory label (top-right)
    this._invLabel = scene.add.text(W - 10, 10, '', {
      fontSize: '16px', color: '#FFFFFF', fontFamily: "'Nunito', Arial, sans-serif",
      align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    this.refresh();
  }

  refresh() {
    const { hp, maxHP, stats, inventory } = GameState;

    // Hearts
    const fullHearts  = Math.floor(hp / 2);
    const halfHeart   = hp % 2 === 1;
    for (let i = 0; i < 6; i++) {
      if (i < fullHearts)                         this._hearts[i].setColor('#FF4466');
      else if (i === fullHearts && halfHeart)      this._hearts[i].setColor('#FF88AA');
      else                                         this._hearts[i].setColor('#333344');
    }

    // Accuracy stat
    const pct = stats.answered > 0
      ? Math.round(stats.correct / stats.answered * 100)
      : 100;

    // Enemies remaining in the current region
    const remaining = this.regionData.enemySpawns.filter(
      (spawn, i) => !GameState.isEnemyDefeated(this.regionData.id, spawn.id + i),
    ).length;
    const enemyStr = remaining > 0 ? `⚔ ${remaining} left` : '⚔ all clear';

    this._statsText.setText(
      `✓ ${stats.correct}/${stats.answered}  ·  ${pct}% accuracy  ·  streak best: ${stats.bestStreak}  ·  ${enemyStr}`,
    );

    // Inventory
    const parts = [];
    if (inventory.sardine)      parts.push(`🐟×${inventory.sardine}`);
    if (inventory.yarn_ball)    parts.push(`🧶×${inventory.yarn_ball}`);
    if (inventory.catnip)       parts.push(`🌿×${inventory.catnip}`);
    if (inventory.lucky_collar) parts.push(`💎×${inventory.lucky_collar}`);
    if (inventory.fish_fossil)  parts.push(`🦴×${inventory.fish_fossil}`);
    this._invLabel.setText(parts.join('  '));
  }

  update() {
    this.refresh();
  }
}

