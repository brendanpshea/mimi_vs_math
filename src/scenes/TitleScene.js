/**
 * TitleScene — animated title screen with New Game / Continue buttons.
 */
import GameState from '../config/GameState.js';

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
    this.add.text(W / 2, H * 0.61, 'A Math Adventure for Grades 1–7', {
      fontSize: '18px', color: '#AACCFF', fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Buttons
    const hasSave = !!localStorage.getItem('mimi_vs_math_save');
    this._makeButton(W / 2, H * 0.73, '⭐  New Game', () => this._newGame());
    if (hasSave) {
      this._makeButton(W / 2, H * 0.83, '▶  Continue', () => this._continue());
    }

    // Footer
    this.add.text(W / 2, H - 16, 'WASD / Arrow keys to move  ·  Space to interact  ·  Esc to pause', {
      fontSize: '11px', color: '#556688', fontFamily: 'Arial',
    }).setOrigin(0.5, 1);

    // Press Enter to start (shortcut)
    this.input.keyboard.once('keydown-ENTER', () => this._newGame());
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

  _newGame() {
    GameState.reset();
    this.scene.start('OverworldScene');
  }

  _continue() {
    GameState.load();
    this.scene.start('OverworldScene');
  }
}
