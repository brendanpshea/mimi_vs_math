/**
 * OverworldScene — region-selection map.
 *
 * Shows five region nodes arranged on a stylised map.
 * Defeated-boss regions are highlighted; locked regions are greyed out.
 */
import * as Phaser from 'phaser';
import GameState from '../config/GameState.js';
import REGIONS   from '../data/regions.js';

const NODE_RADIUS = 40;
const PATH_COLOR  = 0x8B6A3A;

// Per-region terrain tint painted behind each node
const TERRAIN_COLORS = [
  0x6DB83A,   // R0 – grassland
  0x4A9820,   // R1 – meadow
  0xD4952A,   // R2 – desert
  0x88C8E0,   // R3 – frost
  0x2A1850,   // R4 – shadow
];

// Fixed positions for each region node on the 800×600 canvas
const NODE_POSITIONS = [
  { x: 180, y: 440 },  // 0 Sunny Village
  { x: 340, y: 310 },  // 1 Meadow Maze
  { x: 520, y: 230 },  // 2 Desert Dunes
  { x: 640, y: 360 },  // 3 Frostbite Cavern
  { x: 620, y: 500 },  // 4 Shadow Castle
];

export default class OverworldScene extends Phaser.Scene {
  constructor() { super({ key: 'OverworldScene' }); }

  create(data) {
    if (data?.bossDefeated) GameState.defeatBoss(data.regionId);

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this._drawBackground(W, H);
    this._drawDecor(W, H);
    this._drawPaths();
    this._drawBorder(W, H);
    this._drawTitle(W);
    this._drawCompass(W, H);

    REGIONS.forEach((region, i) => this._drawNode(region, NODE_POSITIONS[i]));

    this._drawPlayerInfo(W, H);

    // ESC: close popup first, then return to title
    this.input.keyboard.on('keydown-ESC', () => {
      if (this._popup) { this._closePopup(); }
      else             { this.scene.start('TitleScene'); }
    });

    this.add.text(W / 2, H - 8, 'Click a region to enter  ·  Esc → Title', {
      fontSize: '11px', color: '#8A7050', fontFamily: 'Arial',
    }).setOrigin(0.5, 1);
  }

  // ── Background: sky gradient + parchment land + water + terrain patches ──
  _drawBackground(W, H) {
    const gfx = this.add.graphics();

    // Sky gradient (top 110 px, dark-to-medium blue)
    const skyRows = [0x1A3A6A, 0x254A80, 0x305898, 0x3B65A8, 0x4A72B0];
    const sliceH  = 110 / skyRows.length;
    skyRows.forEach((c, i) => {
      gfx.fillStyle(c, 1);
      gfx.fillRect(0, i * sliceH, W, sliceH + 1);
    });

    // Clouds in sky
    [[160, 52, 88, 26], [195, 44, 60, 20], [580, 62, 78, 24], [614, 55, 54, 19]].forEach(
      ([cx, cy, rw, rh]) => { gfx.fillStyle(0xFFFFFF, 0.22); gfx.fillEllipse(cx, cy, rw, rh); }
    );

    // Parchment land below sky
    gfx.fillStyle(0xC9A87A, 1);
    gfx.fillRect(0, 110, W, H - 110);

    // Horizon line
    gfx.lineStyle(2, 0x9A7A4A, 0.55);
    gfx.lineBetween(0, 110, W, 110);

    // Water area — lower left
    gfx.fillStyle(0x3A7ABE, 0.50); gfx.fillEllipse(62, 505, 170, 125);
    gfx.fillStyle(0x4A8ACE, 0.28); gfx.fillEllipse(42, 515, 100, 72);
    gfx.lineStyle(1, 0xAADDFF, 0.35);
    for (let i = 0; i < 4; i++) gfx.lineBetween(18, 492 + i * 10, 108, 492 + i * 10);

    // Terrain patches per region
    NODE_POSITIONS.forEach((pos, i) => {
      gfx.fillStyle(TERRAIN_COLORS[i], 0.45);
      gfx.fillEllipse(pos.x, pos.y + 18, 205, 150);
    });
  }

  // ── Decorative features: mountains, trees, crystals, dark towers ─────────
  _drawDecor(W, H) {
    const gfx = this.add.graphics();

    // Mountain range between R1–R2 and R2–R3
    [
      { x: 402, y: 268, w: 52, h: 56 }, { x: 447, y: 275, w: 46, h: 50 },
      { x: 484, y: 270, w: 42, h: 54 }, { x: 572, y: 293, w: 38, h: 46 },
      { x: 606, y: 286, w: 36, h: 50 },
    ].forEach(({ x, y, w, h }) => {
      gfx.fillStyle(0x7A6A4A, 0.40);
      gfx.fillTriangle(x - w / 2, y + h / 2, x, y - h / 2, x + w / 2, y + h / 2);
      gfx.fillStyle(0xD4C0A0, 0.45);
      gfx.fillTriangle(x - w * 0.1, y - h / 2, x + w / 2, y + h / 2, x, y - h * 0.28);
      gfx.fillStyle(0xFFFFFF, 0.65);
      gfx.fillTriangle(x - w * 0.17, y - h * 0.24, x, y - h / 2, x + w * 0.17, y - h * 0.24);
    });

    // Forest trees near R0 and R1
    [
      [102, 412], [122, 432], [142, 407], [97, 452], [117, 468], [137, 448],
      [267, 318], [252, 338], [274, 352],
    ].forEach(([tx, ty]) => {
      gfx.fillStyle(0x7A5A2A, 1);   gfx.fillRect(tx - 2, ty, 4, 12);
      gfx.fillStyle(0x2A8A2A, 0.8); gfx.fillTriangle(tx - 10, ty, tx, ty - 17, tx + 10, ty);
      gfx.fillStyle(0x38AA38, 0.7); gfx.fillTriangle(tx - 8, ty - 10, tx, ty - 25, tx + 8, ty - 10);
    });

    // Desert dune accent near R2
    gfx.lineStyle(2, 0xB88820, 0.40);
    for (let i = 0; i < 3; i++) gfx.lineBetween(472 + i * 8, 222 + i * 10, 542 + i * 8, 242 + i * 10);

    // Ice crystals near R3
    [[692, 326], [704, 341], [687, 352]].forEach(([cx, cy]) => {
      gfx.lineStyle(2, 0xAADDFF, 0.70);
      gfx.lineBetween(cx, cy - 10, cx, cy + 10);
      gfx.lineBetween(cx - 6, cy - 4, cx + 6, cy + 4);
      gfx.lineBetween(cx + 6, cy - 4, cx - 6, cy + 4);
    });

    // Dark towers near R4
    [[700, 522], [720, 512]].forEach(([tx, ty]) => {
      gfx.fillStyle(0x1A0A2A, 0.80); gfx.fillRect(tx - 6, ty - 20, 12, 22);
      gfx.fillTriangle(tx - 7, ty - 20, tx, ty - 34, tx + 7, ty - 20);
      gfx.fillStyle(0xFF6600, 0.70); gfx.fillRect(tx - 2, ty - 16, 4, 4);
    });
  }

  // ── Ornate map border ─────────────────────────────────────────────────────
  _drawBorder(W, H) {
    const gfx = this.add.graphics();
    gfx.lineStyle(6, 0x6B4A1A, 1);    gfx.strokeRect(4,  4,  W - 8,  H - 8);
    gfx.lineStyle(2, 0xCC9944, 0.7);  gfx.strokeRect(12, 12, W - 24, H - 24);
    // Corner medallions
    [[16, 16], [W - 16, 16], [16, H - 16], [W - 16, H - 16]].forEach(([cx, cy]) => {
      gfx.fillStyle(0xCC9944, 0.8); gfx.fillCircle(cx, cy, 6);
    });
  }

  // ── Scroll‑style title banner ─────────────────────────────────────────────
  _drawTitle(W) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0xF5E8C0, 0.92);  gfx.fillRoundedRect(W / 2 - 140, 18, 280, 44, 8);
    gfx.lineStyle(2, 0x8B6A3A, 0.9); gfx.strokeRoundedRect(W / 2 - 140, 18, 280, 44, 8);
    // Scroll‑curl ends
    gfx.fillStyle(0xD4C090, 0.45);
    gfx.fillRect(W / 2 - 140, 18, 18, 44);
    gfx.fillRect(W / 2 + 122, 18, 18, 44);
    this.add.text(W / 2, 40, '🗺  World Map', {
      fontSize: '22px', color: '#4A2A0A', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  // ── Compass rose (bottom left) ────────────────────────────────────────────
  _drawCompass(W, H) {
    const cx = 50, cy = H - 55;
    const gfx = this.add.graphics();
    gfx.fillStyle(0xF5E8C0, 0.78);  gfx.fillCircle(cx, cy, 34);
    gfx.lineStyle(1.5, 0x8B6A3A, 0.8); gfx.strokeCircle(cx, cy, 34);
    gfx.lineStyle(1, 0x6B4A1A, 0.7);
    gfx.lineBetween(cx, cy - 28, cx, cy + 28);
    gfx.lineBetween(cx - 28, cy, cx + 28, cy);
    // North arrow — red; South — grey
    gfx.fillStyle(0xCC2222, 0.9); gfx.fillTriangle(cx, cy - 28, cx - 6, cy, cx + 6, cy);
    gfx.fillStyle(0xBBBBBB, 0.9); gfx.fillTriangle(cx, cy + 28, cx - 6, cy, cx + 6, cy);
    this.add.text(cx, cy - 36, 'N', { fontSize: '11px', color: '#4A2A0A', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5, 1);
  }

  _drawPaths() {
    const gfx = this.add.graphics();
    for (let i = 0; i < NODE_POSITIONS.length - 1; i++) {
      const a = NODE_POSITIONS[i];
      const b = NODE_POSITIONS[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      // Outer road
      gfx.lineStyle(8, PATH_COLOR, 0.80); gfx.lineBetween(a.x, a.y, b.x, b.y);
      // Inner lighter road
      gfx.lineStyle(4, 0xC8A86A, 0.60);  gfx.lineBetween(a.x, a.y, b.x, b.y);
      // Dashed centre line
      const steps = Math.floor(len / 18);
      gfx.lineStyle(1.5, 0xF0D890, 0.50);
      for (let s = 0; s < steps; s++) {
        if (s % 2 === 0) {
          const t0 = s / steps, t1 = (s + 0.7) / steps;
          gfx.lineBetween(a.x + dx * t0, a.y + dy * t0, a.x + dx * t1, a.y + dy * t1);
        }
      }
    }
  }

  _drawNode(region, pos) {
    const unlocked  = this._isUnlocked(region.id);
    const completed = GameState.hasDefeatedBoss(region.id);
    const isCurrent = GameState.currentRegion === region.id;

    const ringColor = unlocked
      ? (completed ? 0x44CC44 : (isCurrent ? 0xFFDD44 : 0x4488FF))
      : 0x444455;

    // Drop shadow
    if (unlocked) this.add.circle(pos.x + 4, pos.y + 4, NODE_RADIUS + 3, 0x000000, 0.30);

    const circle = this.add.circle(pos.x, pos.y, NODE_RADIUS,
      unlocked ? 0x1A2A44 : 0x1E1E2E, unlocked ? 1 : 0.55)
      .setStrokeStyle(4, ringColor, unlocked ? 1 : 0.4);

    // Boss sprite or padlock
    if (unlocked) {
      this.add.image(pos.x, pos.y - 8, this._getBossKey(region.id))
        .setDisplaySize(44, 44).setAlpha(0.95);
    } else {
      this.add.text(pos.x, pos.y - 8, '🔒', { fontSize: '22px' }).setOrigin(0.5);
    }

    // Badge
    this.add.circle(pos.x + NODE_RADIUS - 5, pos.y - NODE_RADIUS + 5, 13, 0x110A00)
      .setStrokeStyle(1.5, 0xFFAA22);
    this.add.text(pos.x + NODE_RADIUS - 5, pos.y - NODE_RADIUS + 5, String(region.id + 1), {
      fontSize: '13px', color: '#FFCC44', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Completed star
    if (completed) {
      this.add.text(pos.x, pos.y + NODE_RADIUS - 7, '⭐', { fontSize: '13px' }).setOrigin(0.5, 1);
    }

    // Name + subtitle labels
    this.add.text(pos.x, pos.y + NODE_RADIUS + 8, region.name, {
      fontSize: '12px', color: unlocked ? '#FFE8A0' : '#777799',
      fontFamily: 'Arial', fontStyle: unlocked ? 'bold' : 'normal',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0);
    this.add.text(pos.x, pos.y + NODE_RADIUS + 24, region.subtitle.split('·')[0].trim(), {
      fontSize: '10px', color: unlocked ? '#AACCEE' : '#555577',
      fontFamily: 'Arial', stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5, 0);

    // Interaction
    if (unlocked) {
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerover', () => circle.setStrokeStyle(5, 0xFFFFFF));
      circle.on('pointerout',  () => circle.setStrokeStyle(4, ringColor));
      circle.on('pointerdown', () => this._showNodeInfo(region));
      if (isCurrent) {
        this.tweens.add({ targets: circle, scaleX: 1.08, scaleY: 1.08, duration: 700, yoyo: true, repeat: -1 });
      }
    }
  }

  _drawPlayerInfo(W, H) {
    const { hp, maxHP, level, xp } = GameState;
    const px = W - 98;
    this.add.rectangle(px, 78, 165, 90, 0x000000, 0.62).setStrokeStyle(1.5, 0x886644);
    this.add.text(px, 44,  '🐱  Mimi',          { fontSize: '15px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(px, 63,  `HP: ${hp}/${maxHP}`,   { fontSize: '13px', color: '#FF8899', fontFamily: 'Arial' }).setOrigin(0.5);
    this.add.text(px, 81,  `Level: ${level}`,       { fontSize: '13px', color: '#AADDFF', fontFamily: 'Arial' }).setOrigin(0.5);
    this.add.text(px, 99,  `XP: ${xp}/${level*50}`, { fontSize: '13px', color: '#AADDFF', fontFamily: 'Arial' }).setOrigin(0.5);
  }

  // ── Node info popup ────────────────────────────────────────────────────────
  _showNodeInfo(region) {
    this._closePopup();
    const W = 800, H = 600;
    const items = (this._popup = []);
    const mk = obj => { items.push(obj); return obj; };

    // Semi-transparent overlay (blocks clicks below)
    const ov = mk(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65)
      .setDepth(100).setInteractive());
    ov.on('pointerdown', () => this._closePopup());

    // Panel
    mk(this.add.rectangle(W / 2, H / 2 + 10, 495, 368, 0x0C0C24)
      .setDepth(101).setStrokeStyle(3, 0xFFCC44));

    // Region name
    mk(this.add.text(W / 2, 160, region.name, {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#FFD700', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(102));

    // Subtitle (grades + topic)
    mk(this.add.text(W / 2, 199, region.subtitle, {
      fontSize: '14px', fontFamily: 'Arial', color: '#88CCFF',
    }).setOrigin(0.5).setDepth(102));

    // Divider
    const dg = mk(this.add.graphics().setDepth(101));
    dg.lineStyle(1, 0x445588, 0.8); dg.lineBetween(175, 217, 625, 217);

    // Description
    mk(this.add.text(W / 2, 228, region.description, {
      fontSize: '13px', fontFamily: 'Arial', color: '#CCDDEE',
      align: 'center', wordWrap: { width: 445 }, lineSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(102));

    // Boss line
    const done = GameState.hasDefeatedBoss(region.id);
    mk(this.add.text(W / 2, 358, `⚔️  Boss: ${region.bossName}${done ? '  ✅ Defeated' : ''}`, {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
      color: done ? '#88FF88' : '#FFAA44', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(102));

    // Enter Region button
    const eb = mk(this.add.rectangle(308, 418, 204, 46, 0x0A2A0A)
      .setDepth(102).setStrokeStyle(2, 0x44CC44).setInteractive({ useHandCursor: true }));
    const et = mk(this.add.text(308, 418, '▶️  Enter Region', {
      fontSize: '16px', color: '#88FF88', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(103));
    eb.on('pointerover',  () => { eb.setFillStyle(0x154015); et.setColor('#AAFFAA'); });
    eb.on('pointerout',   () => { eb.setFillStyle(0x0A2A0A); et.setColor('#88FF88'); });
    eb.on('pointerdown',  () => {
      GameState.currentRegion = region.id;
      GameState.save();
      this.scene.start('ExploreScene', { regionId: region.id });
    });

    // Not Yet button
    const cb = mk(this.add.rectangle(512, 418, 158, 46, 0x2A0A0A)
      .setDepth(102).setStrokeStyle(2, 0xCC4444).setInteractive({ useHandCursor: true }));
    const ct = mk(this.add.text(512, 418, '✕  Not Yet', {
      fontSize: '16px', color: '#FF8888', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(103));
    cb.on('pointerover',  () => { cb.setFillStyle(0x401515); ct.setColor('#FFAAAA'); });
    cb.on('pointerout',   () => { cb.setFillStyle(0x2A0A0A); ct.setColor('#FF8888'); });
    cb.on('pointerdown',  () => this._closePopup());
  }

  _closePopup() {
    if (!this._popup) return;
    this._popup.forEach(o => o.destroy());
    this._popup = null;
  }

  _isUnlocked(regionId) {
    if (regionId === 0) return true;
    return GameState.hasDefeatedBoss(regionId - 1);
  }

  _getBossKey(regionId) {
    const bossKeys = [
      'subtraction_witch', 'count_multiplico', 'the_diviner',
      'glacius', 'professor_negativus',
    ];
    return bossKeys[regionId] ?? 'mimi';
  }
}
