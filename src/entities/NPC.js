/**
 * NPC — a friendly wandering NPC sprite placed in the exploration scene.
 *
 * Unlike enemies the wizard roams the ENTIRE level — no home radius.
 * World bounds (set by ExploreScene) act as the only walls.
 *
 * Wander constants:
 *   - WANDER_SPEED  30 px/s (leisurely stroll)
 *   - 40 % chance to pause on each think tick
 *
 * Animation:
 *   - Walk frames A/B cycle every FRAME_MS ms while moving.
 *   - Idle: gentle vertical bob tween.
 *   - Gentle side-sway while walking (SWAY_DEG 5).
 */
import * as Phaser from 'phaser';

// ── Wander constants ─────────────────────────────────────────────────────────
const WANDER_SPEED  = 30;    // px / second while walking
const THINK_MIN_MS  = 1600;  // shortest wait between direction picks
const THINK_MAX_MS  = 3800;  // longest wait

// ── Animation constants ───────────────────────────────────────────────────────
const BOB_PX   = 4;    // vertical bob amplitude (px)
const BOB_MS   = 920;  // half-period of idle bob
const SWAY_DEG = 5;    // max rotation while walking (degrees)
const SWAY_MS  = 260;  // half-period of walking sway
const FRAME_MS = 450;  // ms between walk-frame texture swaps

export default class NPC {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} config
   *   config.spriteKey  – texture key for frame A (e.g. 'npc_wizard')
   *   config.spriteKeyB – texture key for frame B (e.g. 'npc_wizard_b')
   * @param {Function} onInteract
   *   Called with a `done` callback when Mimi overlaps the NPC.
   *   The caller should open a dialog and invoke `done()` when closed.
   */
  constructor(scene, x, y, config, onInteract) {
    this._scene       = scene;
    this._homeX       = x;
    this._homeY       = y;
    this._onInteract  = onInteract;
    this._canInteract = true;
    this._frameA      = true;

    this._spriteKeyA = config.spriteKey;
    this._spriteKeyB = config.spriteKeyB ?? config.spriteKey;

    // Physics-enabled sprite so overlap detection works
    this.sprite = scene.physics.add.image(x, y, this._spriteKeyA);
    this.sprite.setImmovable(true);
    this.sprite.body.allowGravity = false;
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(8);

    // Ground shadow
    this._shadow = scene.add.ellipse(x, y + 14, 26, 8, 0x000000, 0.25).setDepth(7);

    // Walking sway tween — starts paused, resumed while moving
    this._swayTween = scene.tweens.add({
      targets:  this.sprite,
      angle:    { from: -SWAY_DEG, to: SWAY_DEG },
      duration: SWAY_MS,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      paused:   true,
    });

    // Walk-frame timer — loops continuously
    this._frameTimer = scene.time.addEvent({
      delay:         FRAME_MS,
      loop:          true,
      callback:      this._toggleFrame,
      callbackScope: this,
    });

    this._bobTween = null;
    this._startBob();

    // Stagger first think so not all NPCs move simultaneously with enemies
    const firstDelay = 400 + Math.random() * THINK_MAX_MS;
    scene.time.delayedCall(firstDelay, this._think, [], this);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Swap between frame-A and frame-B textures. */
  _toggleFrame() {
    this._frameA = !this._frameA;
    this.sprite.setTexture(this._frameA ? this._spriteKeyA : this._spriteKeyB);
  }

  /** Create a fresh idle bob tween at the sprite's current Y. */
  _startBob() {
    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }
    const baseY = this.sprite.y;
    this._bobTween = this._scene.tweens.add({
      targets:  this.sprite,
      y:        baseY - BOB_PX,
      duration: BOB_MS + Math.random() * 200,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
  }

  _enterMoveAnim() {
    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }
    if (!this._swayTween.isPlaying()) this._swayTween.resume();
  }

  _enterIdleAnim() {
    if (this._swayTween.isPlaying()) {
      this._swayTween.pause();
      this.sprite.setAngle(0);
    }
    this._startBob();
  }

  /** AI tick: pick a random direction or pause. Re-schedules itself. */
  _think() {
    if (Math.random() < 0.40) {
      // Pause more often than enemies — wizards are unhurried
      this._stopMoving();
    } else {
      this._setVelocityAngle(Math.random() * Math.PI * 2);
    }

    const delay = THINK_MIN_MS + Math.random() * (THINK_MAX_MS - THINK_MIN_MS);
    this._scene.time.delayedCall(delay, this._think, [], this);
  }

  _setVelocityAngle(angle) {
    this.sprite.body.setVelocity(
      Math.cos(angle) * WANDER_SPEED,
      Math.sin(angle) * WANDER_SPEED,
    );
    this._enterMoveAnim();
  }

  _stopMoving() {
    this.sprite.body.setVelocity(0, 0);
    this._enterIdleAnim();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Called every frame by ExploreScene.update().
   * No home-clamp — wizard roams freely within world bounds.
   */
  update() {
    if (this._shadow) this._shadow.setPosition(this.sprite.x, this.sprite.y + 14);
    // Nothing to clamp — setCollideWorldBounds handles the walls.
  }

  /**
   * Register overlap with Mimi's physics sprite.
   * Call this after Mimi has been created.
   * @param {Phaser.Physics.Arcade.Image | Phaser.Physics.Arcade.Sprite} mimiBody
   */
  registerOverlap(mimiBody) {
    this._scene.physics.add.overlap(mimiBody, this.sprite, () => {
      if (this._canInteract) {
        this._canInteract = false;
        this._onInteract(() => {
          this._scene.time.delayedCall(1000, () => {
            this._canInteract = true;
          });
        });
      }
    });
  }

  /** Clean up tweens, timers, and sprite. */
  destroy() {
    if (this._frameTimer) this._frameTimer.remove(false);
    if (this._swayTween)  this._swayTween.stop();
    if (this._bobTween)   this._bobTween.stop();
    if (this._shadow)     this._shadow.destroy();
    this.sprite.destroy();
  }
}
