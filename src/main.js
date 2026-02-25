/**
 * main.js — Phaser 3 game configuration and scene registration.
 *
 * Loaded as an ES module from index.html via an importmap that maps
 * 'phaser' to the CDN ESM build. All other source files are also
 * ES modules and are imported relative to this file.
 */
import * as Phaser from 'phaser';

import BootScene        from './scenes/BootScene.js';
import TitleScene       from './scenes/TitleScene.js';
import StoryScene       from './scenes/StoryScene.js';
import BossIntroScene   from './scenes/BossIntroScene.js';
import OverworldScene   from './scenes/OverworldScene.js';
import ExploreScene     from './scenes/ExploreScene.js';
import BattleScene      from './scenes/BattleScene.js';
import BestiaryScene    from './scenes/BestiaryScene.js';

// Pre-detect WebGL so Phaser doesn't attempt (and log) a failed context creation.
function detectRendererType() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return ctx ? Phaser.AUTO : Phaser.CANVAS;
  } catch (e) {
    return Phaser.CANVAS;
  }
}

const config = {
  type: detectRendererType(),  // WebGL if available, Canvas otherwise (no error log)
  backgroundColor: '#0D0D2A',

  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },

  scale: {
    mode: Phaser.Scale.EXPAND,        // fill screen; logical size adjusts to viewport
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
    min: { width: 640, height: 480 },
    // No max — letting EXPAND fill any aspect ratio freely shows more world
    // on wider screens rather than distorting content to fit a fixed 16:9 cap.
  },

  scene: [
    BootScene,
    TitleScene,
    StoryScene,
    BossIntroScene,
    OverworldScene,
    ExploreScene,
    BattleScene,
    BestiaryScene,
  ],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
