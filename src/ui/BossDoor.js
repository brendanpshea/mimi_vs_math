/**
 * BossDoor — draws and manages the ornate stone-arch boss gate for an
 * ExploreScene region.  Extracted from ExploreScene to keep the scene thin.
 *
 * Usage:
 *   const bossDoor = new BossDoor(scene, regionData, {
 *     bossTile:          { col, row },          // POSITIONS-resolved tile
 *     getKillCount:      () => this._killCount,
 *     getRemainingCount: () => this._remainingEnemyCount(),
 *     onEnter:           () => this._startBossBattle(),
 *   });
 *
 *   // After a kill that might unlock the door:
 *   bossDoor.check();
 *
 *   // Every frame:
 *   bossDoor.update();
 */

/** Tile size in pixels — must match ExploreScene's T constant. */
const T = 32;

export default class BossDoor {
  /**
   * @param {Phaser.Scene} scene
   * @param {object}       regionData  - current region config object
   * @param {object}       [opts]
   * @param {{ col: number, row: number }} [opts.bossTile]
   *   The resolved boss tile (caller applies any POSITIONS override first).
   *   Falls back to regionData.bossTile if omitted.
   * @param {Function} [opts.getKillCount]
   *   `() => number` — current kill count; scene owns this state.
   * @param {Function} [opts.getRemainingCount]
   *   `() => number` — remaining undefeated enemies (legacy unlock path).
   * @param {Function} [opts.onEnter]
   *   Called once when Mimi walks through the open gate.
   */
  constructor(scene, regionData, {
    bossTile,
    getKillCount,
    getRemainingCount,
    onEnter,
  } = {}) {
    this._scene             = scene;
    this._rd                = regionData;
    this._getKillCount      = getKillCount      ?? (() => 0);
    this._getRemainingCount = getRemainingCount  ?? (() => 0);
    this._onEnter           = onEnter            ?? (() => {});

    this._isOpen          = false;
    this._entered         = false;   // true after onEnter() fires (prevents re-trigger)
    this._doorMsgCooldown = false;
    this._doorPulseTween  = null;

    const tile = bossTile ?? regionData.bossTile;
    const px   = tile.col * T + T / 2;
    const py   = tile.row * T + T / 2;

    this._drawFrame(px, py);
    this.check();   // set initial locked/open state
  }

  /** Lazy dialog reference — always valid when called during gameplay. */
  get _dlg() { return this._scene.dialog; }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Recomputes open/locked state and redraws the dynamic door layers.
   * Safe to call at any time after construction.
   */
  check() {
    const unlockKills = this._rd.bossUnlockKills;
    const n = unlockKills == null ? this._getRemainingCount() : 0;
    this._isOpen = unlockKills != null
      ? (this._getKillCount() >= unlockKills)
      : (n === 0);

    const { px, py, openX, openTopY, OPEN_W, OPEN_H } = this._doorGeom;
    this._doorFill.clear();
    this._doorDeco.clear();

    if (this._isOpen) {
      // Disable the physics body so Mimi can walk through.
      if (this._doorBodyRect?.body) {
        this._doorBodyRect.body.enable              = false;
        this._doorBodyRect.body.checkCollision.none = true;
        this._doorGroup.refresh();
      }

      // Purple portal glow
      this._doorFill.fillStyle(0x110022);
      this._doorFill.fillRect(openX, openTopY, OPEN_W, OPEN_H);
      this._doorFill.fillStyle(0x5500AA, 0.7);
      this._doorFill.fillEllipse(px, py, OPEN_W * 0.82, OPEN_H * 0.76);
      this._doorFill.fillStyle(0xAA44FF, 0.45);
      this._doorFill.fillEllipse(px, py - 4, OPEN_W * 0.45, OPEN_H * 0.45);
      this._doorDeco.lineStyle(2, 0xFFDD44, 1);
      this._doorDeco.strokeRect(openX + 1, openTopY + 1, OPEN_W - 2, OPEN_H - 2);

      // Pulsing tween — only created once
      if (!this._doorPulseTween) {
        this._doorPulseTween = this._scene.tweens.add({
          targets: this._doorFill, alpha: 0.65, duration: 900, yoyo: true, repeat: -1,
        });
      }

      this._bossLabel.setColor('#FFDD44').setFontStyle('bold');
      this._enemyCountText.setVisible(false);

    } else {
      // Re-enable physics body (belt-and-suspenders — shouldn't be disabled when locked)
      if (this._doorBodyRect?.body) {
        this._doorBodyRect.body.enable              = true;
        this._doorBodyRect.body.checkCollision.none = false;
        this._doorGroup.refresh();
      }

      // Stone door fill
      this._doorFill.fillStyle(0x2A2A36);
      this._doorFill.fillRect(openX, openTopY, OPEN_W, OPEN_H);
      this._doorFill.fillStyle(0x38384A);
      this._doorFill.fillRect(openX + 2, openTopY + 2, OPEN_W - 4, OPEN_H / 3);
      this._doorFill.lineStyle(1, 0x1A1A24, 0.6);
      for (let sy = openTopY + 10; sy < openTopY + OPEN_H; sy += 11) {
        this._doorFill.lineBetween(openX + 2, sy, openX + OPEN_W - 2, sy);
      }
      this._doorFill.lineStyle(1, 0x1A1A24, 0.5);
      this._doorFill.lineBetween(px, openTopY + 2, px, openTopY + OPEN_H - 2);

      // Padlock
      const lx = px, ly = py - 2;
      this._doorDeco.fillStyle(0x997700);
      this._doorDeco.fillRoundedRect(lx - 9, ly - 2, 18, 14, 2);
      this._doorDeco.fillStyle(0xFFCC22);
      this._doorDeco.fillRoundedRect(lx - 7, ly, 14, 11, 2);
      this._doorDeco.lineStyle(4, 0xAA8800, 1);
      this._doorDeco.strokeCircle(lx, ly - 2, 6);
      this._doorDeco.fillStyle(0x2A2A36);
      this._doorDeco.fillRect(lx - 10, ly - 2, 20, 7);
      this._doorDeco.fillStyle(0x6E5500);
      this._doorDeco.fillCircle(lx, ly + 5, 2.5);
      this._doorDeco.fillTriangle(lx - 2, ly + 7, lx + 2, ly + 7, lx, ly + 11);

      if (unlockKills != null) {
        this._enemyCountText
          .setText(`${this._getKillCount()} / ${unlockKills} defeated`)
          .setVisible(true);
      } else {
        const total = this._rd.enemySpawns?.length ?? 0;
        this._enemyCountText
          .setText(`${n} of ${total} enemies remain`)
          .setVisible(true);
      }
      this._bossLabel.setColor('#CC88FF');
    }
  }

  /**
   * Call once per frame from the scene's update().
   * Fires onEnter() when Mimi walks close to the open gate.
   */
  update() {
    if (!this._isOpen || this._entered) return;
    const { px, py } = this._doorGeom;
    const mimi = this._scene.mimi;
    const dx = mimi.x - px;
    const dy = mimi.y - py;
    if (dx * dx + dy * dy < 40 * 40) {
      this._entered = true;
      this._onEnter();
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /**
   * Draws the static stone gate frame: shadow, base platform, two pillars with
   * brick lines, semicircular arch, twin battlements with merlons, central
   * finial, accent-coloured arch outline, and keystone gem.
   * Also creates text labels, dynamic graphics layers, and the physics body.
   * Called exactly once from the constructor.
   *
   * @param {number} px  world-space pixel X of the gate centre
   * @param {number} py  world-space pixel Y of the gate centre
   */
  _drawFrame(px, py) {
    const DW       = 88;
    const DH       = 100;
    const PILLAR_W = 14;
    const OPEN_W   = DW - PILLAR_W * 2;
    const OPEN_H   = DH - 6;
    const ARCH_R   = OPEN_W / 2 + 2;
    const archCY   = py - DH / 2 + ARCH_R;
    const openX    = px - OPEN_W / 2;
    const openTopY = py - DH / 2 + 6;
    const accentColor = this._rd.gateAccentColor ?? 0xFFDD33;

    const s = this._scene;   // shorthand

    // ── Static stone frame (never redrawn) ───────────────────────────────
    const frame = s.add.graphics().setDepth(4);

    // Ground shadow
    frame.fillStyle(0x000000, 0.3);
    frame.fillEllipse(px, py + DH / 2 + 3, DW + 12, 8);

    // Base platform
    frame.fillStyle(0x1E1E26);
    frame.fillRect(px - DW / 2 - 3, py + DH / 2 - 8, DW + 6, 12);
    frame.fillStyle(0x3E3E4E);
    frame.fillRect(px - DW / 2 - 3, py + DH / 2 - 8, DW + 6, 4);

    // Left pillar
    const lpx = px - DW / 2;
    frame.fillStyle(0x1E1E26);
    frame.fillRect(lpx - 3, py - DH / 2 - 3, PILLAR_W + 3, DH + 3);
    frame.fillStyle(0x3C3C4C);
    frame.fillRect(lpx, py - DH / 2, PILLAR_W, DH);
    frame.fillStyle(0x545468, 0.85);
    frame.fillRect(lpx + 1, py - DH / 2, 3, DH);
    frame.fillStyle(0x18181E, 0.7);
    frame.fillRect(lpx + PILLAR_W - 3, py - DH / 2, 3, DH);
    frame.lineStyle(1, 0x14141A, 0.55);
    for (let sy = py - DH / 2; sy < py + DH / 2; sy += 10) {
      frame.lineBetween(lpx, sy, lpx + PILLAR_W, sy);
    }

    // Right pillar
    const rpx = px + DW / 2 - PILLAR_W;
    frame.fillStyle(0x1E1E26);
    frame.fillRect(rpx, py - DH / 2 - 3, PILLAR_W + 3, DH + 3);
    frame.fillStyle(0x3C3C4C);
    frame.fillRect(rpx, py - DH / 2, PILLAR_W, DH);
    frame.fillStyle(0x545468, 0.85);
    frame.fillRect(rpx + 1, py - DH / 2, 3, DH);
    frame.fillStyle(0x18181E, 0.7);
    frame.fillRect(rpx + PILLAR_W - 3, py - DH / 2, 3, DH);
    frame.lineStyle(1, 0x14141A, 0.55);
    for (let sy = py - DH / 2; sy < py + DH / 2; sy += 10) {
      frame.lineBetween(rpx, sy, rpx + PILLAR_W, sy);
    }

    // Arch
    frame.fillStyle(0x1E1E26);
    frame.fillCircle(px, archCY, ARCH_R + 3);
    frame.fillStyle(0x3C3C4C);
    frame.fillCircle(px, archCY, ARCH_R);
    frame.fillStyle(0x3C3C4C);
    frame.fillRect(lpx - 1, archCY, DW + 2, ARCH_R + 4);

    // ── Battlements: twin turrets flanking the gate ───────────────────────
    const TURR_W = PILLAR_W + 4;
    const TURR_H = 28;
    const MRL_W  = 5; const MRL_H = 8; const MRL_GAP = 3;
    const numMrl = Math.floor((TURR_W - 2) / (MRL_W + MRL_GAP));
    for (const bx of [lpx - 2, rpx - 2]) {
      // Turret body
      frame.fillStyle(0x1E1E26);
      frame.fillRect(bx, py - DH / 2 - TURR_H, TURR_W, TURR_H + 2);
      frame.fillStyle(0x3C3C4C);
      frame.fillRect(bx + 1, py - DH / 2 - TURR_H + 1, TURR_W - 2, TURR_H);
      frame.fillStyle(0x545468, 0.65);
      frame.fillRect(bx + 1, py - DH / 2 - TURR_H + 1, 3, TURR_H);
      // Accent stripe
      frame.fillStyle(accentColor, 0.25);
      frame.fillRect(bx + 1, py - DH / 2 - TURR_H + TURR_H * 0.6, TURR_W - 2, 4);
      // Merlons (crenellations)
      for (let m = 0; m < numMrl; m++) {
        const mx = bx + 1 + m * (MRL_W + MRL_GAP);
        frame.fillStyle(0x1E1E26);
        frame.fillRect(mx, py - DH / 2 - TURR_H - MRL_H, MRL_W, MRL_H + 1);
        frame.fillStyle(0x3C3C4C);
        frame.fillRect(mx + 1, py - DH / 2 - TURR_H - MRL_H + 1, MRL_W - 2, MRL_H);
      }
    }

    // Central finial — pointed peak above the arch crown
    const finY = archCY - ARCH_R - 1;
    frame.fillStyle(0x1E1E26);
    frame.fillTriangle(px - 8, finY, px + 8, finY, px, finY - 14);
    frame.fillStyle(0x3C3C4C);
    frame.fillTriangle(px - 6, finY - 1, px + 6, finY - 1, px, finY - 11);

    // Accent: glowing arch outline + keystone gem
    frame.lineStyle(1.5, accentColor, 0.8);
    frame.strokeCircle(px, archCY, ARCH_R);
    frame.fillStyle(accentColor, 0.92);
    frame.fillCircle(px, archCY - ARCH_R + 5, 5);   // gem
    frame.fillStyle(0xFFFFFF, 0.5);
    frame.fillCircle(px - 1, archCY - ARCH_R + 3, 2); // gem shine

    // Boss name label
    this._bossLabel = s.add.text(
      px, py + DH / 2 + 10, this._rd.bossName,
      { fontSize: '9px', color: '#CC88FF', fontFamily: "'Nunito', Arial, sans-serif",
        fontStyle: 'bold', align: 'center', stroke: '#000', strokeThickness: 2 },
    ).setOrigin(0.5, 0).setDepth(10);

    // Remaining-enemies counter (shown when locked)
    this._enemyCountText = s.add.text(
      px, py - DH / 2 - 14, '',
      { fontSize: '9px', color: '#FF9999', fontFamily: "'Nunito', Arial, sans-serif",
        align: 'center', stroke: '#000', strokeThickness: 2 },
    ).setOrigin(0.5, 1).setDepth(10);

    // ── Dynamic layers (cleared and redrawn by check()) ───────────────────
    this._doorFill = s.add.graphics().setDepth(5);
    this._doorDeco = s.add.graphics().setDepth(6);

    // ── Physics ───────────────────────────────────────────────────────────
    // LOCKED  : static body enabled → blocks Mimi; collider fires locked dialog
    // OPEN    : body disabled → update() proximity check fires onEnter()
    this._doorGroup = s.physics.add.staticGroup();
    const blocker   = s.add.rectangle(px, py, OPEN_W, DH, 0, 0);
    s.physics.add.existing(blocker, true);
    this._doorGroup.add(blocker);
    this._doorBodyRect = blocker;

    s.physics.add.collider(
      s.mimi.sprite, this._doorGroup,
      () => {
        if (!this._isOpen && !this._doorMsgCooldown && !this._dlg.isOpen) {
          this._doorMsgCooldown = true;
          const unlockKills = this._rd.bossUnlockKills;
          let msg;
          if (unlockKills != null) {
            const need = unlockKills - this._getKillCount();
            msg = `The boss seal is unbroken.\nDefeat ${need} more enem${need === 1 ? 'y' : 'ies'} to enter.`;
          } else {
            const n = this._getRemainingCount();
            msg = `The boss seal is unbroken.\nDefeat the ${n} remaining enemi${n === 1 ? 'y' : 'es'} to enter.`;
          }
          this._dlg.show(
            msg,
            () => { s.time.delayedCall(2500, () => { this._doorMsgCooldown = false; }); },
            '\uD83D\uDD12 Sealed',
          );
        }
      },
    );

    // Stash geometry so check() and update() can redraw / measure distance
    this._doorGeom = { px, py, openX, openTopY, OPEN_W, OPEN_H };
  }
}
