/**
 * GameState — single source of truth for all persistent player data.
 *
 * Automatically persisted to localStorage on every call to save().
 * Import this module wherever you need to read or mutate player state.
 */

const SAVE_KEY = 'mimi_vs_math_save';

const GameState = {
  // ── Player stats ──────────────────────────────────────────────────────
  hp: 12,
  maxHP: 12,
  xp: 0,
  level: 1,
  mathPower: 1.0,      // damage multiplier; increases with level

  // ── World progress ────────────────────────────────────────────────────
  currentRegion: 0,
  defeatedBosses: [],  // array of region ids whose boss has been beaten

  // ── Enemy tracking (per region) ───────────────────────────────────────
  // key: `r${regionId}_${enemyId}`, value: true when defeated in current visit
  defeatedEnemies: {},

  // ── Inventory ─────────────────────────────────────────────────────────
  // key: item id, value: count
  inventory: {},

  // ── Active battle modifiers (reset between battles) ───────────────────
  activeEffects: {
    timerBonus: 0,      // extra seconds
    doubleHit: false,   // catnip
    shield: false,      // lucky collar
    hintCharges: 0,     // fish fossil
  },

  // ─────────────────────────────────────────────────────────────────────
  // Persistence
  // ─────────────────────────────────────────────────────────────────────

  save() {
    const data = {
      hp:              this.hp,
      maxHP:           this.maxHP,
      xp:              this.xp,
      level:           this.level,
      mathPower:       this.mathPower,
      currentRegion:   this.currentRegion,
      defeatedBosses:  this.defeatedBosses,
      defeatedEnemies: this.defeatedEnemies,
      inventory:       this.inventory,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  },

  load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      Object.assign(this, data);
      return true;
    } catch {
      return false;
    }
  },

  reset() {
    this.hp              = 12;
    this.maxHP           = 12;
    this.xp              = 0;
    this.level           = 1;
    this.mathPower       = 1.0;
    this.currentRegion   = 0;
    this.defeatedBosses  = [];
    this.defeatedEnemies = {};
    this.inventory       = {};
    this.activeEffects   = { timerBonus: 0, doubleHit: false, shield: false, hintCharges: 0 };
    this.save();
  },

  // ─────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────

  /** True if the player has defeated the boss of the given region id. */
  hasDefeatedBoss(regionId) {
    return this.defeatedBosses.includes(regionId);
  },

  /** Mark a region's boss as defeated and unlock the next region. */
  defeatBoss(regionId) {
    if (!this.defeatedBosses.includes(regionId)) {
      this.defeatedBosses.push(regionId);
    }
    this.save();
  },

  /** True if a specific enemy (by composite key) has been defeated. */
  isEnemyDefeated(regionId, enemyId) {
    return !!this.defeatedEnemies[`r${regionId}_${enemyId}`];
  },

  defeatEnemy(regionId, enemyId) {
    this.defeatedEnemies[`r${regionId}_${enemyId}`] = true;
    this.save();
  },

  /** Add XP and handle level-up. Returns true if levelled up. */
  addXP(amount) {
    this.xp += amount;
    const xpNeeded = this.level * 50;
    if (this.xp >= xpNeeded) {
      this.level      += 1;
      this.mathPower  = Math.round((this.mathPower + 0.1) * 10) / 10;
      this.xp         -= xpNeeded;
      this.save();
      return true;
    }
    this.save();
    return false;
  },

  /** Add an item to inventory. */
  addItem(itemId) {
    this.inventory[itemId] = (this.inventory[itemId] || 0) + 1;
    this.save();
  },

  /** Use an item (decrement count). Returns false if not available. */
  useItem(itemId) {
    if (!this.inventory[itemId] || this.inventory[itemId] <= 0) return false;
    this.inventory[itemId] -= 1;
    if (this.inventory[itemId] === 0) delete this.inventory[itemId];
    this.save();
    return true;
  },

  /** Reset battle-only effects at the start of each battle. */
  resetEffects() {
    this.activeEffects = { timerBonus: 0, doubleHit: false, shield: false, hintCharges: 0 };
  },
};

export default GameState;
