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

const config = {
  type: Phaser.AUTO,          // WebGL with Canvas fallback
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
    max: { width: 1366, height: 768 },
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
