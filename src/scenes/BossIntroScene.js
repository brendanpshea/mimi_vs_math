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
import BGM         from '../audio/BGM.js';

export default class BossIntroScene extends Phaser.Scene {
  constructor() { super({ key: 'BossIntroScene' }); }

  init(data) {
    this._panels      = data.panels    ?? [];
    this._regionId    = data.regionId  ?? 0;
    this._nextScene   = data.nextScene ?? 'BattleScene';
    this._nextData    = data.nextData  ?? {};
    this._idx         = 0;
    // Skip typewriter + auto-advance for players who have already seen this intro
    this._alreadySeen = GameState.bossIntroSeen.includes(this._regionId);
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    BGM.play('boss');
    this.time.delayedCall(200, () => this.sound.play('sfx_boss_intro', { volume: 0.80 }));

    this._draw();
  }

  // ── Render current panel ────────────────────────────────────────────────

  _draw() {
    this._clearTypewriter();
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
    const avatarX  = onLeft ? W * 0.185 : W * 0.815;
    const avatarY  = H * 0.255;
    const AVATAR_SIZE = 200;

    // Glow ring behind portrait
    const glowColor = p.nameColor
      ? parseInt(p.nameColor.replace('#', ''), 16)
      : 0x4466AA;

    // Atmosphere wash — portrait half of screen tinted with speaker colour
    const washX = onLeft ? W * 0.25 : W * 0.75;
    this.add.rectangle(washX, H / 2, W * 0.5, H, glowColor, 0.06);
    this.add.rectangle(washX, H / 2, W * 0.28, H, glowColor, 0.04);

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

    // Speaker name badge below portrait
    const badgeY = avatarY + AVATAR_SIZE / 2 + 18;
    const badgeGfx = this.add.graphics();
    badgeGfx.fillStyle(0x06061C, 0.96);
    badgeGfx.fillRoundedRect(avatarX - 100, badgeY - 17, 200, 34, 10);
    badgeGfx.lineStyle(2, glowColor, 0.9);
    badgeGfx.strokeRoundedRect(avatarX - 100, badgeY - 17, 200, 34, 10);
    this.add.text(avatarX, badgeY, p.speaker, {
      fontSize: '17px', color: p.nameColor ?? '#FFFFFF',
      fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif",
    }).setOrigin(0.5);

    // ── Dialogue box ────────────────────────────────────────────────────
    const BOX_Y  = H * 0.676;
    const BOX_H  = 210;
    const BOX_W  = W * 0.90;
    const boxL   = W / 2 - BOX_W / 2;
    const boxT   = BOX_Y - BOX_H / 2;

    // Drop shadow
    this.add.rectangle(W / 2 + 3, BOX_Y + 3, BOX_W, BOX_H, 0x000000, 0.55);
    // Main box
    this.add.rectangle(W / 2, BOX_Y, BOX_W, BOX_H, 0x06061A, 0.95)
      .setStrokeStyle(2, 0x3A4A88);
    // Top accent stripe (speaker colour)
    this.add.rectangle(W / 2, boxT + 3, BOX_W - 4, 4, glowColor, 0.75);

    // Speaker name tab (inside box, portrait side)
    const tabW   = Math.min(p.speaker.length * 11 + 28, 230);
    const tabX   = onLeft ? boxL + 14 : W / 2 + BOX_W / 2 - 14 - tabW;
    const tabGfx = this.add.graphics();
    tabGfx.fillStyle(0x09091E, 0.98);
    tabGfx.fillRoundedRect(tabX, boxT + 10, tabW, 26, 6);
    tabGfx.lineStyle(1.5, glowColor, 0.85);
    tabGfx.strokeRoundedRect(tabX, boxT + 10, tabW, 26, 6);
    this.add.text(
      onLeft ? tabX + 12 : tabX + tabW - 12,
      boxT + 23,
      p.speaker,
      {
        fontSize: '14px', color: p.nameColor ?? '#FFFFFF',
        fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif",
      },
    ).setOrigin(onLeft ? 0 : 1, 0.5);

    // Dialogue text — left-aligned, starts below speaker tab
    const textTopY = boxT + 44;
    const dialogueText = this.add.text(boxL + 20, textTopY, '', {
      fontSize: '17px', color: '#DDEEFF', fontFamily: "'Nunito', Arial, sans-serif",
      align: 'left', lineSpacing: 8,
      stroke: '#000000', strokeThickness: 2,
      wordWrap: { width: BOX_W - 48 },
    }).setOrigin(0, 0);

    if (this._alreadySeen) {
      dialogueText.setText(p.text);
      this._typewriterDone = true;
      // Auto-advance quickly so returning players aren't stuck
      this._autoAdvanceTimer = this.time.delayedCall(900, () => this._advance());
    } else {
      this._startTypewriter(dialogueText, p.text, 28);
    }

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
    // Cancel auto-advance if player clicks manually
    if (this._autoAdvanceTimer) { this._autoAdvanceTimer.remove(false); this._autoAdvanceTimer = null; }
    // First press: complete the typewriter. Second press: turn page.
    if (!this._typewriterDone) {
      this._completeTypewriter();
      return;
    }
    this.sound.play('sfx_page_turn', { volume: 0.55 });
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

  // ── Typewriter helpers ───────────────────────────────────────────────────
  _startTypewriter(textObj, fullText, msPerChar = 28) {
    this._typewriterDone = false;
    this._typewriterFull = fullText;
    this._typewriterObj  = textObj;
    let i = 0;
    this._typewriterTimer = this.time.addEvent({
      delay:    msPerChar,
      repeat:   fullText.length - 1,
      callback: () => {
        i++;
        textObj.setText(fullText.slice(0, i));
        if (i >= fullText.length) this._typewriterDone = true;
      },
    });
  }

  _completeTypewriter() {
    if (this._typewriterTimer) { this._typewriterTimer.remove(false); this._typewriterTimer = null; }
    if (this._typewriterObj && this._typewriterFull != null) {
      this._typewriterObj.setText(this._typewriterFull);
    }
    this._typewriterDone = true;
  }

  _clearTypewriter() {
    if (this._typewriterTimer)    { this._typewriterTimer.remove(false);    this._typewriterTimer    = null; }
    if (this._autoAdvanceTimer)   { this._autoAdvanceTimer.remove(false);   this._autoAdvanceTimer   = null; }
    this._typewriterDone = true;
    this._typewriterObj  = null;
    this._typewriterFull = null;
  }

  _stars(W, H) {    for (let i = 0; i < 50; i++) {
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
