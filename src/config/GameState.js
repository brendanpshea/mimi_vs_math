/**
 * GameState — single source of truth for all persistent player data.
 *
 * Automatically persisted to localStorage on every call to save().
 * Import this module wherever you need to read or mutate player state.
 */

const SAVE_KEY = 'mimi_vs_math_save';

/**
 * Bump this whenever region enemy layouts change (spawns added/removed/reordered).
 * On load, if the stored version doesn't match, defeatedEnemies is cleared so
 * stale keys from old configs can't keep boss doors permanently locked.
 * All other progress (stats, inventory, bosses, currentRegion) is preserved.
 */
const SAVE_VERSION = 5;

const GameState = {
  // ── Player stats ──────────────────────────────────────────────────────
  hp: 12,
  maxHP: 12,  lives: 9,
  maxLives: 9,
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

  // ── Per-region star ratings (1–3; 0 = not yet cleared) ───────────────
  regionStars: {},

  // ── Hard-mode boss clears (region ids) ───────────────────────────────
  regionHardModeCleared: [],

  // ── Per-topic difficulty tiers (persisted) ────────────────────────────
  // key: topic string, value: tier 1–3 earned by the player
  topicTier: {},

  // ── Per-topic perfect-battle streak (session only — never persisted) ──
  // key: topic string, value: consecutive perfect battles at current tier
  topicPerfectStreak: {},

  // ── Per-region max difficulty reached this session (session only — never persisted) ──
  // key: regionId, value: highest difficulty tier (1–3) defeated by the player this run
  regionMaxDifficulty: {},

  // ── Bestiary: highest difficulty at which each enemy type was ever defeated ──
  // key: enemy type id; value: 1–3
  bestiaryHighestDifficulty: {},

  // ── Accessibility / audio preferences (persisted separately from game progress) ──
  // Timer multiplier: 1 = normal, 1.5 / 2 / 3 = extended time
  timeMult: 1.0,
  // Volume: 0 = mute, 0.25 = low, 0.5 = med, 0.75 = high (default), 1.0 = max
  musicVol: 0.75,
  // SFX volume: 0–1 linear Phaser SoundManager scale (default 1.0 = full)
  sfxVol: 1.0,

  // ── Interactive item pickup tracking (persisted) ──────────────────────
  // key: `${regionId}_${col}_${row}`, value: true when collected
  collectedItems: {},
  // ── NPC (Mewton) interaction tracking (persisted) ──────────────────────────
  // key: regionId, value: true when first visited
  npcVisited: {},
  // key: regionId, value: true when the wizard\'s boon has been received
  npcBoonReceived: {},

  // ── Bestiary tracking (persisted) ─────────────────────────────────────
  // key: enemy type id (e.g. 'counting_caterpillar'); set when battle starts
  seenEnemies: {},
  // key: enemy type id; set when Mimi wins a battle against that type
  defeatedEnemyTypes: {},
  // key: enemy type id; number of times the player has defeated that type
  bestiaryKillCounts: {},
  // ─────────────────────────────────────────────────────────────────────
  // Persistence
  // ─────────────────────────────────────────────────────────────────────

  save() {
    const data = {
      saveVersion:     SAVE_VERSION,
      hp:              this.hp,
      maxHP:           this.maxHP,
      lives:           this.lives,
      maxLives:        this.maxLives,
      stats:           this.stats,
      currentRegion:   this.currentRegion,
      defeatedBosses:  this.defeatedBosses,
      defeatedEnemies: this.defeatedEnemies,
      inventory:              this.inventory,
      bossIntroSeen:          this.bossIntroSeen,
      regionStars:            this.regionStars,
      regionHardModeCleared:  this.regionHardModeCleared,
      collectedItems:         this.collectedItems,
      npcVisited:             this.npcVisited,
      npcBoonReceived:        this.npcBoonReceived,
      seenEnemies:                this.seenEnemies,
      defeatedEnemyTypes:         this.defeatedEnemyTypes,
      bestiaryKillCounts:         this.bestiaryKillCounts,
      bestiaryHighestDifficulty:  this.bestiaryHighestDifficulty,
      topicTier:              this.topicTier,
      timeMult:               this.timeMult ?? 1.0,
      musicVol:               this.musicVol ?? 0.75,
      sfxVol:                 this.sfxVol  ?? 1.0,
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
      if (!this.bossIntroSeen)          this.bossIntroSeen = [];
      if (!this.regionStars)            this.regionStars = {};
      if (!this.regionHardModeCleared)  this.regionHardModeCleared = [];
      if (!this.collectedItems)         this.collectedItems = {};
      if (!this.npcVisited)             this.npcVisited = {};
      if (!this.npcBoonReceived)        this.npcBoonReceived = {};
      if (!this.seenEnemies)                   this.seenEnemies = {};
      if (!this.defeatedEnemyTypes)            this.defeatedEnemyTypes = {};
      if (!this.bestiaryKillCounts)            this.bestiaryKillCounts = {};
      if (!this.bestiaryHighestDifficulty)     this.bestiaryHighestDifficulty = {};
      if (!this.topicTier)              this.topicTier = {};
      // topicPerfectStreak is session-only — always reset on load
      this.topicPerfectStreak = {};
      // Strip legacy topicAccuracy field from old saves
      delete this.topicAccuracy;
      if (this.timeMult === undefined)  this.timeMult = 1.0;
      if (this.musicVol === undefined)   this.musicVol = 0.75;
      if (this.sfxVol   === undefined)   this.sfxVol   = 1.0;
      // Ensure lives field exists for saves that predate this feature
      if (this.lives    === undefined) this.lives    = 9;
      if (this.maxLives === undefined) this.maxLives = 9;
      if (!this.stats) this.stats = {
        answered: 0, correct: 0, incorrect: 0, totalTimeMs: 0,
        bestStreak: 0, battlesWon: 0, battlesLost: 0, perfectBattles: 0,
      };
      // Strip legacy level/xp/mathPower fields from old saves
      delete this.xp;
      delete this.level;
      delete this.mathPower;
      // Version migration: if the save predates the current enemy layout,
      // clear defeatedEnemies so stale keys can't lock boss doors forever.
      // All other progress (stats, bosses, inventory, region) is kept.
      if ((data.saveVersion ?? 0) !== SAVE_VERSION) {
        this.defeatedEnemies = {};
        this.save();  // write the migrated save immediately
      }
      return true;
    } catch {
      return false;
    }
  },

  reset() {
    this.hp              = 12;
    this.maxHP           = 12;
    this.lives           = 9;
    this.maxLives        = 9;
    this.stats           = {
      answered: 0, correct: 0, incorrect: 0, totalTimeMs: 0,
      bestStreak: 0, battlesWon: 0, battlesLost: 0, perfectBattles: 0,
    };
    this.currentRegion   = 0;
    this.defeatedBosses  = [];
    this.defeatedEnemies = {};
    this.inventory       = {};
    this.bossIntroSeen          = [];
    this.regionStars            = {};
    this.regionHardModeCleared  = [];
    this.activeEffects          = { timerBonus: 0, doubleHit: false, shield: false, hintCharges: 0 };
    this.topicTier              = {};
    this.topicPerfectStreak     = {};
    this.collectedItems         = {};
    this.npcVisited             = {};
    this.npcBoonReceived        = {};
    this.seenEnemies                = {};
    this.defeatedEnemyTypes         = {};
    this.bestiaryKillCounts         = {};
    this.bestiaryHighestDifficulty  = {};
    this.regionMaxDifficulty        = {};
    // timeMult is an accessibility preference — intentionally NOT reset by new-game
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

  // ── Bestiary helpers ─────────────────────────────────────────────────
  markEnemySeen(id) {
    if (this.seenEnemies?.[id]) return;
    if (!this.seenEnemies) this.seenEnemies = {};
    this.seenEnemies[id] = true;
    this.save();
  },
  markEnemyDefeated(id) {
    if (!this.defeatedEnemyTypes) this.defeatedEnemyTypes = {};
    if (!this.seenEnemies)        this.seenEnemies = {};
    if (!this.bestiaryKillCounts) this.bestiaryKillCounts = {};
    // Record that this type was defeated (boolean) and increment the counter.
    this.defeatedEnemyTypes[id] = true;
    this.seenEnemies[id]        = true;
    this.bestiaryKillCounts[id]  = (this.bestiaryKillCounts[id] || 0) + 1;
    this.save();
  },
  /** Increment the stored kill count for an enemy type. */
  incrementKillCount(id, by = 1) {
    if (!this.bestiaryKillCounts) this.bestiaryKillCounts = {};
    this.bestiaryKillCounts[id] = (this.bestiaryKillCounts[id] || 0) + (by || 0);
    this.save();
  },
  /** Return number of times this enemy type has been defeated (0 if none). */
  getKillCount(id) {
    return this.bestiaryKillCounts?.[id] || 0;
  },
  hasSeenEnemy(id)         { return !!this.seenEnemies?.[id]; },
  hasDefeatedEnemyType(id) { return !!this.defeatedEnemyTypes?.[id]; },

  // ── Bestiary highest-difficulty helpers ──────────────────────────────
  /** Record the difficulty tier at which this enemy type was defeated — only improves. */
  recordEnemyHighestDifficulty(enemyId, diff) {
    if (!this.bestiaryHighestDifficulty) this.bestiaryHighestDifficulty = {};
    const prev = this.bestiaryHighestDifficulty[enemyId] ?? 0;
    if (diff > prev) {
      this.bestiaryHighestDifficulty[enemyId] = diff;
      this.save();
    }
  },
  /** Return the highest difficulty tier at which this enemy was ever defeated (0 if never). */
  getEnemyHighestDifficulty(enemyId) {
    return this.bestiaryHighestDifficulty?.[enemyId] ?? 0;
  },

  // ── Session region-max-difficulty helpers (never persisted) ──────────
  /** Record the highest difficulty tier the player has defeated in a region this session. */
  recordRegionMaxDifficulty(regionId, diff) {
    if (!this.regionMaxDifficulty) this.regionMaxDifficulty = {};
    const prev = this.regionMaxDifficulty[regionId] ?? 0;
    if (diff > prev) this.regionMaxDifficulty[regionId] = diff;
    // intentionally not saved — session-only
  },
  /** Return the highest difficulty tier defeated in this region this session (0 if none). */
  getRegionMaxDifficulty(regionId) {
    return this.regionMaxDifficulty?.[regionId] ?? 0;
  },

  /** True if a specific enemy (by composite key) has been defeated. */
  isEnemyDefeated(regionId, enemyId) {
    return !!this.defeatedEnemies[`r${regionId}_${enemyId}`];
  },

  /**
   * Spend one life.  Returns true if a life was available and consumed,
   * false if no lives remain (real defeat).
   */
  useLife() {
    if (this.lives <= 0) return false;
    this.lives = Math.max(0, this.lives - 1);
    this.hp    = this.maxHP;   // full restore on life use
    this.save();
    return true;
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

  // ─────────────────────────────────────────────────────────────────────
  // Adaptive difficulty helpers (per-topic tier system)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Return the current difficulty tier (1–3) the player has earned for a topic.
   * The floor (e.g. from a spawn's difficultyOverride) is applied so enemies in
   * later regions that are always hard are never shown below their intended tier.
   */
  getTopicTier(topic, floor = 1) {
    return Math.max(this.topicTier[topic] ?? 1, floor);
  },

  /**
   * Record the outcome of a battle for adaptive difficulty.
   * Three consecutive perfect battles at the current tier → advance to next tier.
   * Any non-perfect battle resets the consecutive streak.
   *
   * Only battles fought at or above the player's current tier count toward
   * advancement (fighting weak enemies below your tier doesn't help).
   *
   * @param {string}  topic    - mathTopic of the enemy fought
   * @param {number}  tier     - difficulty tier at which the enemy was fought (1–3)
   * @param {boolean} perfect  - true if zero wrong answers in the battle
   */
  recordTopicBattle(topic, tier, perfect) {
    const currentTier = this.topicTier[topic] ?? 1;
    if (tier < currentTier) return;   // below current tier — doesn't count
    if (perfect) {
      const streak = (this.topicPerfectStreak[topic] ?? 0) + 1;
      if (streak >= 3 && currentTier < 3) {
        this.topicTier[topic]          = currentTier + 1;
        this.topicPerfectStreak[topic] = 0;
        this.save();   // persist the tier advancement
      } else {
        this.topicPerfectStreak[topic] = streak;
        // streak is session-only — no save() needed
      }
    } else {
      this.topicPerfectStreak[topic] = 0;   // reset streak, no tier change
    }
  },

  /**
   * Regress the topic tier by one step (called on hard defeat vs D2/D3 enemy).
   * The perfect streak for the lower tier also resets.
   */
  regressTopicTier(topic) {
    const currentTier = this.topicTier[topic] ?? 1;
    if (currentTier > 1) {
      this.topicTier[topic]          = currentTier - 1;
      this.topicPerfectStreak[topic] = 0;
      this.save();   // persist the regression
    }
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

  /** Return star count (0–3) for a region; 0 = not yet cleared. */
  getRegionStars(regionId) {
    return this.regionStars[regionId] ?? 0;
  },

  /** Update stored stars — only improves, never decreases. */
  setRegionStars(regionId, stars) {
    const prev = this.regionStars[regionId] ?? 0;
    if (stars > prev) this.regionStars[regionId] = stars;
    this.save();
  },

  /** True if the player has beaten hard mode for the given region. */
  hasDefeatedBossHardMode(regionId) {
    return this.regionHardModeCleared.includes(regionId);
  },

  /** Mark a region's hard-mode boss as defeated. */
  defeatBossHardMode(regionId) {
    if (!this.regionHardModeCleared.includes(regionId)) {
      this.regionHardModeCleared.push(regionId);
    }
    this.save();
  },

  /** Reset battle-only effects at the start of each battle. */
  resetEffects() {
    this.activeEffects = { timerBonus: 0, doubleHit: false, shield: false, hintCharges: 0 };
  },
};

export default GameState;
