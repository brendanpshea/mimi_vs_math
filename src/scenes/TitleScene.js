/**
 * TitleScene — animated title screen with New Game / Continue buttons.
 *
 * "New Game" opens an in-scene world-select overlay so the player can start
 * at any world (all previous worlds are auto-unlocked).  Continuing loads
 * the existing save and returns to the World Map.
 */
import * as Phaser from 'phaser';
import GameState from '../config/GameState.js';
import REGIONS   from '../data/regions.js';

const TITLE_COLOR = '#FFD700';
const BG_COLOR    = 0x0D0D2A;
const STAR_COUNT  = 80;

export default class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Background gradient
    this.add.rectangle(W / 2, H / 2, W, H, BG_COLOR);
    this._addStars(W, H);

    // Floating Mimi
    const mimi = this.add.image(W / 2, H * 0.3, 'mimi').setScale(3);
    this.tweens.add({
      targets: mimi, y: H * 0.3 - 12,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Title text with shadow
    this.add.text(W / 2 + 3, H * 0.52 + 3, 'Mimi vs. Math', {
      fontSize: '52px', color: '#442200', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.52, 'Mimi vs. Math', {
      fontSize: '52px', color: TITLE_COLOR, fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Tagline
    this.add.text(W / 2, H * 0.61, 'A Math Adventure for Grades 1–5', {
      fontSize: '18px', color: '#AACCFF', fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Main buttons
    const hasSave = !!localStorage.getItem('mimi_vs_math_save');
    this._makeButton(W / 2, H * 0.72, '⭐  New Game', () => this._showWorldSelect());
    if (hasSave) {
      this._makeButton(W / 2, H * 0.81, '▶  Continue', () => this._continue());
    }

    // Footer
    this.add.text(W / 2, H - 4, 'WASD / Arrow keys to move  ·  Space to interact  ·  Esc to pause', {
      fontSize: '11px', color: '#556688', fontFamily: 'Arial',
    }).setOrigin(0.5, 1);

    // Press Enter to start
    this.input.keyboard.once('keydown-ENTER', () => this._showWorldSelect());
  }

  _addStars(W, H) {
    for (let i = 0; i < STAR_COUNT; i++) {
      const x    = Phaser.Math.Between(0, W);
      const y    = Phaser.Math.Between(0, H);
      const size = Phaser.Math.FloatBetween(1, 3);
      const star = this.add.circle(x, y, size, 0xFFFFFF, 0.7);
      this.tweens.add({
        targets: star, alpha: { from: 0.2, to: 0.9 },
        duration: Phaser.Math.Between(800, 2400),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  _makeButton(x, y, label, callback) {
    const bg = this.add.rectangle(x, y, 260, 50, 0x223366)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x4488FF);

    const txt = this.add.text(x, y, label, {
      fontSize: '22px', color: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerover', () => { bg.setFillStyle(0x3355AA); txt.setColor('#FFEE88'); });
    bg.on('pointerout',  () => { bg.setFillStyle(0x223366); txt.setColor('#FFFFFF'); });
    bg.on('pointerdown', callback);
    return bg;
  }

  // ── World-select overlay ─────────────────────────────────────────────────

  _showWorldSelect() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const D = 200;   // depth base for overlay

    const items = this._worldSelectItems = [];
    const add = obj => { items.push(obj); return obj; };

    // Dim background
    const dim = add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(D).setInteractive());
    dim.on('pointerdown', () => this._closeWorldSelect());

    // Panel
    add(this.add.rectangle(W / 2, H / 2, W * 0.92, 400, 0x080824)
      .setDepth(D + 1).setStrokeStyle(2, 0x4488FF));

    add(this.add.text(W / 2, H / 2 - 178, 'Choose a Starting World', {
      fontSize: '22px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 2));

    add(this.add.text(W / 2, H / 2 - 155, 'Earlier worlds will be unlocked automatically', {
      fontSize: '12px', color: '#8899BB', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(D + 2));

    // Cards — two rows: 3 top, 2 bottom
    const cardW  = 128;
    const cardH  = 108;
    const gapX   = 16;
    const rowY   = [H / 2 - 90, H / 2 + 60];
    const rowCounts = [3, 2];

    REGIONS.forEach((region, i) => {
      const row  = i < 3 ? 0 : 1;
      const col  = i < 3 ? i : i - 3;
      const cols = rowCounts[row];
      const totalW = cols * cardW + (cols - 1) * gapX;
      const cx   = W / 2 - totalW / 2 + col * (cardW + gapX) + cardW / 2;
      const cy   = rowY[row];

      // Card background
      const card = this.add.rectangle(cx, cy, cardW, cardH, 0x0E1A3A)
        .setDepth(D + 2).setStrokeStyle(2, 0x2244AA)
        .setInteractive({ useHandCursor: true });
      add(card);

      // Region number badge
      add(this.add.circle(cx - cardW / 2 + 14, cy - cardH / 2 + 14, 12, 0x1A3A6E)
        .setDepth(D + 3).setStrokeStyle(1.5, 0x4488FF));
      add(this.add.text(cx - cardW / 2 + 14, cy - cardH / 2 + 14, String(i + 1), {
        fontSize: '13px', color: '#AADDFF', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(D + 4));

      // Region name
      add(this.add.text(cx, cy - 26, region.name, {
        fontSize: '11px', color: '#FFE8A0', fontFamily: 'Arial', fontStyle: 'bold',
        wordWrap: { width: cardW - 12 }, align: 'center',
      }).setOrigin(0.5).setDepth(D + 3));

      // Subtitle (trim after ·)
      add(this.add.text(cx, cy - 6, region.subtitle.split('·')[0].trim(), {
        fontSize: '9px', color: '#7799BB', fontFamily: 'Arial',
        wordWrap: { width: cardW - 12 }, align: 'center',
      }).setOrigin(0.5).setDepth(D + 3));

      // Grade label
      add(this.add.text(cx, cy + 14, region.subtitle.split('·')[1]?.trim() ?? '', {
        fontSize: '9px', color: '#55AA88', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(D + 3));

      // "Start here" label
      add(this.add.text(cx, cy + 36, '▶ Start here', {
        fontSize: '10px', color: '#88DDFF', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(D + 3));

      card.on('pointerover', () => { card.setFillStyle(0x1A2E5A); card.setStrokeStyle(2, 0x88CCFF); });
      card.on('pointerout',  () => { card.setFillStyle(0x0E1A3A); card.setStrokeStyle(2, 0x2244AA); });
      card.on('pointerdown', () => this._startAtWorld(i));
    });

    // Cancel button
    const cb = add(this.add.rectangle(W / 2, H / 2 + 175, 150, 36, 0x2A0A0A)
      .setDepth(D + 2).setStrokeStyle(1.5, 0xCC4444).setInteractive({ useHandCursor: true }));
    const ct = add(this.add.text(W / 2, H / 2 + 175, '✕  Cancel', {
      fontSize: '14px', color: '#FF8888', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 3));
    cb.on('pointerover', () => { cb.setFillStyle(0x401515); ct.setColor('#FFAAAA'); });
    cb.on('pointerout',  () => { cb.setFillStyle(0x2A0A0A); ct.setColor('#FF8888'); });
    cb.on('pointerdown', () => this._closeWorldSelect());

    // ESC closes
    this._escKey = this.input.keyboard.once('keydown-ESC', () => this._closeWorldSelect());
  }

  _closeWorldSelect() {
    if (!this._worldSelectItems) return;
    this._worldSelectItems.forEach(o => o.destroy());
    this._worldSelectItems = null;
  }

  _startAtWorld(regionId) {
    this._closeWorldSelect();

    // Reset to a clean slate
    GameState.reset();

    if (regionId === 0) {
      // World 1 plays the story intro normally
      this.scene.start('StoryScene');
      return;
    }

    // Unlock all bosses before the chosen world
    for (let i = 0; i < regionId; i++) {
      if (!GameState.defeatedBosses.includes(i)) {
        GameState.defeatedBosses.push(i);
      }
    }
    GameState.currentRegion = regionId;
    GameState.save();

    this.scene.start('ExploreScene', { regionId });
  }

  _continue() {
    GameState.load();
    this.scene.start('OverworldScene');
  }
}
