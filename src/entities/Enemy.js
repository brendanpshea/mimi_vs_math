/**
 * Enemy — an enemy sprite placed in the exploration scene.
 *
 * Wanders randomly near its spawn point and plays idle/walk animations
 * through tween-based squash-sway.  Initiates a battle when Mimi touches it.
 *
 * Wander behaviour:
 *   - Picks a random direction every THINK_MIN..THINK_MAX ms.
 *   - Has a 30 % chance to pause instead of walking.
 *   - If it drifts beyond WANDER_RADIUS from home it immediately steers back.
 *
 * Animation:
 *   - Idle  : vertical bob tween (created/restarted from current y each stop).
 *   - Moving: side-sway tween (angle ±SWAY_DEG at SWAY_MS per half-cycle).
 */
import * as Phaser from 'phaser';

// ── Wander constants ─────────────────────────────────────────────────────────
const WANDER_RADIUS = 80;   // max px from spawn before forced turn-back
const WANDER_SPEED  = 44;   // px / second while walking
const THINK_MIN_MS  = 1200; // shortest wait between direction decisions
const THINK_MAX_MS  = 3000; // longest wait

// ── Animation constants ───────────────────────────────────────────────────────
const BOB_PX    = 6;   // vertical bob amplitude (px)
const BOB_MS    = 800; // half-period of the idle bob
const SWAY_DEG  = 7;   // max rotation while walking (degrees)
const SWAY_MS   = 210; // half-period of the sway rock

export default class Enemy {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} data  – entry from enemies.js
   * @param {Function} onTouch – called when Mimi overlaps this enemy
   */
  constructor(scene, x, y, data, onTouch) {
    this.data     = data;
    this.scene    = scene;
    this._touched = false;
    this._homeX   = x;
    this._homeY   = y;

    this.sprite = scene.physics.add.image(x, y, data.spriteKey);
    this.sprite.setImmovable(true);
    this.sprite.body.allowGravity = false;
    this.sprite.setDepth(8);

    // Tint sprite body by difficulty so players can gauge threat at a glance.
    // Bosses are visually distinct already — skip tinting them.
    if (!data.isBoss) {
      const TINTS = { 1: 0xAAFFBB, 2: 0xFFCC88, 3: 0xFF9999 };
      this.sprite.setTint(TINTS[data.difficulty] ?? 0xFFFFFF);
    }

    // Walking sway tween — starts paused, activated while moving
    this._swayTween = scene.tweens.add({
      targets:  this.sprite,
      angle:    { from: -SWAY_DEG, to: SWAY_DEG },
      duration: SWAY_MS,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      paused:   true,
    });

    // Idle bob — created fresh at current position each time we stop
    this._bobTween = null;
    this._startBob();

    // Stagger the first direction pick so all enemies don't move at once
    const firstDelay = Math.random() * THINK_MAX_MS;
    scene.time.delayedCall(firstDelay, this._think, [], this);

    this._onTouch = onTouch;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Create a fresh bob tween anchored at the sprite's current y. */
  _startBob() {
    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }
    const baseY = this.sprite.y;
    this._bobTween = this.scene.tweens.add({
      targets:  this.sprite,
      y:        baseY - BOB_PX,
      duration: BOB_MS + Math.random() * 200,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
  }

  /** Switch to moving-animation state. */
  _enterMoveAnim() {
    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }
    if (!this._swayTween.isPlaying()) {
      this._swayTween.resume();
    }
  }

  /** Switch to idle-animation state. */
  _enterIdleAnim() {
    if (this._swayTween.isPlaying()) {
      this._swayTween.pause();
      this.sprite.setAngle(0);
    }
    this._startBob();
  }

  /** AI tick: pick a new direction (or pause). Re-schedules itself. */
  _think() {
    if (this._touched) return;

    const dx   = this._homeX - this.sprite.x;
    const dy   = this._homeY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > WANDER_RADIUS * 0.75) {
      // Getting too far — steer back home
      this._setVelocityAngle(Math.atan2(dy, dx));
    } else if (Math.random() < 0.30) {
      // Pause for a moment
      this._stopMoving();
    } else {
      // Wander in a random direction
      this._setVelocityAngle(Math.random() * Math.PI * 2);
    }

    const delay = THINK_MIN_MS + Math.random() * (THINK_MAX_MS - THINK_MIN_MS);
    this.scene.time.delayedCall(delay, this._think, [], this);
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
   * Enforces the home-clamp so the enemy never drifts too far.
   */
  update() {
    if (this._touched) return;

    const dx   = this._homeX - this.sprite.x;
    const dy   = this._homeY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > WANDER_RADIUS) {
      // Hard clamp: redirect toward home immediately
      this._setVelocityAngle(Math.atan2(dy, dx));
    }
  }

  /** Register Mimi overlap. Call after Mimi is created. */
  registerOverlap(mimiBody) {
    this.scene.physics.add.overlap(mimiBody, this.sprite, () => {
      if (!this._touched) {
        this._touched = true;
        this._stopMoving();
        this._onTouch(this.data);
      }
    });
  }

  /** Remove this enemy from the scene (after defeat). */
  destroy() {
    if (this._swayTween) this._swayTween.stop();
    if (this._bobTween)  this._bobTween.stop();
    this.sprite.destroy();
  }

  get alive() { return !this._touched; }
}
