/**
 * StoryScene — five-panel intro story shown on New Game.
 * Navigate with click / Enter / Space.  Skip link on each panel except the last.
 *
 * Layout (fixed three zones — no overlap possible):
 *   Zone A  H 0.00–0.14  Title
 *   Zone B  H 0.15–0.54  Art (sprites / yarn-ball drawing)
 *   Zone C  H 0.56–0.80  Body text on a dark pill background
 *   Zone D  H 0.84–0.96  Button + page dots
 */
import * as Phaser from 'phaser';
import GameState   from '../config/GameState.js';

// ── Zone constants ────────────────────────────────────────────────────────────
// H = 600 reference:
//   Title   centred at  42  (H * 0.07)
//   Art     centred at 180  (H * 0.30)  — Mimi @ scale 3.0 = 192 px → bottom 276
//   Pill    315 → 475        (H * 0.525, 160 px tall)  — 39 px gap below art
//   Button  centred at 540   (H * 0.90)  — 65 px below pill bottom
//   Dots    at 572           (H * 0.953)
const TITLE_Y    = 0.07;
const ART_Y      = 0.30;
const TEXT_TOP_Y = 0.525;   // art pages: pill top (fraction of H)
const BTN_Y      = 0.90;
const DOTS_Y     = 0.953;

const PAGES = [
  {
    bg:         0x0A1520,
    title:      'Somewhere peaceful.  For now.',
    body:       'In the village of Sunny Paws — pop. 214, or 213 if you didn\'t count\nMr. Threadwick\'s goldfish, and most people didn\'t — there lived a\nsmall grey cat named Mimi.\n\nShe was clever, brave, and deeply attached to her yarn ball.\nThis is the story of what happened when someone made the mistake\nof taking it.',
    art:        'mimi_and_yarn',
    titleColor: '#88DDFF',
  },
  {
    bg:         0x1A0808,
    title:      '🦊  Enter Fenwick  (Stage Left, Dramatically)',
    body:       'Fenwick the Sly Fox had stolen many things over the years.\nThree crowns.  Seventeen encyclopaedias.\nThe village\'s second-best pie recipe.\n\nHe had never made an enemy worth worrying about.\nThen he stole Mimi\'s yarn ball.\nHe had absolutely no idea what he had started.',
    art:        'mimi_vs_fenwick',
    titleColor: '#FF8844',
  },
  {
    bg:         0x080808,
    title:      'Five Kingdoms.  Five Champions.',
    body:       'Fenwick\'s shadow now stretched across five kingdoms, each sealed\nbehind a Math Ward — an enchantment only a correct answer\ncould break.\n\nWarriors had tried.  Adventurers had tried.\nOne very confused accountant had tried.\n(The accountant sent a very polite apology note.)',
    art:        'none',
    titleColor: '#CC88FF',
  },
  {
    bg:         0x08101A,
    title:      '✨  The Only Language Fenwick Fears',
    body:       'Every seal, every barricade, every locked gate in the five kingdoms\nbends to the same ancient rule:\n\nAnswer correctly  →  the shield shatters!\nAnswer wrong  →  Mimi takes damage.\n\nFive lands.  Five seals.  All standing between one cat and her yarn ball.',
    art:        'none',
    titleColor: '#88FFCC',
  },
  {
    bg:         0x0A190A,
    title:      '🐱  One Cat.  One Quest.  One Yarn Ball.',
    body:       'The yarn ball isn\'t going to rescue itself.  🧶\n\nHelp Mimi brave five kingdoms, defeat five champions,\nclimb to the top of the Shadow Castle —\nand remind a certain fox exactly how this ends.',
    art:        'mimi_and_fenwick_final',
    titleColor: '#FFDD44',
    last:       true,
  },
];

export default class StoryScene extends Phaser.Scene {
  constructor() { super({ key: 'StoryScene' }); }

  create() {
    this._idx = 0;
    this._draw();
  }

  // ── Build / re-build the current page ───────────────────────────────────
  _draw() {
    this.tweens.killAll();
    this.children.removeAll(true);

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const p = PAGES[this._idx];

    // Zone A — background + stars
    this.add.rectangle(W / 2, H / 2, W, H, p.bg);
    this._stars(W, H);

    // Page-dot indicator
    for (let i = 0; i < PAGES.length; i++) {
      const active = i === this._idx;
      this.add.circle(W / 2 + (i - 2) * 22, H * DOTS_Y,
        active ? 7 : 4, active ? 0xFFDD44 : 0x334455);
    }

    // Zone A — title
    this.add.text(W / 2, H * TITLE_Y, p.title, {
      fontSize: '24px', color: p.titleColor, fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4, align: 'center',
      wordWrap: { width: W - 60 },
    }).setOrigin(0.5, 0.5);

    // Zone B — art
    this._drawArt(p, W, H);

    // Zone C — body text on dark pill
    // Art pages:    fixed 160 px strip just below the art zone (H*0.525–H*0.792)
    // No-art pages: tall pill fills most of the screen (H*0.18 – H*0.79)
    const hasArt   = p.art !== 'none';
    const pillW    = W - 64;
    const pillTopY = hasArt ? H * TEXT_TOP_Y : H * 0.18;
    const pillH    = hasArt ? 175 : (H * BTN_Y - 25 - 44 - H * 0.18);  // 44 = gap above btn
    const pillY    = pillTopY + pillH / 2;

    this.add.rectangle(W / 2, pillY, pillW, pillH, 0x000000, 0.62)
      .setStrokeStyle(1, 0x334466, 0.7);
    this.add.text(W / 2, pillTopY + 14, p.body, {
      fontSize: hasArt ? '15px' : '16px', color: '#DDEEFF', fontFamily: 'Arial',
      align: 'center', stroke: '#000000', strokeThickness: 2,
      lineSpacing: 5, wordWrap: { width: pillW - 48 },
    }).setOrigin(0.5, 0);

    // Zone D — navigation button
    const isLast  = !!p.last;
    const label   = isLast ? '🎮  Begin Adventure!' : 'Next  ▶';
    const bgColor = isLast ? 0x1A3A0A : 0x0A1A3A;
    const stroke  = isLast ? 0x66FF44  : 0x4488FF;

    const btn = this.add.rectangle(W / 2, H * BTN_Y, 290, 50, bgColor)
      .setStrokeStyle(2, stroke)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H * BTN_Y, label, {
      fontSize: '20px', color: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(isLast ? 0x2A5A10 : 0x162A5A));
    btn.on('pointerout',  () => btn.setFillStyle(bgColor));
    btn.on('pointerdown', () => this._advance());

    // Skip link
    if (!isLast) {
      const skip = this.add.text(W - 16, H - 8, 'Skip story →', {
        fontSize: '12px', color: '#445566', fontFamily: 'Arial',
      }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
      skip.on('pointerover', () => skip.setColor('#778899'));
      skip.on('pointerout',  () => skip.setColor('#445566'));
      skip.on('pointerdown', () => this._finish());
    }

    // Keyboard shortcuts
    this.input.keyboard.once('keydown-ENTER', () => this._advance());
    this.input.keyboard.once('keydown-SPACE', () => this._advance());
  }

  // ── Art zone renderer ────────────────────────────────────────────────────
  _drawArt(p, W, H) {
    const artY = H * ART_Y;

    if (p.art === 'mimi_and_yarn') {
      // Mimi left-centre, yarn ball right-centre
      const mimiX = W * 0.38;
      const mimi  = this.add.image(mimiX, artY, 'mimi').setScale(3.0);
      this.tweens.add({
        targets: mimi, y: artY - 10,
        duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      // Yarn ball drawn procedurally (no item sprite loaded yet)
      this._drawYarnBall(W * 0.64, artY);

    } else if (p.art === 'mimi_vs_fenwick') {
      // Mimi on the left, Fenwick on the right, each slightly offset
      const mimiX    = W * 0.26;
      const fenwickX = W * 0.74;

      const mimi = this.add.image(mimiX, artY, 'mimi').setScale(3.0);
      this.tweens.add({
        targets: mimi, y: artY - 8,
        duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      const fenwick = this.add.image(fenwickX, artY, 'professor_negativus')
        .setDisplaySize(110, 110).setFlipX(true);
      this.tweens.add({
        targets: fenwick, y: artY - 10, angle: { from: -3, to: 3 },
        duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      // Yarn ball in the middle, floating away toward Fenwick
      const yarnX = W * 0.50;
      this._drawYarnBall(yarnX, artY - 10);
      // Dashed "snatch" arc hint
      const g = this.add.graphics().setAlpha(0.35);
      g.lineStyle(2, 0xFF8844, 1);
      g.beginPath();
      g.moveTo(mimiX + 50, artY);
      g.lineTo(yarnX - 22, artY - 12);
      g.strokePath();

    } else if (p.art === 'mimi_and_fenwick_final') {
      // Mimi centred, smaller Fenwick silhouette in background
      const mimiX    = W * 0.42;
      const fenwickX = W * 0.72;

      const fenwick = this.add.image(fenwickX, artY + 10, 'professor_negativus')
        .setDisplaySize(80, 80).setAlpha(0.45).setTint(0x440022);

      const mimi = this.add.image(mimiX, artY, 'mimi').setScale(3.2);
      this.tweens.add({
        targets: mimi, y: artY - 10,
        duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: fenwick, alpha: { from: 0.3, to: 0.55 },
        duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
    // 'none' — no art rendered (stars + bg only)
  }

  // ── Yarn ball (procedural) ───────────────────────────────────────────────
  _drawYarnBall(cx, cy) {
    const R  = 26;
    const g  = this.add.graphics();
    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx + 3, cy + R + 4, R * 1.6, 8);
    // Ball body
    g.fillStyle(0xFF6699, 1);
    g.fillCircle(cx, cy, R);
    // Highlight
    g.fillStyle(0xFFAACC, 0.55);
    g.fillCircle(cx - 8, cy - 8, 10);
    // Wind lines
    g.lineStyle(2, 0xCC3366, 0.7);
    g.beginPath(); g.arc(cx, cy, R - 5, -0.6, 1.2); g.strokePath();
    g.beginPath(); g.arc(cx, cy, R - 12, 0.4, 2.2); g.strokePath();
    // Loose thread
    g.lineStyle(2, 0xFF6699, 0.9);
    g.beginPath();
    g.moveTo(cx + R - 2, cy - 6);
    g.lineTo(cx + R + 10, cy - 18);
    g.lineTo(cx + R + 18, cy - 12);
    g.strokePath();

    this.tweens.add({
      targets: g, y: g.y - 8,
      duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: 200,
    });
  }

  _advance() {
    if (PAGES[this._idx].last) { this._finish(); }
    else { this._idx++; this._draw(); }
  }

  _finish() {
    GameState.reset();
    this.scene.start('OverworldScene');
  }

  _stars(W, H) {
    for (let i = 0; i < 55; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Phaser.Math.FloatBetween(0.5, 2);
      const s = this.add.circle(x, y, r, 0xFFFFFF, 0.7);
      this.tweens.add({
        targets: s, alpha: { from: 0.15, to: 0.85 },
        duration: Phaser.Math.Between(900, 2500),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2200),
      });
    }
  }
}
