/**
 * Mimi — the player character for the exploration scene.
 *
 * Wraps a Phaser physics image and handles:
 *   - WASD / arrow-key movement
 *   - 4-directional walking sprites
 *   - Idle bobbing animation
 */
import * as Phaser from 'phaser';
import GameState from '../config/GameState.js';

export default class Mimi {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 160;
    this._frozen = false;
    this._dpad   = null;  // set by ExploreScene via setDPad()

    this.sprite = scene.physics.add.image(x, y, 'mimi');
    this.sprite.setDepth(29);  // above colour-grade overlay (depth 25) and enemies (27)
    this.sprite.setCollideWorldBounds(true);
    // Shrink physics body to roughly Mimi's torso — the 64px sprite has a lot
    // of transparent padding around the character, so the default full-image
    // body makes corridors feel impossibly narrow.
    this.sprite.setSize(28, 28);

    // Ground shadow — short semi-transparent ellipse beneath the feet
    this._shadow = scene.add.ellipse(x, y + 16, 28, 9, 0x000000, 0.28).setDepth(28);

    // Bobbing tween - will be paused when moving
    this._bobbingTween = scene.tweens.add({
      targets:   this.sprite,
      y:         y - 4,
      duration:  600,
      yoyo:      true,
      repeat:    -1,
      ease:      'Sine.easeInOut',
    });

    // Leg animation state — cycles through 4 frames every STEP_INTERVAL ticks
    // Sequence: 0=A (contact), 1=C (mid-stride), 2=B (contact), 3=D (mid-stride)
    this._stepFrame   = 0;
    this._stepCounter = 0;
    this._lastDir     = '';  // detect direction changes so steps reset cleanly

    this._setupKeys(scene);
  }

  _setupKeys(scene) {
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      up:    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update() {
    // Shadow always tracks the sprite even when frozen/bobbing
    if (this._shadow) this._shadow.setPosition(this.sprite.x, this.sprite.y + 16);

    if (this._frozen) return;

    const { cursors, wasd, sprite, speed } = this;
    let vx = 0;
    let vy = 0;

    const dp = this._dpad;
    if (cursors.left.isDown  || wasd.left.isDown  || dp?.left)  vx = -speed;
    if (cursors.right.isDown || wasd.right.isDown || dp?.right) vx =  speed;
    if (cursors.up.isDown    || wasd.up.isDown    || dp?.up)    vy = -speed;
    if (cursors.down.isDown  || wasd.down.isDown  || dp?.down)  vy =  speed;

    // Normalise diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    // Update sprite based on movement direction
    if (vx !== 0 || vy !== 0) {
      // Determine dominant direction
      let dir;
      if (Math.abs(vx) > Math.abs(vy)) {
        dir = vx > 0 ? 'right' : 'left';
      } else {
        dir = vy > 0 ? 'down' : 'up';
      }

      // Reset step frame on direction change to avoid visual glitch
      if (dir !== this._lastDir) {
        this._stepFrame   = 0;
        this._stepCounter = 0;
        this._lastDir     = dir;
      }

      // Advance step counter — advance frame every 5 ticks (~83 ms at 60 fps)
      // 4 frames × 5 ticks = 20-tick cycle ≈ 333 ms per full stride
      this._stepCounter++;
      if (this._stepCounter >= 5) {
        this._stepCounter = 0;
        this._stepFrame   = (this._stepFrame + 1) % 4;
        // Footstep sound only on contact frames (0=A and 2=B)
        if (this._stepFrame === 0 || this._stepFrame === 2) {
          this.scene.sound.play('sfx_footstep', {
            volume: 0.18,
            detune: Phaser.Math.Between(-120, 120),
          });
        }
      }

      // Map frame index to texture suffix: A='', C='_c', B='_b', D='_d'
      const WALK_SUFFIXES = ['', '_c', '_b', '_d'];
      const suffix     = WALK_SUFFIXES[this._stepFrame];
      const newTexture = `mimi_walk_${dir}${suffix}`;
      if (this.scene.textures.exists(newTexture)) {
        sprite.setTexture(newTexture);
      }

      // Pause bobbing when moving
      if (this._bobbingTween && this._bobbingTween.isPlaying()) {
        this._bobbingTween.pause();
      }
    } else {
      // Reset walking state
      this._stepFrame   = 0;
      this._stepCounter = 0;
      this._lastDir     = '';

      // Idle - use default sprite
      sprite.setTexture('mimi');
      
      // Resume bobbing when idle
      if (this._bobbingTween && !this._bobbingTween.isPlaying()) {
        // Restart bobbing from current position (don't snap back)
        const currentY = sprite.y;
        this._bobbingTween.stop();
        this._bobbingTween = this.scene.tweens.add({
          targets:   sprite,
          y:         currentY - 4,
          duration:  600,
          yoyo:      true,
          repeat:    -1,
          ease:      'Sine.easeInOut',
        });
      }
    }

    sprite.setVelocity(vx, vy);
  }

  /** Connect a VirtualDPad so touch input drives movement. */
  setDPad(dpad) { this._dpad = dpad; }

  /** Temporarily disable player input (e.g. during dialogue). */
  freeze() {
    this.sprite.setVelocity(0, 0);
    this._frozen = true;
    if (this._dpad) this._dpad.clearState();
  }

  unfreeze() {
    this._frozen = false;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  /** Phaser physics body for add.overlap / add.collider calls. */
  get body() { return this.sprite; }
}
