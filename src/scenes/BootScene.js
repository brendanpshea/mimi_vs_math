/**
 * BootScene — preloads all assets, generates procedural tile textures,
 * then hands off to TitleScene.
 */
import * as Phaser from 'phaser';
import { loadAllAssets } from '../config/AssetConfig.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Loading bar ────────────────────────────────────────────────────
    const barBg   = this.add.rectangle(W / 2, H / 2 + 20, 400, 20, 0x333355);
    const barFill = this.add.rectangle(W / 2 - 200, H / 2 + 20, 0, 20, 0x6688FF).setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2 - 20, 'Loading…', {
      fontSize: '20px', color: '#FFFFFF', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 60, '🐱 Mimi vs. Math', {
      fontSize: '32px', color: '#FFD700', fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5);

    this.load.on('progress', v => barFill.setDisplaySize(400 * v, 20));
    
    this.load.on('loaderror', (file) => {
      console.error(`Failed to load: ${file.key} from ${file.src}`);
    });

    // ── Load all character/UI sprites ──────────────────────────────────
    loadAllAssets(this);
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Generate procedural tile textures used in ExploreScene
    this._generateTileTextures();

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TitleScene');
    });
  }

  // ── Tile texture generation ─────────────────────────────────────────────
  // Creates a 4-frame sprite sheet (each frame 32×32) used as the map tileset.
  // Frame layout: 0=floor, 1=wall, 2=water/obstacle, 3=door
  // To replace with pixel-art: export a 128×32 PNG named assets/sprites/tileset.png
  // and load it with this.load.image('tileset', '…') in preload() instead.

  _generateTileTextures() {
    const SIZE = 32;
    const gfx  = this.make.graphics({ x: 0, y: 0, add: false });

    // ── Floor (frame 0) ────────────────────────────────────────────────
    gfx.fillStyle(0x5FA827);
    gfx.fillRect(0, 0, SIZE, SIZE);
    gfx.lineStyle(1, 0x4A8A1E, 0.4);
    gfx.strokeRect(0, 0, SIZE, SIZE);
    // small grass detail
    gfx.lineStyle(1, 0x3A7A0E, 0.6);
    gfx.lineBetween(8, 8, 8, 14);
    gfx.lineBetween(16, 6, 16, 12);
    gfx.lineBetween(24, 10, 24, 16);
    gfx.generateTexture('tile_floor', SIZE, SIZE);

    // ── Wall (frame 1) ─────────────────────────────────────────────────
    gfx.clear();
    gfx.fillStyle(0x8B6B4A);
    gfx.fillRect(0, 0, SIZE, SIZE);
    gfx.fillStyle(0x7A5A3A);
    gfx.fillRect(2, 2, SIZE - 4, SIZE / 2 - 2);
    gfx.fillRect(2, SIZE / 2 + 2, SIZE - 4, SIZE / 2 - 4);
    gfx.lineStyle(1, 0x6A4A2A, 0.5);
    gfx.strokeRect(0, 0, SIZE, SIZE);
    gfx.generateTexture('tile_wall', SIZE, SIZE);

    // ── Water / obstacle (frame 2) ─────────────────────────────────────
    gfx.clear();
    gfx.fillStyle(0x2266BB);
    gfx.fillRect(0, 0, SIZE, SIZE);
    gfx.fillStyle(0x3388DD);
    gfx.fillRect(4, 4, SIZE - 8, SIZE - 8);
    gfx.lineStyle(1, 0x1144AA, 0.5);
    gfx.strokeRect(0, 0, SIZE, SIZE);
    gfx.generateTexture('tile_water', SIZE, SIZE);

    // ── Boss door (frame 3) ────────────────────────────────────────────
    gfx.clear();
    gfx.fillStyle(0x442266);
    gfx.fillRect(0, 0, SIZE, SIZE);
    gfx.fillStyle(0x6633AA);
    gfx.fillRect(6, 0, SIZE - 12, SIZE);
    gfx.fillStyle(0xFFDD44);
    gfx.fillCircle(SIZE / 2, SIZE / 2, 5); // door knob
    gfx.lineStyle(2, 0xFFDD44, 1);
    gfx.strokeRect(6, 0, SIZE - 12, SIZE);
    gfx.generateTexture('tile_door', SIZE, SIZE);

    // ── Treasure chest ─────────────────────────────────────────────────
    gfx.clear();
    gfx.fillStyle(0xAA6622);
    gfx.fillRect(4, 8, 24, 18);
    gfx.fillStyle(0xFFDD44);
    gfx.fillRect(4, 6, 24, 6);
    gfx.fillStyle(0xFFDD44);
    gfx.fillCircle(16, 12, 3);
    gfx.lineStyle(2, 0x442200, 1);
    gfx.strokeRect(4, 8, 24, 18);
    gfx.generateTexture('tile_chest', SIZE, SIZE);

    // ── NPC placeholder ────────────────────────────────────────────────
    gfx.clear();
    gfx.fillStyle(0xFFCCAA); // head
    gfx.fillCircle(16, 10, 8);
    gfx.fillStyle(0x4488FF); // body
    gfx.fillRect(8, 18, 16, 12);
    gfx.generateTexture('tile_npc', SIZE, SIZE);

    gfx.destroy();
  }
}
