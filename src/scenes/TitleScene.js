/**
 * TitleScene — animated title screen with New Game / Continue buttons.
 *
 * "New Game" opens an in-scene world-select overlay so the player can start
 * at any world (all previous worlds are auto-unlocked).  Continuing loads
 * the existing save and returns to the World Map.
 */
import * as Phaser from 'phaser';
import GameState from '../config/GameState.js';
import BGM       from '../audio/BGM.js';
import { openSettings, closeSettings } from '../ui/SettingsOverlay.js';

const TITLE_COLOR = '#FFD700';
const BG_COLOR    = 0x0D0D2A;
const STAR_COUNT  = 80;

export default class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // BGM.play() needs Tone.start() which requires a user gesture.
    // Fire on the very first pointer OR key event instead of create().
    const _startMusic = () => BGM.play('title');
    this.input.once('pointerdown', _startMusic);
    this.input.keyboard.once('keydown', _startMusic);

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Load existing save early so we can show stats on the title screen.
    const hasSave = !!localStorage.getItem('mimi_vs_math_save');
    if (hasSave) GameState.load();

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
      fontSize: '52px', color: '#442200', fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.52, 'Mimi vs. Math', {
      fontSize: '52px', color: TITLE_COLOR, fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5);

    // Tagline
    this.add.text(W / 2, H * 0.61, 'A Math Adventure for Grades 1–5', {
      fontSize: '18px', color: '#AACCFF', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(0.5);

    // Main buttons
    this._makeButton(W / 2, H * 0.72, '⭐  New Game', () => this._showWorldSelect());
    if (hasSave) {
      this._makeButton(W / 2, H * 0.81, '▶  Continue', () => this._continue());
    }

    // Stats button — only shown if the player has answered at least one question
    if (GameState.stats.answered > 0) {
      const sb = this.add.rectangle(W / 2, H * (hasSave ? 0.9 : 0.81), 180, 36, 0x0C1A0C)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(1.5, 0x44AA44);
      const st = this.add.text(W / 2, H * (hasSave ? 0.9 : 0.81), '📊  View Stats', {
        fontSize: '16px', color: '#88FF88', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
      }).setOrigin(0.5);
      sb.on('pointerover', () => { sb.setFillStyle(0x153015); st.setColor('#AAFFAA'); });
      sb.on('pointerout',  () => { sb.setFillStyle(0x0C1A0C); st.setColor('#88FF88'); });
      sb.on('pointerdown', () => this._showStatsOverlay());
    }

    // Settings button — bottom-right corner, always visible
    const setBtn = this.add.rectangle(W - 54, H - 20, 92, 28, 0x111130)
      .setStrokeStyle(1.5, 0x4466AA).setInteractive({ useHandCursor: true });
    const setTxt = this.add.text(W - 54, H - 20, '⚙  Settings', {
      fontSize: '13px', color: '#99BBDD', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5);
    setBtn.on('pointerover', () => { setBtn.setFillStyle(0x1A2050); setTxt.setColor('#CCDDFF'); });
    setBtn.on('pointerout',  () => { setBtn.setFillStyle(0x111130); setTxt.setColor('#99BBDD'); });
    setBtn.on('pointerdown', () => this._showSettingsOverlay());

    // Footer
    this.add.text(W / 2 - 50, H - 4, 'WASD / Arrow keys to move  ·  Space to interact  ·  Esc to pause', {
      fontSize: '11px', color: '#556688', fontFamily: "'Nunito', Arial, sans-serif",
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
      fontSize: '22px', color: '#FFFFFF', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
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
    const D = 200;

    const items = this._worldSelectItems = [];
    const add = obj => { items.push(obj); return obj; };

    // Dim background
    const dim = add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.80)
      .setDepth(D).setInteractive());
    dim.on('pointerdown', () => this._closeWorldSelect());

    // Panel
    add(this.add.rectangle(W / 2, H / 2, Math.min(680, W * 0.94), 330, 0x080824)
      .setDepth(D + 1).setStrokeStyle(2, 0x4488FF));

    // Title
    add(this.add.text(W / 2, H / 2 - 145, 'Choose Your Grade', {
      fontSize: '24px', color: '#FFD700',
      fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 2));

    add(this.add.text(W / 2, H / 2 - 118, 'Earlier grades unlock automatically', {
      fontSize: '12px', color: '#8899BB', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(0.5).setDepth(D + 2));

    // One card per grade — each maps to the first region of that grade level
    const GRADES = [
      { num: 1, topic: 'Adding &\nSubtracting',     regionId: 0, fill: 0x2A1A00, hover: 0x3D2800, stroke: 0xFFCC44 },
      { num: 2, topic: 'Place Value &\nTimes Tables', regionId: 1, fill: 0x0A2010, hover: 0x153020, stroke: 0x44CC66 },
      { num: 3, topic: 'Multiplication\n& Division',  regionId: 3, fill: 0x0A1428, hover: 0x142040, stroke: 0x44AAFF },
      { num: 4, topic: 'Fractions &\nDecimals',       regionId: 5, fill: 0x1A0A28, hover: 0x281440, stroke: 0xAA44FF },
      { num: 5, topic: 'Percentages\n& Ratios',       regionId: 6, fill: 0x280A0A, hover: 0x3D1414, stroke: 0xFF6644 },
    ];

    const cardW  = 108;
    const cardH  = 148;
    const gap    = 12;
    const totalW = GRADES.length * cardW + (GRADES.length - 1) * gap;
    const startX = W / 2 - totalW / 2 + cardW / 2;
    const cardY  = H / 2 + 8;

    GRADES.forEach((g, i) => {
      const cx = startX + i * (cardW + gap);

      const card = add(this.add.rectangle(cx, cardY, cardW, cardH, g.fill)
        .setDepth(D + 2).setStrokeStyle(2.5, g.stroke)
        .setInteractive({ useHandCursor: true }));

      // Large grade number
      add(this.add.text(cx, cardY - 48, String(g.num), {
        fontSize: '46px', color: '#FFFFFF',
        fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif", fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(D + 3));

      // "Grade" label beneath number
      add(this.add.text(cx, cardY - 14, 'Grade', {
        fontSize: '10px', color: '#AABBCC', fontFamily: "'Nunito', Arial, sans-serif",
      }).setOrigin(0.5).setDepth(D + 3));

      // Thin separator
      add(this.add.rectangle(cx, cardY + 2, cardW - 20, 1, g.stroke, 0.35)
        .setDepth(D + 3));

      // Topic text
      add(this.add.text(cx, cardY + 26, g.topic, {
        fontSize: '10px', color: '#DDEEFF', fontFamily: "'Nunito', Arial, sans-serif",
        align: 'center', wordWrap: { width: cardW - 10 },
      }).setOrigin(0.5).setDepth(D + 3));

      // "Start here" call-to-action
      add(this.add.text(cx, cardY + 60, '▶ Start', {
        fontSize: '10px', fontStyle: 'bold',
        color: '#' + g.stroke.toString(16).padStart(6, '0'),
        fontFamily: "'Nunito', Arial, sans-serif",
      }).setOrigin(0.5).setDepth(D + 3));

      card.on('pointerover', () => { card.setFillStyle(g.hover); });
      card.on('pointerout',  () => { card.setFillStyle(g.fill);  });
      card.on('pointerdown', () => this._startAtWorld(g.regionId));
    });

    // Cancel button
    const cb = add(this.add.rectangle(W / 2, H / 2 + 145, 150, 36, 0x2A0A0A)
      .setDepth(D + 2).setStrokeStyle(1.5, 0xCC4444).setInteractive({ useHandCursor: true }));
    const ct = add(this.add.text(W / 2, H / 2 + 145, '✕  Cancel', {
      fontSize: '14px', color: '#FF8888', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
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

  // ── Stats overlay ──────────────────────────────────────────────────────

  _showStatsOverlay() {
    if (this._statsItems) return;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const D = 300;
    const s = GameState.stats;
    const items = this._statsItems = [];
    const add = o => { items.push(o); return o; };

    const dim = add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.80)
      .setDepth(D).setInteractive());
    dim.on('pointerdown', () => this._closeStatsOverlay());

    add(this.add.rectangle(W / 2, H / 2, 420, 370, 0x08082A)
      .setDepth(D + 1).setStrokeStyle(2, 0x4488FF));

    add(this.add.text(W / 2, H / 2 - 162, '📊  Mimi’s Stats', {
      fontSize: '24px', color: '#FFD700', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 2));

    const dg = add(this.add.graphics().setDepth(D + 2));
    dg.lineStyle(1, 0x445588, 0.8);
    dg.lineBetween(W / 2 - 190, H / 2 - 140, W / 2 + 190, H / 2 - 140);

    const pct = s.answered > 0
      ? Math.round(s.correct / s.answered * 100) : 100;
    const avgSec = s.answered > 0
      ? (s.totalTimeMs / s.answered / 1000).toFixed(1) : '—';

    const rows = [
      ['❓ Questions Answered',   String(s.answered)],
      ['✅ Correct',              `${s.correct}  (${pct}%)`],
      ['❌ Incorrect / Timeouts', String(s.incorrect)],
      ['⏱ Avg. Answer Time',      `${avgSec}s`],
      ['', ''],
      ['🔥 Best Streak',            String(s.bestStreak)],
      ['⚔️ Battles Won',            String(s.battlesWon)],
      ['💤 Battles Lost',           String(s.battlesLost)],
      ['✨ Perfect Battles',         String(s.perfectBattles)],
    ];

    let ry = H / 2 - 132;
    rows.forEach(([label, value]) => {
      if (!label) { ry += 10; return; }
      add(this.add.text(W / 2 - 168, ry, label,
        { fontSize: '14px', color: '#CCDDFF', fontFamily: "'Nunito', Arial, sans-serif" },
      ).setOrigin(0, 0).setDepth(D + 2));
      add(this.add.text(W / 2 + 168, ry, value,
        { fontSize: '14px', color: '#FFFFFF', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold' },
      ).setOrigin(1, 0).setDepth(D + 2));
      ry += 26;
    });

    const cb = add(this.add.rectangle(W / 2, H / 2 + 155, 160, 34, 0x2A0A0A)
      .setDepth(D + 2).setStrokeStyle(1.5, 0xCC4444).setInteractive({ useHandCursor: true }));
    const ct = add(this.add.text(W / 2, H / 2 + 155, '✕  Close',
      { fontSize: '14px', color: '#FF8888', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold' },
    ).setOrigin(0.5).setDepth(D + 3));
    cb.on('pointerover', () => { cb.setFillStyle(0x401515); ct.setColor('#FFAAAA'); });
    cb.on('pointerout',  () => { cb.setFillStyle(0x2A0A0A); ct.setColor('#FF8888'); });
    cb.on('pointerdown', () => this._closeStatsOverlay());
  }

  _closeStatsOverlay() {
    if (!this._statsItems) return;
    this._statsItems.forEach(o => o.destroy());
    this._statsItems = null;
  }

  _showSettingsOverlay() { openSettings(this, 400); }
  _closeSettingsOverlay() { closeSettings(this); }

  _startAtWorld(regionId) {
    this._closeWorldSelect();

    // Reset to a clean slate, then set up the chosen starting world
    GameState.reset();
    for (let i = 0; i < regionId; i++) {
      if (!GameState.defeatedBosses.includes(i)) {
        GameState.defeatedBosses.push(i);
      }
    }
    GameState.currentRegion = regionId;
    GameState.save();

    // Always show the story intro — _finish() routes to the right world after
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('StoryScene');
    });
  }

  _continue() {
    GameState.load();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('OverworldScene');
    });
  }
}
