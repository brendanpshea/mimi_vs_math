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
import { generateQuestion }  from '../math/QuestionBank.js';
import { getChoices }        from '../math/Distractors.js';
import { getExplanation }    from '../math/Explanations.js';
import ITEMS                 from '../data/items.js';

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
    this.isBoss        = data.isBoss ?? false;
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

    // Consume inventory items → may raise GameState.hp before snapshotting
    GameState.resetEffects();
    this._applyInventoryEffects();
    this.playerHP = GameState.hp;
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
    
    // Subtle overlay — keeps backdrop visible without crushing other UI
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.20).setDepth(1);
    
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
    // Dark pill behind the question text only — guarantees contrast without
    // darkening the rest of the battle scene.
    this.questionBg = this.add.rectangle(W / 2, H * 0.43, W - 40, 88, 0x000000, 0.68).setDepth(2);

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
    this.currentQuestion = q;
    this.currentChoices = getChoices(q);

    this.questionText.setText(q.text);

    this.answerButtons.forEach((btn, i) => {
      const choice = this.currentChoices[i];
      btn.lbl.setText(choice.text);
      btn.lbl.setColor('#FFFFFF');
      btn.numLbl.setAlpha(1);
      btn.bg.setFillStyle(BTN_COLORS.idle).setInteractive();
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
      }
      this._refreshEffectsDisplay();
    }

    // Timer
    const duration = (this.enemyData.timerSeconds + (GameState.activeEffects.timerBonus ?? 0)) * 1000;
    this._startTimer(duration);
    this._qStartTime = this.time.now;
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

    GameState.recordAnswer(false, this.time.now - this._qStartTime);
    this.battleWrongAnswers++;

    this.answerButtons.forEach((btn, i) => {
      btn.bg.removeInteractive();
      if (this.currentChoices[i].correct) btn.bg.setFillStyle(BTN_COLORS.reveal);
    });

    this.streak = 0;
    this._showFeedback('⏱ Time\'s up!', 0xFF6633);
    this._damagePlayer();

    this.time.delayedCall(700, () => this._showExplanation(this.currentQuestion));
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
    GameState.recordAnswer(true, this.time.now - this._qStartTime);

    this.streak++;
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

    // Enemy bounce
    this.tweens.add({
      targets: this.enemySprite,
      y: { from: this.enemySprite.y + 12, to: this.enemySprite.y },
      duration: 120, ease: 'Power2',
    });

    const label = isFast ? `⚡ Fast! −${dmg}` : `✓ Correct! −${dmg}`;
    this._showFeedback(label, isFast ? 0xFFDD00 : 0x44FF44);
    this._updateStreakDisplay();

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
    this.battleWrongAnswers++;

    this.streak = 0;
    this._updateStreakDisplay();
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
    if (fx.shield)          tags.push({ icon: '💎', label: 'Shield',              color: '#88CCFF' });
    if (fx.doubleHit)       tags.push({ icon: '🌿', label: '2× Hit',              color: '#AAFFAA' });
    if (fx.hintCharges > 0) tags.push({ icon: '🦴', label: `Hint ×${fx.hintCharges}`, color: '#FFDDAA' });
    if (fx.timerBonus > 0)  tags.push({ icon: '🧶', label: `+${fx.timerBonus}s`,  color: '#DDAAFF' });

    // Anchor badges under Mimi's HP bar (left side)
    const W = this.cameras.main.width;
    tags.forEach((tag, i) => {
      const x = W * 0.04 + i * 76;
      const y = 187;
      this.effectsRow.add(
        this.add.rectangle(x + 34, y, 68, 18, 0x000033, 0.88).setStrokeStyle(1, 0x446688),
      );
      this.effectsRow.add(
        this.add.text(x + 34, y, `${tag.icon} ${tag.label}`, {
          fontSize: '10px', color: tag.color, fontFamily: FONT_UI, fontStyle: 'bold',
        }).setOrigin(0.5),
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
    });
    if (this.timerFill) this.timerFill.setVisible(false);
    if (this.timerText) this.timerText.setVisible(false);
    if (this.feedbackText) this.feedbackText.setAlpha(0);
    if (this.streakText)   this.streakText.setAlpha(0);
    if (this.effectsRow)   this.effectsRow.setVisible(false);
  }

  _endBattle(victory) {
    this.battleOver = true;
    if (this._timerEvent) this._timerEvent.remove();

    this._hideQuestionUI();

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    if (victory) {
      GameState.recordBattle(true, this.battleWrongAnswers === 0, this.streak);

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
            },
          });
        }
      }, undefined, undefined, btnYOffset);

    } else {
      // Defeat — respawn with half HP
      GameState.recordBattle(false, false, this.streak);
      GameState.hp = Math.max(1, Math.ceil(GameState.maxHP / 2));
      GameState.save();

      this.add.rectangle(W / 2, H / 2, W * 0.78, 200, 0x220000, 0.93)
        .setStrokeStyle(2, 0x882222);

      this.add.text(W / 2, H / 2 - 60, '💫  Defeated…', {
        ...TEXT_STYLE(38, '#FF6666', true), fontFamily: FONT_TITLE, stroke: '#000', strokeThickness: 3,
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

  _makeContinueButton(W, H, label, cb, bgColor = 0x003366, strokeColor = 0x4488FF, yOffset = 78) {
    const bg = this.add.rectangle(W / 2, H / 2 + yOffset, 220, 48, bgColor)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, strokeColor);

    const txt = this.add.text(W / 2, H / 2 + yOffset, label, TEXT_STYLE(22, '#FFFFFF', true))
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
