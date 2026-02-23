/**
 * BattleScene — turn-based math battle.
 *
 * Scene data expected:
 * {
 *   enemy:         object  – from enemies.js
 *   enemyInstance: string  – unique key for GameState tracking
 *   regionId:      number
 *   isBoss:        boolean
 *   returnScene:   string  – scene to resume after battle
 *   returnData:    object  – data forwarded to returnScene
 * }
 */
import * as Phaser from 'phaser';
import GameState             from '../config/GameState.js';
import BGM                   from '../audio/BGM.js';
import { generateQuestion }  from '../math/QuestionBank.js';
import { getChoices }        from '../math/Distractors.js';
import { getExplanation }    from '../math/Explanations.js';
import ITEMS                 from '../data/items.js';
import REGIONS               from '../data/regions/index.js';

const BTN_COLORS = {
  idle:    0x1E3A6E,
  hover:   0x2E5AA0,
  correct: 0x1A7A2A,
  wrong:   0x7A1A1A,
  reveal:  0x1A2E7A,
};
const FONT_UI    = "'Nunito', Arial, sans-serif";
const FONT_TITLE = "'Fredoka', 'Nunito', Arial, sans-serif";
const TEXT_STYLE = (size, color = '#FFFFFF', bold = false) => ({
  fontSize: `${size}px`, color, fontFamily: FONT_UI,
  fontStyle: bold ? 'bold' : 'normal',
});

export default class BattleScene extends Phaser.Scene {
  constructor() { super({ key: 'BattleScene' }); }

  init(data) {
    this.enemyData     = data.enemy;
    this.enemyInstance = data.enemyInstance;
    this.regionId      = data.regionId;
    this.isBoss        = data.isBoss     ?? false;
    this.isHardMode    = data.isHardMode ?? false;
    this.returnScene   = data.returnScene ?? 'OverworldScene';
    this.returnData    = data.returnData  ?? {};

    // Battle state
    this.enemyHP           = this.enemyData.hp;
    this.streak            = 0;
    this.questionIdx       = 0;
    this.battleOver        = false;
    this.answering         = false;
    this.battleWrongAnswers = 0;   // for perfect-battle detection
    this._qStartTime        = 0;   // Phaser timestamp when current question appeared
    this._battlePaused      = false;
    this._pauseRemainingMs  = 0;
    // Adaptive difficulty (A + C)
    this.battleDiffOffset  = 0;    // A: in-battle drift −1/0/+1
    this.lossStreak        = 0;    // A: consecutive wrong/timeout counter
    this.currentTopic      = null; // C: topic used for this question (for recording)

    // Consume inventory items → may raise GameState.hp before snapshotting
    GameState.resetEffects();
    this._applyInventoryEffects();
    this.playerHP = GameState.hp;

    // Bestiary: mark this enemy type as encountered
    GameState.markEnemySeen(this.enemyData.id);
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this._drawBackground(W, H);
    this._buildLayout(W, H);
    this._setupKeys();

    this.sound.play('sfx_battle_start', { volume: 0.75 });
    BGM.play(this.isBoss ? 'boss' : 'battle');
    this.time.delayedCall(400, () => this._nextQuestion());
  }

  // ── Background ────────────────────────────────────────────────────────────

  _drawBackground(W, H) {
    const regionData  = REGIONS[this.regionId];
    const backdropKey = regionData?.backdropKey ?? 'backdrop_village';

    // Display Full-screen backdrop
    if (this.textures.exists(backdropKey)) {
      this.add.image(W / 2, H / 2, backdropKey).setDisplaySize(W, H).setDepth(0);
    } else {
      // Fallback if backdrop not loaded
      console.warn(`Backdrop ${backdropKey} not found, using solid color`);
      this.add.rectangle(W / 2, H / 2, W, H, 0x0A0A20).setDepth(0);
    }
    
    // Subtle overlay — keeps backdrop visible without crushing other UI
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.20).setDepth(1);
    
    // Separator lines (gradient fade from center)
    const gfx = this.add.graphics().setDepth(2);
    // Top separator
    gfx.lineStyle(1, 0xFFFFFF, 0.15);
    gfx.lineBetween(40, 160, W - 40, 160);
    gfx.lineStyle(1, 0xFFFFFF, 0.08);
    gfx.lineBetween(20, 161, W - 20, 161);
    // Bottom separator
    gfx.lineStyle(1, 0xFFFFFF, 0.15);
    gfx.lineBetween(40, H - 110, W - 40, H - 110);
    gfx.lineStyle(1, 0xFFFFFF, 0.08);
    gfx.lineBetween(20, H - 109, W - 20, H - 109);
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  _buildLayout(W, H) {
    // ── Enemy side ──────────────────────────────────────────────────────

    // Boss sprites are larger and sit slightly higher so the bottom edge
    // clears the name text at y=144.  All sizes are display-only — no
    // physics body is involved, so no collision box to worry about.
    const enemyY  = this.isBoss ? 72  : 88;
    const enemySz = this.isBoss ? 140 : 100;

    // Region-specific aura colour and sprite tint used for bosses.
    // Tints are very subtle (near-white) so the original sprite art shows through.
    const regionData  = REGIONS[this.regionId];
    const auraColor   = regionData?.auraColor ?? 0xFFDD33;
    this._bossTint    = this.isBoss ? (regionData?.bossTint ?? 0xFFFFF0) : null;

    if (this.isBoss) {
      // Large soft filled glow behind the boss
      const aura = this.add.ellipse(W * 0.72, enemyY, 172, 172, auraColor, 0.22).setDepth(2);
      this.tweens.add({
        targets: aura, scaleX: 1.15, scaleY: 1.15, alpha: 0.08,
        duration: 880, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      // Crisp outer ring that pulses independently
      const ring = this.add.ellipse(W * 0.72, enemyY, 182, 182).setStrokeStyle(2, auraColor, 0.55).setDepth(2);
      this.tweens.add({
        targets: ring, scaleX: 1.07, scaleY: 1.07, alpha: 0.28,
        duration: 1250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    this.enemySprite = this.add.image(W * 0.72, enemyY, this.enemyData.id)
      .setDisplaySize(enemySz, enemySz).setDepth(3);
    if (this._bossTint) this.enemySprite.setTint(this._bossTint);

    // Capture scale AFTER setDisplaySize so breathe tween stays proportional
    const esx = this.enemySprite.scaleX;
    const esy = this.enemySprite.scaleY;

    // Idle float + gentle breathe for the enemy
    this.tweens.add({
      targets:  this.enemySprite,
      y:        this.enemySprite.y - 6,
      duration: 1400,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
    this.tweens.add({
      targets:  this.enemySprite,
      scaleX:   { from: esx, to: esx * 0.97 },
      scaleY:   { from: esy, to: esy * 1.03 },
      duration: 1800,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      delay:    400,
    });

    this.add.text(W * 0.72, 144, this.enemyData.name, {
      ...TEXT_STYLE(16, '#FFCCEE', true),
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);

    this.enemyHPBar = this._makeHPBar(W * 0.72, 162, this.enemyData.hp, 0xCC3333);

    if (this.isBoss) {
      this.add.text(W * 0.72, 10, '⚠ BOSS BATTLE', TEXT_STYLE(15, '#FF6633', true))
        .setOrigin(0.5, 0);
    }
    if (this.isHardMode) {
      this.add.text(W * 0.28, 10, '🗡 HARD MODE', TEXT_STYLE(15, '#FF3333', true))
        .setOrigin(0.5, 0);
    }

    // ── Player (Mimi) side ──────────────────────────────────────────────
    this.mimiSprite = this.add.image(W * 0.28, 88, 'mimi_battle')
      .setDisplaySize(100, 100).setFlipX(true);
    // Store home position so attack animation can return precisely
    this._mimiBaseX = this.mimiSprite.x;
    this._mimiBaseY = this.mimiSprite.y;

    // Gentle idle bob for Mimi
    this._mimiIdleBob = this.tweens.add({
      targets:  this.mimiSprite,
      y:        this.mimiSprite.y - 4,
      duration: 1600,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      delay:    200,
    });

    this.add.text(W * 0.28, 144, 'Mimi', {
      ...TEXT_STYLE(16, '#AAFFCC', true),
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);
    this.playerHPBar = this._makeHPBar(W * 0.28, 162, GameState.maxHP, 0x33CC66);

    // ── Lives counter (below Mimi HP bar) ──────────────────────────────────
    const livesStr = '🐾 '.repeat(Math.max(0, GameState.lives));
    this.add.text(W * 0.28, 176, `${livesStr}`, TEXT_STYLE(11, '#FFCC88'))
      .setOrigin(0.5, 0);

    // ── Run Away button (bottom-left; hidden for boss battles) ───────────────
    if (!this.isBoss) {
      this._runBtn = this.add.rectangle(46, H - 80, 90, 30, 0x0A0A1A)
        .setStrokeStyle(1.5, 0x446688).setInteractive({ useHandCursor: true }).setDepth(3);
      this._runTxt = this.add.text(46, H - 80, '🏃 Run  [Esc]', TEXT_STYLE(11, '#88AACC'))
        .setOrigin(0.5).setDepth(4);
      this._runBtn.on('pointerover', () => { this._runBtn.setFillStyle(0x0F1F2F); this._runTxt.setColor('#AACCEE'); });
      this._runBtn.on('pointerout',  () => { this._runBtn.setFillStyle(0x0A0A1A); this._runTxt.setColor('#88AACC'); });
      this._runBtn.on('pointerdown', () => this._tryRunAway());
    }
    const topicLabels = {
      addSub: 'Addition & Subtraction', multiplication: 'Multiplication',
      division: 'Division', fractions: 'Fractions',
      addition: 'Addition', subtraction: 'Subtraction', comparison: 'Comparison',
      placeValue: 'Place Value', addCarry: 'Addition', subBorrow: 'Subtraction',
      multTables: 'Times Tables', skipCounting: 'Skip Counting', doubling: 'Doubling',
      divisionWord: 'Division', missingNumber: 'Missing Number',
      fractionCompare: 'Fractions', fractionAdd: 'Fractions', decimals: 'Decimals',
      orderOfOps: 'Order of Operations', percentages: 'Percentages', ratiosProp: 'Ratios & Proportions',
    };
    // Dark pill behind topic label so it's readable over any backdrop
    const topicStr = topicLabels[this.enemyData.mathTopic] ?? '';
    if (topicStr) {
      const tpill = this.add.graphics().setDepth(3);
      tpill.fillStyle(0x000000, 0.55);
      tpill.fillRoundedRect(W / 2 - 130, 8, 260, 24, 6);
    }
    this.add.text(W / 2, 10, topicStr, {
      ...TEXT_STYLE(15, '#AACCFF'),
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(4);

    // ── Question display ────────────────────────────────────────────────
    // Dark pill behind the question text — guarantees contrast.
    const qbg = this.add.graphics().setDepth(2);
    qbg.fillStyle(0x000000, 0.7);
    qbg.fillRoundedRect(20, H * 0.43 - 46, W - 40, 92, 12);
    qbg.lineStyle(2, 0xFFCC44, 0.3);
    qbg.strokeRoundedRect(20, H * 0.43 - 46, W - 40, 92, 12);
    this.questionBg = qbg;

    this.questionText = this.add.text(W / 2, H * 0.43, '', {
      ...TEXT_STYLE(34, '#FFE44D', true),
      fontFamily: FONT_TITLE,
      stroke: '#000000', strokeThickness: 4,
      align: 'center',
      wordWrap: { width: W - 80 },
    }).setOrigin(0.5).setDepth(3);

    // ── Answer buttons ──────────────────────────────────────────────────
    this._buildAnswerButtons(W, H);

    // ── Timer bar ───────────────────────────────────────────────────────
    this._buildTimerBar(W, H);

    // ── Feedback / streak ───────────────────────────────────────────────
    this.feedbackText = this.add.text(W / 2, H * 0.27, '', {
      ...TEXT_STYLE(26, '#FFD700', true),
      fontFamily: FONT_TITLE,
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.streakText = this.add.text(W / 2, 22, '', TEXT_STYLE(16, '#FF9900', true))
      .setOrigin(0.5).setAlpha(0);

    this._updateHPBar(this.playerHPBar, this.playerHP);
    this._updateHPBar(this.enemyHPBar, this.enemyHP);

    // ── Active effects badges ────────────────────────────────────────────
    this.effectsRow = this.add.container(0, 0).setDepth(3);
    this._refreshEffectsDisplay();
  }

  _makeHPBar(cx, cy, maxHP, fillColor) {
    const BW = 160, BH = 16;
    // Outer border (dark)
    const border = this.add.graphics();
    border.fillStyle(0x000000, 0.8);
    border.fillRoundedRect(cx - BW / 2 - 3, cy - BH / 2 - 3, BW + 6, BH + 6, 4);
    // Inner track
    border.fillStyle(0x1A1A2A, 1);
    border.fillRoundedRect(cx - BW / 2 - 1, cy - BH / 2 - 1, BW + 2, BH + 2, 3);

    const fill = this.add.rectangle(cx - BW / 2, cy, BW, BH, fillColor).setOrigin(0, 0.5);
    // Highlight stripe on fill bar
    const shine = this.add.rectangle(cx - BW / 2, cy - BH / 4, BW, BH / 3, 0xFFFFFF, 0.15).setOrigin(0, 0.5);

    // HP segment markers
    const seg = this.add.graphics().setDepth(1);
    for (let i = 1; i < maxHP; i++) {
      const sx = cx - BW / 2 + (i / maxHP) * BW;
      seg.lineStyle(1, 0x000000, 0.3);
      seg.lineBetween(sx, cy - BH / 2, sx, cy + BH / 2);
    }

    const lbl = this.add.text(cx, cy, `${maxHP}/${maxHP}`, {
      ...TEXT_STYLE(11, '#FFFFFF', true),
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(2);
    return { fill, shine, lbl, maxHP, bw: BW, bh: BH, fillColor, cx };
  }

  _updateHPBar(bar, currentHP) {
    const targetHP    = Math.max(0, currentHP);
    const targetRatio = targetHP / bar.maxHP;
    const targetW     = bar.bw * targetRatio;

    bar.lbl.setText(`${targetHP}/${bar.maxHP}`);

    // Animate the bar width rather than snapping — DS-style drain
    this.tweens.killTweensOf(bar.fill);
    this.tweens.add({
      targets:  bar.fill,
      displayWidth: targetW,
      duration: 420,
      ease:     'Sine.easeOut',
      onUpdate: () => {
        const w     = bar.fill.displayWidth;
        bar.shine.setDisplaySize(w, bar.bh / 3);
        const ratio = w / bar.bw;
        const r = Math.round(255 * (1 - ratio));
        const g = Math.round(255 * ratio);
        bar.fill.setFillStyle(Phaser.Display.Color.GetColor(r, g, 40));
      },
    });
  }

  _buildAnswerButtons(W, H) {
    const BW = 170, BH = 58;
    const positions = [
      { x: W * 0.22, y: H * 0.72 },
      { x: W * 0.44, y: H * 0.72 },
      { x: W * 0.66, y: H * 0.72 },
      { x: W * 0.88, y: H * 0.72 },
    ];

    this.answerButtons = positions.map((pos, i) => {
      // Shadow under button
      const shadow = this.add.rectangle(pos.x + 2, pos.y + 3, BW, BH, 0x000000, 0.4)
        .setDepth(2);

      const bg = this.add.rectangle(pos.x, pos.y, BW, BH, BTN_COLORS.idle)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x4466AA)
        .setDepth(3);

      // Top highlight for bevel effect
      const highlight = this.add.rectangle(pos.x, pos.y - BH / 4, BW - 4, BH / 3, 0xFFFFFF, 0.08)
        .setDepth(3);

      const numLbl = this.add.text(pos.x, pos.y - 18, `[${i + 1}]`, TEXT_STYLE(11, '#6688CC'))
        .setOrigin(0.5).setDepth(4);

      const lbl = this.add.text(pos.x, pos.y + 6, '', TEXT_STYLE(22, '#FFFFFF', true))
        .setOrigin(0.5).setDepth(4);

      // Correct / wrong icon (top-right corner, hidden until answer revealed)
      const icon = this.add.text(pos.x + BW / 2 - 14, pos.y - BH / 2 + 14, '', {
        ...TEXT_STYLE(18, '#44FF88', true),
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5).setAlpha(0);

      bg.on('pointerover', () => {
        if (this.answering) return;
        bg.setFillStyle(BTN_COLORS.hover).setStrokeStyle(2, 0x66AAFF);
        this.tweens.add({ targets: [bg, shadow, highlight, numLbl, lbl], scaleX: 1.05, scaleY: 1.05, duration: 80 });
      });
      bg.on('pointerout', () => {
        if (this.answering) return;
        bg.setFillStyle(BTN_COLORS.idle).setStrokeStyle(2, 0x4466AA);
        this.tweens.add({ targets: [bg, shadow, highlight, numLbl, lbl], scaleX: 1, scaleY: 1, duration: 80 });
      });
      bg.on('pointerdown', () => this._selectAnswer(i));

      return { bg, lbl, numLbl, shadow, highlight, icon };
    });
  }

  _buildTimerBar(W, H) {
    const TW = W - 60, y = H - 60;
    // Outer border
    const timerBorder = this.add.graphics();
    timerBorder.fillStyle(0x000000, 0.8);
    timerBorder.fillRoundedRect(W / 2 - TW / 2 - 3, y - 13, TW + 6, 26, 5);
    timerBorder.fillStyle(0x1A1A2A, 1);
    timerBorder.fillRoundedRect(W / 2 - TW / 2 - 1, y - 11, TW + 2, 22, 4);

    this.timerFill = this.add.rectangle(W / 2 - TW / 2, y, TW, 18, 0x44EE44).setOrigin(0, 0.5);
    // Highlight stripe
    this.add.rectangle(W / 2 - TW / 2, y - 4, TW, 5, 0xFFFFFF, 0.1).setOrigin(0, 0.5);
    // Glow circle (shown when timer is low)
    this._timerGlow = this.add.circle(W / 2, y, 12, 0xFF3333, 0).setDepth(1);

    this.timerText = this.add.text(W / 2, y, '', {
      ...TEXT_STYLE(13, '#FFFFFF', true),
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(2);
    this._timerW = TW;
  }

  _setupKeys() {
    const kb = this.input.keyboard;
    this.keys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];
    this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pKey   = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  }

  // ── Question flow ─────────────────────────────────────────────────────────

  _nextQuestion() {
    if (this.battleOver) return;
    this.answering = false;
    this.questionIdx++;

    // Boss battles pick randomly from all region topics; regular enemies use their
    // specific topic.
    const topics   = this.enemyData.mathTopics ?? [this.enemyData.mathTopic];
    const topic    = topics[Math.floor(Math.random() * topics.length)];
    this.currentTopic = topic;

    // ── Adaptive difficulty (A + C) ────────────────────────────────────────
    // Enemy base: bosses start at 1 (lots of HP; questions stay manageable).
    const enemyBase   = this.isBoss ? 1 : (this.enemyData.difficulty ?? 1);
    // C: session accuracy across all battles may raise/lower this topic's tier.
    const sessionDiff = GameState.getTopicDifficulty(topic, enemyBase);
    // A: in-battle drift shifts the session tier by −1 or +1 based on live streak.
    const rawDiff     = Math.max(1, Math.min(3, sessionDiff + this.battleDiffOffset));
    // Hard Mode adds a further +1 on top, capped at 3.
    const difficulty  = this.isHardMode ? Math.min(3, rawDiff + 1) : rawDiff;
    // ────────────────────────────────────────────────────────

    const q = generateQuestion(topic, difficulty);
    this.currentQuestion = q;
    this.currentChoices = getChoices(q);

    this.questionText.setText(q.text);

    this.answerButtons.forEach((btn, i) => {
      const choice = this.currentChoices[i];
      btn.lbl.setText(choice.text);
      btn.lbl.setColor('#FFFFFF');
      btn.numLbl.setAlpha(1);
      btn.icon.setText('').setAlpha(0);
      btn.bg.setFillStyle(BTN_COLORS.idle).setStrokeStyle(2, 0x4466AA).setInteractive();
    });

    // Hint: auto-eliminate one wrong choice when fossil charges remain
    if (GameState.activeEffects.hintCharges > 0) {
      GameState.activeEffects.hintCharges--;
      const wrongIdxs = this.currentChoices
        .map((c, i) => (c.correct ? -1 : i))
        .filter(i => i !== -1);
      if (wrongIdxs.length > 0) {
        const hi = wrongIdxs[Math.floor(Math.random() * wrongIdxs.length)];
        this.answerButtons[hi].bg.setFillStyle(0x111111).removeInteractive();
        this.answerButtons[hi].lbl.setColor('#333333');
        this.answerButtons[hi].numLbl.setAlpha(0.2);
        this.answerButtons[hi].icon.setAlpha(0);
      }
      this._refreshEffectsDisplay();
    }

    // Timer — word problems get a flat +8 s reading bonus on top of the base timer
    const wordBonus   = q.wordProblem ? 8 : 0;
    const hardPenalty = this.isHardMode ? -5 : 0;
    const duration    = (Math.max(8, this.enemyData.timerSeconds + hardPenalty) + (GameState.activeEffects.timerBonus ?? 0) + wordBonus) * 1000;
    this._startTimer(duration);
    this._qStartTime = this.time.now;
  }

  _startTimer(totalMs) {
    if (this._timerEvent) this._timerEvent.remove();
    const startTime = this.time.now;
    this._warnPlayed = false;

    this._timerEvent = this.time.addEvent({
      delay: 50, repeat: -1,
      callback: () => {
        if (this.answering) return;
        const elapsed   = this.time.now - startTime;
        const remaining = Math.max(0, totalMs - elapsed);
        const ratio     = remaining / totalMs;
        this._currentRemainingMs = remaining;

        this.timerFill.setDisplaySize(this._timerW * ratio, 18);
        this.timerText.setText(`${Math.ceil(remaining / 1000)}s`);

        // Single warning tick when 5 seconds remain
        if (remaining <= 5000 && !this._warnPlayed) {
          this._warnPlayed = true;
          this.sound.play('sfx_timer_warn', { volume: 0.45 });
        }

        // Colour + glow when low
        if (ratio < 0.25) {
          this.timerFill.setFillStyle(0xEE3333);
          if (this._timerGlow) this._timerGlow.setAlpha(0.15 + 0.15 * Math.sin(elapsed * 0.008));
        } else if (ratio < 0.55) {
          this.timerFill.setFillStyle(0xEEAA33);
          if (this._timerGlow) this._timerGlow.setAlpha(0);
        } else {
          this.timerFill.setFillStyle(0x44EE44);
          if (this._timerGlow) this._timerGlow.setAlpha(0);
        }

        if (remaining <= 0) {
          this._timerEvent.remove();
          this._onTimeout();
        }
      },
    });
    this._timerStartMs = totalMs;
    this._timerStartAt = this.time.now;
  }

  _elapsedRatio() {
    const elapsed = this.time.now - this._timerStartAt;
    return elapsed / this._timerStartMs;
  }

  _onTimeout() {
    if (this.answering || this.battleOver) return;
    this.answering = true;

    GameState.recordAnswer(false, this.time.now - this._qStartTime);
    GameState.recordTopicAnswer(this.currentTopic, false);  // C
    this.battleWrongAnswers++;

    this.answerButtons.forEach((btn, i) => {
      btn.bg.removeInteractive();
      if (this.currentChoices[i].correct) {
        btn.bg.setFillStyle(BTN_COLORS.reveal).setStrokeStyle(4, 0x4488FF);
        btn.icon.setText('✓').setColor('#88CCFF').setAlpha(1);
      }
    });

    this.streak = 0;
    // A: timeout counts the same as a wrong answer for difficulty drift
    this.lossStreak++;
    if (this.lossStreak >= 2 && this.battleDiffOffset > -1) {
      this.battleDiffOffset--;
      this.lossStreak = 0;
      this._floatDiffChange(-1);
    }
    this._showFeedback('⏱ Time\'s up!', 0xFF6633);
    this._damagePlayer();

    this.time.delayedCall(700, () => this._showExplanation(this.currentQuestion));
  }

  _selectAnswer(index) {
    if (this.answering || this.battleOver) return;
    this.answering = true;
    if (this._timerEvent) this._timerEvent.remove();

    const isFast   = (this.time.now - this._timerStartAt) < 5000;
    const selected = this.currentChoices[index];

    this.answerButtons.forEach(btn => btn.bg.removeInteractive());

    if (selected.correct) {
      this.answerButtons[index].bg.setFillStyle(BTN_COLORS.correct).setStrokeStyle(4, 0x44FF88);
      this.answerButtons[index].icon.setText('✓').setColor('#44FF88').setAlpha(1);
      this._onCorrect(isFast, index);
    } else {
      this.answerButtons[index].bg.setFillStyle(BTN_COLORS.wrong).setStrokeStyle(4, 0xFF4444);
      this.answerButtons[index].icon.setText('✗').setColor('#FF6666').setAlpha(1);
      // Highlight correct answer
      this.answerButtons.forEach((btn, i) => {
        if (this.currentChoices[i].correct) {
          btn.bg.setFillStyle(BTN_COLORS.reveal).setStrokeStyle(4, 0x4488FF);
          btn.icon.setText('✓').setColor('#88CCFF').setAlpha(1);
        }
      });
      this._onWrong();
    }
  }

  _onCorrect(isFast) {
    GameState.recordAnswer(true, this.time.now - this._qStartTime);
    this.sound.play('sfx_correct', { volume: 0.55 });

    this.streak++;
    this.lossStreak = 0;  // A: correct resets the consecutive-wrong counter

    // A: every 3rd consecutive correct → bump in-battle difficulty offset
    if (this.streak % 3 === 0 && this.battleDiffOffset < 1) {
      this.battleDiffOffset++;
      this._floatDiffChange(+1);
    }

    // C: record this answer for cross-battle session accuracy
    GameState.recordTopicAnswer(this.currentTopic, true);

    let dmg = isFast ? 3 : 2;
    if (this.streak >= 3) dmg += 1;   // streak bonus
    if (GameState.activeEffects.doubleHit) {
      dmg *= 2;
      GameState.activeEffects.doubleHit = false;
      this._refreshEffectsDisplay();
    }

    this.enemyHP = Math.max(0, this.enemyHP - dmg);
    this._updateHPBar(this.enemyHPBar, this.enemyHP);

    // Lock the battle immediately if this hit killed the enemy — prevents any
    // subsequent timer tick or stale callback from loading a new question.
    if (this.enemyHP <= 0) {
      this.battleOver = true;
      if (this._timerEvent) this._timerEvent.remove();
    }

    const label = isFast ? `⚡ Fast! −${dmg}` : `✓ Correct! −${dmg}`;
    this._showFeedback(label, isFast ? 0xFFDD00 : 0x44FF44);
    this._updateStreakDisplay();

    // Mimi lunges and launches a projectile; enemy hit effects fire on impact.
    this._mimiAttack(isFast, dmg, () => {
      this.sound.play('sfx_hit_enemy', { volume: 0.70 });

      // Enemy hit flash + bounce (restore boss tint afterwards)
      this.enemySprite.setTint(0xFFFFFF);
      this.time.delayedCall(100, () => {
        if (this._bossTint) this.enemySprite.setTint(this._bossTint);
        else this.enemySprite.clearTint();
      });
      this.tweens.add({
        targets: this.enemySprite,
        y: { from: this.enemySprite.y + 14, to: this.enemySprite.y },
        scaleX: { from: 1.15, to: 1 },
        scaleY: { from: 0.85, to: 1 },
        duration: 200, ease: 'Bounce.easeOut',
      });
      // Screen flash on impact
      this.cameras.main.flash(150, 255, 255, 255, false, null, null, 0.08);

      // Floating damage number at the enemy
      const floatColor = isFast ? 0xFFDD00 : (dmg >= 4 ? 0xFF8800 : 0x44FF44);
      const floatScale = dmg >= 4 ? 1.3 : 1.0;
      this._floatText(this.enemySprite.x, this.enemySprite.y - 20, `−${dmg}`, floatColor, floatScale);
      if (isFast) this._floatText(this.enemySprite.x + 28, this.enemySprite.y - 44, '⚡FAST!', 0xFFDD00, 0.75);
    });

    // Use a longer pause on a kill so the player can see the enemy defeated
    // before the victory overlay appears.  Call _endBattle directly so the
    // battleOver guard in _afterAnswer doesn't swallow the victory.
    if (this.enemyHP <= 0) {
      this.time.delayedCall(1400, () => this._endBattle(true));
    } else {
      this.time.delayedCall(1200, () => this._afterAnswer());
    }
  }

  _onWrong() {
    GameState.recordAnswer(false, this.time.now - this._qStartTime);
    GameState.recordTopicAnswer(this.currentTopic, false);  // C
    this.sound.play('sfx_wrong', { volume: 0.75 });
    this.battleWrongAnswers++;

    this.streak = 0;
    this._updateStreakDisplay();

    // A: track consecutive wrong answers; after 2 in a row, ease off
    this.lossStreak++;
    if (this.lossStreak >= 2 && this.battleDiffOffset > -1) {
      this.battleDiffOffset--;
      this.lossStreak = 0;
      this._floatDiffChange(-1);
    }
    this._damagePlayer();
    this._showFeedback('✗ Wrong!', 0xFF4444);

    this.time.delayedCall(700, () => this._showExplanation(this.currentQuestion));
  }

  _damagePlayer() {
    if (GameState.activeEffects.shield) {
      GameState.activeEffects.shield = false;
      this._refreshEffectsDisplay();
      this._showFeedback('💎 Shield blocked the hit!', 0xAADDFF);
      return;
    }
    const dmg = this.enemyData.damage ?? 1;
    this.sound.play('sfx_hit_player', { volume: 0.80 });
    this.playerHP = Math.max(0, this.playerHP - dmg);
    GameState.hp  = this.playerHP;
    this._updateHPBar(this.playerHPBar, this.playerHP);

    // Shake Mimi + red flash
    const ox = this.mimiSprite.x;
    this.mimiSprite.setTint(0xFF4444);
    this.time.delayedCall(200, () => this.mimiSprite.clearTint());
    this.tweens.add({
      targets: this.mimiSprite, x: { from: ox - 12, to: ox + 12 },
      duration: 50, yoyo: true, repeat: 4,
      onComplete: () => { this.mimiSprite.x = ox; },
    });
    // Camera shake on damage
    this.cameras.main.shake(200, 0.008);

    // Floating damage number from Mimi's position
    this._floatText(this.mimiSprite.x, this.mimiSprite.y - 20, `−${dmg}`, 0xFF4444);
  }

  _afterAnswer() {
    if (this.battleOver) return;
    if (this.enemyHP <= 0) { this._endBattle(true);  return; }
    if (this.playerHP <= 0) { this._endBattle(false); return; }
    this._nextQuestion();
  }

  // ── Inventory → battle effects ────────────────────────────────────────────

  _applyInventoryEffects() {
    const inv = GameState.inventory;
    const fx  = GameState.activeEffects;

    // Sardine: heal 2 HP (only useful below max; skip if already full)
    if (inv.sardine > 0 && GameState.hp < GameState.maxHP) {
      GameState.hp = Math.min(GameState.maxHP, GameState.hp + ITEMS.sardine.value);
      GameState.useItem('sardine');
    }

    // Yarn Ball: +5s to battle timer
    if (inv.yarn_ball > 0) {
      fx.timerBonus = ITEMS.yarn_ball.value;
      GameState.useItem('yarn_ball');
    }

    // Catnip: double damage on the very next correct answer
    if (inv.catnip > 0) {
      fx.doubleHit = true;
      GameState.useItem('catnip');
    }

    // Lucky Collar: absorb one wrong hit
    if (inv.lucky_collar > 0) {
      fx.shield = true;
      GameState.useItem('lucky_collar');
    }

    // Fish Fossil: 3 hint charges — each eliminates one wrong answer per question
    if (inv.fish_fossil > 0) {
      fx.hintCharges = ITEMS.fish_fossil.value;
      GameState.useItem('fish_fossil');
    }
  }

  // ── Effects HUD row ───────────────────────────────────────────────────────

  _refreshEffectsDisplay() {
    if (!this.effectsRow) return;
    this.effectsRow.removeAll(true);

    const fx   = GameState.activeEffects;
    const tags = [];
    if (fx.shield)          tags.push({ spriteKey: 'item_collar', label: 'Shield',                  color: '#88CCFF' });
    if (fx.doubleHit)       tags.push({ spriteKey: 'item_catnip', label: '2× Hit',                  color: '#AAFFAA' });
    if (fx.hintCharges > 0) tags.push({ spriteKey: 'item_fossil', label: `Hint ×${fx.hintCharges}`, color: '#FFDDAA' });
    if (fx.timerBonus > 0)  tags.push({ spriteKey: 'item_yarn',   label: `+${fx.timerBonus}s`,      color: '#DDAAFF' });

    // Anchor badges under Mimi's HP bar (left side)
    const W = this.cameras.main.width;
    tags.forEach((tag, i) => {
      const bx = W * 0.04 + i * 80;
      const y  = 187;
      this.effectsRow.add(
        this.add.rectangle(bx + 38, y, 74, 18, 0x000033, 0.88).setStrokeStyle(1, 0x446688),
      );
      const iconImg = this.textures.exists(tag.spriteKey)
        ? this.add.image(bx + 10, y, tag.spriteKey).setDisplaySize(13, 13).setOrigin(0.5)
        : this.add.text(bx + 10, y, '?', { fontSize: '10px', color: '#FFFFFF', fontFamily: FONT_UI }).setOrigin(0.5);
      this.effectsRow.add(iconImg);
      this.effectsRow.add(
        this.add.text(bx + 19, y, tag.label, {
          fontSize: '10px', color: tag.color, fontFamily: FONT_UI, fontStyle: 'bold',
        }).setOrigin(0, 0.5),
      );
    });
  }

  // ── Explanation overlay (wrong answer / timeout) ──────────────────────────

  _showExplanation(question) {
    if (!question || this.battleOver) { this._afterAnswer(); return; }

    const W   = this.cameras.main.width;
    const H   = this.cameras.main.height;
    const D   = 20;   // base depth
    const explanation = getExplanation(question);
    const ans = question.answerDisplay !== undefined
      ? String(question.answerDisplay) : String(question.answer);

    const overlay = [];
    const add = obj => { overlay.push(obj); return obj; };

    // Dim backdrop
    add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(D));

    // Panel
    add(this.add.rectangle(W / 2, H / 2 - 10, W * 0.82, 320, 0x080824)
      .setStrokeStyle(2, 0xFFCC44).setDepth(D));

    // Header: correct answer
    add(this.add.text(W / 2, H * 0.20, `✓  Correct answer: ${ans}`, {
      fontSize: '22px', color: '#FFD700', fontFamily: FONT_TITLE, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(D + 1));

    // Divider
    const dg = add(this.add.graphics().setDepth(D + 1));
    dg.lineStyle(1, 0x445588, 0.7);
    dg.lineBetween(W * 0.14, H * 0.295, W * 0.86, H * 0.295);

    // Explanation text
    add(this.add.text(W / 2, H * 0.31, explanation, {
      fontSize: '16px', color: '#DDEEFF', fontFamily: FONT_UI,
      align: 'center', lineSpacing: 5,
      stroke: '#000000', strokeThickness: 2,
      wordWrap: { width: W * 0.74 },
    }).setOrigin(0.5, 0).setDepth(D + 1));

    // "Got it!" button
    const btnBg = add(this.add.rectangle(W / 2, H * 0.79, 210, 48, 0x0A2840)
      .setStrokeStyle(2, 0x44AAFF)
      .setInteractive({ useHandCursor: true })
      .setDepth(D + 1));
    const btnTxt = add(this.add.text(W / 2, H * 0.79, 'Got it!  →', {
      fontSize: '19px', color: '#88CCFF', fontFamily: FONT_UI, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 2));

    const dismiss = () => {
      // Remove keyboard listeners to avoid stale handlers
      this.input.keyboard.off('keydown-ENTER', dismiss);
      this.input.keyboard.off('keydown-SPACE', dismiss);
      overlay.forEach(o => o.destroy());
      this._afterAnswer();
    };

    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x163E6A); btnTxt.setColor('#AADDFF'); });
    btnBg.on('pointerout',  () => { btnBg.setFillStyle(0x0A2840); btnTxt.setColor('#88CCFF'); });
    btnBg.on('pointerdown', dismiss);
    this.input.keyboard.on('keydown-ENTER', dismiss);
    this.input.keyboard.on('keydown-SPACE', dismiss);
  }

  // ── Feedback / streak display ─────────────────────────────────────────────

  // ── Adaptive difficulty display ───────────────────────────────────────

  /**
   * Briefly show an upward or downward difficulty-shift label near the
   * topic line at the top of the screen.
   * @param {number} dir  +1 (ramping up) or -1 (easing off)
   */
  _floatDiffChange(dir) {
    const W   = this.cameras.main.width;
    const msg = dir > 0 ? '↑ Ramping up!' : '↓ Taking it easy';
    const col = dir > 0 ? 0xFFDD44 : 0x88DDFF;
    this._floatText(W / 2, 28, msg, col, 0.65);
  }

  // ── Mimi attack animation ───────────────────────────────────────────────

  /**
   * Lunge Mimi toward the enemy and fire a glowing projectile orb.
   * Calls onHit() when the orb reaches the enemy sprite.
   * @param {boolean} isFast
   * @param {number}  dmg
   * @param {Function} onHit
   */
  _mimiAttack(isFast, dmg, onHit) {
    const baseX = this._mimiBaseX;
    const baseY = this._mimiBaseY;

    // Pause idle bob and snap to the clean home position
    this.tweens.killTweensOf(this.mimiSprite);
    this.mimiSprite.setPosition(baseX, baseY);

    // Phase 1 — forward lunge toward the enemy
    this.tweens.add({
      targets:  this.mimiSprite,
      x:        baseX + 50,
      y:        baseY - 10,
      duration: 110,
      ease:     'Quad.easeOut',
      onComplete: () => {
        // Fire the orb at the peak of the lunge
        const orbColor = isFast ? 0xFFDD00 : (dmg >= 4 ? 0xFF8800 : 0x55FF88);
        const orbSize  = dmg >= 4 ? 10 : 7;
        this._launchProjectile(
          this.mimiSprite.x, this.mimiSprite.y,
          this.enemySprite.x, this.enemySprite.y,
          orbColor, orbSize, onHit,
        );
        // Phase 2 — spring back to home
        this.tweens.add({
          targets:  this.mimiSprite,
          x:        baseX,
          y:        baseY,
          duration: 190,
          ease:     'Back.easeOut',
          onComplete: () => {
            if (this.battleOver) return;
            // Restart idle bob
            this.tweens.add({
              targets:  this.mimiSprite,
              y:        baseY - 4,
              duration: 1600,
              yoyo:     true,
              repeat:   -1,
              ease:     'Sine.easeInOut',
              delay:    200,
            });
          },
        });
      },
    });
  }

  /**
   * Spawn a glowing orb that travels from (x1,y1) to (x2,y2) then calls onHit.
   */
  _launchProjectile(x1, y1, x2, y2, color, size, onHit) {
    const gfx = this.add.graphics().setDepth(20);
    gfx.fillStyle(color, 0.30);
    gfx.fillCircle(0, 0, size + 6);   // outer halo
    gfx.fillStyle(color, 1);
    gfx.fillCircle(0, 0, size);        // core
    gfx.fillStyle(0xFFFFFF, 0.85);
    gfx.fillCircle(0, 0, Math.ceil(size * 0.42));  // bright centre spark
    gfx.setPosition(x1, y1);

    this.tweens.add({
      targets:  gfx,
      x:        x2,
      y:        y2,
      duration: 180,
      ease:     'Quad.easeIn',
      onComplete: () => { gfx.destroy(); onHit(); },
    });
  }

  /**
   * Spawn a floating damage/status text that arcs up from (x, y) and fades.
   * @param {number} x
   * @param {number} y
   * @param {string} msg
   * @param {number} color  hex integer
   * @param {number} [scale=1]
   */
  _floatText(x, y, msg, color, scale = 1) {
    const colorStr = '#' + color.toString(16).padStart(6, '0');
    const t = this.add.text(x, y, msg, {
      fontSize: `${Math.round(22 * scale)}px`,
      color: colorStr,
      fontFamily: FONT_TITLE,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20).setAlpha(1);

    this.tweens.add({
      targets:  t,
      y:        y - 54,
      x:        x + Phaser.Math.Between(-18, 18),
      alpha:    0,
      scaleX:   scale * 1.3,
      scaleY:   scale * 1.3,
      duration: 850,
      ease:     'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  _showFeedback(msg, color) {
    const H = this.cameras.main.height;
    this.feedbackText
      .setText(msg)
      .setColor(Phaser.Display.Color.IntegerToColor(color).rgba)
      .setAlpha(1)
      .setY(H * 0.27);

    this.tweens.add({
      targets: this.feedbackText,
      y: H * 0.20, alpha: 0,
      duration: 900,
    });
  }

  _updateStreakDisplay() {
    if (this.streak >= 3) {
      this.streakText
        .setText(`🔥 Math Streak ×${this.streak}! (+1 bonus dmg)`)
        .setAlpha(1);
    } else if (this.streak > 0) {
      this.streakText.setText(`Streak: ${this.streak}`).setAlpha(0.8);
    } else {
      this.streakText.setAlpha(0);
    }
  }

  // ── End of battle ─────────────────────────────────────────────────────────

  /** Hide all mid-battle question UI so the victory/defeat overlay is clean. */
  _hideQuestionUI() {
    if (this.questionBg) this.questionBg.setVisible(false);
    this.questionText.setVisible(false);
    this.answerButtons.forEach(btn => {
      btn.bg.removeInteractive().setVisible(false);
      btn.lbl.setVisible(false);
      btn.numLbl.setVisible(false);
      if (btn.shadow) btn.shadow.setVisible(false);
      if (btn.highlight) btn.highlight.setVisible(false);
    });
    if (this.timerFill) this.timerFill.setVisible(false);
    if (this.timerText) this.timerText.setVisible(false);
    if (this.feedbackText) this.feedbackText.setAlpha(0);
    if (this.streakText)   this.streakText.setAlpha(0);
    if (this.effectsRow)   this.effectsRow.setVisible(false);
  }

  /** Spawn confetti particles across the screen. */
  _spawnConfetti(W, H) {
    const COLORS = [0xFFD700, 0xFF4488, 0x44AAFF, 0x44FF88, 0xFF8844, 0xAA66FF, 0xFFFFFF];
    for (let i = 0; i < 50; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = Phaser.Math.FloatBetween(3, 7);
      const x = Phaser.Math.Between(0, W);
      const startY = Phaser.Math.Between(-60, -10);
      const shape = Math.random() > 0.5
        ? this.add.rectangle(x, startY, size, size * 1.5, color).setDepth(30)
        : this.add.circle(x, startY, size / 2, color).setDepth(30);

      this.tweens.add({
        targets: shape,
        y: H + 30,
        x: x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(-360, 360),
        alpha: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(1500, 3500),
        delay: Phaser.Math.Between(0, 800),
        ease: 'Sine.easeIn',
        onComplete: () => shape.destroy(),
      });
    }
  }

  _endBattle(victory) {
    this.battleOver = true;
    if (this._timerEvent) this._timerEvent.remove();

    this._hideQuestionUI();

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    if (victory) {
      // Bestiary: mark this enemy type as defeated
      GameState.markEnemyDefeated(this.enemyData.id);

      this.sound.play('sfx_victory', { volume: 0.80 });
      // Victory effects
      this._spawnConfetti(W, H);
      this.cameras.main.flash(400, 255, 215, 0, false, null, null, 0.15);

      GameState.recordBattle(true, this.battleWrongAnswers === 0, this.streak);

      // ── Star rating for boss battles ──────────────────────────────────────
      if (this.isBoss) {
        const wrRatio = this.questionIdx > 0 ? this.battleWrongAnswers / this.questionIdx : 0;
        this._bossStars = wrRatio === 0 ? 3 : wrRatio <= 0.25 ? 2 : 1;
      }

      // ── Item drop: 100% for bosses, 30% for regular enemies ──
      const ITEM_IDS    = Object.keys(ITEMS);
      const dropChance  = this.isBoss ? 1.0 : 0.30;
      const droppedItem = Math.random() < dropChance
        ? ITEM_IDS[Phaser.Math.Between(0, ITEM_IDS.length - 1)]
        : null;
      if (droppedItem) GameState.addItem(droppedItem);

      // ── Build victory overlay with a flowing y cursor ──────────────────
      let nextY = H / 2 - 80;

      const yVictory  = nextY;  nextY += 52;
      const yAccuracy = nextY;  nextY += 34;

      let yStreak = null;
      if (this.streak >= 3) { yStreak = nextY; nextY += 26; }

      let yPerfect = null;
      if (this.battleWrongAnswers === 0) { yPerfect = nextY; nextY += 24; }

      let yBoss = null;
      if (this.isBoss) { yBoss = nextY; nextY += 24; }

      let yStars = null;
      if (this.isBoss) { yStars = nextY; nextY += 26; }

      let yItemTitle = null, yItemDesc = null;
      if (droppedItem) {
        nextY += 8;
        yItemTitle = nextY; nextY += 22;
        yItemDesc  = nextY; nextY += 20;
      }

      const btnY     = nextY + 18;
      const overlayH = (btnY + 30) - (H / 2 - 80 - 14) + 14;
      const overlayY = (H / 2 - 80 - 14) + overlayH / 2;

      this.add.rectangle(W / 2, overlayY, W * 0.78, overlayH, 0x000033, 0.93)
        .setStrokeStyle(2, 0x4488FF);

      this.add.text(W / 2, yVictory, '⭐  Victory!  ⭐', {
        ...TEXT_STYLE(38, '#FFD700', true), fontFamily: FONT_TITLE, stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);

      // Battle accuracy
      const battleAnswered = this.questionIdx;
      const battleCorrect  = battleAnswered - this.battleWrongAnswers;
      const pct = battleAnswered > 0 ? Math.round(battleCorrect / battleAnswered * 100) : 100;
      this.add.text(W / 2, yAccuracy,
        `${battleCorrect}/${battleAnswered} correct  (${pct}%)`,
        TEXT_STYLE(18, '#AAFFCC'),
      ).setOrigin(0.5);

      if (yStreak !== null) {
        this.add.text(W / 2, yStreak, `🔥 ${this.streak}-answer streak!`, TEXT_STYLE(16, '#FF9900')).setOrigin(0.5);
      }

      if (yPerfect !== null) {
        this.add.text(W / 2, yPerfect, '✨ Perfect battle!', TEXT_STYLE(15, '#FFEEAA')).setOrigin(0.5);
      }

      if (yBoss !== null) {
        this.add.text(W / 2, yBoss, 'The path to the next region is open!', TEXT_STYLE(14, '#88FFAA')).setOrigin(0.5);
      }

      if (yStars !== null) {
        const stars  = this._bossStars ?? 1;
        const sStr   = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        const sColor = stars === 3 ? '#FFD700' : stars === 2 ? '#DDBB88' : '#AAAAAA';
        const sLabel = stars === 3 ? '  Perfect!' : stars === 2 ? '  Well done!' : '';
        this.add.text(W / 2, yStars, `${sStr}${sLabel}`, {
          ...TEXT_STYLE(20, sColor, true), stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5);
      }

      // Item drop notification
      if (droppedItem && yItemTitle !== null) {
        const itm = ITEMS[droppedItem];
        this.add.text(W / 2, yItemTitle,
          `🎁 ${itm.emoji} ${itm.name} dropped!`,
          TEXT_STYLE(15, '#FFE88A', true),
        ).setOrigin(0.5);
        this.add.text(W / 2, yItemDesc,
          itm.description,
          TEXT_STYLE(12, '#CCDDFF'),
        ).setOrigin(0.5);
      }

      const btnYOffset = btnY - H / 2;
      this._makeContinueButton(W, H, 'Continue →', () => {
        GameState.save();

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          // Boss victory → go directly to overworld
          if (this.isBoss) {
            GameState.defeatBoss(this.regionId);
            GameState.setRegionStars(this.regionId, this._bossStars ?? 1);
            if (this.isHardMode) GameState.defeatBossHardMode(this.regionId);
            GameState.save();
            this.scene.start('OverworldScene', { bossDefeated: !this.isHardMode, regionId: this.regionId });
          } else {
            // Regular enemy → return to exploration
            this.scene.start(this.returnScene, {
              ...this.returnData,
              battleResult: {
                victory:       true,
                enemyInstance: this.enemyInstance,
                isBoss:        this.isBoss,
              },
            });
          }
        });
      }, undefined, undefined, btnYOffset);

    } else {
      // ── Defeat ─────────────────────────────────────────────────────────────
      this.cameras.main.shake(500, 0.012);
      this.cameras.main.flash(300, 180, 0, 0, false, null, null, 0.2);
      GameState.recordBattle(false, false, this.streak);

      const lifeUsed = GameState.useLife();   // consumes 1 life AND sets hp = maxHP if available

      if (lifeUsed) {
        // ── Soft defeat: life consumed, respawn near the enemy ────────────────
        const DEFEAT_QUIPS = [
          'Mimi has exactly nine lives for a reason.\nShe checked. It\'s in the paperwork.',
          `One down, ${GameState.lives} to go.\nMimi eyes the enemy with renewed focus.`,
          'Knocked out.\nMimi dusts herself off with enormous dignity.\n(She has fallen over in less impressive ways.)',
          'That round went to the enemy.\nMimi is taking notes. Detailed, vengeful notes.',
          'Technically that didn\'t happen.\nMimi is prepared to argue this with documentation.',
          'Mimi has invoked emergency cat physics.\nShe bounces. It\'s a thing.',
          'A cat does not acknowledge defeat.\nA cat merely... re-strategies. Near the enemy.',
          'Life spent. Zero regrets.\nAbsolute lies, but convincingly delivered.',
          `${GameState.lives} liv${GameState.lives === 1 ? 'e' : 'es'} remaining.\nMimi has done the maths. She\'s fine.`,
        ];
        const quip = DEFEAT_QUIPS[Phaser.Math.Between(0, DEFEAT_QUIPS.length - 1)];

        // Dark vignette overlay
        this.add.rectangle(W / 2, H / 2, W, H, 0x110000, 0.4);
        const boxH = 220;
        this.add.rectangle(W / 2, H / 2, W * 0.78, boxH, 0x220000, 0.93)
          .setStrokeStyle(2, 0x882222);

        this.add.text(W / 2, H / 2 - boxH / 2 + 18, '🐾  A Life Used…', {
          ...TEXT_STYLE(32, '#FF8844', true), fontFamily: FONT_TITLE, stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 12, quip, {
          ...TEXT_STYLE(15, '#FFCCAA'), wordWrap: { width: W * 0.68 }, align: 'center',
        }).setOrigin(0.5);

        const livesLeft = '🐾 '.repeat(GameState.lives).trim() || '(none left!)';
        this.add.text(W / 2, H / 2 + boxH / 2 - 46,
          `Lives remaining: ${livesLeft}`, TEXT_STYLE(13, '#FFB088')).setOrigin(0.5);

        this._makeContinueButton(W, H, 'Back into it! →', () => {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(this.returnScene, {
              ...this.returnData,
              battleResult: { victory: false, usedLife: true },
            });
          });
        }, 0x550000, 0xCC6633, 62);

      } else {
        // ── Hard defeat: no lives left, reset to region spawn ────────────────
        GameState.hp = Math.max(1, Math.ceil(GameState.maxHP / 2));
        GameState.save();

        this.add.rectangle(W / 2, H / 2, W, H, 0x110000, 0.4);
        this.add.rectangle(W / 2, H / 2, W * 0.78, 220, 0x220000, 0.93)
          .setStrokeStyle(2, 0x882222);

        this.add.text(W / 2, H / 2 - 72, '💫  All Nine Lives Gone…', {
          ...TEXT_STYLE(30, '#FF6666', true), fontFamily: FONT_TITLE, stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 - 24,
          'Mimi has exhausted the full allowance of\ncat-based second chances.\nShe retreats to the region entrance to regroup.',
          { ...TEXT_STYLE(14, '#FFAAAA'), wordWrap: { width: W * 0.66 }, align: 'center' }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 28,
          `HP restored to ${GameState.hp}/${GameState.maxHP}`, TEXT_STYLE(13, '#FFAAAA')).setOrigin(0.5);

        this._makeContinueButton(W, H, 'Try Again →', () => {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(this.returnScene, {
              ...this.returnData,
              battleResult: { victory: false, usedLife: false },
            });
          });
        }, 0x660000, 0xAA4444);
      }
    }
  }

  _makeContinueButton(W, H, label, cb, bgColor = 0x003366, strokeColor = 0x4488FF, yOffset = 78) {
    // Shadow
    this.add.rectangle(W / 2 + 2, H / 2 + yOffset + 3, 220, 48, 0x000000, 0.4);

    const bg = this.add.rectangle(W / 2, H / 2 + yOffset, 220, 48, bgColor)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, strokeColor);

    // Top bevel highlight
    this.add.rectangle(W / 2, H / 2 + yOffset - 10, 214, 12, 0xFFFFFF, 0.08);

    const txt = this.add.text(W / 2, H / 2 + yOffset, label, TEXT_STYLE(22, '#FFFFFF', true))
      .setOrigin(0.5);

    bg.on('pointerover', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1.06, scaleY: 1.06, duration: 80 });
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 80 });
    });
    bg.on('pointerdown', cb);

    // Also allow Enter/Space
    this.input.keyboard.once('keydown-ENTER', cb);
    this.input.keyboard.once('keydown-SPACE', cb);
  }

  // ── Pause / Resume ───────────────────────────────────────────────────────

  _pauseBattle() {
    if (this._battlePaused) return;
    this._battlePaused = true;
    // Stop the running timer event and save remaining time
    if (this._timerEvent) { this._timerEvent.remove(); this._timerEvent = null; }
    this._pauseRemainingMs = this._currentRemainingMs ?? 0;
    this.tweens.pauseAll();
    // Pause overlay
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    this._pauseOverlay = [
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(50),
      this.add.text(W / 2, H / 2 - 22, '⏸  PAUSED', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '36px', fontStyle: 'bold', color: '#FFFFFF',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(51),
      this.add.text(W / 2, H / 2 + 22, 'Press  [P]  to resume', {
        fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#AACCFF',
      }).setOrigin(0.5).setDepth(51),
    ];
  }

  _resumeBattle() {
    if (!this._battlePaused) return;
    this._battlePaused = false;
    if (this._pauseOverlay) { this._pauseOverlay.forEach(o => o.destroy()); this._pauseOverlay = null; }
    this.tweens.resumeAll();
    // Restart timer with saved remaining time (only if player hasn't answered yet)
    if (!this.answering && !this.battleOver && this._pauseRemainingMs > 0) {
      this._startTimer(this._pauseRemainingMs);
    }
  }

  _togglePause() { this._battlePaused ? this._resumeBattle() : this._pauseBattle(); }

  // ── Update loop ───────────────────────────────────────────────────────────

  update() {
    // P toggles pause regardless of other state
    if (Phaser.Input.Keyboard.JustDown(this.pKey)) this._togglePause();
    if (this._battlePaused || this.battleOver || this.answering) return;
    this.keys.forEach((key, i) => {
      if (Phaser.Input.Keyboard.JustDown(key)) this._selectAnswer(i);
    });
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) this._tryRunAway();
  }

  // ── Run Away ──────────────────────────────────────────────────────────────

  /** Attempt to flee the current battle. Blocked for bosses; costs 1 HP otherwise. */
  _tryRunAway() {
    if (this.battleOver || this.answering) return;

    if (this.isBoss) {
      const W = this.cameras.main.width;
      const H = this.cameras.main.height;
      const flash = this.add.text(W / 2, H * 0.43, "Can't escape a boss!",
        { ...TEXT_STYLE(20, '#FF6644', true), stroke: '#000', strokeThickness: 3 },
      ).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: flash, alpha: 0, delay: 1000, duration: 500, onComplete: () => flash.destroy() });
      return;
    }

    // Cost: 1 HP (floor at 1 — running can't kill Mimi)
    const cost = this.playerHP > 1 ? 1 : 0;
    this.playerHP       = Math.max(1, this.playerHP - 1);
    GameState.hp        = Math.max(1, GameState.hp - 1);
    GameState.save();
    this._updateHPBar(this.playerHPBar, this.playerHP);

    this._endRunAway(cost);
  }

  _endRunAway(hpCost) {
    this.battleOver = true;
    if (this._timerEvent) this._timerEvent.remove();
    this._hideQuestionUI();

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    const RUN_QUIPS = [
      'Living to fight another day.',
      'Strategic retreat. Very strategic.',
      'Mimi has decided this is not her problem.',
      'Sometimes the best answer is running.',
      "Technically, 'not losing' counts as not losing.",
      'She\'ll be back. With a plan. Maybe.',
    ];
    const quip = RUN_QUIPS[Phaser.Math.Between(0, RUN_QUIPS.length - 1)];

    const boxH  = hpCost > 0 ? 188 : 168;
    const boxY  = H / 2 - 10;
    this.add.rectangle(W / 2, boxY, W * 0.78, boxH, 0x001122, 0.93)
      .setStrokeStyle(2, 0x446688);

    this.add.text(W / 2, boxY - boxH / 2 + 28, '🏃  Mimi Fled!', {
      ...TEXT_STYLE(34, '#88CCFF', true), fontFamily: FONT_TITLE, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(W / 2, boxY - boxH / 2 + 72, quip,
      { ...TEXT_STYLE(15, '#AACCFF'), wordWrap: { width: W * 0.65 }, align: 'center' },
    ).setOrigin(0.5);

    if (hpCost > 0) {
      this.add.text(W / 2, boxY - boxH / 2 + 100,
        `−${hpCost} HP from the hasty retreat`,
        TEXT_STYLE(13, '#FF9988'),
      ).setOrigin(0.5);
    }

    const btnOffset = boxH / 2 - 34;
    this._makeContinueButton(W, H, 'Back to it →', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(this.returnScene, {
          ...this.returnData,
          battleResult: { victory: false, ranAway: true },
        });
      });
    }, 0x001133, 0x4466AA, boxY - H / 2 + btnOffset);
  }
}
