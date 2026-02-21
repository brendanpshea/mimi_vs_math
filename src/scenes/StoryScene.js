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
//   Pill    303 → 523        (H * 0.505, 220 px tall)  — 27 px gap below art
//   Button  centred at 557   (H * 0.929) — 34 px below pill bottom
//   Dots    at 587           (H * 0.978)
const TITLE_Y    = 0.07;
const ART_Y      = 0.30;
const TEXT_TOP_Y = 0.505;   // art pages: pill top (fraction of H)
const BTN_Y      = 0.929;
const DOTS_Y     = 0.978;

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
    body:       'Fenwick\'s shadow stretched across five kingdoms,\neach sealed behind a Math Ward.\n\nWarriors tried.  Adventurers tried.\nOne confused accountant tried — and sent an apology note.',
    art:        'kingdoms_cast',
    titleColor: '#CC88FF',
  },
  {
    bg:         0x08101A,
    title:      '✨  The Only Language Fenwick Fears',
    body:       'Every seal, every locked gate bends to one rule:\n\nAnswer correctly → the shield SHATTERS!\nAnswer wrong → Mimi takes damage.\n\nFive lands.  Five seals.  One yarn ball.',
    art:        'answer_shield',
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
    this.cameras.main.fadeIn(400, 0, 0, 0);

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
      fontSize: '28px', color: p.titleColor,
      fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif",
      stroke: '#000000', strokeThickness: 4, align: 'center',
      wordWrap: { width: W - 48 },
    }).setOrigin(0.5, 0.5);

    // Zone B — art
    this._drawArt(p, W, H);

    // Zone C — body text on dark pill
    // Art pages:    fixed 160 px strip just below the art zone (H*0.525–H*0.792)
    // No-art pages: tall pill fills most of the screen (H*0.18 – H*0.79)
    const hasArt    = p.art !== 'none';
    const pillW     = W - 56;
    const pillTopY  = hasArt ? H * TEXT_TOP_Y : H * 0.18;
    const pillH     = hasArt ? 220 : (H * BTN_Y - 25 - 44 - H * 0.18);
    const pillY     = pillTopY + pillH / 2;
    const pillBorder = parseInt((p.titleColor ?? '#334466').replace('#', ''), 16);

    this.add.rectangle(W / 2, pillY, pillW, pillH, 0x000000, 0.55)
      .setStrokeStyle(1.5, pillBorder, 0.38);
    this.add.text(W / 2, pillTopY + 18, p.body, {
      fontSize: '18px', color: '#DDEEFF', fontFamily: "'Nunito', Arial, sans-serif",
      align: 'center', stroke: '#000000', strokeThickness: 2,
      lineSpacing: 7, wordWrap: { width: pillW - 40 },
    }).setOrigin(0.5, 0);

    // Zone D — navigation button
    const isLast  = !!p.last;
    const label   = isLast ? '🎮  Begin Adventure!' : 'Next  ▶';
    const bgColor = isLast ? 0x1A3A0A : 0x0A1A3A;
    const stroke  = isLast ? 0x66FF44  : 0x4488FF;

    // Button shadow
    this.add.rectangle(W / 2 + 2, H * BTN_Y + 3, 302, 50, 0x000000, 0.35);
    const btn = this.add.rectangle(W / 2, H * BTN_Y, 302, 50, bgColor)
      .setStrokeStyle(2, stroke)
      .setInteractive({ useHandCursor: true });
    // Top bevel
    this.add.rectangle(W / 2, H * BTN_Y - 13, 294, 10, 0xFFFFFF, 0.07);
    const btnTxt = this.add.text(W / 2, H * BTN_Y, label, {
      fontSize: '21px', color: '#FFFFFF',
      fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif",
    }).setOrigin(0.5);

    btn.on('pointerover', () => { btn.setFillStyle(isLast ? 0x2A5A10 : 0x162A5A); btnTxt.setScale(1.04); });
    btn.on('pointerout',  () => { btn.setFillStyle(bgColor); btnTxt.setScale(1); });
    btn.on('pointerdown', () => this._advance());

    // Skip link
    if (!isLast) {
      const skip = this.add.text(W - 16, H - 8, 'Skip story →', {
        fontSize: '12px', color: '#445566', fontFamily: "'Nunito', Arial, sans-serif",
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

      const fenwick = this.add.image(fenwickX, artY, 'fenwick')
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

      const fenwick = this.add.image(fenwickX, artY + 10, 'fenwick')
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

    } else if (p.art === 'kingdoms_cast') {
      // Five boss portraits spread across the art zone
      const keys = ['subtraction_witch', 'count_multiplico', 'the_diviner', 'glacius', 'fenwick'];
      const spacing = W / (keys.length + 1);
      for (let i = 0; i < keys.length; i++) {
        const spX = spacing * (i + 1);
        const spY = artY + (i % 2 === 0 ? -10 : 10);
        if (this.textures.exists(keys[i])) {
          const sp = this.add.image(spX, spY, keys[i]).setDisplaySize(68, 68);
          this.tweens.add({
            targets: sp, y: spY - 10,
            duration: 1300 + i * 180, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut', delay: i * 130,
          });
        } else {
          this.add.circle(spX, spY, 30, 0x334455, 0.8).setStrokeStyle(2, 0x88AACC);
          this.add.text(spX, spY, String(i + 1), {
            fontSize: '20px', color: '#AADDFF',
            fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif",
          }).setOrigin(0.5);
        }
      }

    } else if (p.art === 'answer_shield') {
      // Procedural animated shield + checkmark
      const cx = W * 0.5;
      const cy = artY;
      const glow = this.add.circle(cx, cy, 62, 0x88FFCC, 0.08);
      this.tweens.add({
        targets: glow, scaleX: 1.3, scaleY: 1.3, alpha: 0.18,
        duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      const g = this.add.graphics();
      // Shield body
      g.fillStyle(0x113355, 0.92);
      g.fillRoundedRect(cx - 46, cy - 54, 92, 70, 20);
      g.fillTriangle(cx - 46, cy + 12, cx + 46, cy + 12, cx, cy + 64);
      // Inner panel
      g.fillStyle(0x1A5533, 0.88);
      g.fillRoundedRect(cx - 30, cy - 40, 60, 50, 10);
      g.fillTriangle(cx - 30, cy + 8, cx + 30, cy + 8, cx, cy + 46);
      // Shield outline
      g.lineStyle(2.5, 0x44DDAA, 0.9);
      g.strokeRoundedRect(cx - 46, cy - 54, 92, 70, 20);
      g.lineStyle(2, 0x44DDAA, 0.8);
      g.strokeTriangle(cx - 46, cy + 12, cx + 46, cy + 12, cx, cy + 64);
      // Checkmark
      g.lineStyle(5, 0xFFFFFF, 1);
      g.beginPath();
      g.moveTo(cx - 18, cy - 2);
      g.lineTo(cx - 4, cy + 16);
      g.lineTo(cx + 26, cy - 22);
      g.strokePath();
      // Sparkles
      const sparkColors = [0xFFDD88, 0x88FFCC, 0xFFAAFF, 0xAADDFF, 0xFFCC44];
      [[cx - 58, cy - 30], [cx + 60, cy - 24], [cx - 52, cy + 44],
       [cx + 54, cy + 38], [cx,      cy - 70]].forEach(([sx, sy], i) => {
        const spark = this.add.circle(sx, sy, 4 - (i % 2), sparkColors[i], 0.9);
        this.tweens.add({
          targets: spark, y: sy - 12, alpha: 0.25,
          duration: 900 + i * 180, yoyo: true, repeat: -1,
          delay: i * 150, ease: 'Sine.easeInOut',
        });
      });
      this.tweens.add({
        targets: g, y: g.y - 9,
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
    this.sound.play('sfx_page_turn', { volume: 0.6 });
    if (PAGES[this._idx].last) { this._finish(); }
    else { this._idx++; this._draw(); }
  }

  _finish() {
    GameState.reset();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('OverworldScene');
    });
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
