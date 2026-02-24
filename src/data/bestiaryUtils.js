/**
 * bestiaryUtils.js
 *
 * Shared utilities for the bestiary system.
 * Imported by both BestiaryScene (browser) and test_bestiary.mjs (Node),
 * so any enemy added to ENEMIES + REGIONS automatically appears in the
 * bestiary without touching BestiaryScene.js.
 */

/**
 * Build the canonical bestiary display order.
 *
 * Rule:
 *  • Each non-boss enemy type appears exactly once, at the first region
 *    whose enemySpawns list contains that ID.
 *  • The boss for each region is appended after all of that region's
 *    first-appearance non-boss enemies.
 *
 * @param {Array}  regions  – REGIONS array from src/data/regions/index.js
 * @param {Object} enemies  – ENEMIES object from src/data/enemies.js
 * @returns {string[]}  Ordered array of enemy type IDs
 */
export function buildCanonOrder(regions, enemies) {
  const globalSeen = new Set();
  const order      = [];

  for (const region of regions) {
    // Non-boss enemies: add on first global appearance only
    for (const spawn of region.enemySpawns) {
      if (!globalSeen.has(spawn.id) && enemies[spawn.id] && !enemies[spawn.id].isBoss) {
        globalSeen.add(spawn.id);
        order.push(spawn.id);
      }
    }
    // Boss: append last within this region's section
    if (region.boss && !globalSeen.has(region.boss) && enemies[region.boss]) {
      globalSeen.add(region.boss);
      order.push(region.boss);
    }
  }

  return order;
}

/**
 * Build a map from enemy ID → home region index.
 *
 * "Home region" is the first region whose enemySpawns list contains the ID,
 * or whose boss field equals the ID.  This replaces the old `region` field
 * that used to be stored directly on each enemy object.
 *
 * @param {Array}  regions  – REGIONS array from src/data/regions/index.js
 * @returns {Map<string, number>}  enemyId → regionIndex
 */
export function buildEnemyRegionMap(regions) {
  const map = new Map();
  regions.forEach((region, idx) => {
    for (const spawn of region.enemySpawns) {
      if (!map.has(spawn.id)) map.set(spawn.id, idx);
    }
    if (region.boss && !map.has(region.boss)) map.set(region.boss, idx);
  });
  return map;
}
