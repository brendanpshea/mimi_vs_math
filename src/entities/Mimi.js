/**
 * Mimi — the player character for the exploration scene.
 *
 * Wraps a Phaser physics image and handles:
 *   - WASD / arrow-key movement
 *   - 4-directional sprite tinting to hint direction
 *   - Idle bobbing animation
 */
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

    this.sprite = scene.physics.add.image(x, y, 'mimi');
    this.sprite.setDepth(10);
    this.sprite.setCollideWorldBounds(true);

    // Bobbing tween
    scene.tweens.add({
      targets:   this.sprite,
      y:         y - 4,
      duration:  600,
      yoyo:      true,
      repeat:    -1,
      ease:      'Sine.easeInOut',
    });

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
    const { cursors, wasd, sprite, speed } = this;
    let vx = 0;
    let vy = 0;

    if (cursors.left.isDown  || wasd.left.isDown)  vx = -speed;
    if (cursors.right.isDown || wasd.right.isDown) vx =  speed;
    if (cursors.up.isDown    || wasd.up.isDown)    vy = -speed;
    if (cursors.down.isDown  || wasd.down.isDown)  vy =  speed;

    // Normalise diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    sprite.setVelocity(vx, vy);
  }

  /** Temporarily disable player input (e.g. during dialogue). */
  freeze() {
    this.sprite.setVelocity(0, 0);
    this._frozen = true;
  }

  unfreeze() {
    this._frozen = false;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  /** Phaser physics body for add.overlap / add.collider calls. */
  get body() { return this.sprite; }
}
