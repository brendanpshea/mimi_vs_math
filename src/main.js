/**
 * main.js — Phaser 3 game configuration and scene registration.
 *
 * Loaded as an ES module from index.html via an importmap that maps
 * 'phaser' to the CDN ESM build. All other source files are also
 * ES modules and are imported relative to this file.
 */
import * as Phaser from 'phaser';

import BootScene     from './scenes/BootScene.js';
import TitleScene    from './scenes/TitleScene.js';
import OverworldScene from './scenes/OverworldScene.js';
import ExploreScene  from './scenes/ExploreScene.js';
import BattleScene   from './scenes/BattleScene.js';

const config = {
  type: Phaser.AUTO,          // WebGL with Canvas fallback
  width: 800,
  height: 600,
  backgroundColor: '#0D0D2A',

  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },

  scale: {
    mode: Phaser.Scale.FIT,           // scale to window, maintain aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [
    BootScene,
    TitleScene,
    OverworldScene,
    ExploreScene,
    BattleScene,
  ],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
