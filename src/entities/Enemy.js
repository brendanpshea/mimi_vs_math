/**
 * Enemy — an enemy sprite placed in the exploration scene.
 *
 * Stays still (static physics body) until Mimi walks into it,
 * which triggers a battle scene transition.
 */
export default class Enemy {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} data – entry from enemies.js
   * @param {Function} onTouch – called when Mimi overlaps this enemy
   */
  constructor(scene, x, y, data, onTouch) {
    this.data = data;
    this.scene = scene;
    this._touched = false;

    this.sprite = scene.physics.add.image(x, y, data.spriteKey);
    this.sprite.setImmovable(true);
    this.sprite.body.allowGravity = false;
    this.sprite.setDepth(8);

    // Gentle floating tween
    scene.tweens.add({
      targets:  this.sprite,
      y:        y - 6,
      duration: 900 + Math.random() * 400,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });

    // Name label
    this.label = scene.add.text(x, y - 40, data.name, {
      fontSize:        '11px',
      color:           '#FFFFFF',
      stroke:          '#000000',
      strokeThickness: 3,
      fontFamily:      'Arial',
    }).setOrigin(0.5).setDepth(9);

    // HP mini-bar
    this._hpBg  = scene.add.rectangle(x, y - 50, 50, 6, 0x333333).setDepth(9);
    this._hpBar = scene.add.rectangle(x - 25, y - 50, 50, 6, 0xFF4444).setOrigin(0, 0.5).setDepth(9);

    this._onTouch = onTouch;
  }

  /** Register Mimi overlap. Call after Mimi is created. */
  registerOverlap(mimiBody) {
    this.scene.physics.add.overlap(mimiBody, this.sprite, () => {
      if (!this._touched) {
        this._touched = true;
        this._onTouch(this.data);
      }
    });
  }

  /** Remove this enemy from the scene (after defeat). */
  destroy() {
    this.sprite.destroy();
    this.label.destroy();
    this._hpBg.destroy();
    this._hpBar.destroy();
  }

  get alive() { return !this._touched; }
}
