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
  // 4-frame walk sprites (cycled by Mimi.js step timer: A→C→B→D)
  { key: 'mimi_walk_down_b',      file: 'mimi_walk_down_b',      size: 64 },
  { key: 'mimi_walk_up_b',        file: 'mimi_walk_up_b',        size: 64 },
  { key: 'mimi_walk_left_b',      file: 'mimi_walk_left_b',      size: 64 },
  { key: 'mimi_walk_right_b',     file: 'mimi_walk_right_b',     size: 64 },
  // Frame-C/D: mid-stride passing phase (body low, legs centered)
  { key: 'mimi_walk_down_c',      file: 'mimi_walk_down_c',      size: 64 },
  { key: 'mimi_walk_up_c',        file: 'mimi_walk_up_c',        size: 64 },
  { key: 'mimi_walk_left_c',      file: 'mimi_walk_left_c',      size: 64 },
  { key: 'mimi_walk_right_c',     file: 'mimi_walk_right_c',     size: 64 },
  { key: 'mimi_walk_down_d',      file: 'mimi_walk_down_d',      size: 64 },
  { key: 'mimi_walk_up_d',        file: 'mimi_walk_up_d',        size: 64 },
  { key: 'mimi_walk_left_d',      file: 'mimi_walk_left_d',      size: 64 },
  { key: 'mimi_walk_right_d',     file: 'mimi_walk_right_d',     size: 64 },

  // Region 0 — Sunny Village
  { key: 'counting_caterpillar',  file: 'counting_caterpillar',  size: 64 },
  { key: 'number_gnome',          file: 'number_gnome',          size: 64 },
  { key: 'minus_mole',            file: 'minus_mole',            size: 64 },
  { key: 'number_bee',            file: 'number_bee',            size: 64 },
  { key: 'subtraction_witch',     file: 'subtraction_witch',     size: 96 },

  // Region 1 — Meadow Maze
  { key: 'slime_pup',             file: 'slime_pup',             size: 64 },
  { key: 'cactus_sprite',         file: 'cactus_sprite',         size: 64 },
  { key: 'cloud_bully',           file: 'cloud_bully',           size: 64 },
  { key: 'double_bunny',          file: 'double_bunny',          size: 64 },
  { key: 'count_multiplico',      file: 'count_multiplico',      size: 96 },

  // Region 2 — Desert Dunes
  { key: 'sand_scarab',           file: 'sand_scarab',           size: 64 },
  { key: 'mummy_cat',             file: 'mummy_cat',             size: 64 },
  { key: 'mirage_fox',            file: 'mirage_fox',            size: 64 },
  { key: 'riddle_scarab',         file: 'riddle_scarab',         size: 64 },
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
  { key: 'professor_negativus',   file: 'professor_negativus',   size: 96 }, // legacy (unused in gameplay)
  { key: 'fenwick',               file: 'fenwick',               size: 96 },
  { key: 'fenwick_b',             file: 'fenwick_b',             size: 96 },

  // Frame-B walk/fly sprites (cycled by Enemy.js step timer)
  { key: 'counting_caterpillar_b', file: 'counting_caterpillar_b', size: 64 },
  { key: 'number_gnome_b',         file: 'number_gnome_b',         size: 64 },
  { key: 'minus_mole_b',           file: 'minus_mole_b',           size: 64 },
  { key: 'subtraction_witch_b',    file: 'subtraction_witch_b',    size: 96 },
  { key: 'number_bee_b',           file: 'number_bee_b',           size: 64 },
  { key: 'slime_pup_b',            file: 'slime_pup_b',            size: 64 },
  { key: 'cactus_sprite_b',        file: 'cactus_sprite_b',        size: 64 },
  { key: 'cloud_bully_b',          file: 'cloud_bully_b',          size: 64 },
  { key: 'count_multiplico_b',     file: 'count_multiplico_b',     size: 96 },
  { key: 'double_bunny_b',         file: 'double_bunny_b',         size: 64 },
  { key: 'sand_scarab_b',          file: 'sand_scarab_b',          size: 64 },
  { key: 'mummy_cat_b',            file: 'mummy_cat_b',            size: 64 },
  { key: 'mirage_fox_b',           file: 'mirage_fox_b',           size: 64 },
  { key: 'the_diviner_b',          file: 'the_diviner_b',          size: 96 },
  { key: 'riddle_scarab_b',        file: 'riddle_scarab_b',        size: 64 },
  { key: 'ice_frog_b',             file: 'ice_frog_b',             size: 64 },
  { key: 'snow_golem_b',           file: 'snow_golem_b',           size: 64 },
  { key: 'crystal_bat_b',          file: 'crystal_bat_b',          size: 64 },
  { key: 'glacius_b',              file: 'glacius_b',              size: 96 },
  { key: 'ratio_raven_b',          file: 'ratio_raven_b',          size: 64 },
  { key: 'percent_wraith_b',       file: 'percent_wraith_b',       size: 64 },
  { key: 'shadow_knight_b',        file: 'shadow_knight_b',        size: 64 },
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
  { key: 'decoration_tree',          file: 'decoration_tree',          size: { width: 32, height: 48 } },
  { key: 'decoration_tree_b',         file: 'decoration_tree_b',         size: { width: 32, height: 48 } },
  { key: 'decoration_tree_meadow',    file: 'decoration_tree_meadow',    size: { width: 32, height: 48 } },
  { key: 'decoration_tree_meadow_b',  file: 'decoration_tree_meadow_b',  size: { width: 32, height: 48 } },
  { key: 'decoration_rock',           file: 'decoration_rock',           size: 32 },
  { key: 'decoration_rock_b',         file: 'decoration_rock_b',         size: 32 },
  { key: 'decoration_cactus',      file: 'decoration_cactus',      size: { width: 32, height: 48 } },
  { key: 'decoration_flower',      file: 'decoration_flower',      size: 32 },
  { key: 'decoration_mushroom',    file: 'decoration_mushroom',    size: 32 },
  { key: 'decoration_palmtree',    file: 'decoration_palmtree',    size: { width: 32, height: 48 } },
  { key: 'decoration_icicle',      file: 'decoration_icicle',      size: { width: 32, height: 48 } },
  { key: 'decoration_icicle_b',    file: 'decoration_icicle_b',    size: { width: 32, height: 48 } },
  { key: 'decoration_snowpile',    file: 'decoration_snowpile',    size: { width: 32, height: 16 } },
  { key: 'decoration_pillar',      file: 'decoration_pillar',      size: { width: 24, height: 40 } },
  { key: 'decoration_pillar_b',    file: 'decoration_pillar_b',    size: { width: 24, height: 40 } },
  { key: 'decoration_gravestone',  file: 'decoration_gravestone',  size: { width: 24, height: 32 } },
  { key: 'decoration_torch',        file: 'decoration_torch',        size: { width: 24, height: 40 } },

  // New decorations — Region 0 (Village)
  { key: 'decoration_hay_bale',    file: 'decoration_hay_bale',    size: { width: 32, height: 24 } },
  { key: 'decoration_well',        file: 'decoration_well',        size: { width: 32, height: 40 } },
  // New decorations — Region 1 (Meadow)
  { key: 'decoration_vine',        file: 'decoration_vine',        size: { width: 32, height: 48 } },
  { key: 'decoration_clover',      file: 'decoration_clover',      size: 32 },
  // New decorations — Region 2 (Desert)
  { key: 'decoration_bones',       file: 'decoration_bones',       size: 32 },
  { key: 'decoration_tumbleweed',  file: 'decoration_tumbleweed',  size: 32 },
  // New decorations — Region 3 (Ice)
  { key: 'decoration_ice_crystal', file: 'decoration_ice_crystal', size: { width: 32, height: 48 } },
  { key: 'decoration_frost_flower',file: 'decoration_frost_flower',size: 32 },
  // New decorations — Region 4 (Shadow)
  { key: 'decoration_skull',       file: 'decoration_skull',       size: 32 },
  { key: 'decoration_chains',      file: 'decoration_chains',      size: { width: 32, height: 48 } },
  { key: 'decoration_bookshelf',   file: 'decoration_bookshelf',   size: { width: 32, height: 48 } },

  // Landmark set-pieces (multi-tile, one per region)
  { key: 'landmark_pond',         file: 'landmark_pond',         size: { width: 160, height: 128 } },
  { key: 'landmark_flower_ring',  file: 'landmark_flower_ring',  size: { width: 160, height: 128 } },
  { key: 'landmark_lava_pool',    file: 'landmark_lava_pool',    size: { width: 160, height: 128 } },
  { key: 'landmark_frozen_lake',  file: 'landmark_frozen_lake',  size: { width: 192, height: 160 } },
  { key: 'landmark_dark_altar',   file: 'landmark_dark_altar',   size: { width: 128, height: 128 } },
  
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

/** Keys for every WAV file in assets/audio/. */
export const AUDIO_KEYS = [
  'sfx_correct', 'sfx_wrong', 'sfx_click',
  'sfx_hit_enemy', 'sfx_hit_player', 'sfx_chest_open',
  'sfx_battle_start', 'sfx_victory', 'sfx_boss_intro',
  'sfx_page_turn', 'sfx_level_up', 'sfx_npc_talk',
  'sfx_damage_critical', 'sfx_timer_warn', 'sfx_footstep',
];

/**
 * Load all audio files.  Call from BootScene.preload().
 * @param {Phaser.Scene} scene
 */
export function loadAllAudio(scene) {
  for (const key of AUDIO_KEYS) {
    scene.load.audio(key, `assets/audio/${key}.wav`);
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
