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
const PATH_COLOR  = 0x886644;

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
    // Handle battle result passed back (e.g. boss defeated)
    if (data?.bossDefeated !== undefined) {
      if (data.bossDefeated) GameState.defeatBoss(data.regionId);
    }

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Background — parchment-style
    this.add.rectangle(W / 2, H / 2, W, H, 0x8B7A5A);
    // Texture overlay
    this._drawMapTexture(W, H);

    // Title
    this.add.text(W / 2, 22, '🗺  World Map', {
      fontSize: '22px', color: '#FFE8A0', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Draw paths between nodes
    this._drawPaths();

    // Draw region nodes
    REGIONS.forEach((region, i) => {
      this._drawNode(region, NODE_POSITIONS[i]);
    });

    // Player info strip
    this._drawPlayerInfo(W, H);

    // ESC → title
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('TitleScene'));

    // Hint
    this.add.text(W / 2, H - 10, 'Click a region to enter  ·  Esc → Title', {
      fontSize: '11px', color: '#6A5A3A', fontFamily: 'Arial',
    }).setOrigin(0.5, 1);
  }

  _drawMapTexture(W, H) {
    // Simple parchment lines
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x7A6A4A, 0.3);
    for (let y = 0; y < H; y += 20) gfx.lineBetween(0, y, W, y);
    for (let x = 0; x < W; x += 20) gfx.lineBetween(x, 0, x, H);
    // Border
    gfx.lineStyle(4, 0x5A4A2A, 0.8);
    gfx.strokeRect(4, 4, W - 8, H - 8);
  }

  _drawPaths() {
    const gfx = this.add.graphics();
    gfx.lineStyle(6, PATH_COLOR, 0.6);
    for (let i = 0; i < NODE_POSITIONS.length - 1; i++) {
      const a = NODE_POSITIONS[i];
      const b = NODE_POSITIONS[i + 1];
      gfx.lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  _drawNode(region, pos) {
    const unlocked = this._isUnlocked(region.id);
    const completed = GameState.hasDefeatedBoss(region.id);
    const isCurrent = GameState.currentRegion === region.id;

    // Node circle
    const color = unlocked
      ? (completed ? 0x44CC44 : (isCurrent ? 0xFFDD44 : 0x4488FF))
      : 0x555566;
    const alpha = unlocked ? 1 : 0.5;

    const circle = this.add.circle(pos.x, pos.y, NODE_RADIUS, color, alpha)
      .setStrokeStyle(3, unlocked ? 0xFFFFFF : 0x333333);

    // Icon / sprite inside node
    if (unlocked) {
      const boss = this._getBossKey(region.id);
      const img  = this.add.image(pos.x, pos.y - 10, boss)
        .setDisplaySize(44, 44).setAlpha(0.9);
      if (!unlocked) img.setTint(0x444444);
    } else {
      // Padlock text
      this.add.text(pos.x, pos.y - 8, '🔒', { fontSize: '22px' }).setOrigin(0.5);
    }

    // Region number badge
    this.add.circle(pos.x + NODE_RADIUS - 6, pos.y - NODE_RADIUS + 6, 12, 0x221100)
      .setStrokeStyle(1, 0xFFAA00);
    this.add.text(pos.x + NODE_RADIUS - 6, pos.y - NODE_RADIUS + 6, String(region.id), {
      fontSize: '13px', color: '#FFCC44', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Completed star
    if (completed) {
      this.add.text(pos.x, pos.y + NODE_RADIUS - 8, '⭐', { fontSize: '14px' }).setOrigin(0.5, 1);
    }

    // Name label
    this.add.text(pos.x, pos.y + NODE_RADIUS + 8, region.name, {
      fontSize: '12px',
      color: unlocked ? '#FFE8A0' : '#888888',
      fontFamily: 'Arial',
      fontStyle: unlocked ? 'bold' : 'normal',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0);

    this.add.text(pos.x, pos.y + NODE_RADIUS + 24, region.subtitle, {
      fontSize: '10px', color: unlocked ? '#AACCEE' : '#666666', fontFamily: 'Arial',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5, 0);

    // Click handler
    if (unlocked) {
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerover', () => circle.setStrokeStyle(4, 0xFFFFFF));
      circle.on('pointerout',  () => circle.setStrokeStyle(3, 0xFFFFFF));
      circle.on('pointerdown', () => {
        GameState.currentRegion = region.id;
        GameState.save();
        this.scene.start('ExploreScene', { regionId: region.id });
      });

      // Pulse current region
      if (isCurrent) {
        this.tweens.add({
          targets: circle, scaleX: 1.08, scaleY: 1.08,
          duration: 700, yoyo: true, repeat: -1,
        });
      }
    }
  }

  _drawPlayerInfo(W, H) {
    const { hp, maxHP, level, xp } = GameState;
    const bg = this.add.rectangle(W - 100, 80, 170, 90, 0x000000, 0.6)
      .setStrokeStyle(1, 0x886644);
    this.add.text(W - 100, 46, '🐱  Mimi', {
      fontSize: '15px', color: '#FFD700', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W - 100, 65, `HP: ${hp}/${maxHP}`, {
      fontSize: '13px', color: '#FF8899', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.add.text(W - 100, 83, `Level: ${level}`, {
      fontSize: '13px', color: '#AADDFF', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this.add.text(W - 100, 101, `XP: ${xp}/${level * 50}`, {
      fontSize: '13px', color: '#AADDFF', fontFamily: 'Arial',
    }).setOrigin(0.5);
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
