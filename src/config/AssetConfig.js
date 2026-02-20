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
  { key: 'mimi_walk_down',        file: 'mimi_walk_down',        size: 64 },
  { key: 'mimi_walk_up',          file: 'mimi_walk_up',          size: 64 },
  { key: 'mimi_walk_left',        file: 'mimi_walk_left',        size: 64 },
  { key: 'mimi_walk_right',       file: 'mimi_walk_right',       size: 64 },
  // Frame-B walk sprites (opposite leg phase — cycled by Mimi.js step timer)
  { key: 'mimi_walk_down_b',      file: 'mimi_walk_down_b',      size: 64 },
  { key: 'mimi_walk_up_b',        file: 'mimi_walk_up_b',        size: 64 },
  { key: 'mimi_walk_left_b',      file: 'mimi_walk_left_b',      size: 64 },
  { key: 'mimi_walk_right_b',     file: 'mimi_walk_right_b',     size: 64 },

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
 * Terrain tile definitions (floors, walls, decorations)
 */
export const TERRAIN_DEFS = [
  // Floor tiles (A = base, B/C = texture variants for random tiling)
  { key: 'floor_grass',   file: 'floor_grass',   size: 32 },
  { key: 'floor_grass_b', file: 'floor_grass_b', size: 32 },
  { key: 'floor_grass_c', file: 'floor_grass_c', size: 32 },
  { key: 'floor_sand',    file: 'floor_sand',    size: 32 },
  { key: 'floor_sand_b',  file: 'floor_sand_b',  size: 32 },
  { key: 'floor_sand_c',  file: 'floor_sand_c',  size: 32 },
  { key: 'floor_snow',    file: 'floor_snow',    size: 32 },
  { key: 'floor_snow_b',  file: 'floor_snow_b',  size: 32 },
  { key: 'floor_snow_c',  file: 'floor_snow_c',  size: 32 },
  { key: 'floor_stone',   file: 'floor_stone',   size: 32 },
  { key: 'floor_stone_b', file: 'floor_stone_b', size: 32 },
  { key: 'floor_stone_c', file: 'floor_stone_c', size: 32 },
  
  // Wall tiles
  { key: 'wall_brick',  file: 'wall_brick',  size: 32 },
  { key: 'wall_ice',    file: 'wall_ice',    size: 32 },
  
  // Decorations
  { key: 'decoration_tree',        file: 'decoration_tree',        size: { width: 32, height: 48 } },
  { key: 'decoration_rock',        file: 'decoration_rock',        size: 32 },
  { key: 'decoration_cactus',      file: 'decoration_cactus',      size: { width: 32, height: 48 } },
  { key: 'decoration_flower',      file: 'decoration_flower',      size: 32 },
  { key: 'decoration_mushroom',    file: 'decoration_mushroom',    size: 32 },
  { key: 'decoration_palmtree',    file: 'decoration_palmtree',    size: { width: 32, height: 48 } },
  { key: 'decoration_icicle',      file: 'decoration_icicle',      size: { width: 32, height: 48 } },
  { key: 'decoration_snowpile',    file: 'decoration_snowpile',    size: { width: 32, height: 16 } },
  { key: 'decoration_pillar',      file: 'decoration_pillar',      size: { width: 24, height: 40 } },
  { key: 'decoration_gravestone',  file: 'decoration_gravestone',  size: { width: 24, height: 32 } },
  
  // NPCs (A = idle/stand, B = walk frame — cycled by NPC.js step timer)
  { key: 'npc_wizard',   file: 'npc_wizard',   size: { width: 48, height: 56 } },
  { key: 'npc_wizard_b', file: 'npc_wizard_b', size: { width: 48, height: 56 } },
];

/**
 * Battle backdrop definitions (Final Fantasy-style backgrounds)
 */
export const BACKDROP_DEFS = [
  { key: 'backdrop_village', file: 'backdrop_village', size: { width: 800, height: 600 } },
  { key: 'backdrop_meadow',  file: 'backdrop_meadow',  size: { width: 800, height: 600 } },
  { key: 'backdrop_desert',  file: 'backdrop_desert',  size: { width: 800, height: 600 } },
  { key: 'backdrop_ice',     file: 'backdrop_ice',     size: { width: 800, height: 600 } },
  { key: 'backdrop_shadow',  file: 'backdrop_shadow',  size: { width: 800, height: 600 } },
];

/**
 * Load a character sprite into a Phaser scene's loader.
 * @param {Phaser.Scene} scene
 * @param {string} key    Phaser texture key
 * @param {string} file   Filename without extension (relative to assets/sprites/)
 * @param {number|object} size   Pixel size (used for SVG rendering) - can be number or {width, height}
 */
export function loadSprite(scene, key, file, size = 64) {
  const base = `assets/sprites/${file}`;
  if (ASSET_TYPE === 'svg') {
    const sizeConfig = typeof size === 'number' 
      ? { width: size, height: size }
      : size;
    scene.load.svg(key, `${base}.svg`, sizeConfig);
  } else {
    scene.load.image(key, `${base}.png`);
  }
}

/**
 * Load all sprites defined in SPRITE_DEFS, UI_DEFS, TERRAIN_DEFS, and BACKDROP_DEFS.
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
  for (const def of TERRAIN_DEFS) {
    loadSprite(scene, def.key, def.file, def.size);
  }
  for (const def of BACKDROP_DEFS) {
    loadSprite(scene, def.key, def.file, def.size);
  }
}
