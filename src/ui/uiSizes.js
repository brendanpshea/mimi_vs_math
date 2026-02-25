/**
 * uiSizes(W, H) — responsive design tokens for the current viewport.
 *
 * Scale formula: clamp( min(W/800, H/600), 0.75, 1.0 )
 *   800×600 baseline → s = 1.0   (no change from authored values)
 *   640×480 minimum  → s = 0.80  (slightly smaller but still legible)
 *   1280×800 laptop  → s = 1.0   (capped — no inflation on large screens)
 *
 * Font floor values prevent text going below legible sizes even at the
 * minimum scale factor.
 *
 * Usage:
 *   import { uiSizes } from '../ui/uiSizes.js';
 *   const sz = uiSizes(this.cameras.main.width, this.cameras.main.height);
 */
export function uiSizes(W, H) {
  const s  = Math.max(0.75, Math.min(1.0, Math.min(W / 800, H / 600)));
  const px = n => Math.round(n * s);
  return {
    s,                                  // raw scale factor (0.75–1.0)

    // ── Font sizes (floored for legibility) ──────────────────────────────
    fontXs:  Math.max(10, px(11)),      // hint text, compass 'N' label
    fontSm:  Math.max(11, px(12)),      // node subtitle, sidebar buttons
    fontMd:  Math.max(12, px(13)),      // node name, badge number, stats rows
    fontLg:  Math.max(13, px(14)),      // player-info panel labels

    // ── VirtualDPad geometry ─────────────────────────────────────────────
    dpadEdgePad:    px(82),             // screen-edge → d-pad centre (x & y)
    dpadOffset:     px(46),             // d-pad centre → each arrow centre
    dpadBtnSize:    px(50),             // invisible hit-area square side
    dpadRadius:     px(20),             // direction arrow circle radius
    dpadBaseRadius: px(72),             // outer base circle radius

    // ── OverworldScene node ───────────────────────────────────────────────
    nodeRadius: px(40),                 // region node circle radius
  };
}
