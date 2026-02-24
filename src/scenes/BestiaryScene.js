/**
 * BestiaryScene — Pokémon-style enemy index.
 *
 * Shows a 7-column grid of all enemies in canonical order.
 * CANON_ORDER is derived automatically from REGIONS + ENEMIES —
 * new enemies appear here the moment they are added to those data files.
 *
 * Each card has three states:
 *   unknown  — dark silhouette, "???" label, not interactive
 *   seen     — desaturated sprite, 👁 badge, click for details
 *   defeated — full-colour sprite, ✓/👑 badge, click for details
 *
 * Launched via:
 *   this.scene.start('BestiaryScene', { from: 'OverworldScene' });
 */
import * as Phaser from 'phaser';
import GameState         from '../config/GameState.js';
import ENEMIES           from '../data/enemies.js';
import REGIONS           from '../data/regions/index.js';
import { buildCanonOrder } from '../data/bestiaryUtils.js';

// ── Canonical enemy display order — derived from live data ────────────────
// Enemies appear at their first-encountered region; bosses last within that region.
// Adding a region_N.js + its enemies makes them show up here automatically.
const CANON_ORDER = buildCanonOrder(REGIONS, ENEMIES);

// ── Region labels — derived from region data ──────────────────────────────
const REGION_NAMES = REGIONS.map(r => r.name);
// Extract "Grade N" prefix from subtitle (format: "Grade N · Topic description")
const GRADE_LABELS = REGIONS.map(r => r.subtitle.split(' · ')[0]);

// ── Bestiary-specific colour palette ─────────────────────────────────────
// Dark card-background and border-accent colour per region.
// Extend this array when adding a new region; unknown regions fall back to
// neutral colours so the bestiary never hard-crashes on a missing entry.
const REGION_BG     = [0x1A2A0A, 0x200A00, 0x0A2A0A, 0x0A2010, 0x2A1A08, 0x081A28, 0x0C0818];
const REGION_ACCENT = [0x44AA22, 0xFFAA33, 0x44DD22, 0x44FF88, 0xCC8822, 0x44AADD, 0x7744CC];
const DEFAULT_BG     = 0x0A0A1A;   // fallback for regions beyond the colour table
const DEFAULT_ACCENT = 0x8866CC;

// Grid constants — 7 cols; row count adjusts automatically to total enemy count
const COLS       = 7;
const CARD_W     = 102;
const CARD_H     = 84;
const GAP_X      = 7;
const GAP_Y      = 7;
const GRID_START_Y = 60;

const FONT = "'Nunito', Arial, sans-serif";
const W = 800, H = 600;

export default class BestiaryScene extends Phaser.Scene {
  constructor() { super('BestiaryScene'); }

  init(data) {
    this._from = data?.from ?? 'OverworldScene';
    this._detailGroup = null;
  }

  create() {
    // — Background ──────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x050510);

    // — Title bar ───────────────────────────────────────────────────────
    this.add.rectangle(W / 2, 24, W, 48, 0x0A0A22);
    this.add.text(W / 2, 24, '📖  BESTIARY', {
      fontSize: '20px', fontFamily: FONT, color: '#EEDDFF',
      stroke: '#220044', strokeThickness: 4,
    }).setOrigin(0.5);

    // Counting badge  (X / 28 encountered)
    const total    = CANON_ORDER.length;
    const seen     = CANON_ORDER.filter(id => GameState.hasSeenEnemy(id)).length;
    const defeated = CANON_ORDER.filter(id => GameState.hasDefeatedEnemyType(id)).length;
    this.add.text(W - 12, 24,
      `👁 ${seen}  ✓ ${defeated} / ${total}`, {
      fontSize: '11px', fontFamily: FONT, color: '#AABBCC',
    }).setOrigin(1, 0.5);

    // — Back button ─────────────────────────────────────────────────────
    const backBg = this.add.rectangle(44, 24, 64, 26, 0x1A0A2A)
      .setStrokeStyle(1.5, 0x8866CC).setInteractive({ useHandCursor: true });
    const backTxt = this.add.text(44, 24, '← Back', {
      fontSize: '12px', fontFamily: FONT, color: '#BB99FF',
    }).setOrigin(0.5);
    backBg.on('pointerover', () => { backBg.setFillStyle(0x2A1A3A); backTxt.setColor('#EEDDFF'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(0x1A0A2A); backTxt.setColor('#BB99FF'); });
    backBg.on('pointerdown', () => this._goBack());

    // — ESC to go back ──────────────────────────────────────────────────
    this.input.keyboard.on('keydown-ESC', () => {
      if (this._detailGroup) { this._closeDetail(); }
      else { this._goBack(); }
    });

    // — Enemy grid ──────────────────────────────────────────────────────
    CANON_ORDER.forEach((id, num) => this._drawCard(id, num));
  }

  // ── Grid card ──────────────────────────────────────────────────────────
  _drawCard(id, num) {
    const data = ENEMIES[id];
    if (!data) return;

    const rowIdx    = Math.floor(num / COLS);
    const colIdx    = num % COLS;
    const rowCount  = Math.min(COLS, CANON_ORDER.length - rowIdx * COLS);
    const rowStartX = (W - (rowCount * CARD_W + (rowCount - 1) * GAP_X)) / 2;
    const cx        = rowStartX + colIdx * (CARD_W + GAP_X) + CARD_W / 2;
    const cy        = GRID_START_Y + rowIdx * (CARD_H + GAP_Y) + CARD_H / 2;

    const r        = data.region;
    const isSeen     = GameState.hasSeenEnemy(id);
    const isDefeated = GameState.hasDefeatedEnemyType(id);
    const isBoss     = !!data.isBoss;

    // Card background
    let bgColor, borderColor, borderThick;
    if (isDefeated) {
      bgColor     = REGION_BG[r]     ?? DEFAULT_BG;
      borderColor = isBoss ? 0xFFDD44 : (REGION_ACCENT[r] ?? DEFAULT_ACCENT);
      borderThick = isBoss ? 2.5 : 1.5;
    } else if (isSeen) {
      bgColor     = 0x0E0E22;
      borderColor = 0x334466;
      borderThick = 1;
    } else {
      bgColor     = 0x0C0C20;
      borderColor = 0x222244;
      borderThick = 1;
    }

    const bg = this.add.rectangle(cx, cy, CARD_W, CARD_H, bgColor)
      .setStrokeStyle(borderThick, borderColor);

    // Sprite
    // setTint() is WebGL-only; Canvas renderer (Firefox) ignores it and shows
    // full-colour sprites.  Use renderer-aware fallbacks instead.
    const isWebGL = (this.game.renderer.type === Phaser.WEBGL);
    if (this.textures.exists(data.id)) {
      const sprite = this.add.image(cx - 16, cy, data.id).setDisplaySize(56, 56);
      if (!isSeen) {
        if (isWebGL) {
          sprite.setTint(0x0A0A18);               // dark silhouette (WebGL)
        } else {
          sprite.setAlpha(0.10);                  // near-invisible (Canvas)
        }
      } else if (!isDefeated) {
        if (isWebGL) {
          sprite.setTint(0x8899AA).setAlpha(0.55); // grey ghost (WebGL)
        } else {
          sprite.setAlpha(0.40);                  // dim ghost (Canvas)
          // Lay a semi-transparent grey wash over the sprite
          this.add.rectangle(cx - 16, cy, 56, 56, 0x8899AA, 0.45);
        }
      }
    }

    // Entry number (top-left)
    this.add.text(cx - CARD_W / 2 + 4, cy - CARD_H / 2 + 3, `#${String(num + 1).padStart(2, '0')}`, {
      fontSize: '9px', fontFamily: FONT,
      color: isSeen ? '#8899BB' : '#444466',
    });

    // Name label (bottom-center)
    const displayName = isSeen ? data.name : '???';
    this.add.text(cx + 10, cy + CARD_H / 2 - 14, displayName, {
      fontSize: '9px', fontFamily: FONT,
      color: isDefeated ? '#EEEEFF' : (isSeen ? '#AABBCC' : '#444466'),
      wordWrap: { width: 56 },
    }).setOrigin(0.5, 0);

    // Status badge (top-right corner)
    if (isDefeated) {
      const badge = isBoss ? '👑' : '✓';
      this.add.text(cx + CARD_W / 2 - 4, cy - CARD_H / 2 + 2, badge, {
        fontSize: '13px', fontFamily: FONT,
      }).setOrigin(1, 0);
      // Small defeat-count badge (if >0)
      const kc = GameState.getKillCount ? GameState.getKillCount(id) : 0;
      if (kc > 0) {
        this.add.text(cx + CARD_W / 2 - 6, cy - CARD_H / 2 + 18, `x${kc}`, {
          fontSize: '10px', fontFamily: FONT, color: '#DDFFCC',
        }).setOrigin(1, 0);
      }
    } else if (isSeen) {
      this.add.text(cx + CARD_W / 2 - 4, cy - CARD_H / 2 + 2, '👁', {
        fontSize: '11px', fontFamily: FONT,
      }).setOrigin(1, 0);
      const kc = GameState.getKillCount ? GameState.getKillCount(id) : 0;
      if (kc > 0) {
        this.add.text(cx + CARD_W / 2 - 6, cy - CARD_H / 2 + 18, `x${kc}`, {
          fontSize: '10px', fontFamily: FONT, color: '#CCCCCC',
        }).setOrigin(1, 0);
      }
    }

    // Interactivity (seen or defeated only)
    if (isSeen) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setStrokeStyle(borderThick + 1, 0xFFFFFF));
      bg.on('pointerout',  () => bg.setStrokeStyle(borderThick, borderColor));
      bg.on('pointerdown', () => this._showDetail(id));
    }
  }

  // ── Detail panel ───────────────────────────────────────────────────────
  _showDetail(id) {
    if (this._detailGroup) this._closeDetail();

    const data = ENEMIES[id];
    if (!data) return;

    const r          = data.region;
    const isDefeated = GameState.hasDefeatedEnemyType(id);
    const isBoss     = !!data.isBoss;
    const grp        = this.add.group();
    this._detailGroup = grp;

    // Dim overlay
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7)
      .setInteractive({ useHandCursor: false });
    dim.on('pointerdown', () => this._closeDetail());
    grp.add(dim);

    // Panel background
    const PW = 560, PH = 310;
    const px = W / 2, py = H / 2;
    const panel = this.add.rectangle(px, py, PW, PH, 0x0A0A1E)
      .setStrokeStyle(2, REGION_ACCENT[r] ?? DEFAULT_ACCENT);
    grp.add(panel);

    // Region-colour sprite frame (left side)
    const frameX = px - PW / 2 + 75;
    const frameY = py;
    const frame = this.add.rectangle(frameX, frameY, 120, 120, REGION_BG[r] ?? DEFAULT_BG)
      .setStrokeStyle(2, REGION_ACCENT[r] ?? DEFAULT_ACCENT);
    grp.add(frame);

    if (this.textures.exists(data.id)) {
      const spr = this.add.image(frameX, frameY, data.id).setDisplaySize(100, 100);
      if (!isDefeated) { spr.setTint(0x8899AA).setAlpha(0.6); }
      grp.add(spr);
    }

    // → Text column
    let tx = px - PW / 2 + 155;
    let ty = py - PH / 2 + 22;
    const lineH = 24;

    // Name
    const nameColor = isBoss ? '#FFDD44' : '#EEEEFF';
    const nameTxt = this.add.text(tx, ty, isBoss ? `👑 ${data.name}` : data.name, {
      fontSize: '16px', fontFamily: FONT, color: nameColor,
      stroke: '#000022', strokeThickness: 3,
    });
    grp.add(nameTxt);
    ty += lineH + 4;

    // Region / Grade row
    const regionTxt = this.add.text(tx, ty,
      `${REGION_NAMES[r]}  ·  ${GRADE_LABELS[r]}`, {
      fontSize: '11px', fontFamily: FONT, color: '#88AACC',
    });
    grp.add(regionTxt);
    ty += lineH;

    // Divider
    const div = this.add.rectangle(px + 20, ty, PW - 160, 1, 0x334466);
    grp.add(div);
    ty += 10;

    // Topic
    const topicTxt = this.add.text(tx, ty, `📚 Topic: ${data.mathTopic}`, {
      fontSize: '11px', fontFamily: FONT, color: '#CCCCEE',
    });
    grp.add(topicTxt);
    ty += lineH;

    // Special ability
    if (data.special) {
      const specTxt = this.add.text(tx, ty, `⚡ ${data.special}`, {
        fontSize: '11px', fontFamily: FONT, color: '#FFCC66',
        wordWrap: { width: PW - 165 },
      });
      grp.add(specTxt);
      ty += lineH + (data.special.length > 30 ? 12 : 0);
    }

    // HP / Damage — only shown once defeated
    if (isDefeated) {
      const statTxt = this.add.text(tx, ty,
        `❤ HP: ${data.hp}   ⚔ DMG: ${data.damage}   ✦ XP: ${data.xp}`, {
        fontSize: '11px', fontFamily: FONT, color: '#AAFFAA',
      });
      grp.add(statTxt);
      ty += lineH;
      // Show total defeated count for this enemy type
      const kc = GameState.getKillCount ? GameState.getKillCount(id) : 0;
      const kcTxt = this.add.text(tx, ty, `⚔ Defeated: ${kc}`, {
        fontSize: '11px', fontFamily: FONT, color: '#CCFFCC',
      });
      grp.add(kcTxt);
      ty += lineH;
    } else {
      const unknownTxt = this.add.text(tx, ty, '❤ HP: ???   ⚔ DMG: ???', {
        fontSize: '11px', fontFamily: FONT, color: '#556677',
      });
      grp.add(unknownTxt);
      ty += lineH;
      // Even when unknown, show times defeated if any (helps players see progress)
      const kc = GameState.getKillCount ? GameState.getKillCount(id) : 0;
      if (kc > 0) {
        const kcTxt = this.add.text(tx, ty, `⚔ Defeated: ${kc}`, {
          fontSize: '11px', fontFamily: FONT, color: '#556677',
        });
        grp.add(kcTxt);
        ty += lineH;
      }
    }

    // Status badge (top-right of panel)
    const statusLabel = isDefeated ? '⚔ DEFEATED' : '👁 ENCOUNTERED';
    const statusColor = isDefeated ? '#AAFFAA' : '#AABBCC';
    const statusTxt = this.add.text(px + PW / 2 - 12, py - PH / 2 + 10,
      statusLabel, {
      fontSize: '10px', fontFamily: FONT, color: statusColor,
    }).setOrigin(1, 0);
    grp.add(statusTxt);

    // ✕ close button
    const closeBg = this.add.rectangle(px + PW / 2 - 16, py - PH / 2 + 16, 26, 26, 0x1A0A2A)
      .setStrokeStyle(1, 0x8866CC).setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(px + PW / 2 - 16, py - PH / 2 + 16, '✕', {
      fontSize: '14px', fontFamily: FONT, color: '#BB99FF',
    }).setOrigin(0.5);
    closeBg.on('pointerover', () => { closeBg.setFillStyle(0x3A1A5A); closeTxt.setColor('#FFFFFF'); });
    closeBg.on('pointerout',  () => { closeBg.setFillStyle(0x1A0A2A); closeTxt.setColor('#BB99FF'); });
    closeBg.on('pointerdown', () => this._closeDetail());
    grp.add(closeBg);
    grp.add(closeTxt);

    // Entrance tween
    panel.setScale(0.8).setAlpha(0);
    this.tweens.add({
      targets: [panel, frame, ...grp.getChildren().filter(c => c !== dim && c !== panel)],
      alpha:   { from: 0, to: 1 },
      duration: 180,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: panel,
      scale:   { from: 0.8, to: 1 },
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  _closeDetail() {
    if (!this._detailGroup) return;
    const grp = this._detailGroup;
    this._detailGroup = null;
    this.tweens.add({
      targets: grp.getChildren(),
      alpha: 0,
      duration: 120,
      onComplete: () => grp.destroy(true),
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────
  _goBack() {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.start(this._from));
  }
}
