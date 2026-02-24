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
  { key: 'counting_caterpillar',  file: 'counting_caterpillar',  size: 64, frames: ['b', 'c'] },
  { key: 'number_gnome',          file: 'number_gnome',          size: 64, frames: ['b', 'c'] },
  { key: 'minus_mole',            file: 'minus_mole',            size: 64, frames: ['b', 'c'] },
  { key: 'number_bee',            file: 'number_bee',            size: 64, frames: ['b', 'c'] },
  { key: 'subtraction_witch',     file: 'subtraction_witch',     size: 96, frames: ['b'] },

  // Region 1 — Windmill Village
  { key: 'gear_gnome',        file: 'gear_gnome',        size: 64, frames: ['b'] },
  { key: 'windmill_sprite',   file: 'windmill_sprite',   size: 64, frames: ['b'] },
  { key: 'harvest_scarecrow', file: 'harvest_scarecrow', size: 64, frames: ['b'] },
  { key: 'counting_crow',     file: 'counting_crow',     size: 64, frames: ['b'] },
  { key: 'grand_miller',      file: 'grand_miller',      size: 96, frames: ['b'] },

  // Region 2 — Meadow Maze
  { key: 'slime_pup',             file: 'slime_pup',             size: 64, frames: ['b', 'c'] },
  { key: 'cactus_sprite',         file: 'cactus_sprite',         size: 64, frames: ['b'] },
  { key: 'cloud_bully',           file: 'cloud_bully',           size: 64, frames: ['b'] },
  { key: 'double_bunny',          file: 'double_bunny',          size: 64, frames: ['b', 'c'] },
  { key: 'count_multiplico',      file: 'count_multiplico',      size: 96, frames: ['b'] },

  // Region 3 — Mycelium Hollow
  { key: 'fungus_toad',          file: 'fungus_toad',          size: 64, frames: ['b'] },
  { key: 'mycelium_wisp',        file: 'mycelium_wisp',        size: 64, frames: ['b'] },
  { key: 'spore_puff',           file: 'spore_puff',           size: 64, frames: ['b'] },
  { key: 'queen_sporella',       file: 'queen_sporella',       size: 96, frames: ['b'] },

  // Region 4 — Desert Dunes
  { key: 'sand_scarab',           file: 'sand_scarab',           size: 64, frames: ['b'] },
  { key: 'mummy_cat',             file: 'mummy_cat',             size: 64, frames: ['b'] },
  { key: 'mirage_fox',            file: 'mirage_fox',            size: 64, frames: ['b', 'c'] },
  { key: 'riddle_scarab',         file: 'riddle_scarab',         size: 64, frames: ['b'] },
  { key: 'the_diviner',           file: 'the_diviner',           size: 96, frames: ['b'] },

  // Region 5 — Frostbite Cavern
  { key: 'ice_frog',              file: 'ice_frog',              size: 64, frames: ['b'] },
  { key: 'snow_golem',            file: 'snow_golem',            size: 64, frames: ['b'] },
  { key: 'crystal_bat',           file: 'crystal_bat',           size: 64, frames: ['b', 'c'] },
  { key: 'glacius',               file: 'glacius',               size: 96, frames: ['b'] },

  { key: 'shadow_knight',         file: 'shadow_knight',         size: 64, frames: ['b'] },
  { key: 'ratio_raven',           file: 'ratio_raven',           size: 64, frames: ['b'] },
  { key: 'percent_wraith',        file: 'percent_wraith',        size: 64, frames: ['b'] },
  { key: 'professor_negativus',   file: 'professor_negativus',   size: 96 }, // legacy (unused in gameplay)
  { key: 'fenwick',               file: 'fenwick',               size: 96, frames: ['b'] },
];

/**
 * UI icon definitions (lives, stars, item power-ups)
 */
export const UI_DEFS = [
  { key: 'ui_heart',     file: 'ui/heart',        size: 32 },
  { key: 'ui_star',      file: 'ui/star',         size: 28 },
  // Item (power-up) icons — used in HUD inventory and BattleScene effects row
  { key: 'item_sardine', file: 'ui/item_sardine', size: 32 },
  { key: 'item_yarn',    file: 'ui/item_yarn',    size: 32 },
  { key: 'item_catnip',  file: 'ui/item_catnip',  size: 32 },
  { key: 'item_collar',  file: 'ui/item_collar',  size: 32 },
  { key: 'item_fossil',  file: 'ui/item_fossil',  size: 32 },
];

/**
 * Terrain tile definitions (floors, walls, decorations)
 */
export const TERRAIN_DEFS = [
  // Floor tiles (A = base, B/C = texture variants for random tiling)
  { key: 'floor_grass',   file: 'floor_grass',   size: 32 },
  { key: 'floor_grass_b', file: 'floor_grass_b', size: 32 },
  { key: 'floor_grass_c', file: 'floor_grass_c', size: 32 },
  { key: 'floor_wheat',   file: 'floor_wheat',   size: 32 },
  { key: 'floor_wheat_b', file: 'floor_wheat_b', size: 32 },
  { key: 'floor_wheat_c', file: 'floor_wheat_c', size: 32 },
  { key: 'floor_sand',    file: 'floor_sand',    size: 32 },
  { key: 'floor_sand_b',  file: 'floor_sand_b',  size: 32 },
  { key: 'floor_sand_c',  file: 'floor_sand_c',  size: 32 },
  { key: 'floor_snow',    file: 'floor_snow',    size: 32 },
  { key: 'floor_snow_b',  file: 'floor_snow_b',  size: 32 },
  { key: 'floor_snow_c',  file: 'floor_snow_c',  size: 32 },
  { key: 'floor_stone',   file: 'floor_stone',   size: 32 },
  { key: 'floor_stone_b', file: 'floor_stone_b', size: 32 },
  { key: 'floor_stone_c', file: 'floor_stone_c', size: 32 },
  
  // Mycelium Hollow floor + wall tiles
  { key: 'floor_moss',   file: 'floor_moss',   size: 32 },
  { key: 'floor_moss_b', file: 'floor_moss_b', size: 32 },
  { key: 'floor_moss_c', file: 'floor_moss_c', size: 32 },
  { key: 'wall_mycelium', file: 'wall_mycelium', size: 32 },

  // Wall tiles
  { key: 'wall_brick',     file: 'wall_brick',     size: 32 },
  { key: 'wall_cobble',    file: 'wall_cobble',    size: 32 },

  // Newly added static wall boundaries
  { key: 'wall_hedge',      file: 'wall_hedge',      size: 32 },
  { key: 'wall_sandstone',  file: 'wall_sandstone',  size: 32 },
  { key: 'wall_obsidian',   file: 'wall_obsidian',   size: 32 },

  { key: 'wall_ice',       file: 'wall_ice',       size: 32 },
  
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

  // New decorations — Region 1 (Windmill Village)
  { key: 'decoration_windmill',      file: 'decoration_windmill',      size: { width: 32, height: 56 } },
  { key: 'decoration_hay_bale_b',    file: 'decoration_hay_bale_b',    size: { width: 32, height: 28 } },
  { key: 'decoration_wheat_stalk',   file: 'decoration_wheat_stalk',   size: { width: 32, height: 48 } },
  { key: 'decoration_sunflower',     file: 'decoration_sunflower',     size: { width: 32, height: 48 } },
  // Landmark — Region 1
  { key: 'landmark_windmill_mill',   file: 'landmark_windmill_mill',   size: { width: 160, height: 128 } },

  // New decorations — Region 0 (Village)
  { key: 'decoration_hay_bale',    file: 'decoration_hay_bale',    size: { width: 32, height: 24 } },
  { key: 'decoration_well',        file: 'decoration_well',        size: { width: 32, height: 40 } },
  { key: 'decoration_campfire',    file: 'decoration_campfire',    size: { width: 32, height: 40 } },
  // New decorations — Region 1 (Meadow)
  { key: 'decoration_vine',        file: 'decoration_vine',        size: { width: 32, height: 48 } },
  { key: 'decoration_clover',      file: 'decoration_clover',      size: 32 },
  // New decorations — Region 4 (Desert Dunes)
  { key: 'decoration_bones',       file: 'decoration_bones',       size: 32 },
  { key: 'decoration_tumbleweed',  file: 'decoration_tumbleweed',  size: 32 },
  // New decorations — Region 5 (Frostbite)
  { key: 'decoration_ice_crystal', file: 'decoration_ice_crystal', size: { width: 32, height: 48 } },
  { key: 'decoration_frost_flower',file: 'decoration_frost_flower',size: 32 },
  // New decorations — Region 6 (Shadow Castle)
  { key: 'decoration_skull',       file: 'decoration_skull',       size: 32 },
  { key: 'decoration_chains',      file: 'decoration_chains',      size: { width: 32, height: 48 } },
  { key: 'decoration_bookshelf',   file: 'decoration_bookshelf',   size: { width: 32, height: 48 } },

  // Decorations — Region 3 (Mycelium Hollow)
  { key: 'decoration_lily',        file: 'decoration_lily',        size: 32 },
  { key: 'landmark_mushroom_circle', file: 'landmark_mushroom_circle', size: { width: 160, height: 128 } },

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
  { key: 'backdrop_windmill', file: 'backdrop_windmill', size: { width: 800, height: 600 } },
  { key: 'backdrop_village', file: 'backdrop_village', size: { width: 800, height: 600 } },
  { key: 'backdrop_meadow',  file: 'backdrop_meadow',  size: { width: 800, height: 600 } },
  { key: 'backdrop_hollow',  file: 'backdrop_hollow',  size: { width: 800, height: 600 } },
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
    if (def.frames) {
      for (const suffix of def.frames) {
        loadSprite(scene, `${def.key}_${suffix}`, `${def.file}_${suffix}`, def.size);
      }
    }
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
