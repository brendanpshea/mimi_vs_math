/**
 * BGM.js  —  Tone.js background music manager for Mimi vs Math.
 *
 * Tracks
 *   'title'     – gentle arpeggiated title theme  (C major, 80 BPM)
 *   'overworld' – bright Zelda-ish world-map piece (C major, 105 BPM)
 *   'explore'   – upbeat JRPG exploration theme   (G major, 118 BPM)
 *   'battle'    – driving minor-key battle music   (A minor, 140 BPM)
 *   'boss'      – intense boss encounter           (E Phrygian, 152 BPM)
 *
 * Usage
 *   import BGM from '../audio/BGM.js';
 *   BGM.play('title');     // starts track (no-op if already playing)
 *   BGM.play('battle');    // crossfades to next track
 *   BGM.stop();            // fade out and silence
 *   BGM.setVolume(-4);     // master dB (default -6)
 */
import * as Tone from 'tone';

// ── Shared state ──────────────────────────────────────────────────────────────
let _currentTrack = null;
let _masterVol    = null;    // Tone.Volume — created after first Tone.start()
let _activeParts  = [];
let _activeSynths = [];
let _started      = false;

// ── Audio context bootstrap ───────────────────────────────────────────────────
async function _ensureCtx() {
  if (_started) return;
  await Tone.start();
  _masterVol = new Tone.Volume(-6).toDestination();
  _started   = true;
}

// ── Teardown: dispose all current parts + synths ──────────────────────────────
function _teardown() {
  Tone.getTransport().stop();
  _activeParts.forEach(p => { try { p.stop(0); p.dispose(); } catch (_) {} });
  _activeSynths.forEach(s => { try { s.dispose(); } catch (_) {} });
  _activeParts  = [];
  _activeSynths = [];
}

function _reg(synth) { _activeSynths.push(synth); return synth; }
function _part(p)    { _activeParts.push(p);       return p;    }

// ── Public API ────────────────────────────────────────────────────────────────
const BGM = {
  async play(trackName) {
    if (_currentTrack === trackName) return;   // already playing — do nothing
    await _ensureCtx();
    _teardown();
    _currentTrack = trackName;

    const builder = TRACKS[trackName];
    if (!builder) return;

    // Fade in from silence
    _masterVol.volume.value = -60;
    builder(_masterVol);
    Tone.getTransport().start();
    _masterVol.volume.rampTo(-6, 1.2);
  },

  stop(fadeSec = 0.7) {
    if (!_started || !_currentTrack) return;
    _currentTrack = null;
    if (_masterVol) _masterVol.volume.rampTo(-80, fadeSec);
    setTimeout(() => _teardown(), (fadeSec + 0.2) * 1000);
  },

  setVolume(db) {
    if (_masterVol) _masterVol.volume.value = db;
  },
};

export default BGM;

// ── Track registry ────────────────────────────────────────────────────────────
const TRACKS = {
  title:     _buildTitle,
  overworld: _buildOverworld,
  explore:   _buildExplore,
  battle:    _buildBattle,
  boss:      _buildBoss,
};

// ─────────────────────────────────────────────────────────────────────────────
// TITLE  "Mimi's World"
// Warm, dreamy arpeggiated theme.  C major, 80 BPM, 4-bar loop.
// ─────────────────────────────────────────────────────────────────────────────
function _buildTitle(out) {
  Tone.getTransport().bpm.value = 80;

  const pad = _reg(new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope:   { attack: 0.4, decay: 0.2, sustain: 0.6, release: 1.8 },
    volume: -16,
  }).connect(out));

  const bell = _reg(new Tone.Synth({
    oscillator: { type: 'sine4' },
    envelope:   { attack: 0.01, decay: 0.5, sustain: 0.25, release: 1.4 },
    volume: -9,
  }).connect(out));

  const bass = _reg(new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope:   { attack: 0.12, decay: 0.3, sustain: 0.5, release: 0.8 },
    volume: -12,
  }).connect(out));

  // Chord pads: Cmaj → Am → Fmaj → Gmaj
  const padPart = _part(new Tone.Part((t, v) => pad.triggerAttackRelease(v.n, v.d, t), [
    { time: '0:0', n: ['C4', 'E4', 'G4'], d: '1m' },
    { time: '1:0', n: ['A3', 'C4', 'E4'], d: '1m' },
    { time: '2:0', n: ['F3', 'A3', 'C4'], d: '1m' },
    { time: '3:0', n: ['G3', 'B3', 'D4'], d: '1m' },
  ]));
  padPart.loop = true;  padPart.loopEnd = '4m';  padPart.start(0);

  // Bell melody: arpeggiated up through each chord
  const bellPart = _part(new Tone.Part((t, v) => bell.triggerAttackRelease(v.n, v.d, t), [
    // Bar 0 — C major
    { time: '0:0',   n: 'C5',  d: '8n' },
    { time: '0:0.5', n: 'E5',  d: '8n' },
    { time: '0:1',   n: 'G5',  d: '4n' },
    { time: '0:2',   n: 'G5',  d: '8n' },
    { time: '0:2.5', n: 'E5',  d: '8n' },
    { time: '0:3',   n: 'G5',  d: '4n' },
    // Bar 1 — A minor
    { time: '1:0',   n: 'A4',  d: '8n' },
    { time: '1:0.5', n: 'C5',  d: '8n' },
    { time: '1:1',   n: 'E5',  d: '4n' },
    { time: '1:2',   n: 'E5',  d: '8n' },
    { time: '1:2.5', n: 'C5',  d: '8n' },
    { time: '1:3',   n: 'A5',  d: '4n' },
    // Bar 2 — F major
    { time: '2:0',   n: 'F4',  d: '8n' },
    { time: '2:0.5', n: 'A4',  d: '8n' },
    { time: '2:1',   n: 'C5',  d: '4n' },
    { time: '2:2',   n: 'F5',  d: '8n' },
    { time: '2:2.5', n: 'E5',  d: '8n' },
    { time: '2:3',   n: 'C5',  d: '4n' },
    // Bar 3 — G major
    { time: '3:0',   n: 'G4',  d: '8n' },
    { time: '3:0.5', n: 'B4',  d: '8n' },
    { time: '3:1',   n: 'D5',  d: '4n' },
    { time: '3:2',   n: 'G5',  d: '8n' },
    { time: '3:2.5', n: 'B5',  d: '8n' },
    { time: '3:3',   n: 'D5',  d: '4n' },
  ]));
  bellPart.loop = true;  bellPart.loopEnd = '4m';  bellPart.start(0);

  // Walking half-note bass
  const bassPart = _part(new Tone.Part((t, v) => bass.triggerAttackRelease(v.n, v.d, t), [
    { time: '0:0', n: 'C2', d: '2n' }, { time: '0:2', n: 'G2', d: '2n' },
    { time: '1:0', n: 'A2', d: '2n' }, { time: '1:2', n: 'E2', d: '2n' },
    { time: '2:0', n: 'F2', d: '2n' }, { time: '2:2', n: 'C2', d: '2n' },
    { time: '3:0', n: 'G2', d: '2n' }, { time: '3:2', n: 'D2', d: '2n' },
  ]));
  bassPart.loop = true;  bassPart.loopEnd = '4m';  bassPart.start(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERWORLD  "Adventure Begins"
// Bright, Zelda-inspired world-map theme.  C major, 105 BPM, 8-bar loop.
// ─────────────────────────────────────────────────────────────────────────────
function _buildOverworld(out) {
  Tone.getTransport().bpm.value = 105;

  const lead = _reg(new Tone.Synth({
    oscillator: { type: 'triangle8' },
    envelope:   { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.4 },
    volume: -8,
  }).connect(out));

  const pad = _reg(new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope:   { attack: 0.3, decay: 0.2, sustain: 0.4, release: 1.0 },
    volume: -19,
  }).connect(out));

  const bass = _reg(new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope:   { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.4 },
    volume: -10,
  }).connect(out));

  // Zelda-style overworld melody
  const leadPart = _part(new Tone.Part((t, v) => lead.triggerAttackRelease(v.n, v.d, t), [
    // Phrase A
    { time: '0:0',   n: 'G5',  d: '8n'   },
    { time: '0:0.5', n: 'E5',  d: '8n'   },
    { time: '0:1',   n: 'C5',  d: '4n'   },
    { time: '0:2',   n: 'D5',  d: '4n'   },
    { time: '0:3',   n: 'E5',  d: '4n'   },
    { time: '1:0',   n: 'G5',  d: '4n.'  },
    { time: '1:1.5', n: 'A5',  d: '8n'   },
    { time: '1:2',   n: 'G5',  d: '2n'   },
    // Phrase B
    { time: '2:0',   n: 'E5',  d: '8n'   },
    { time: '2:0.5', n: 'D5',  d: '8n'   },
    { time: '2:1',   n: 'C5',  d: '4n'   },
    { time: '2:2',   n: 'A4',  d: '4n'   },
    { time: '2:3',   n: 'G4',  d: '4n'   },
    { time: '3:0',   n: 'A4',  d: '4n'   },
    { time: '3:1',   n: 'C5',  d: '4n'   },
    { time: '3:2',   n: 'E5',  d: '2n'   },
    // Phrase C
    { time: '4:0',   n: 'F5',  d: '8n'   },
    { time: '4:0.5', n: 'E5',  d: '8n'   },
    { time: '4:1',   n: 'D5',  d: '4n'   },
    { time: '4:2',   n: 'E5',  d: '4n'   },
    { time: '4:3',   n: 'C5',  d: '4n'   },
    { time: '5:0',   n: 'G5',  d: '4n.'  },
    { time: '5:1.5', n: 'A5',  d: '8n'   },
    { time: '5:2',   n: 'B5',  d: '2n'   },
    // Phrase D
    { time: '6:0',   n: 'A5',  d: '8n'   },
    { time: '6:0.5', n: 'G5',  d: '8n'   },
    { time: '6:1',   n: 'F5',  d: '4n'   },
    { time: '6:2',   n: 'E5',  d: '4n'   },
    { time: '6:3',   n: 'D5',  d: '4n'   },
    { time: '7:0',   n: 'C5',  d: '2n'   },
    { time: '7:2',   n: 'G4',  d: '4n'   },
    { time: '7:3',   n: 'A4',  d: '4n'   },
  ]));
  leadPart.loop = true;  leadPart.loopEnd = '8m';  leadPart.start(0);

  const padPart = _part(new Tone.Part((t, v) => pad.triggerAttackRelease(v.n, v.d, t), [
    { time: '0:0', n: ['C3', 'G3', 'E4'], d: '2m' },
    { time: '2:0', n: ['F3', 'A3', 'C4'], d: '2m' },
    { time: '4:0', n: ['G3', 'B3', 'D4'], d: '2m' },
    { time: '6:0', n: ['C3', 'E3', 'G3'], d: '2m' },
  ]));
  padPart.loop = true;  padPart.loopEnd = '8m';  padPart.start(0);

  const bassPart = _part(new Tone.Part((t, v) => bass.triggerAttackRelease(v.n, v.d, t), [
    // C (bars 0-1)
    { time: '0:0', n: 'C2', d: '4n' }, { time: '0:1', n: 'C2', d: '4n' },
    { time: '0:2', n: 'G2', d: '4n' }, { time: '0:3', n: 'G2', d: '4n' },
    { time: '1:0', n: 'C2', d: '4n' }, { time: '1:1', n: 'C2', d: '4n' },
    { time: '1:2', n: 'E2', d: '4n' }, { time: '1:3', n: 'G2', d: '4n' },
    // F (bars 2-3)
    { time: '2:0', n: 'F2', d: '4n' }, { time: '2:1', n: 'F2', d: '4n' },
    { time: '2:2', n: 'A2', d: '4n' }, { time: '2:3', n: 'C3', d: '4n' },
    { time: '3:0', n: 'F2', d: '4n' }, { time: '3:1', n: 'E2', d: '4n' },
    { time: '3:2', n: 'D2', d: '4n' }, { time: '3:3', n: 'C2', d: '4n' },
    // G (bars 4-5)
    { time: '4:0', n: 'G2', d: '4n' }, { time: '4:1', n: 'G2', d: '4n' },
    { time: '4:2', n: 'B2', d: '4n' }, { time: '4:3', n: 'D3', d: '4n' },
    { time: '5:0', n: 'G2', d: '4n' }, { time: '5:1', n: 'F2', d: '4n' },
    { time: '5:2', n: 'E2', d: '4n' }, { time: '5:3', n: 'D2', d: '4n' },
    // C (bars 6-7)
    { time: '6:0', n: 'C2', d: '4n' }, { time: '6:1', n: 'E2', d: '4n' },
    { time: '6:2', n: 'G2', d: '4n' }, { time: '6:3', n: 'A2', d: '4n' },
    { time: '7:0', n: 'C2', d: '2n' }, { time: '7:2', n: 'G2', d: '4n' },
    { time: '7:3', n: 'B2', d: '4n' },
  ]));
  bassPart.loop = true;  bassPart.loopEnd = '8m';  bassPart.start(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORE  "Into the Dungeon"
// Upbeat in-world exploration.  G major, 118 BPM, 8-bar loop.
// ─────────────────────────────────────────────────────────────────────────────
function _buildExplore(out) {
  Tone.getTransport().bpm.value = 118;

  const lead = _reg(new Tone.Synth({
    oscillator: { type: 'square4' },
    envelope:   { attack: 0.01, decay: 0.08, sustain: 0.5, release: 0.25 },
    volume: -12,
  }).connect(out));

  const pad = _reg(new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope:   { attack: 0.2, decay: 0.1, sustain: 0.5, release: 0.8 },
    volume:     -21,
  }).connect(out));

  const bass = _reg(new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope:   { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3 },
    volume: -11,
  }).connect(out));

  // Brisk JRPG field melody in G major
  const leadPart = _part(new Tone.Part((t, v) => lead.triggerAttackRelease(v.n, v.d, t), [
    { time: '0:0',   n: 'G5',  d: '4n'  },
    { time: '0:1',   n: 'B5',  d: '8n'  }, { time: '0:1.5', n: 'A5', d: '8n' },
    { time: '0:2',   n: 'G5',  d: '4n'  }, { time: '0:3',   n: 'D5', d: '4n' },
    { time: '1:0',   n: 'E5',  d: '8n'  }, { time: '1:0.5', n: 'D5', d: '8n' },
    { time: '1:1',   n: 'E5',  d: '4n'  }, { time: '1:2',   n: 'G5', d: '2n' },
    { time: '2:0',   n: 'A5',  d: '4n'  }, { time: '2:1',   n: 'B5', d: '4n' },
    { time: '2:2',   n: 'C6',  d: '4n'  }, { time: '2:3',   n: 'B5', d: '4n' },
    { time: '3:0',   n: 'A5',  d: '2n'  }, { time: '3:2',   n: 'G5', d: '4n' },
    { time: '3:3',   n: 'F#5', d: '4n'  },
    { time: '4:0',   n: 'G5',  d: '4n'  },
    { time: '4:1',   n: 'D5',  d: '8n'  }, { time: '4:1.5', n: 'E5', d: '8n' },
    { time: '4:2',   n: 'G5',  d: '4n'  }, { time: '4:3',   n: 'B5', d: '4n' },
    { time: '5:0',   n: 'A5',  d: '8n'  }, { time: '5:0.5', n: 'G5', d: '8n' },
    { time: '5:1',   n: 'F#5', d: '4n'  }, { time: '5:2',   n: 'D5', d: '2n' },
    { time: '6:0',   n: 'E5',  d: '4n'  }, { time: '6:1',   n: 'G5', d: '4n' },
    { time: '6:2',   n: 'A5',  d: '4n'  }, { time: '6:3',   n: 'C6', d: '4n' },
    { time: '7:0',   n: 'B5',  d: '2n'  }, { time: '7:2',   n: 'G5', d: '4n' },
    { time: '7:3',   n: 'D5',  d: '4n'  },
  ]));
  leadPart.loop = true;  leadPart.loopEnd = '8m';  leadPart.start(0);

  const padPart = _part(new Tone.Part((t, v) => pad.triggerAttackRelease(v.n, v.d, t), [
    { time: '0:0', n: ['G3', 'B3', 'D4'], d: '2m' },
    { time: '2:0', n: ['C3', 'E3', 'G3'], d: '2m' },
    { time: '4:0', n: ['G3', 'B3', 'D4'], d: '2m' },
    { time: '6:0', n: ['D3', 'F#3', 'A3'], d: '2m' },
  ]));
  padPart.loop = true;  padPart.loopEnd = '8m';  padPart.start(0);

  const bassPart = _part(new Tone.Part((t, v) => bass.triggerAttackRelease(v.n, v.d, t), [
    // G (bars 0-1)
    { time: '0:0', n: 'G2', d: '4n' }, { time: '0:1', n: 'B2', d: '4n' },
    { time: '0:2', n: 'D3', d: '4n' }, { time: '0:3', n: 'B2', d: '4n' },
    { time: '1:0', n: 'G2', d: '4n' }, { time: '1:1', n: 'G2', d: '4n' },
    { time: '1:2', n: 'G2', d: '4n' }, { time: '1:3', n: 'A2', d: '4n' },
    // C (bars 2-3)
    { time: '2:0', n: 'C3', d: '4n' }, { time: '2:1', n: 'E3', d: '4n' },
    { time: '2:2', n: 'G3', d: '4n' }, { time: '2:3', n: 'E3', d: '4n' },
    { time: '3:0', n: 'C3', d: '4n' }, { time: '3:1', n: 'C3', d: '4n' },
    { time: '3:2', n: 'C3', d: '4n' }, { time: '3:3', n: 'D3', d: '4n' },
    // G (bars 4-5)
    { time: '4:0', n: 'G2', d: '4n' }, { time: '4:1', n: 'B2', d: '4n' },
    { time: '4:2', n: 'D3', d: '4n' }, { time: '4:3', n: 'B2', d: '4n' },
    { time: '5:0', n: 'G2', d: '4n' }, { time: '5:1', n: 'G2', d: '4n' },
    { time: '5:2', n: 'G2', d: '4n' }, { time: '5:3', n: 'A2', d: '4n' },
    // D (bars 6-7)
    { time: '6:0', n: 'D3', d: '4n' }, { time: '6:1', n: 'F#3', d: '4n' },
    { time: '6:2', n: 'A3', d: '4n' }, { time: '6:3', n: 'F#3', d: '4n' },
    { time: '7:0', n: 'D3', d: '4n' }, { time: '7:1', n: 'D3', d: '4n' },
    { time: '7:2', n: 'G2', d: '4n' }, { time: '7:3', n: 'A2', d: '4n' },
  ]));
  bassPart.loop = true;  bassPart.loopEnd = '8m';  bassPart.start(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// BATTLE  "Do the Math!"
// Driving minor-key battle track.  A minor, 140 BPM, 4-bar loop.
// ─────────────────────────────────────────────────────────────────────────────
function _buildBattle(out) {
  Tone.getTransport().bpm.value = 140;

  const lead = _reg(new Tone.Synth({
    oscillator: { type: 'sawtooth8' },
    envelope:   { attack: 0.01, decay: 0.07, sustain: 0.45, release: 0.12 },
    volume: -9,
  }).connect(out));

  const arp = _reg(new Tone.Synth({
    oscillator: { type: 'square4' },
    envelope:   { attack: 0.005, decay: 0.07, sustain: 0.2, release: 0.08 },
    volume: -16,
  }).connect(out));

  const bass = _reg(new Tone.Synth({
    oscillator: { type: 'sawtooth4' },
    envelope:   { attack: 0.02, decay: 0.08, sustain: 0.6, release: 0.15 },
    volume: -9,
  }).connect(out));

  // Battle melody (A minor, dramatic peaks)
  const leadPart = _part(new Tone.Part((t, v) => lead.triggerAttackRelease(v.n, v.d, t), [
    { time: '0:0',   n: 'A5',  d: '8n' }, { time: '0:0.5', n: 'G5', d: '8n' },
    { time: '0:1',   n: 'A5',  d: '4n' },
    { time: '0:2',   n: 'C6',  d: '8n' }, { time: '0:2.5', n: 'B5', d: '8n' },
    { time: '0:3',   n: 'A5',  d: '4n' },
    { time: '1:0',   n: 'G5',  d: '8n' }, { time: '1:0.5', n: 'F5', d: '8n' },
    { time: '1:1',   n: 'G5',  d: '4n' }, { time: '1:2',   n: 'E5', d: '2n' },
    { time: '2:0',   n: 'F5',  d: '8n' }, { time: '2:0.5', n: 'E5', d: '8n' },
    { time: '2:1',   n: 'F5',  d: '4n' },
    { time: '2:2',   n: 'G5',  d: '8n' }, { time: '2:2.5', n: 'A5', d: '8n' },
    { time: '2:3',   n: 'G5',  d: '4n' },
    { time: '3:0',   n: 'E5',  d: '4n' }, { time: '3:1',   n: 'D5', d: '4n' },
    { time: '3:2',   n: 'E5',  d: '4n' }, { time: '3:3',   n: 'A4', d: '4n' },
  ]));
  leadPart.loop = true;  leadPart.loopEnd = '4m';  leadPart.start(0);

  // Driving 8th-note arpeggio: Am → F → C → E
  const arpNotes = [
    'A3','C4','E4','A4','C5','E4','C4','A3',  // Am ×2
    'F3','A3','C4','F4','A4','C4','A3','F3',  // F  ×2
    'C3','E3','G3','C4','E4','G3','E3','C3',  // C  ×2
    'E3','G#3','B3','E4','G#4','B3','G#3','E3', // E  ×2
  ];
  const arpEvents = arpNotes.map((n, i) => ({
    time: `${Math.floor(i / 8)}:${(i % 8) * 0.5}`, n, d: '8n',
  }));
  const arpPart = _part(new Tone.Part((t, v) => arp.triggerAttackRelease(v.n, v.d, t), arpEvents));
  arpPart.loop = true;  arpPart.loopEnd = '4m';  arpPart.start(0);

  // Pumping bass line
  const bassPart = _part(new Tone.Part((t, v) => bass.triggerAttackRelease(v.n, v.d, t), [
    { time: '0:0',   n: 'A2', d: '8n' }, { time: '0:0.5', n: 'A2', d: '16n' },
    { time: '0:1',   n: 'A2', d: '8n' }, { time: '0:2',   n: 'A2', d: '8n' },
    { time: '0:3',   n: 'G2', d: '8n' }, { time: '0:3.5', n: 'G2', d: '8n' },
    { time: '1:0',   n: 'A2', d: '8n' }, { time: '1:0.5', n: 'A2', d: '16n' },
    { time: '1:1',   n: 'A2', d: '8n' }, { time: '1:2',   n: 'E2', d: '4n' },
    { time: '1:3',   n: 'E2', d: '4n' },
    { time: '2:0',   n: 'F2', d: '8n' }, { time: '2:0.5', n: 'F2', d: '16n' },
    { time: '2:1',   n: 'F2', d: '8n' }, { time: '2:2',   n: 'F2', d: '8n' },
    { time: '2:3',   n: 'G2', d: '8n' }, { time: '2:3.5', n: 'G2', d: '8n' },
    { time: '3:0',   n: 'E2', d: '8n' }, { time: '3:0.5', n: 'E2', d: '16n' },
    { time: '3:1',   n: 'E2', d: '8n' }, { time: '3:2',   n: 'A2', d: '4n' },
    { time: '3:3',   n: 'E2', d: '4n' },
  ]));
  bassPart.loop = true;  bassPart.loopEnd = '4m';  bassPart.start(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// BOSS  "Final Equation"
// Intense, dark boss encounter.  E Phrygian, 152 BPM, 4-bar loop.
// ─────────────────────────────────────────────────────────────────────────────
function _buildBoss(out) {
  Tone.getTransport().bpm.value = 152;

  const lead = _reg(new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope:   { attack: 0.01, decay: 0.06, sustain: 0.55, release: 0.1 },
    volume: -7,
  }).connect(out));

  const arp = _reg(new Tone.Synth({
    oscillator: { type: 'square' },
    envelope:   { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.05 },
    volume: -16,
  }).connect(out));

  const bass = _reg(new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope:   { attack: 0.01, decay: 0.06, sustain: 0.7, release: 0.1 },
    volume: -7,
  }).connect(out));

  // Dark Phrygian modal melody (E-F-G-A-B-C-D)
  const leadPart = _part(new Tone.Part((t, v) => lead.triggerAttackRelease(v.n, v.d, t), [
    { time: '0:0',   n: 'E5', d: '8n' }, { time: '0:0.5', n: 'F5', d: '8n' },
    { time: '0:1',   n: 'G5', d: '4n' },
    { time: '0:2',   n: 'F5', d: '8n' }, { time: '0:2.5', n: 'E5', d: '8n' },
    { time: '0:3',   n: 'D5', d: '4n' },
    { time: '1:0',   n: 'C5', d: '8n' }, { time: '1:0.5', n: 'D5', d: '8n' },
    { time: '1:1',   n: 'E5', d: '4n' }, { time: '1:2',   n: 'G5', d: '4n' },
    { time: '1:3',   n: 'F5', d: '4n' },
    { time: '2:0',   n: 'E5', d: '8n' }, { time: '2:0.5', n: 'D5', d: '8n' },
    { time: '2:1',   n: 'C5', d: '4n' },
    { time: '2:2',   n: 'B4', d: '8n' }, { time: '2:2.5', n: 'C5', d: '8n' },
    { time: '2:3',   n: 'D5', d: '4n' },
    { time: '3:0',   n: 'E5', d: '4n' },
    { time: '3:1',   n: 'E5', d: '4n' },
    { time: '3:2',   n: 'D5', d: '8n' }, { time: '3:2.5', n: 'C5', d: '8n' },
    { time: '3:3',   n: 'B4', d: '4n' },
  ]));
  leadPart.loop = true;  leadPart.loopEnd = '4m';  leadPart.start(0);

  // Fast 16th-note arpeggios: Em → Fmaj → Gmaj → Am
  const arpNotes = [
    'E3','G3','B3','E4','G4','B4','G4','E4',   // Em
    'F3','A3','C4','F4','A4','C5','A4','F4',   // F
    'G3','B3','D4','G4','B4','D5','B4','G4',   // G
    'A3','C4','E4','A4','C5','E5','C5','A4',   // Am
  ];
  const arpEvents = arpNotes.map((n, i) => ({
    time: `${Math.floor(i / 8)}:${(i % 8) * 0.5}`, n, d: '16n',
  }));
  const arpPart = _part(new Tone.Part((t, v) => arp.triggerAttackRelease(v.n, v.d, t), arpEvents));
  arpPart.loop = true;  arpPart.loopEnd = '4m';  arpPart.start(0);

  // Heavy Phrygian bass: E → F → G chromatic tension
  const bassPart = _part(new Tone.Part((t, v) => bass.triggerAttackRelease(v.n, v.d, t), [
    { time: '0:0',   n: 'E2', d: '8n' }, { time: '0:0.5', n: 'E2', d: '8n' },
    { time: '0:1',   n: 'E2', d: '8n' }, { time: '0:1.5', n: 'F2', d: '8n' },
    { time: '0:2',   n: 'F2', d: '8n' }, { time: '0:2.5', n: 'F2', d: '8n' },
    { time: '0:3',   n: 'G2', d: '8n' }, { time: '0:3.5', n: 'G2', d: '8n' },
    { time: '1:0',   n: 'E2', d: '8n' }, { time: '1:0.5', n: 'E2', d: '8n' },
    { time: '1:1',   n: 'E2', d: '8n' }, { time: '1:1.5', n: 'D2', d: '8n' },
    { time: '1:2',   n: 'C2', d: '8n' }, { time: '1:2.5', n: 'D2', d: '8n' },
    { time: '1:3',   n: 'E2', d: '4n' },
    { time: '2:0',   n: 'G2', d: '8n' }, { time: '2:0.5', n: 'G2', d: '8n' },
    { time: '2:1',   n: 'G2', d: '8n' }, { time: '2:1.5', n: 'F2', d: '8n' },
    { time: '2:2',   n: 'F2', d: '8n' }, { time: '2:2.5', n: 'E2', d: '8n' },
    { time: '2:3',   n: 'D2', d: '8n' }, { time: '2:3.5', n: 'C2', d: '8n' },
    { time: '3:0',   n: 'E2', d: '4n' }, { time: '3:1',   n: 'E2', d: '8n' },
    { time: '3:1.5', n: 'F2', d: '8n' }, { time: '3:2',   n: 'G2', d: '8n' },
    { time: '3:2.5', n: 'G2', d: '8n' }, { time: '3:3',   n: 'E2', d: '4n' },
  ]));
  bassPart.loop = true;  bassPart.loopEnd = '4m';  bassPart.start(0);
}
