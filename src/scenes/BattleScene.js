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
import GameState        from '../config/GameState.js';
import { generateQuestion } from '../math/QuestionBank.js';
import { getChoices }       from '../math/Distractors.js';

const BTN_COLORS = {
  idle:    0x1E3A6E,
  hover:   0x2E5AA0,
  correct: 0x1A7A2A,
  wrong:   0x7A1A1A,
  reveal:  0x1A2E7A,
};
const TEXT_STYLE = (size, color = '#FFFFFF', bold = false) => ({
  fontSize: `${size}px`, color, fontFamily: 'Arial',
  fontStyle: bold ? 'bold' : 'normal',
});

export default class BattleScene extends Phaser.Scene {
  constructor() { super({ key: 'BattleScene' }); }

  init(data) {
    this.enemyData     = data.enemy;
    this.enemyInstance = data.enemyInstance;
    this.regionId      = data.regionId;
    this.isBoss        = data.isBoss ?? false;
    this.returnScene   = data.returnScene ?? 'OverworldScene';
    this.returnData    = data.returnData  ?? {};

    // Battle state
    this.enemyHP     = this.enemyData.hp;
    this.playerHP    = GameState.hp;
    this.streak      = 0;
    this.questionIdx = 0;
    this.battleOver  = false;
    this.answering   = false;

    GameState.resetEffects();
    // Apply inventory effects if any
    if (GameState.inventory.yarn_ball > 0) {
      GameState.activeEffects.timerBonus = 5;
    }
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this._drawBackground(W, H);
    this._buildLayout(W, H);
    this._setupKeys();

    this.time.delayedCall(400, () => this._nextQuestion());
  }

  // ── Background ────────────────────────────────────────────────────────────

  _drawBackground(W, H) {
    // Map regionId to backdrop
    const backdropKeys = [
      'backdrop_village',  // Region 0
      'backdrop_meadow',   // Region 1
      'backdrop_desert',   // Region 2
      'backdrop_ice',      // Region 3
      'backdrop_shadow',   // Region 4
    ];
    
    const backdropKey = backdropKeys[this.regionId] ?? 'backdrop_village';
    
    // Display Full-screen backdrop
    if (this.textures.exists(backdropKey)) {
      this.add.image(W / 2, H / 2, backdropKey).setDisplaySize(W, H).setDepth(0);
    } else {
      // Fallback if backdrop not loaded
      console.warn(`Backdrop ${backdropKey} not found, using solid color`);
      this.add.rectangle(W / 2, H / 2, W, H, 0x0A0A20).setDepth(0);
    }
    
    // Add subtle overlay for UI readability
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.15).setDepth(1);
    
    // Separator lines
    const gfx = this.add.graphics();
    gfx.lineStyle(2, 0xFFFFFF, 0.2);
    gfx.lineBetween(0, 160, W, 160);
    gfx.lineBetween(0, H - 110, W, H - 110);
    gfx.setDepth(2);
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  _buildLayout(W, H) {
    // ── Enemy side ──────────────────────────────────────────────────────
    this.enemySprite = this.add.image(W * 0.72, 88, this.enemyData.spriteKey)
      .setDisplaySize(100, 100);

    this.add.text(W * 0.72, 144, this.enemyData.name, TEXT_STYLE(16, '#FFCCEE', true))
      .setOrigin(0.5);

    this.enemyHPBar = this._makeHPBar(W * 0.72, 162, this.enemyData.hp, 0xCC3333);

    if (this.isBoss) {
      this.add.text(W * 0.72, 10, '⚠ BOSS BATTLE', TEXT_STYLE(13, '#FF6633', true))
        .setOrigin(0.5, 0);
    }

    // ── Player (Mimi) side ──────────────────────────────────────────────
    this.mimiSprite = this.add.image(W * 0.28, 88, 'mimi_battle')
      .setDisplaySize(100, 100).setFlipX(true);

    this.add.text(W * 0.28, 144, 'Mimi', TEXT_STYLE(16, '#AAFFCC', true)).setOrigin(0.5);
    this.playerHPBar = this._makeHPBar(W * 0.28, 162, GameState.maxHP, 0x33CC66);

    // ── Math topic badge ────────────────────────────────────────────────
    const topicLabels = {
      addSub: 'Addition & Subtraction', multiplication: 'Multiplication',
      division: 'Division', fractions: 'Fractions', mixed: 'Mixed',
    };
    this.add.text(W / 2, 10, topicLabels[this.enemyData.mathTopic] ?? '', TEXT_STYLE(13, '#AACCFF'))
      .setOrigin(0.5, 0);

    // ── Question display ────────────────────────────────────────────────
    this.questionText = this.add.text(W / 2, H * 0.43, '', {
      ...TEXT_STYLE(34, '#FFE44D', true),
      align: 'center',
      wordWrap: { width: W - 60 },
    }).setOrigin(0.5);

    // ── Answer buttons ──────────────────────────────────────────────────
    this._buildAnswerButtons(W, H);

    // ── Timer bar ───────────────────────────────────────────────────────
    this._buildTimerBar(W, H);

    // ── Feedback / streak ───────────────────────────────────────────────
    this.feedbackText = this.add.text(W / 2, H * 0.27, '', {
      ...TEXT_STYLE(26, '#FFD700', true),
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.streakText = this.add.text(W / 2, 22, '', TEXT_STYLE(16, '#FF9900', true))
      .setOrigin(0.5).setAlpha(0);

    this._updateHPBar(this.playerHPBar, this.playerHP);
    this._updateHPBar(this.enemyHPBar, this.enemyHP);
  }

  _makeHPBar(cx, cy, maxHP, fillColor) {
    const BW = 160, BH = 14;
    this.add.rectangle(cx, cy, BW + 4, BH + 4, 0x111111).setOrigin(0.5);
    const fill = this.add.rectangle(cx - BW / 2, cy, BW, BH, fillColor).setOrigin(0, 0.5);
    const lbl  = this.add.text(cx, cy, `${maxHP}/${maxHP}`, TEXT_STYLE(11)).setOrigin(0.5).setDepth(2);
    return { fill, lbl, maxHP, bw: BW, bh: BH, fillColor };
  }

  _updateHPBar(bar, currentHP) {
    const ratio = Math.max(0, currentHP) / bar.maxHP;
    bar.fill.setDisplaySize(bar.bw * ratio, bar.bh);
    bar.lbl.setText(`${Math.max(0, currentHP)}/${bar.maxHP}`);
    // Colour shift: green → yellow → red
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(255 * ratio);
    bar.fill.setFillStyle(Phaser.Display.Color.GetColor(r, g, 40));
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
      const bg = this.add.rectangle(pos.x, pos.y, BW, BH, BTN_COLORS.idle)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x4466AA);

      const numLbl = this.add.text(pos.x, pos.y - 18, `[${i + 1}]`, TEXT_STYLE(11, '#6688CC'))
        .setOrigin(0.5);

      const lbl = this.add.text(pos.x, pos.y + 6, '', TEXT_STYLE(22, '#FFFFFF', true))
        .setOrigin(0.5);

      bg.on('pointerover', () => { if (!this.answering) bg.setFillStyle(BTN_COLORS.hover); });
      bg.on('pointerout',  () => { if (!this.answering) bg.setFillStyle(BTN_COLORS.idle);  });
      bg.on('pointerdown', () => this._selectAnswer(i));

      return { bg, lbl, numLbl };
    });
  }

  _buildTimerBar(W, H) {
    const TW = W - 60, y = H - 60;
    this.add.rectangle(W / 2, y, TW + 4, 22, 0x111111);
    this.timerFill = this.add.rectangle(W / 2 - TW / 2, y, TW, 18, 0x44EE44).setOrigin(0, 0.5);
    this.timerText = this.add.text(W / 2, y, '', TEXT_STYLE(13)).setOrigin(0.5).setDepth(2);
    this._timerW   = TW;
  }

  _setupKeys() {
    const kb = this.input.keyboard;
    this.keys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];
  }

  // ── Question flow ─────────────────────────────────────────────────────────

  _nextQuestion() {
    if (this.battleOver) return;
    this.answering = false;
    this.questionIdx++;

    // Boss battles pick randomly from all region topics; regular enemies use their
    // specific topic.  Difficulty stays at the enemy's level (bosses use D1 so
    // questions are fair even with many HP).
    const difficulty = this.isBoss ? 1 : (this.enemyData.difficulty ?? 1);
    const topics     = this.enemyData.mathTopics ?? [this.enemyData.mathTopic];
    const topic      = topics[Math.floor(Math.random() * topics.length)];
    const q = generateQuestion(topic, difficulty);
    this.currentChoices = getChoices(q);

    this.questionText.setText(q.text);

    this.answerButtons.forEach((btn, i) => {
      const choice = this.currentChoices[i];
      btn.lbl.setText(choice.text);
      btn.bg.setFillStyle(BTN_COLORS.idle).setInteractive();
    });

    // Timer
    const duration = (this.enemyData.timerSeconds + (GameState.activeEffects.timerBonus ?? 0)) * 1000;
    this._startTimer(duration);
  }

  _startTimer(totalMs) {
    if (this._timerEvent) this._timerEvent.remove();
    const startTime = this.time.now;

    this._timerEvent = this.time.addEvent({
      delay: 50, repeat: -1,
      callback: () => {
        if (this.answering) return;
        const elapsed   = this.time.now - startTime;
        const remaining = Math.max(0, totalMs - elapsed);
        const ratio     = remaining / totalMs;

        this.timerFill.setDisplaySize(this._timerW * ratio, 18);
        this.timerText.setText(`${Math.ceil(remaining / 1000)}s`);

        // Colour
        if      (ratio < 0.25) this.timerFill.setFillStyle(0xEE3333);
        else if (ratio < 0.55) this.timerFill.setFillStyle(0xEEAA33);
        else                   this.timerFill.setFillStyle(0x44EE44);

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

    this.answerButtons.forEach((btn, i) => {
      btn.bg.removeInteractive();
      if (this.currentChoices[i].correct) btn.bg.setFillStyle(BTN_COLORS.reveal);
    });

    this.streak = 0;
    this._showFeedback('⏱ Time\'s up!', 0xFF6633);
    this._damagePlayer();

    this.time.delayedCall(1600, () => this._afterAnswer());
  }

  _selectAnswer(index) {
    if (this.answering || this.battleOver) return;
    this.answering = true;
    if (this._timerEvent) this._timerEvent.remove();

    const isFast   = this._elapsedRatio() < (5 / (this.enemyData.timerSeconds ?? 15));
    const selected = this.currentChoices[index];

    this.answerButtons.forEach(btn => btn.bg.removeInteractive());

    if (selected.correct) {
      this.answerButtons[index].bg.setFillStyle(BTN_COLORS.correct);
      this._onCorrect(isFast, index);
    } else {
      this.answerButtons[index].bg.setFillStyle(BTN_COLORS.wrong);
      // Highlight correct answer
      this.answerButtons.forEach((btn, i) => {
        if (this.currentChoices[i].correct) btn.bg.setFillStyle(BTN_COLORS.reveal);
      });
      this._onWrong();
    }
  }

  _onCorrect(isFast) {
    this.streak++;
    let dmg = isFast ? 3 : 2;
    if (this.streak >= 3)             dmg += 1;           // streak bonus
    if (GameState.activeEffects.doubleHit) { dmg *= 2; GameState.activeEffects.doubleHit = false; }
    dmg = Math.round(dmg * GameState.mathPower);

    this.enemyHP = Math.max(0, this.enemyHP - dmg);
    this._updateHPBar(this.enemyHPBar, this.enemyHP);

    // Enemy bounce
    this.tweens.add({
      targets: this.enemySprite,
      y: { from: this.enemySprite.y + 12, to: this.enemySprite.y },
      duration: 120, ease: 'Power2',
    });

    const label = isFast ? `⚡ Fast! −${dmg}` : `✓ Correct! −${dmg}`;
    this._showFeedback(label, isFast ? 0xFFDD00 : 0x44FF44);
    this._updateStreakDisplay();

    this.time.delayedCall(1200, () => this._afterAnswer());
  }

  _onWrong() {
    this.streak = 0;
    this._updateStreakDisplay();
    this._damagePlayer();
    this._showFeedback('✗ Wrong!', 0xFF4444);

    this.time.delayedCall(1600, () => this._afterAnswer());
  }

  _damagePlayer() {
    if (GameState.activeEffects.shield) {
      GameState.activeEffects.shield = false;
      this._showFeedback('💎 Shield blocked the hit!', 0xAADDFF);
      return;
    }
    const dmg = this.enemyData.damage ?? 1;
    this.playerHP = Math.max(0, this.playerHP - dmg);
    GameState.hp  = this.playerHP;
    this._updateHPBar(this.playerHPBar, this.playerHP);

    // Shake Mimi
    const ox = this.mimiSprite.x;
    this.tweens.add({
      targets: this.mimiSprite, x: { from: ox - 10, to: ox + 10 },
      duration: 60, yoyo: true, repeat: 3,
      onComplete: () => { this.mimiSprite.x = ox; },
    });
  }

  _afterAnswer() {
    if (this.battleOver) return;
    if (this.enemyHP <= 0) { this._endBattle(true);  return; }
    if (this.playerHP <= 0) { this._endBattle(false); return; }
    this._nextQuestion();
  }

  // ── Feedback / streak display ─────────────────────────────────────────────

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

  _endBattle(victory) {
    this.battleOver = true;
    if (this._timerEvent) this._timerEvent.remove();

    this.answerButtons.forEach(btn => btn.bg.removeInteractive());

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    if (victory) {
      const xpGain  = this.enemyData.xp ?? 10;
      const levelUp = GameState.addXP(xpGain);

      // Victory overlay
      this.add.rectangle(W / 2, H / 2, W * 0.78, 230, 0x000033, 0.93)
        .setStrokeStyle(2, 0x4488FF);

      this.add.text(W / 2, H / 2 - 72, '⭐  Victory!  ⭐', {
        ...TEXT_STYLE(38, '#FFD700', true), stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);

      this.add.text(W / 2, H / 2 - 24, `+${xpGain} XP`, TEXT_STYLE(22, '#AAFFCC')).setOrigin(0.5);

      if (levelUp) {
        this.add.text(W / 2, H / 2 + 14, `Level Up! Now Level ${GameState.level} 🎉`, TEXT_STYLE(18, '#FFDD44')).setOrigin(0.5);
      }

      // Streak celebration
      if (this.streak >= 5) {
        this.add.text(W / 2, H / 2 + (levelUp ? 44 : 20), `🔥 Incredible ${this.streak}-streak!`, TEXT_STYLE(16, '#FF9900')).setOrigin(0.5);
      }

      // Boss victory message
      if (this.isBoss) {
        const yPos = H / 2 + (this.streak >= 5 ? 70 : (levelUp ? 50 : 35));
        this.add.text(W / 2, yPos, 'The path to the next region is open!', TEXT_STYLE(14, '#88FFAA')).setOrigin(0.5);
      }

      this._makeContinueButton(W, H, 'Continue →', () => {
        GameState.save();
        
        // Boss victory → go directly to overworld
        if (this.isBoss) {
          GameState.defeatBoss(this.regionId);
          GameState.save();
          this.scene.start('OverworldScene', { bossDefeated: true, regionId: this.regionId });
        } else {
          // Regular enemy → return to exploration
          this.scene.start(this.returnScene, {
            ...this.returnData,
            battleResult: {
              victory:       true,
              enemyInstance: this.enemyInstance,
              isBoss:        this.isBoss,
              leveledUp:     levelUp,
            },
          });
        }
      });

    } else {
      // Defeat — respawn with half HP
      GameState.hp = Math.max(1, Math.ceil(GameState.maxHP / 2));
      GameState.save();

      this.add.rectangle(W / 2, H / 2, W * 0.78, 200, 0x220000, 0.93)
        .setStrokeStyle(2, 0x882222);

      this.add.text(W / 2, H / 2 - 60, '💫  Defeated…', {
        ...TEXT_STYLE(38, '#FF6666', true), stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);

      this.add.text(W / 2, H / 2 - 14, 'Mimi returns to the region entrance.', TEXT_STYLE(16, '#FFAAAA')).setOrigin(0.5);
      this.add.text(W / 2, H / 2 + 14, `HP restored to ${GameState.hp}/${GameState.maxHP}`, TEXT_STYLE(14, '#FFAAAA')).setOrigin(0.5);

      this._makeContinueButton(W, H, 'Try Again →', () => {
        this.scene.start(this.returnScene, {
          ...this.returnData,
          battleResult: { victory: false },
        });
      }, 0x660000, 0xAA4444);
    }
  }

  _makeContinueButton(W, H, label, cb, bgColor = 0x003366, strokeColor = 0x4488FF) {
    const bg = this.add.rectangle(W / 2, H / 2 + 78, 220, 48, bgColor)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, strokeColor);

    const txt = this.add.text(W / 2, H / 2 + 78, label, TEXT_STYLE(22, '#FFFFFF', true))
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setAlpha(0.75));
    bg.on('pointerout',  () => bg.setAlpha(1));
    bg.on('pointerdown', cb);

    // Also allow Enter/Space
    this.input.keyboard.once('keydown-ENTER', cb);
    this.input.keyboard.once('keydown-SPACE', cb);
  }

  // ── Update loop ───────────────────────────────────────────────────────────

  update() {
    if (this.battleOver || this.answering) return;
    this.keys.forEach((key, i) => {
      if (Phaser.Input.Keyboard.JustDown(key)) this._selectAnswer(i);
    });
  }
}
