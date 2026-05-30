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
    this.add.text(W / 2, H / 2 - 20, 'Loading…', {
      fontSize: '20px', color: '#FFFFFF', fontFamily: "'Nunito', Arial, sans-serif",
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 60, '🐱 Mimi vs. Math', {
      fontSize: '32px', color: '#FFD700', fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif", fontStyle: 'bold',
    }).setOrigin(0.5);

    // Load the SVG outline immediately so we can use it as a progress bar frame
    this.load.svg('scepter_loading_boot', 'assets/sprites/scepter_loading.svg', { width: 400, height: 60 });
    
    let barFill = null;
    this.load.once('filecomplete-svg-scepter_loading_boot', () => {
      this.add.image(W / 2, H / 2 + 20, 'scepter_loading_boot').setDepth(2);
      barFill = this.add.rectangle(W / 2 - 200 + 20, H / 2 + 20, 0, 12, 0xFFDD44).setOrigin(0, 0.5).setDepth(1);
    });

    this.load.on('progress', v => {
      if (barFill) barFill.setDisplaySize(320 * v, 12);
    });
    
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
  // Region-specific wall fragments are generated procedurally here.
  // All floor/wall/door/chest/NPC/heart art is now loaded from SVG assets;
  // the old "tile_" textures and heart textures have been removed as dead code.

  _generateTileTextures() {
    const SIZE = 32;
    const gfx  = this.make.graphics({ x: 0, y: 0, add: false });

    // ── Per-region border walls now loaded from static SVG assets ─────────
    // Walls behave as immutable world boundaries; they no longer need
    // runtime texture generation. Their keys are preloaded in AssetConfig.

    // R0 & R1 — wall_hedge (leafy green hedge)
    // R2 — wall_sandstone (Desert Dunes sandy blocks)
    // R4 — wall_obsidian (Shadow Castle dark purple blocks)
    // (generation removed)

    // R3 — wall_ice removed earlier; static asset already in place
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

    // ── (Heart textures removed – now loaded from SVG assets)
    // UI hearts are defined in AssetConfig and preloaded; HUD.js will
    // reference 'heart_full', 'heart_half', and 'heart_empty' directly.
    gfx.destroy();
  }
}
