/**
 * MewtonDialogue — encapsulates all NPC conversation logic for Mewton the
 * wizard cat.  Extracted from ExploreScene to keep the scene thin.
 *
 * Usage:
 *   const mewton = new MewtonDialogue(scene, regionData, {
 *     onItemGiven: (itemId) => { this._showPickupToast(itemId); this.hud.refresh(); },
 *   });
 *
 *   // Show a pulsing beacon above the wizard's start tile
 *   mewton.showBeacon(px, py);
 *
 *   // Remove the beacon on first contact
 *   mewton.hideBeacon();
 *
 *   // Start the conversation
 *   mewton.talk(done, { bossBeaten, allClear });
 */
import GameState from '../config/GameState.js';
import ITEMS     from '../data/items.js';
import NPC_JOKES from '../data/npcJokes.json' with { type: 'json' };

export default class MewtonDialogue {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} regionData  - the current region's config object
   * @param {object} [opts]
   * @param {Function} [opts.onItemGiven]  - called with itemId after a treat is given
   */
  constructor(scene, regionData, { onItemGiven } = {}) {
    this._scene       = scene;
    // dialog is resolved lazily via this._dlg so it is always available even
    // when this constructor runs before scene.dialog has been created.
    this._rd          = regionData;
    this._onItemGiven = onItemGiven ?? (() => {});
    this._treatGiven  = false;   // resets every ExploreScene visit (new instance)
    this._beacon      = null;    // array of GameObjects, or null
  }

  /** Lazy reference — safe to call any time after scene.create() runs. */
  get _dlg() { return this._scene.dialog; }

  // ── Beacon ──────────────────────────────────────────────────────────────

  /**
   * Creates a pulsing gold orb above the wizard's tile so the player can
   * spot him before making first contact.
   * @param {number} px  world-space pixel X
   * @param {number} py  world-space pixel Y
   */
  showBeacon(px, py) {
    if (this._beacon) return;   // already shown
    const orbY = py - 28;
    const orb = this._scene.add.circle(px, orbY, 6, 0xFFDD44, 0.85)
      .setDepth(22).setScrollFactor(1);

    this._scene.tweens.add({
      targets: orb, y: orbY - 6,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this._scene.tweens.add({
      targets: orb, alpha: { from: 0.55, to: 0.95 },
      duration: 900, yoyo: true, repeat: -1,
    });

    this._beacon = [orb];
  }

  /** Removes the beacon (called on first player contact). */
  hideBeacon() {
    if (!this._beacon) return;
    this._beacon.forEach(o => o.destroy());
    this._beacon = null;
  }

  // ── Main entry point ────────────────────────────────────────────────────

  /**
   * Shows a context-aware greeting then the player-driven topic menu.
   * @param {Function} done
   * @param {object}   flags - { bossBeaten, allClear }
   */
  talk(done, { bossBeaten, allClear } = {}) {
    const rid        = this._rd.id;
    const firstVisit = !GameState.npcVisited?.[rid];

    if (!GameState.npcVisited) GameState.npcVisited = {};
    GameState.npcVisited[rid] = true;
    GameState.save();

    let greeting;
    if (bossBeaten) {
      greeting = `You defeated ${this._rd.bossName ?? 'the boss'}! I knew you would manage it.\n\n...I had a contingency plan. We do not need to discuss the contingency plan.`;
    } else if (allClear) {
      greeting = `Every enemy cleared — boss door is open.\n\nI predicted this. 50% probability still counts.`;
    } else if (firstVisit) {
      greeting = `Ah — Mimi! I'm Mewton. Wizard and cat-genius.\n\nWhat can I do for you?`;
    } else {
      greeting = `Back again? The boss won't defeat itself.\n\nCan I help?`;
    }

    this._dlg.show(greeting, () => {
      const labels = [
        '😂 Tell me a joke',
        '📖 About the boss',
        ...(!this._treatGiven ? ['🐟 Can I have a treat?'] : []),
        '👋 All good, thanks!',
      ];
      this._dlg.showChoice('What would you like to know?', labels, (idx) => {
        const treatIdx = this._treatGiven ? -1 : 2;
        const byeIdx   = labels.length - 1;
        if      (idx === 0)        this._joke(done);
        else if (idx === 1)        this._bossStory(done);
        else if (idx === treatIdx) this._treat(done);
        else                       done();
      }, '🧙 Mewton', 'npc_wizard');
    }, '🧙 Mewton', 'npc_wizard');
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /** Chains an array of dialog pages sequentially, then calls onDone. */
  _chain(pages, onDone) {
    if (!pages || pages.length === 0) { onDone?.(); return; }
    const [first, ...rest] = pages;
    this._dlg.show(first,
      () => this._chain(rest, onDone),
      '🧙 Mewton', 'npc_wizard');
  }

  /** Tells a random joke from npcJokes.json then calls done. */
  _joke(done) {
    const joke = NPC_JOKES[Math.floor(Math.random() * NPC_JOKES.length)];
    this._dlg.show(joke.setup, () => {
      this._dlg.show(joke.punchline, done, '🧙 Mewton', 'npc_wizard');
    }, '🧙 Mewton', 'npc_wizard');
  }

  /** Shows the 2-page boss background story then calls done. */
  _bossStory(done) {
    this._chain(this._rd.npcBossStory ?? [this._rd.npcHint], done);
  }

  /**
   * Gives Mimi the region boon item as a treat — once per ExploreScene visit.
   * @param {Function} done
   */
  _treat(done) {
    const boonId = this._rd.npcBoon;
    const item   = ITEMS[boonId];

    if (!item) {
      this._dlg.show(
        "Hmm — I seem to have misplaced my treat supply. Come back another time!",
        done, '🧙 Mewton', 'npc_wizard',
      );
      return;
    }

    this._treatGiven = true;
    GameState.addItem(boonId);
    GameState.save();
    this._onItemGiven(boonId);

    this._dlg.show(
      `Here — take this. Don't tell anyone I'm a soft touch.\n\n${item.emoji ?? '✨'} ${item.name} — ${item.description}`,
      done, '🧙 Mewton', 'npc_wizard',
    );
  }
}
