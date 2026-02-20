/**
 * AssetConfig — centralises all asset loading for Mimi vs. Math.
 *
 * HOW TO SWITCH FROM SVG → PNG
 * ─────────────────────────────
 * 1. Change `ASSET_TYPE` below to `'png'`.
 * 2. Place PNG files at the same paths as the SVG files, using the same
 *    filename but with a `.png` extension.
 *    e.g.  assets/sprites/mimi.svg  →  assets/sprites/mimi.png
 * 3. Recommended PNG sizes: 64×64 px for characters, 32×32 px for UI icons.
 *
 * All scene code uses texture keys (e.g. `'mimi'`) and never references file
 * extensions directly, so no other code needs to change.
 */

export const ASSET_TYPE = 'svg'; // ← change to 'png' when ready

/**
 * All character/enemy sprite definitions.
 * key      – Phaser texture key used throughout the game
 * file     – filename relative to assets/sprites/, without extension
 * size     – render size in pixels (SVG only; ignored for PNG)
 */
export const SPRITE_DEFS = [
  // Player
  { key: 'mimi',                  file: 'mimi',                  size: 64 },
  { key: 'mimi_battle',           file: 'mimi_battle',           size: 96 },

  // Region 0 — Sunny Village
  { key: 'counting_caterpillar',  file: 'counting_caterpillar',  size: 64 },
  { key: 'number_gnome',          file: 'number_gnome',          size: 64 },
  { key: 'minus_mole',            file: 'minus_mole',            size: 64 },
  { key: 'subtraction_witch',     file: 'subtraction_witch',     size: 96 },

  // Region 1 — Meadow Maze
  { key: 'slime_pup',             file: 'slime_pup',             size: 64 },
  { key: 'cactus_sprite',         file: 'cactus_sprite',         size: 64 },
  { key: 'cloud_bully',           file: 'cloud_bully',           size: 64 },
  { key: 'count_multiplico',      file: 'count_multiplico',      size: 96 },

  // Region 2 — Desert Dunes
  { key: 'sand_scarab',           file: 'sand_scarab',           size: 64 },
  { key: 'mummy_cat',             file: 'mummy_cat',             size: 64 },
  { key: 'mirage_fox',            file: 'mirage_fox',            size: 64 },
  { key: 'the_diviner',           file: 'the_diviner',           size: 96 },

  // Region 3 — Frostbite Cavern
  { key: 'ice_frog',              file: 'ice_frog',              size: 64 },
  { key: 'snow_golem',            file: 'snow_golem',            size: 64 },
  { key: 'crystal_bat',           file: 'crystal_bat',           size: 64 },
  { key: 'glacius',               file: 'glacius',               size: 96 },

  // Region 4 — Shadow Castle
  { key: 'shadow_knight',         file: 'shadow_knight',         size: 64 },
  { key: 'ratio_raven',           file: 'ratio_raven',           size: 64 },
  { key: 'percent_wraith',        file: 'percent_wraith',        size: 64 },
  { key: 'professor_negativus',   file: 'professor_negativus',   size: 96 },
];

/**
 * UI icon definitions (lives, stars, etc.)
 */
export const UI_DEFS = [
  { key: 'ui_heart', file: 'ui/heart', size: 32 },
  { key: 'ui_star',  file: 'ui/star',  size: 28 },
];

/**
 * Load a character sprite into a Phaser scene's loader.
 * @param {Phaser.Scene} scene
 * @param {string} key    Phaser texture key
 * @param {string} file   Filename without extension (relative to assets/sprites/)
 * @param {number} size   Pixel size (used for SVG rendering)
 */
export function loadSprite(scene, key, file, size = 64) {
  const base = `assets/sprites/${file}`;
  if (ASSET_TYPE === 'svg') {
    scene.load.svg(key, `${base}.svg`, { width: size, height: size });
  } else {
    scene.load.image(key, `${base}.png`);
  }
}

/**
 * Load all sprites defined in SPRITE_DEFS and UI_DEFS.
 * Call this from BootScene.preload().
 * @param {Phaser.Scene} scene
 */
export function loadAllAssets(scene) {
  for (const def of SPRITE_DEFS) {
    loadSprite(scene, def.key, def.file, def.size);
  }
  for (const def of UI_DEFS) {
    loadSprite(scene, def.key, def.file, def.size);
  }
}
