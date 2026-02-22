/**
 * Enemy — an enemy sprite placed in the exploration scene.
 *
 * Behaviour modes:
 *   patrol — walks between two fixed waypoints (home ↔ a nearby point),
 *            pausing briefly at each end.  Default mode.
 *   aggro  — when Mimi enters AGGRO_RADIUS, the enemy breaks off patrol and
 *            chases her directly.  Breaks off once she exceeds AGGRO_LEASH.
 *
 * Animation:
 *   - Moving: alternates spriteKey / spriteKey_b every STEP_MS (walk/fly cycle)
 *             with a 2px step-bob synced to the frame swap.
 *   - Idle  : locks to frame A and resumes the gentle float bob.
 *   - Sprite flips horizontally to face the direction of travel.
 */
import * as Phaser from 'phaser';

// ── Movement constants ──────────────────────────────────────────────────────
const PATROL_SPEED  = 44;   // px / second on patrol legs
const AGGRO_SPEED   = 72;   // px / second when chasing Mimi (less than Mimi's 160)
const AGGRO_RADIUS  = 120;  // px — Mimi detection range
const AGGRO_LEASH   = 200;  // px — break-off range (must be > AGGRO_RADIUS)
const WANDER_RADIUS = 90;   // px — hard clamp: never drift farther from home
const THINK_MIN_MS  = 900;  // shortest re-think interval
const THINK_MAX_MS  = 2200; // longest re-think interval
const WAYPOINT_NEAR = 14;   // px — "arrived at waypoint" threshold
const PATROL_PAUSE  = 700;  // ms to stand still at each waypoint end

// ── Animation constants ───────────────────────────────────────────────────────
const STEP_MS   = 200; // ms between walk-frame flips (A → B → A …)
const STEP_BOB  = 2;   // px the body drops on the contact frame

// Eight compass directions (N/NE/E/SE/S/SW/W/NW) for cardinal-snap movement
const DIRECTIONS = [
  0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4,
  Math.PI, -3 * Math.PI / 4, -Math.PI / 2, -Math.PI / 4,
];

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

    // Ground shadow
    this._shadow = scene.add.ellipse(x, y + 16, 28, 9, 0x000000, 0.25).setDepth(7);

    // Tint sprite body by difficulty so players can gauge threat at a glance.
    // Bosses are visually distinct already — skip tinting them.
    if (!data.isBoss) {
      const TINTS = { 1: 0xAAFFBB, 2: 0xFFCC88, 3: 0xFF9999 };
      this.sprite.setTint(TINTS[data.difficulty] ?? 0xFFFFFF);
    }

    // Idle bob — subtle float when standing still; paused while walking
    this._bobTween = scene.tweens.add({
      targets:  this.sprite,
      y:        { from: y - 3, to: y + 3 },
      duration: Phaser.Math.Between(1200, 2000),
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
      delay:    Phaser.Math.Between(0, 1000),
    });

    // Patrol waypoints: A = spawn (home), B = a fixed offset in a random 8-way direction
    const patrolAngle  = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const patrolDist   = 52 + Math.random() * 26; // 52–78 px from home
    this._waypoints = [
      { x, y },
      { x: x + Math.cos(patrolAngle) * patrolDist,
        y: y + Math.sin(patrolAngle) * patrolDist },
    ];
    this._wpIdx      = 0;        // index of the waypoint we're currently walking toward
    this._mode       = 'patrol'; // 'patrol' | 'aggro'
    this._mimiSprite = null;     // set via setMimi() after construction

    // Two-frame walk cycle — flips between spriteKey and spriteKey_b
    this._stepFrame     = 0;
    this._stepBobOffset = 0; // net px currently applied as step-bob
    this._stepTimer = scene.time.addEvent({
      delay:         STEP_MS,
      callback:      this._onStep,
      callbackScope: this,
      loop:          true,
    });

    // Stagger the first patrol leg so all enemies don't set off simultaneously
    const firstDelay = Math.random() * 1500;
    scene.time.delayedCall(firstDelay, this._think, [], this);

    this._onTouch = onTouch;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Called every STEP_MS by the step timer.
   * Advances the walk frame while the body is moving; resets to frame A while idle.
   */
  _onStep() {
    const body = this.sprite.body;
    const isMoving = body &&
      (Math.abs(body.velocity.x) > 1 || Math.abs(body.velocity.y) > 1);

    if (isMoving) {
      this._stepFrame = 1 - this._stepFrame;

      // Step-bob: drop on the contact frame (B), rise back on the lift frame (A)
      const targetBob = this._stepFrame === 1 ? STEP_BOB : 0;
      const delta     = targetBob - this._stepBobOffset;
      this.sprite.y  += delta;
      this._stepBobOffset = targetBob;
    } else {
      this._stepFrame = 0;
      // Undo any residual bob offset when we stop
      if (this._stepBobOffset !== 0) {
        this.sprite.y      -= this._stepBobOffset;
        this._stepBobOffset = 0;
      }
    }

    const key = this._stepFrame === 1
      ? `${this.data.spriteKey}_b`
      : this.data.spriteKey;

    if (this.scene.textures.exists(key)) {
      this.sprite.setTexture(key);
    }
  }

  /** Switch to moving-animation state. */
  _enterMoveAnim() {
    if (this._bobTween.isPlaying()) this._bobTween.pause();
  }

  /** Switch to idle-animation state. */
  _enterIdleAnim() {
    if (!this._bobTween.isPlaying()) this._bobTween.resume();
  }

  /**
   * Patrol AI tick — drives movement between the two waypoints.
   * Ignored while aggroing (mode check at top).
   */
  _think() {
    if (this._touched || this._mode !== 'patrol') return;

    const wp   = this._waypoints[this._wpIdx];
    const dx   = wp.x - this.sprite.x;
    const dy   = wp.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < WAYPOINT_NEAR) {
      // Arrived at this waypoint — pause, then head to the other one
      this._stopMoving();
      this._wpIdx = 1 - this._wpIdx;
      this.scene.time.delayedCall(PATROL_PAUSE, this._think, [], this);
    } else {
      // Walk toward waypoint; re-check position after a think interval
      this._setVelocityAngle(Math.atan2(dy, dx), PATROL_SPEED);
      const delay = THINK_MIN_MS + Math.random() * (THINK_MAX_MS - THINK_MIN_MS);
      this.scene.time.delayedCall(delay, this._think, [], this);
    }
  }

  /** Set velocity at the given angle and speed (defaults to PATROL_SPEED). */
  _setVelocityAngle(angle, speed = PATROL_SPEED) {
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.sprite.body.setVelocity(vx, vy);
    // Flip horizontally so the sprite faces its direction of travel
    if (Math.abs(vx) > 0.5) this.sprite.setFlipX(vx < 0);
    this._enterMoveAnim();
  }

  _stopMoving() {
    this.sprite.body.setVelocity(0, 0);
    this._enterIdleAnim();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Called every frame by ExploreScene.update().
   * Handles aggro detection/release and the patrol home-clamp.
   */
  update() {
    if (this._shadow) this._shadow.setPosition(this.sprite.x, this.sprite.y + 16);
    if (this._touched) return;

    // ── Aggro / leash logic ────────────────────────────────────────────────
    if (this._mimiSprite) {
      const mdx  = this._mimiSprite.x - this.sprite.x;
      const mdy  = this._mimiSprite.y - this.sprite.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (this._mode === 'patrol' && mdist < AGGRO_RADIUS) {
        // Mimi stepped into detection range — start chasing
        this._mode = 'aggro';
        this._enterMoveAnim();
      } else if (this._mode === 'aggro' && mdist > AGGRO_LEASH) {
        // Mimi escaped — break off and resume patrol
        this._mode = 'patrol';
        this._stopMoving();
        // Short pause before resuming patrol so the break-off feels deliberate
        this.scene.time.delayedCall(400, this._think, [], this);
      }

      if (this._mode === 'aggro') {
        // Chase: raw angle toward Mimi (no 8-way snap — smooth pursuit)
        this._setVelocityAngle(Math.atan2(mdy, mdx), AGGRO_SPEED);
        return; // skip patrol clamp while chasing
      }
    }

    // ── Patrol home-clamp (safety net only — waypoints keep enemies near home) ─
    const hdx  = this._homeX - this.sprite.x;
    const hdy  = this._homeY - this.sprite.y;
    const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
    if (hdist > WANDER_RADIUS) {
      this._setVelocityAngle(Math.atan2(hdy, hdx));
    }
  }

  /**
   * Store a reference to Mimi's sprite for aggro distance checks.
   * Call immediately after construction (alongside registerOverlap).
   * @param {Phaser.GameObjects.Image} mimiSprite
   */
  setMimi(mimiSprite) {
    this._mimiSprite = mimiSprite;
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
    if (this._bobTween)  this._bobTween.stop();
    if (this._stepTimer) this._stepTimer.remove(false);
    if (this._shadow)    this._shadow.destroy();
    this.sprite.destroy();
  }

  get alive() { return !this._touched; }
}
