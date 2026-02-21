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

  // ── Lifetime stats ────────────────────────────────────────────────────
  stats: {
    answered:       0,   // total questions seen
    correct:        0,
    incorrect:      0,
    totalTimeMs:    0,   // sum of answer times (ms) for avg calculation
    bestStreak:     0,   // all-time best answer streak
    battlesWon:     0,
    battlesLost:    0,
    perfectBattles: 0,   // won with zero wrong answers
  },

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

  // ── Boss intro cutscene tracking ──────────────────────────────────────
  // Stores region ids whose boss intro has already been shown this save.
  bossIntroSeen: [],

  // ─────────────────────────────────────────────────────────────────────
  // Persistence
  // ─────────────────────────────────────────────────────────────────────

  save() {
    const data = {
      hp:              this.hp,
      maxHP:           this.maxHP,
      stats:           this.stats,
      currentRegion:   this.currentRegion,
      defeatedBosses:  this.defeatedBosses,
      defeatedEnemies: this.defeatedEnemies,
      inventory:       this.inventory,
      bossIntroSeen:   this.bossIntroSeen,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  },

  load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      Object.assign(this, data);
      // Ensure fields added after old saves exist
      if (!this.bossIntroSeen) this.bossIntroSeen = [];
      if (!this.stats) this.stats = {
        answered: 0, correct: 0, incorrect: 0, totalTimeMs: 0,
        bestStreak: 0, battlesWon: 0, battlesLost: 0, perfectBattles: 0,
      };
      // Strip legacy level/xp/mathPower fields from old saves
      delete this.xp;
      delete this.level;
      delete this.mathPower;
      return true;
    } catch {
      return false;
    }
  },

  reset() {
    this.hp              = 12;
    this.maxHP           = 12;
    this.stats           = {
      answered: 0, correct: 0, incorrect: 0, totalTimeMs: 0,
      bestStreak: 0, battlesWon: 0, battlesLost: 0, perfectBattles: 0,
    };
    this.currentRegion   = 0;
    this.defeatedBosses  = [];
    this.defeatedEnemies = {};
    this.inventory       = {};
    this.bossIntroSeen   = [];
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

  /** Remove all defeated-enemy records for a region (called on Mimi's defeat). */
  clearRegionEnemies(regionId) {
    const prefix = `r${regionId}_`;
    for (const key of Object.keys(this.defeatedEnemies)) {
      if (key.startsWith(prefix)) delete this.defeatedEnemies[key];
    }
    this.save();
  },

  /** Record a single question result. timeMs is the time taken to answer. */
  recordAnswer(correct, timeMs) {
    this.stats.answered++;
    if (correct) this.stats.correct++;
    else         this.stats.incorrect++;
    this.stats.totalTimeMs += (timeMs || 0);
    // save() is intentionally skipped per-answer for performance;
    // _endBattle calls save() once at the end of each battle.
  },

  /** Record end-of-battle outcome and update best streak. */
  recordBattle(won, perfect, streak) {
    if (won) {
      this.stats.battlesWon++;
      if (perfect) this.stats.perfectBattles++;
    } else {
      this.stats.battlesLost++;
    }
    if ((streak ?? 0) > this.stats.bestStreak) {
      this.stats.bestStreak = streak;
    }
    this.save();
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
