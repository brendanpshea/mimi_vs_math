/**
 * VirtualDPad – on-screen directional pad for touch / mouse control.
 *
 * Creates a semi-transparent 4-button cross in the bottom-left corner of the
 * screen (scrollFactor 0) and exposes { up, down, left, right } boolean state
 * readable each frame — the same interface as Phaser cursor keys.
 *
 * Usage:
 *   const dpad = new VirtualDPad(scene);
 *   // in Mimi.update():  if (dpad.left) { ... }
 *
 * Touch & mouse both work.  Each button highlights on press and resets on
 * pointerup OR pointerout (prevents stuck-direction when a finger slides off).
 */
import * as Phaser from 'phaser';

// ── Layout constants ──────────────────────────────────────────────────────────
const DEPTH  = 48;   // above world, below dialog / HUD overlays
const OFFSET = 46;   // px from d-pad centre to each arrow centre
const BSIZE  = 50;   // invisible hit-area square side (px) — generous for thumbs
const FONT   = "'Nunito', Arial, sans-serif";

export default class VirtualDPad {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this._scene = scene;
    this._state = { up: false, down: false, left: false, right: false };
    this._objs  = [];

    const H  = scene.cameras.main.height;
    const CX = 82;
    const CY = H - 82;

    this._build(CX, CY);
  }

  _build(CX, CY) {
    const scene = this._scene;
    const push  = o => { this._objs.push(o); return o; };

    // ── Outer ring / base ─────────────────────────────────────────────────
    const base = push(scene.add.graphics().setScrollFactor(0).setDepth(DEPTH));
    base.fillStyle(0x000000, 0.30);
    base.fillCircle(CX, CY, 72);
    base.lineStyle(1.5, 0xFFFFFF, 0.18);
    base.strokeCircle(CX, CY, 72);

    // Centre nub
    push(
      scene.add.arc(CX, CY, 7, 0, 360, false, 0xFFFFFF, 0.20)
        .setScrollFactor(0).setDepth(DEPTH + 1),
    );

    // ── Four directional buttons ──────────────────────────────────────────
    const dirs = [
      { key: 'up',    label: '▲', dx:  0,      dy: -OFFSET },
      { key: 'down',  label: '▼', dx:  0,      dy:  OFFSET },
      { key: 'left',  label: '◀', dx: -OFFSET, dy:  0      },
      { key: 'right', label: '▶', dx:  OFFSET, dy:  0      },
    ];

    for (const { key, label, dx, dy } of dirs) {
      const bx = CX + dx;
      const by = CY + dy;

      // Filled circle indicator (visual feedback on press)
      const circle = push(
        scene.add.arc(bx, by, 20, 0, 360, false, 0x000000, 0.45)
          .setStrokeStyle(1.5, 0xFFFFFF, 0.35)
          .setScrollFactor(0).setDepth(DEPTH + 1),
      );

      // Arrow text
      const txt = push(
        scene.add.text(bx, by, label, {
          fontSize: '16px', color: '#FFFFFF', fontFamily: FONT, fontStyle: 'bold',
        }).setAlpha(0.70).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3),
      );

      // Invisible square hit-area (larger than the circle for fat-finger friendliness)
      const btn = push(
        scene.add.rectangle(bx, by, BSIZE, BSIZE, 0x000000, 0)
          .setScrollFactor(0).setDepth(DEPTH + 4)
          .setInteractive({ useHandCursor: false }),
      );

      const press = () => {
        this._state[key] = true;
        circle.setFillStyle(0x3399FF, 0.70);
        txt.setAlpha(1.0);
      };
      const release = () => {
        this._state[key] = false;
        circle.setFillStyle(0x000000, 0.45);
        txt.setAlpha(0.70);
      };

      btn.on('pointerdown', press);
      btn.on('pointerup',   release);
      btn.on('pointerout',  release);
    }
  }

  // ── Public state getters (mirror Phaser key .isDown) ─────────────────────
  get up()    { return this._state.up;    }
  get down()  { return this._state.down;  }
  get left()  { return this._state.left;  }
  get right() { return this._state.right; }

  /** Show or hide the entire control without destroying it. */
  setVisible(visible) {
    this._objs.forEach(o => o.setVisible(visible));
  }

  /** Release all pressed directions (call when freezing Mimi). */
  clearState() {
    this._state.up = this._state.down = this._state.left = this._state.right = false;
  }

  destroy() {
    this._objs.forEach(o => o.destroy());
    this._objs = [];
  }
}
