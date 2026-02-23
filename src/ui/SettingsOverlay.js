/**
 * SettingsOverlay.js
 *
 * Reusable in-game settings panel:
 *   • Answer Timer Speed (1× / 1.5× / 2× / 3×)
 *   • Music Volume      (Off / Low / Med / High / Max)
 *   • SFX Volume        (Off / Low / Med / High / Max)
 *
 * Usage from any Phaser scene:
 *   import { openSettings, closeSettings } from '../ui/SettingsOverlay.js';
 *   openSettings(this);               // opens at default depth 200
 *   openSettings(this, 400, cb);      // custom depth + close callback
 */
import GameState from '../config/GameState.js';
import BGM       from '../audio/BGM.js';

const FONT = "'Nunito', Arial, sans-serif";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map linear 0–1 vol to dB.  0.75 → -6 dB (original default). */
export function volToDb(v) {
  return v === 0 ? -80 : -24 + 24 * v;
}

function _makeRow(scene, items, D, opts, cy, btnW, btnH, gap, getValue, onChange) {
  const add  = o => { items.push(o); return o; };
  const W    = scene.cameras.main.width;
  const n    = opts.length;
  const span = n * btnW + (n - 1) * gap;
  const x0   = W / 2 - span / 2 + btnW / 2;
  const btns = [];

  const refresh = () => {
    const cur = getValue();
    btns.forEach(({ bg, lbl, value }) => {
      const on = Math.abs(cur - value) < 0.01;
      bg.setFillStyle(on ? 0x1A4A8A : 0x0E1A3A);
      bg.setStrokeStyle(on ? 2.5 : 1.5, on ? 0x66AAFF : 0x2244AA);
      lbl.setColor(on ? '#FFE066' : '#CCDDEF');
    });
  };

  opts.forEach(({ top, sub, value }, i) => {
    const bx  = x0 + i * (btnW + gap);
    const bg  = add(scene.add.rectangle(bx, cy, btnW, btnH, 0x0E1A3A)
      .setDepth(D + 2).setScrollFactor(0).setStrokeStyle(1.5, 0x2244AA)
      .setInteractive({ useHandCursor: true }));
    const lbl = add(scene.add.text(bx, cy, `${top}\n${sub}`, {
      fontSize: '13px', color: '#CCDDEF',
      fontFamily: FONT, fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setDepth(D + 3).setScrollFactor(0));
    btns.push({ bg, lbl, value });
    bg.on('pointerover', () => { if (Math.abs(getValue() - value) > 0.01) bg.setFillStyle(0x1A2E5A); });
    bg.on('pointerout',  refresh);
    bg.on('pointerdown', () => { onChange(value); refresh(); });
  });

  refresh();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Open the settings overlay on top of the given scene.
 * @param {Phaser.Scene} scene
 * @param {number}       depth    Base render depth (default 200).
 * @param {Function}     onClose  Optional callback when panel is closed.
 */
export function openSettings(scene, depth = 200, onClose = null) {
  if (scene._settingsItems) return;

  const D = depth;
  const W = scene.cameras.main.width;
  const H = scene.cameras.main.height;
  const items = scene._settingsItems = [];
  const add   = o => { items.push(o); return o; };

  // Dim background
  const dim = add(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82)
    .setDepth(D).setScrollFactor(0).setInteractive());
  dim.on('pointerdown', () => closeSettings(scene, onClose));

  // Panel
  add(scene.add.rectangle(W / 2, H / 2, 400, 350, 0x08082A)
    .setDepth(D + 1).setScrollFactor(0).setStrokeStyle(2, 0x4488FF));

  // Title
  add(scene.add.text(W / 2, H / 2 - 158, '\u2699  Settings', {
    fontSize: '24px', color: '#FFD700', fontFamily: FONT, fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));

  // ── Timer Speed ────────────────────────────────────────────────────────────
  add(scene.add.text(W / 2, H / 2 - 118, '\u23f1  Answer Timer Speed', {
    fontSize: '14px', color: '#AACCFF', fontFamily: FONT, fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));

  _makeRow(scene, items, D,
    [
      { top: '1\u00d7',   sub: 'Normal', value: 1.0 },
      { top: '1.5\u00d7', sub: '+50%',   value: 1.5 },
      { top: '2\u00d7',   sub: 'Double', value: 2.0 },
      { top: '3\u00d7',   sub: 'Triple', value: 3.0 },
    ],
    H / 2 - 82, 74, 50, 10,
    () => GameState.timeMult ?? 1.0,
    (v) => { GameState.timeMult = v; GameState.save(); },
  );

  const dg1 = add(scene.add.graphics().setDepth(D + 2).setScrollFactor(0));
  dg1.lineStyle(1, 0x334466, 0.7);
  dg1.lineBetween(W / 2 - 178, H / 2 - 44, W / 2 + 178, H / 2 - 44);

  // ── Music Volume ───────────────────────────────────────────────────────────
  add(scene.add.text(W / 2, H / 2 - 30, '\u266a  Music Volume', {
    fontSize: '14px', color: '#AACCFF', fontFamily: FONT, fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));

  const VOL_OPTS = [
    { top: 'Off',  sub: '0%',   value: 0    },
    { top: 'Low',  sub: '25%',  value: 0.25 },
    { top: 'Med',  sub: '50%',  value: 0.5  },
    { top: 'High', sub: '75%',  value: 0.75 },
    { top: 'Max',  sub: '100%', value: 1.0  },
  ];

  _makeRow(scene, items, D, VOL_OPTS,
    H / 2 + 10, 62, 50, 7,
    () => GameState.musicVol ?? 0.75,
    (v) => {
      GameState.musicVol = v;
      GameState.save();
      BGM.setVolume(volToDb(v));
    },
  );

  const dg2 = add(scene.add.graphics().setDepth(D + 2).setScrollFactor(0));
  dg2.lineStyle(1, 0x334466, 0.7);
  dg2.lineBetween(W / 2 - 178, H / 2 + 50, W / 2 + 178, H / 2 + 50);

  // ── SFX Volume ─────────────────────────────────────────────────────────────
  add(scene.add.text(W / 2, H / 2 + 63, '\u266b  SFX Volume', {
    fontSize: '14px', color: '#AACCFF', fontFamily: FONT, fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));

  _makeRow(scene, items, D, VOL_OPTS,
    H / 2 + 103, 62, 50, 7,
    () => GameState.sfxVol ?? 1.0,
    (v) => {
      GameState.sfxVol = v;
      GameState.save();
      if (scene?.sound) scene.sound.setVolume(v);
    },
  );

  // ── Close button ───────────────────────────────────────────────────────────
  const cb = add(scene.add.rectangle(W / 2, H / 2 + 152, 160, 34, 0x2A0A0A)
    .setDepth(D + 2).setScrollFactor(0).setStrokeStyle(1.5, 0xCC4444)
    .setInteractive({ useHandCursor: true }));
  const ct = add(scene.add.text(W / 2, H / 2 + 152, '\u2715  Close', {
    fontSize: '14px', color: '#FF8888', fontFamily: FONT, fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(D + 3).setScrollFactor(0));
  cb.on('pointerover', () => { cb.setFillStyle(0x401515); ct.setColor('#FFAAAA'); });
  cb.on('pointerout',  () => { cb.setFillStyle(0x2A0A0A); ct.setColor('#FF8888'); });
  cb.on('pointerdown', () => closeSettings(scene, onClose));

  // ESC closes — use once() so it auto-removes and never calls destroy
  scene._settingsEscKey = scene.input.keyboard.once('keydown-ESC',
    () => closeSettings(scene, onClose));
}

/**
 * Close and destroy the settings overlay created by openSettings().
 */
export function closeSettings(scene, onClose = null) {
  if (!scene._settingsItems) return;
  scene._settingsItems.forEach(o => o.destroy());
  scene._settingsItems = null;
  scene._settingsEscKey = null; // once() auto-removes; never call .destroy()
  if (typeof onClose === 'function') onClose();
}
