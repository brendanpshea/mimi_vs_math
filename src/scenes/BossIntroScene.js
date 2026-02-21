/**
 * BossIntroScene — JRPG-style pre-boss dialogue cutscene.
 *
 * Scene data expected:
 * {
 *   panels:    Array<{
 *                speaker:    string        – name shown in badge
 *                side:       'left'|'right'– which side of screen the portrait sits
 *                spriteKey:  string        – portrait texture key
 *                text:       string        – dialogue body
 *                nameColor:  string        – CSS hex colour for speaker badge
 *                bg:         number        – background colour (0xRRGGBB)
 *              }>
 *   regionId:  number  – used to record that this intro has been seen
 *   nextScene: string  – scene to launch after the last panel
 *   nextData:  object  – data forwarded to nextScene
 * }
 */
import * as Phaser from 'phaser';
import GameState   from '../config/GameState.js';

export default class BossIntroScene extends Phaser.Scene {
  constructor() { super({ key: 'BossIntroScene' }); }

  init(data) {
    this._panels    = data.panels    ?? [];
    this._regionId  = data.regionId  ?? 0;
    this._nextScene = data.nextScene ?? 'BattleScene';
    this._nextData  = data.nextData  ?? {};
    this._idx       = 0;
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this._draw();
  }

  // ── Render current panel ────────────────────────────────────────────────

  _draw() {
    this.tweens.killAll();
    this.children.removeAll(true);

    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const p  = this._panels[this._idx];
    const isLast = this._idx === this._panels.length - 1;

    // ── Background ──────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, p.bg ?? 0x080414);
    this._stars(W, H);

    // ── Panel-dot navigation indicator ─────────────────────────────────
    const n = this._panels.length;
    for (let i = 0; i < n; i++) {
      const active = i === this._idx;
      const dotX   = W / 2 + (i - (n - 1) / 2) * 22;
      this.add.circle(dotX, H * 0.963, active ? 7 : 4,
        active ? 0xFFDD44 : 0x334455);
    }

    // ── Portrait ────────────────────────────────────────────────────────
    const onLeft   = (p.side ?? 'left') === 'left';
    const avatarX  = onLeft ? W * 0.19 : W * 0.81;
    const avatarY  = H * 0.29;
    const AVATAR_SIZE = 160;

    // Glow ring behind portrait
    const glowColor = p.nameColor
      ? parseInt(p.nameColor.replace('#', ''), 16)
      : 0x4466AA;

    // Dramatic radiating lines behind portrait
    const rays = this.add.graphics();
    const RAY_COUNT = 12;
    for (let i = 0; i < RAY_COUNT; i++) {
      const angle = (i / RAY_COUNT) * Math.PI * 2;
      const innerR = AVATAR_SIZE / 2 + 10;
      const outerR = AVATAR_SIZE / 2 + 60;
      rays.lineStyle(2, glowColor, 0.15);
      rays.lineBetween(
        avatarX + Math.cos(angle) * innerR, avatarY + Math.sin(angle) * innerR,
        avatarX + Math.cos(angle) * outerR, avatarY + Math.sin(angle) * outerR,
      );
    }
    this.tweens.add({
      targets: rays, angle: 360,
      duration: 20000, repeat: -1,
    });

    // Outer glow ring
    const ring2 = this.add.circle(avatarX, avatarY, AVATAR_SIZE / 2 + 12, glowColor, 0.1);
    const ring = this.add.circle(avatarX, avatarY, AVATAR_SIZE / 2 + 6, glowColor, 0.25);
    this.tweens.add({
      targets: [ring, ring2], alpha: { from: 0.12, to: 0.45 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    if (this.textures.exists(p.spriteKey)) {
      const portrait = this.add.image(avatarX, avatarY, p.spriteKey)
        .setDisplaySize(AVATAR_SIZE, AVATAR_SIZE);
      if (!onLeft) portrait.setFlipX(true);
      this.tweens.add({
        targets: portrait, y: avatarY - 10,
        duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else {
      // Fallback placeholder
      this.add.rectangle(avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE,
        glowColor, 0.3).setStrokeStyle(2, glowColor, 0.8);
      this.add.text(avatarX, avatarY, p.speaker[0] ?? '?', {
        fontSize: '56px', color: '#FFFFFF', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // Speaker name badge (larger, with Fredoka font)
    const badgeY = avatarY + AVATAR_SIZE / 2 + 20;
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(0x060618, 0.92);
    badgeGfx.fillRoundedRect(avatarX - 90, badgeY - 16, 180, 32, 8);
    badgeGfx.lineStyle(1.5, glowColor, 0.7);
    badgeGfx.strokeRoundedRect(avatarX - 90, badgeY - 16, 180, 32, 8);
    this.add.text(avatarX, badgeY, p.speaker, {
      fontSize: '15px', color: p.nameColor ?? '#FFFFFF',
      fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Dialogue box ────────────────────────────────────────────────────
    const BOX_Y  = H * 0.685;
    const BOX_H  = 196;
    const BOX_W  = W * 0.88;

    // Drop shadow
    this.add.rectangle(W / 2 + 3, BOX_Y + 3, BOX_W, BOX_H, 0x000000, 0.55);
    // Main box
    this.add.rectangle(W / 2, BOX_Y, BOX_W, BOX_H, 0x06061A, 0.94)
      .setStrokeStyle(2, 0x4455AA);
    // Top accent stripe
    this.add.rectangle(W / 2, BOX_Y - BOX_H / 2 + 4, BOX_W - 4, 4,
      glowColor, 0.55);
    // Corner diamonds
    for (const [cx, cy] of [
      [W * 0.065, BOX_Y - BOX_H / 2],
      [W * 0.935, BOX_Y - BOX_H / 2],
      [W * 0.065, BOX_Y + BOX_H / 2],
      [W * 0.935, BOX_Y + BOX_H / 2],
    ]) {
      this.add.rectangle(cx, cy, 8, 8, glowColor, 0.9)
        .setAngle(45);
    }

    // Dialogue text — anchored to the top-inside of the box so long speeches
    // always start at the top and never overflow downward into the button.
    const textTopY = BOX_Y - BOX_H / 2 + 18;
    this.add.text(W / 2, textTopY, p.text, {
      fontSize: '14px', color: '#DDEEFF', fontFamily: "'Nunito', Arial, sans-serif",
      align:  'center', lineSpacing: 5,
      stroke: '#000000', strokeThickness: 2,
      wordWrap: { width: BOX_W * 0.86 },
    }).setOrigin(0.5, 0);

    // ── Advance button ──────────────────────────────────────────────────
    const btnY   = H * 0.925;
    const isBoss = isLast;
    const label  = isBoss ? '⚔️  Battle!' : 'Next  ▶';
    const bgCol  = isBoss ? 0x3A0A0A : 0x0A1A3A;
    const stCol  = isBoss ? 0xFF5544 : 0x4488FF;
    const txtCol = isBoss ? '#FF9988' : '#88AAFF';

    // Button shadow
    this.add.rectangle(W / 2 + 2, btnY + 3, 220, 48, 0x000000, 0.4);

    const btn = this.add.rectangle(W / 2, btnY, 220, 48, bgCol)
      .setStrokeStyle(2, stCol)
      .setInteractive({ useHandCursor: true });
    // Top bevel
    this.add.rectangle(W / 2, btnY - 10, 214, 12, 0xFFFFFF, 0.06);

    const btnText = this.add.text(W / 2, btnY, label, {
      fontSize: '20px', color: txtCol, fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5);

    // Pulse the battle button on the last panel
    if (isBoss) {
      this.tweens.add({
        targets: [btn, btnText], scaleX: 1.06, scaleY: 1.06,
        duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    btn.on('pointerover', () => {
      this.tweens.add({ targets: [btn, btnText], scaleX: 1.08, scaleY: 1.08, duration: 80 });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: [btn, btnText], scaleX: 1, scaleY: 1, duration: 80 });
    });
    btn.on('pointerdown', () => this._advance());

    this.input.keyboard.once('keydown-ENTER', () => this._advance());
    this.input.keyboard.once('keydown-SPACE', () => this._advance());
  }

  _advance() {
    if (this._idx < this._panels.length - 1) {
      this._idx++;
      this._draw();
    } else {
      // Mark intro as seen so it won't replay on retry
      if (!GameState.bossIntroSeen.includes(this._regionId)) {
        GameState.bossIntroSeen.push(this._regionId);
        GameState.save();
      }
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(this._nextScene, this._nextData);
      });
    }
  }

  _stars(W, H) {
    for (let i = 0; i < 50; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        Phaser.Math.FloatBetween(0.5, 2),
        0xFFFFFF, 0.7,
      );
      this.tweens.add({
        targets: s,
        alpha: { from: 0.08, to: 0.75 },
        duration: Phaser.Math.Between(900, 2800),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2200),
      });
    }
  }
}
