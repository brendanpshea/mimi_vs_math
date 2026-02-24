/**
 * bestiaryUtils.js
 *
 * Shared utility for building the canonical bestiary display order.
 * Imported by both BestiaryScene (browser) and test_bestiary.mjs (Node),
 * so any enemy added to ENEMIES + REGIONS automatically appears in the
 * bestiary without touching BestiaryScene.js.
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
