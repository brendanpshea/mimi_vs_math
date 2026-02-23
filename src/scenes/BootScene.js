/**
 * BootScene — preloads all assets, generates procedural tile textures,
 * then hands off to TitleScene.
 */
import * as Phaser from 'phaser';
import { loadAllAssets, loadAllAudio } from '../config/AssetConfig.js';
import BGM       from '../audio/BGM.js';
import GameState from '../config/GameState.js';

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

    // ── Load all SFX ───────────────────────────────────────────────────
    loadAllAudio(this);
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Kick off BGM sample decoding in parallel — by the time TitleScene
    // appears all 46 MP3s should already be decoded and ready to play.
    BGM.preload();

    // Apply saved volume preferences so BGM ramps to the right level from
    // the very first note, and SFX plays at the user's preferred level.
    GameState.load();
    BGM.applyVolPref(GameState.musicVol ?? 0.75);
    this.sound.setVolume(GameState.sfxVol ?? 1.0);

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
    // ── Per-region border wall tiles ─────────────────────────────────────────

    // R0 & R1 — wall_hedge (leafy green hedge) ──────────────────────
    gfx.clear();
    gfx.fillStyle(0x2A7B12);
    gfx.fillRect(0, 0, SIZE, SIZE);
    gfx.fillStyle(0x3D9E20);
    gfx.fillCircle(6, 7, 6);  gfx.fillCircle(16, 5, 7);  gfx.fillCircle(26, 8, 5);
    gfx.fillCircle(4, 22, 5); gfx.fillCircle(15, 24, 6); gfx.fillCircle(26, 21, 6);
    gfx.fillStyle(0x66CC33, 0.65);
    gfx.fillCircle(9, 3, 3);  gfx.fillCircle(21, 2, 2.5); gfx.fillCircle(13, 20, 2.5);
    gfx.lineStyle(1, 0x1A5A08, 0.55);
    gfx.lineBetween(8, 0, 6, SIZE); gfx.lineBetween(20, 0, 22, SIZE);
    gfx.lineStyle(1, 0x1A5008, 0.35);
    gfx.strokeRect(0, 0, SIZE, SIZE);
    gfx.generateTexture('wall_hedge', SIZE, SIZE);

    // R2 — wall_sandstone (Desert Dunes sandy blocks) ───────────────
    gfx.clear();
    gfx.fillStyle(0xC8A058);
    gfx.fillRect(0, 0, SIZE, SIZE);
    // Brick rows with offset pattern
    gfx.fillStyle(0xAA8840);
    gfx.fillRect(0, 0, 15, 10);  gfx.fillRect(16, 0, 16, 10);  // row 1
    gfx.fillRect(0, 11, 9, 10);  gfx.fillRect(10, 11, 22, 10); // row 2
    gfx.fillRect(0, 22, 15, 10); gfx.fillRect(16, 22, 16, 10); // row 3
    // Highlight strips
    gfx.fillStyle(0xE0C070, 0.45);
    gfx.fillRect(1, 1, 13, 2);  gfx.fillRect(17, 1, 14, 2);
    gfx.fillRect(1, 12, 7, 2);  gfx.fillRect(11, 12, 20, 2);
    gfx.fillRect(1, 23, 13, 2); gfx.fillRect(17, 23, 14, 2);
    // Mortar lines
    gfx.lineStyle(1.5, 0x8A6828, 0.65);
    gfx.lineBetween(0, 10.5, SIZE, 10.5);
    gfx.lineBetween(0, 21.5, SIZE, 21.5);
    gfx.lineBetween(15.5, 0, 15.5, 10);  gfx.lineBetween(9.5, 11, 9.5, 21); gfx.lineBetween(15.5, 22, 15.5, SIZE);
    gfx.lineStyle(1, 0x6A4818, 0.35);
    gfx.strokeRect(0, 0, SIZE, SIZE);
    gfx.generateTexture('wall_sandstone', SIZE, SIZE);

    // R3 — wall_ice (Frostbite Cavern icy blue) ────────────────────
    gfx.clear();
    gfx.fillStyle(0x4A88BB);
    gfx.fillRect(0, 0, SIZE, SIZE);
    gfx.fillStyle(0x6AA8D8);
    gfx.fillTriangle(0, 0, 16, 0, 8, 14);
    gfx.fillTriangle(16, 0, SIZE, 0, 24, 12);
    gfx.fillStyle(0x88C8EE, 0.55);
    gfx.fillTriangle(0, 0, 12, 0, 0, 12);
    gfx.fillTriangle(20, 0, SIZE, 0, SIZE, 8);
    // Frost crack lines
    gfx.lineStyle(1, 0xBBDDFF, 0.5);
    gfx.lineBetween(4, 4, 12, 18); gfx.lineBetween(14, 2, 22, 16); gfx.lineBetween(22, 6, 30, 20);
    // Surface sheen
    gfx.lineStyle(1.5, 0xCCEEFF, 0.45);
    gfx.lineBetween(0, 0, SIZE, 0); gfx.lineBetween(0, 0, 0, SIZE);
    gfx.lineStyle(1, 0x2A5888, 0.35);
    gfx.strokeRect(0, 0, SIZE, SIZE);
    gfx.generateTexture('wall_ice', SIZE, SIZE);

    // R4 — wall_obsidian (Shadow Castle dark purple blocks) ──────────
    gfx.clear();
    gfx.fillStyle(0x14102A);
    gfx.fillRect(0, 0, SIZE, SIZE);
    gfx.fillStyle(0x221840);
    gfx.fillRect(2, 2, SIZE - 4, 12); gfx.fillRect(2, 18, SIZE - 4, 12);
    gfx.fillStyle(0x3A2860);
    gfx.fillRect(2, 2, SIZE - 4, 3); gfx.fillRect(2, 18, SIZE - 4, 3);
    // Purple glint veins
    gfx.lineStyle(1, 0x7744CC, 0.4);
    gfx.lineBetween(5, 3, 2, 13);   gfx.lineBetween(14, 2, 10, 12);  gfx.lineBetween(22, 4, 28, 13);
    gfx.lineBetween(3, 19, 8, 29);  gfx.lineBetween(18, 19, 14, 30);
    // Mortar lines
    gfx.lineStyle(1.5, 0x08051A, 0.9);
    gfx.lineBetween(0, 14.5, SIZE, 14.5);
    gfx.lineBetween(SIZE / 2, 0, SIZE / 2, 14);
    gfx.lineBetween(SIZE / 3, 15, SIZE / 3, SIZE);
    gfx.lineStyle(1, 0x3A2060, 0.25);
    gfx.strokeRect(0, 0, SIZE, SIZE);
    gfx.generateTexture('wall_obsidian', SIZE, SIZE);

    // ── HUD heart textures (20×20) ──────────────────────────────────────────────
    // Heart shape: two overlapping circles (top bumps) + triangle (lower body).
    // No physics body — display-only textures used by HUD.js.
    const SH = 20;

    // Full heart — bright red with a white shine spot
    gfx.clear();
    gfx.fillStyle(0xFF2244);
    gfx.fillCircle(6, 7, 5.5);
    gfx.fillCircle(14, 7, 5.5);
    gfx.fillTriangle(1, 9, 19, 9, 10, 19);
    gfx.fillStyle(0xFF88AA, 0.65);
    gfx.fillCircle(7, 5, 2.5);       // shine
    gfx.lineStyle(1, 0x880022, 0.4);
    gfx.strokeCircle(6, 7, 5.5); gfx.strokeCircle(14, 7, 5.5);
    gfx.generateTexture('heart_full', SH, SH);

    // Half heart — right half bright red, left half dim
    gfx.clear();
    gfx.fillStyle(0x44223A);          // dim left bump
    gfx.fillCircle(6, 7, 5.5);
    gfx.fillTriangle(1, 9, 10, 9, 10, 19);
    gfx.fillStyle(0xFF2244);          // bright right bump (painted over overlap)
    gfx.fillCircle(14, 7, 5.5);
    gfx.fillTriangle(10, 9, 19, 9, 10, 19);
    gfx.fillStyle(0xFF88AA, 0.6);
    gfx.fillCircle(15, 5, 2);
    gfx.generateTexture('heart_half', SH, SH);

    // Empty heart — very dark with faint purple outline
    gfx.clear();
    gfx.fillStyle(0x2A1A33);
    gfx.fillCircle(6, 7, 5.5);
    gfx.fillCircle(14, 7, 5.5);
    gfx.fillTriangle(1, 9, 19, 9, 10, 19);
    gfx.lineStyle(1.5, 0x664477, 0.75);
    gfx.strokeCircle(6, 7, 5.5); gfx.strokeCircle(14, 7, 5.5);
    gfx.generateTexture('heart_empty', SH, SH);
    gfx.destroy();
  }
}
