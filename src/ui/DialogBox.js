/**
 * DialogBox — a simple text-box overlay for NPC dialogue and hints.
 *
 * Usage:
 *   const dlg = new DialogBox(scene);
 *   dlg.show('Hello, Mimi! Good luck!', () => console.log('closed'));
 */
import * as Phaser from 'phaser';

export default class DialogBox {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene   = scene;
    this._active = false;
    this._typing = false;
    this._typeEvent   = null;
    this._fullText    = '';
    this._displayText = '';

    const W = scene.cameras.main.width;
    const H = scene.cameras.main.height;

    // Background panel — interactive so tapping it advances/closes the dialog
    this._panel = scene.add.rectangle(W / 2, H - 90, W - 40, 120, 0x000022, 0.92)
      .setScrollFactor(0).setDepth(80).setVisible(false)
      .setInteractive();
    this._panel.on('pointerdown', () => this._handleAdvance());

    // Border
    this._border = scene.add.rectangle(W / 2, H - 90, W - 36, 124, 0x4488FF, 0)
      .setScrollFactor(0).setDepth(80).setStrokeStyle(2, 0x4488FF).setVisible(false);

    // Portrait frame (sits in the left side of the panel)
    this._portraitBg = scene.add.rectangle(52, H - 90, 52, 52, 0x0A0A33)
      .setScrollFactor(0).setDepth(81).setStrokeStyle(2, 0x6699FF).setVisible(false);
    // Portrait image (texture set dynamically in show())
    this._portrait = scene.add.image(52, H - 90, '__DEFAULT')
      .setDisplaySize(44, 44)
      .setScrollFactor(0).setDepth(82).setVisible(false);

    // Speaker name
    this._speaker = scene.add.text(30, H - 148, '', {
      fontSize: '15px', color: '#FFDD88', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(81).setVisible(false);

    // Body text
    this._body = scene.add.text(30, H - 130, '', {
      fontSize: '15px', color: '#FFFFFF', fontFamily: "'Nunito', Arial, sans-serif",
      wordWrap: { width: W - 80 },
    }).setScrollFactor(0).setDepth(81).setVisible(false);

    this._baseBodyW = W - 80;
    this._portBodyW = W - 132;

    // Continue prompt — label adapts to input method available
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this._prompt = scene.add.text(W - 30, H - 42, hasTouch ? '▶ Tap to continue' : '▶ Press SPACE', {
      fontSize: '14px', color: '#88AAFF', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(81).setVisible(false);

    // Blink the prompt
    scene.tweens.add({
      targets:  this._prompt,
      alpha:    { from: 1, to: 0.2 },
      duration: 700,
      yoyo:     true,
      repeat:   -1,
    });

    // ── Choice buttons (pre-created, shown only in showChoice mode) ────
    // Up to 4 buttons: [0]=top-left, [1]=top-right, [2]=bot-left, [3]=bot-right
    this._choiceBgs  = [];
    this._choiceTxts = [];
    for (let i = 0; i < 4; i++) {
      const bg = scene.add.rectangle(W / 2, H - 52, 200, 24, 0x0A1A44)
        .setScrollFactor(0).setDepth(83)
        .setStrokeStyle(1, 0x4488FF).setVisible(false)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerover',  () => bg.setFillStyle(0x1A3A77));
      bg.on('pointerout',   () => bg.setFillStyle(0x0A1A44));
      bg.on('pointerdown',  () => {
        if (!this._choiceCallback) return;
        const cb = this._choiceCallback;
        this._choiceCallback = null;
        for (let j = 0; j < 4; j++) {
          this._choiceBgs[j].setVisible(false);
          this._choiceTxts[j].setVisible(false);
        }
        this.hide();
        cb(i);          // i captured at button-create time
      });
      const txt = scene.add.text(W / 2, H - 52, '', {
        fontSize: '14px', color: '#FFFFFF',
        fontFamily: "'Nunito', Arial, sans-serif",
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(84).setVisible(false);
      this._choiceBgs.push(bg);
      this._choiceTxts.push(txt);
    }
    this._choiceCallback = null;

    // Space / Enter to close
    this._spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  /**
   * @param {string}   text
   * @param {Function} [onClose]
   * @param {string}   [speaker]    - optional speaker name label
   * @param {string}   [portraitKey] - optional Phaser texture key for portrait image
   */
  show(text, onClose, speaker = '', portraitKey = '') {
    this._active  = true;
    this._onClose = onClose;

    // Portrait
    const hasPortrait = portraitKey &&
      this.scene.textures.exists(portraitKey) &&
      portraitKey !== '__DEFAULT';
    if (hasPortrait) {
      this._portrait.setTexture(portraitKey).setVisible(true);
      this._portraitBg.setVisible(true);
      this._speaker.setX(86);
      this._body.setX(86).setWordWrapWidth(this._portBodyW);
    } else {
      this._portrait.setVisible(false);
      this._portraitBg.setVisible(false);
      this._speaker.setX(30);
      this._body.setX(30).setWordWrapWidth(this._baseBodyW);
    }

    this._panel.setVisible(true);
    this._border.setVisible(true);
    this._speaker.setVisible(true).setText(speaker);
    this._body.setVisible(true).setText('');
    this._prompt.setVisible(false);  // hidden while typing

    // Cancel any in-progress typewriter from a previous show()
    if (this._typeEvent) {
      this._typeEvent.remove(false);
      this._typeEvent = null;
    }

    // Typewriter: reveal one character every 28 ms
    this._fullText    = text;
    this._displayText = '';
    this._typing      = true;

    this._typeEvent = this.scene.time.addEvent({
      delay:    28,
      repeat:   text.length - 1,
      callback: () => {
        this._displayText += this._fullText[this._displayText.length];
        this._body.setText(this._displayText);
        if (this._displayText.length >= this._fullText.length) {
          this._finishTyping();
        }
      },
    });
  }

  /** Complete the typewriter immediately and show the continue prompt. */
  _finishTyping() {
    if (this._typeEvent) { this._typeEvent.remove(false); this._typeEvent = null; }
    this._displayText = this._fullText;
    this._body.setText(this._fullText);
    this._typing = false;
    this._prompt.setVisible(true);
  }

  /**
   * Show the dialog panel, then after text finishes typing present labelled
   * buttons the player can click/tap to choose.
   *
   * @param {string}   text         - body text (supports \n)
   * @param {string[]} labels       - 2 or 4 button labels
   * @param {Function} onChoice     - called with button index (0-based)
   * @param {string}   [speaker]
   * @param {string}   [portraitKey]
   */
  showChoice(text, labels, onChoice, speaker = '', portraitKey = '') {
    const W = this.scene.cameras.main.width;
    const H = this.scene.cameras.main.height;
    const count = Math.min(labels.length, 4);

    // Position buttons
    let positions;
    if (count <= 2) {
      positions = [
        [W * 0.32, H - 52],
        [W * 0.68, H - 52],
        [W * 0.32, H - 52],   // unused
        [W * 0.68, H - 52],
      ];
    } else {
      positions = [
        [W * 0.28, H - 68],
        [W * 0.72, H - 68],
        [W * 0.28, H - 46],
        [W * 0.72, H - 46],
      ];
    }
    for (let i = 0; i < 4; i++) {
      this._choiceBgs[i].setPosition(positions[i][0], positions[i][1]);
      this._choiceTxts[i].setPosition(positions[i][0], positions[i][1]);
    }

    this._choiceCallback = onChoice;

    // Show the dialog (null onClose so hide() won't fire a callback)
    this.show(text, null, speaker, portraitKey);

    // Once typing finishes, swap prompt for choice buttons
    const poll = this.scene.time.addEvent({
      delay: 30, loop: true,
      callback: () => {
        if (!this._typing) {
          poll.remove();
          this._prompt.setVisible(false);
          for (let i = 0; i < 4; i++) {
            const vis = i < count;
            this._choiceBgs[i].setVisible(vis).setFillStyle(0x0A1A44);
            this._choiceTxts[i].setVisible(vis).setText(vis ? labels[i] : '');
          }
        }
      },
    });
  }

  hide() {
    if (this._typeEvent) { this._typeEvent.remove(false); this._typeEvent = null; }
    this._typing = false;
    this._active = false;
    this._choiceCallback = null;
    for (let i = 0; i < 4; i++) {
      this._choiceBgs[i].setVisible(false);
      this._choiceTxts[i].setVisible(false);
    }
    this._panel.setVisible(false);
    this._border.setVisible(false);
    this._portrait.setVisible(false);
    this._portraitBg.setVisible(false);
    this._speaker.setVisible(false);
    this._body.setVisible(false);
    this._prompt.setVisible(false);
    if (this._onClose) this._onClose();
  }

  /** Shared advance handler — used by keyboard (update) and panel tap (pointerdown). */
  _handleAdvance() {
    if (!this._active) return;
    if (this._choiceCallback) return;   // waiting for a choice tap — ignore
    if (this._typing) {
      this._finishTyping();   // first input: skip typewriter
    } else {
      this.hide();            // second input: close
    }
  }

  update() {
    if (!this._active) return;
    if (this._choiceCallback) return;
    if (
      Phaser.Input.Keyboard.JustDown(this._spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this._enterKey)
    ) {
      this._handleAdvance();
    }
  }

  get isOpen() { return this._active; }
}
