/**
 * HUD — exploration scene heads-up display.
 *
 * Shows:  ♥ hearts  |  Region name  |  Level / XP bar  |  Inventory pills
 *
 * Call update() each frame so the XP bar stays current.
 */
import GameState from '../config/GameState.js';

const HEART_COLOR   = 0xFF4466;
const EMPTY_COLOR   = 0x444444;
const XP_COLOR      = 0x44DDFF;
const PANEL_COLOR   = 0x000000;
const PANEL_ALPHA   = 0.55;

export default class HUD {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} regionName
   */
  constructor(scene, regionName) {
    this.scene      = scene;
    this.regionName = regionName;

    const W = scene.cameras.main.width;

    // Background panel
    this._panel = scene.add.rectangle(W / 2, 30, W, 60, PANEL_COLOR, PANEL_ALPHA)
      .setScrollFactor(0).setDepth(50);

    // Hearts (max 6 shown)
    this._hearts = [];
    for (let i = 0; i < 6; i++) {
      const h = scene.add.text(16 + i * 26, 14, '♥', {
        fontSize: '22px', color: '#FF4466', fontFamily: 'Arial',
      }).setScrollFactor(0).setDepth(51);
      this._hearts.push(h);
    }

    // Region label
    this._regionLabel = scene.add.text(W / 2, 10, regionName, {
      fontSize: '14px', color: '#FFEEAA', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51);

    // Level text
    this._levelText = scene.add.text(W / 2, 30, '', {
      fontSize: '11px', color: '#AADDFF', fontFamily: 'Arial',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51);

    // XP bar background
    scene.add.rectangle(W / 2, 50, 200, 8, 0x222222)
      .setScrollFactor(0).setDepth(51);

    // XP bar fill
    this._xpBar = scene.add.rectangle(W / 2 - 100, 50, 0, 8, XP_COLOR)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(52);

    // Inventory label (top-right)
    this._invLabel = scene.add.text(W - 10, 10, '', {
      fontSize: '16px', color: '#FFFFFF', fontFamily: 'Arial',
      align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    this.refresh();
  }

  refresh() {
    const { hp, maxHP, xp, level, inventory } = GameState;

    // Hearts
    const fullHearts  = Math.floor(hp / 2);
    const halfHeart   = hp % 2 === 1;
    for (let i = 0; i < 6; i++) {
      if (i < fullHearts)                         this._hearts[i].setColor('#FF4466');
      else if (i === fullHearts && halfHeart)      this._hearts[i].setColor('#FF88AA');
      else                                         this._hearts[i].setColor('#333344');
    }

    // XP bar
    const needed = level * 50;
    const ratio  = Math.min(xp / needed, 1);
    this._xpBar.setDisplaySize(200 * ratio, 8);

    // Level text
    this._levelText.setText(`Lv ${level}  •  ${xp}/${needed} XP`);

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
