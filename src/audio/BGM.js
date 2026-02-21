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
let _masterVol    = null;
let _samplers     = null;
let _activeParts  = [];
let _started      = false;

// ── Audio context + sampler bootstrap (called once) ───────────────────────────

// Phase 1: create samplers and kick off MP3 fetching/decoding.
// Safe to call before any user gesture — does NOT start the AudioContext.
function _preloadSamplers() {
  if (_samplers) return;
  _masterVol = new Tone.Volume(-6).toDestination();
  _samplers  = _createSamplers(_masterVol);
  console.log('[BGM] Pre-loading instrument samples…');
}

// Phase 2: resume AudioContext (requires user gesture) and wait for decode.
async function _ensureCtx() {
  if (_started) return;
  _preloadSamplers();          // no-op if already done
  await Tone.start();          // resume AudioContext
  console.log('[BGM] Waiting for samples…');
  await Tone.loaded();         // likely already done if preload was called early
  console.log('[BGM] Samples ready.');
  _started = true;
}

function _createSamplers(out) {
  const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.18 }).connect(out);

  const piano = new Tone.Sampler({
    urls: {
      'A1': 'A1.mp3',
      'C2': 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', 'A2': 'A2.mp3',
      'C3': 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', 'A3': 'A3.mp3',
      'C4': 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', 'A4': 'A4.mp3',
      'C5': 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', 'A5': 'A5.mp3',
      'A6': 'A6.mp3',
    },
    baseUrl: 'assets/audio/samples/piano/',
  }).connect(out);

  const guitar = new Tone.Sampler({
    urls: {
      'E2': 'E2.mp3', 'A2': 'A2.mp3',
      'D3': 'D3.mp3', 'G3': 'G3.mp3',
      'C#4': 'Cs4.mp3', 'F#4': 'Fs4.mp3',
      'B4': 'B4.mp3',   'E5': 'E5.mp3', 'A5': 'A5.mp3',
    },
    baseUrl: 'assets/audio/samples/guitar-nylon/',
  }).connect(reverb);

  const violin = new Tone.Sampler({
    urls: {
      'G3': 'G3.mp3',
      'C4': 'C4.mp3', 'E4': 'E4.mp3', 'G4': 'G4.mp3', 'A4': 'A4.mp3',
      'C5': 'C5.mp3', 'E5': 'E5.mp3', 'G5': 'G5.mp3', 'A5': 'A5.mp3',
      'C6': 'C6.mp3', 'E6': 'E6.mp3', 'A6': 'A6.mp3',
    },
    baseUrl: 'assets/audio/samples/violin/',
  }).connect(reverb);

  const cello = new Tone.Sampler({
    urls: {
      'C2': 'C2.mp3', 'E2': 'E2.mp3', 'G2': 'G2.mp3', 'A2': 'A2.mp3',
      'C3': 'C3.mp3', 'E3': 'E3.mp3', 'G3': 'G3.mp3',
    },
    baseUrl: 'assets/audio/samples/cello/',
  }).connect(out);

  return { piano, guitar, violin, cello, reverb };
}

// ── Teardown: stop + discard all active Tone.Parts ────────────────────────────
function _teardown() {
  Tone.getTransport().stop();
  _activeParts.forEach(p => { try { p.stop(0); p.dispose(); } catch (_) {} });
  _activeParts = [];
}

function _part(p) { _activeParts.push(p); return p; }

// ── Public API ────────────────────────────────────────────────────────────────
const BGM = {
  /** Call during asset loading (e.g. BootScene) to pre-fetch all MP3 samples.
   *  No user gesture needed — just starts the network/decode in the background. */
  preload() { _preloadSamplers(); },
  async play(trackName) {
    if (_currentTrack === trackName) return;
    await _ensureCtx();
    _teardown();
    _currentTrack = trackName;

    const builder = TRACKS[trackName];
    if (!builder) return;

    _masterVol.volume.value = -60;
    builder(_samplers);
    Tone.getTransport().start();
    _masterVol.volume.rampTo(-6, 1.5);
  },

  stop(fadeSec = 0.8) {
    if (!_started || !_currentTrack) return;
    _currentTrack = null;
    if (_masterVol) _masterVol.volume.rampTo(-80, fadeSec);
    setTimeout(() => _teardown(), (fadeSec + 0.3) * 1000);
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
// Piano bell melody over guitar arpeggios + violin pads.  C major, 80 BPM.
// ─────────────────────────────────────────────────────────────────────────────
function _buildTitle({ piano, guitar, violin, cello }) {
  Tone.getTransport().bpm.value = 80;
  piano.volume.value  = -6;
  guitar.volume.value = -10;
  violin.volume.value = -12;
  cello.volume.value  = -10;

  // Violin pad chords: Cmaj → Am → Fmaj → Gmaj (whole bar each)
  const violinPad = _part(new Tone.Part((t, v) => {
    violin.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0', n: ['C4', 'E4', 'G4'], d: '1m' },
    { time: '1:0', n: ['A3', 'C4', 'E4'], d: '1m' },
    { time: '2:0', n: ['F3', 'A3', 'C4'], d: '1m' },
    { time: '3:0', n: ['G3', 'B3', 'D4'], d: '1m' },
  ]));
  violinPad.loop = true;  violinPad.loopEnd = '4m';  violinPad.start(0);

  // Guitar arpeggios: quarter-note chord tones
  const guitarArp = _part(new Tone.Part((t, v) => {
    guitar.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0', n: 'C3', d: '4n' }, { time: '0:1', n: 'E3', d: '4n' },
    { time: '0:2', n: 'G3', d: '4n' }, { time: '0:3', n: 'E3', d: '4n' },
    { time: '1:0', n: 'A3', d: '4n' }, { time: '1:1', n: 'C4', d: '4n' },
    { time: '1:2', n: 'E4', d: '4n' }, { time: '1:3', n: 'C4', d: '4n' },
    { time: '2:0', n: 'F3', d: '4n' }, { time: '2:1', n: 'A3', d: '4n' },
    { time: '2:2', n: 'C4', d: '4n' }, { time: '2:3', n: 'A3', d: '4n' },
    { time: '3:0', n: 'G3', d: '4n' }, { time: '3:1', n: 'B3', d: '4n' },
    { time: '3:2', n: 'D4', d: '4n' }, { time: '3:3', n: 'B3', d: '4n' },
  ]));
  guitarArp.loop = true;  guitarArp.loopEnd = '4m';  guitarArp.start(0);

  // Piano bell melody: gentle arpeggiated rise through each chord
  const pianoMel = _part(new Tone.Part((t, v) => {
    piano.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0',   n: 'C5',  d: '8n' }, { time: '0:0.5', n: 'E5', d: '8n' },
    { time: '0:1',   n: 'G5',  d: '4n' }, { time: '0:2',   n: 'G5', d: '8n' },
    { time: '0:2.5', n: 'E5',  d: '8n' }, { time: '0:3',   n: 'G5', d: '4n' },
    { time: '1:0',   n: 'A4',  d: '8n' }, { time: '1:0.5', n: 'C5', d: '8n' },
    { time: '1:1',   n: 'E5',  d: '4n' }, { time: '1:2',   n: 'E5', d: '8n' },
    { time: '1:2.5', n: 'C5',  d: '8n' }, { time: '1:3',   n: 'A5', d: '4n' },
    { time: '2:0',   n: 'F4',  d: '8n' }, { time: '2:0.5', n: 'A4', d: '8n' },
    { time: '2:1',   n: 'C5',  d: '4n' }, { time: '2:2',   n: 'F5', d: '8n' },
    { time: '2:2.5', n: 'E5',  d: '8n' }, { time: '2:3',   n: 'C5', d: '4n' },
    { time: '3:0',   n: 'G4',  d: '8n' }, { time: '3:0.5', n: 'B4', d: '8n' },
    { time: '3:1',   n: 'D5',  d: '4n' }, { time: '3:2',   n: 'G5', d: '8n' },
    { time: '3:2.5', n: 'B5',  d: '8n' }, { time: '3:3',   n: 'D5', d: '4n' },
  ]));
  pianoMel.loop = true;  pianoMel.loopEnd = '4m';  pianoMel.start(0);

  // Cello walking half-note bass
  const celloBass = _part(new Tone.Part((t, v) => {
    cello.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0', n: 'C2', d: '2n' }, { time: '0:2', n: 'G2', d: '2n' },
    { time: '1:0', n: 'A2', d: '2n' }, { time: '1:2', n: 'E2', d: '2n' },
    { time: '2:0', n: 'F2', d: '2n' }, { time: '2:2', n: 'C2', d: '2n' },
    { time: '3:0', n: 'G2', d: '2n' }, { time: '3:2', n: 'D2', d: '2n' },  // D2 played as E2 (nearest)
  ]));
  celloBass.loop = true;  celloBass.loopEnd = '4m';  celloBass.start(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERWORLD  "Adventure Begins"
// Bright, Zelda-inspired world-map theme.  C major, 105 BPM, 8-bar loop.
// ─────────────────────────────────────────────────────────────────────────────
function _buildOverworld({ piano, guitar, violin, cello }) {
  Tone.getTransport().bpm.value = 105;
  piano.volume.value  = -7;
  guitar.volume.value = -14;
  violin.volume.value = -13;
  cello.volume.value  = -9;

  // Piano carries the Zelda-style overworld melody
  const pianoMel = _part(new Tone.Part((t, v) => {
    piano.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0',   n: 'G5',  d: '8n'  }, { time: '0:0.5', n: 'E5', d: '8n'  },
    { time: '0:1',   n: 'C5',  d: '4n'  }, { time: '0:2',   n: 'D5', d: '4n'  },
    { time: '0:3',   n: 'E5',  d: '4n'  },
    { time: '1:0',   n: 'G5',  d: '4n.' }, { time: '1:1.5', n: 'A5', d: '8n'  },
    { time: '1:2',   n: 'G5',  d: '2n'  },
    { time: '2:0',   n: 'E5',  d: '8n'  }, { time: '2:0.5', n: 'D5', d: '8n'  },
    { time: '2:1',   n: 'C5',  d: '4n'  }, { time: '2:2',   n: 'A4', d: '4n'  },
    { time: '2:3',   n: 'G4',  d: '4n'  },
    { time: '3:0',   n: 'A4',  d: '4n'  }, { time: '3:1',   n: 'C5', d: '4n'  },
    { time: '3:2',   n: 'E5',  d: '2n'  },
    { time: '4:0',   n: 'F5',  d: '8n'  }, { time: '4:0.5', n: 'E5', d: '8n'  },
    { time: '4:1',   n: 'D5',  d: '4n'  }, { time: '4:2',   n: 'E5', d: '4n'  },
    { time: '4:3',   n: 'C5',  d: '4n'  },
    { time: '5:0',   n: 'G5',  d: '4n.' }, { time: '5:1.5', n: 'A5', d: '8n'  },
    { time: '5:2',   n: 'B5',  d: '2n'  },
    { time: '6:0',   n: 'A5',  d: '8n'  }, { time: '6:0.5', n: 'G5', d: '8n'  },
    { time: '6:1',   n: 'F5',  d: '4n'  }, { time: '6:2',   n: 'E5', d: '4n'  },
    { time: '6:3',   n: 'D5',  d: '4n'  },
    { time: '7:0',   n: 'C5',  d: '2n'  }, { time: '7:2',   n: 'G4', d: '4n'  },
    { time: '7:3',   n: 'A4',  d: '4n'  },
  ]));
  pianoMel.loop = true;  pianoMel.loopEnd = '8m';  pianoMel.start(0);

  // Violin pads: long 2-bar chords
  const violinPad = _part(new Tone.Part((t, v) => {
    violin.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0', n: ['C4', 'E4', 'G4'], d: '2m' },
    { time: '2:0', n: ['F3', 'A3', 'C4'], d: '2m' },
    { time: '4:0', n: ['G3', 'B3', 'D4'], d: '2m' },
    { time: '6:0', n: ['C4', 'E4', 'G4'], d: '2m' },
  ]));
  violinPad.loop = true;  violinPad.loopEnd = '8m';  violinPad.start(0);

  // Guitar fills on beats 3-4 of each bar
  const guitarFill = _part(new Tone.Part((t, v) => {
    guitar.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:2', n: 'E4', d: '4n' }, { time: '0:3', n: 'G4', d: '4n' },
    { time: '2:2', n: 'A3', d: '4n' }, { time: '2:3', n: 'C4', d: '4n' },
    { time: '4:2', n: 'B4', d: '4n' }, { time: '4:3', n: 'D5', d: '4n' },
    { time: '6:2', n: 'E4', d: '4n' }, { time: '6:3', n: 'G4', d: '4n' },
  ]));
  guitarFill.loop = true;  guitarFill.loopEnd = '8m';  guitarFill.start(0);

  // Cello quarter-note walking bass
  const celloBass = _part(new Tone.Part((t, v) => {
    cello.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0', n: 'C2', d: '4n' }, { time: '0:1', n: 'C2', d: '4n' },
    { time: '0:2', n: 'G2', d: '4n' }, { time: '0:3', n: 'G2', d: '4n' },
    { time: '1:0', n: 'C2', d: '4n' }, { time: '1:1', n: 'C2', d: '4n' },
    { time: '1:2', n: 'E2', d: '4n' }, { time: '1:3', n: 'G2', d: '4n' },
    { time: '2:0', n: 'F2', d: '4n' }, { time: '2:1', n: 'F2', d: '4n' },
    { time: '2:2', n: 'A2', d: '4n' }, { time: '2:3', n: 'C3', d: '4n' },
    { time: '3:0', n: 'F2', d: '4n' }, { time: '3:1', n: 'E2', d: '4n' },
    { time: '3:2', n: 'E2', d: '4n' }, { time: '3:3', n: 'C2', d: '4n' },
    { time: '4:0', n: 'G2', d: '4n' }, { time: '4:1', n: 'G2', d: '4n' },
    { time: '4:2', n: 'G2', d: '4n' }, { time: '4:3', n: 'G2', d: '4n' },
    { time: '5:0', n: 'G2', d: '4n' }, { time: '5:1', n: 'G2', d: '4n' },
    { time: '5:2', n: 'E2', d: '4n' }, { time: '5:3', n: 'E2', d: '4n' },
    { time: '6:0', n: 'C2', d: '4n' }, { time: '6:1', n: 'E2', d: '4n' },
    { time: '6:2', n: 'G2', d: '4n' }, { time: '6:3', n: 'A2', d: '4n' },
    { time: '7:0', n: 'C2', d: '2n' }, { time: '7:2', n: 'G2', d: '4n' },
    { time: '7:3', n: 'G2', d: '4n' },
  ]));
  celloBass.loop = true;  celloBass.loopEnd = '8m';  celloBass.start(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORE  "Into the Dungeon"
// Upbeat in-world exploration.  G major, 118 BPM, 8-bar loop.
// ─────────────────────────────────────────────────────────────────────────────
function _buildExplore({ piano, guitar, violin, cello }) {
  Tone.getTransport().bpm.value = 118;
  piano.volume.value  = -14;
  guitar.volume.value = -8;
  violin.volume.value = -13;
  cello.volume.value  = -10;

  // Guitar carries the brisk JRPG field melody in G major
  const guitarMel = _part(new Tone.Part((t, v) => {
    guitar.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0',   n: 'G5',  d: '4n'  },
    { time: '0:1',   n: 'B5',  d: '8n'  }, { time: '0:1.5', n: 'A5',  d: '8n'  },
    { time: '0:2',   n: 'G5',  d: '4n'  }, { time: '0:3',   n: 'D5',  d: '4n'  },
    { time: '1:0',   n: 'E5',  d: '8n'  }, { time: '1:0.5', n: 'D5',  d: '8n'  },
    { time: '1:1',   n: 'E5',  d: '4n'  }, { time: '1:2',   n: 'G5',  d: '2n'  },
    { time: '2:0',   n: 'A5',  d: '4n'  }, { time: '2:1',   n: 'B5',  d: '4n'  },
    { time: '2:2',   n: 'A5',  d: '4n'  }, { time: '2:3',   n: 'B5',  d: '4n'  },
    { time: '3:0',   n: 'A5',  d: '2n'  }, { time: '3:2',   n: 'G5',  d: '4n'  },
    { time: '3:3',   n: 'F#4', d: '4n'  },
    { time: '4:0',   n: 'G5',  d: '4n'  },
    { time: '4:1',   n: 'D5',  d: '8n'  }, { time: '4:1.5', n: 'E5',  d: '8n'  },
    { time: '4:2',   n: 'G5',  d: '4n'  }, { time: '4:3',   n: 'B5',  d: '4n'  },
    { time: '5:0',   n: 'A5',  d: '8n'  }, { time: '5:0.5', n: 'G5',  d: '8n'  },
    { time: '5:1',   n: 'F#4', d: '4n'  }, { time: '5:2',   n: 'D5',  d: '2n'  },
    { time: '6:0',   n: 'E5',  d: '4n'  }, { time: '6:1',   n: 'G5',  d: '4n'  },
    { time: '6:2',   n: 'A5',  d: '4n'  }, { time: '6:3',   n: 'A5',  d: '4n'  },
    { time: '7:0',   n: 'B5',  d: '2n'  }, { time: '7:2',   n: 'G5',  d: '4n'  },
    { time: '7:3',   n: 'D5',  d: '4n'  },
  ]));
  guitarMel.loop = true;  guitarMel.loopEnd = '8m';  guitarMel.start(0);

  // Violin pads: 2-bar sustained chords
  const violinPad = _part(new Tone.Part((t, v) => {
    violin.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0', n: ['G3', 'B3', 'D4'], d: '2m' },
    { time: '2:0', n: ['C4', 'E4', 'G4'], d: '2m' },
    { time: '4:0', n: ['G3', 'B3', 'D4'], d: '2m' },
    { time: '6:0', n: ['A3', 'C4', 'E4'], d: '2m' },
  ]));
  violinPad.loop = true;  violinPad.loopEnd = '8m';  violinPad.start(0);

  // Piano fills on off-beats (lighter counter-melody)
  const pianoFill = _part(new Tone.Part((t, v) => {
    piano.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:1.5', n: 'D5', d: '8n' }, { time: '0:3.5', n: 'B4', d: '8n' },
    { time: '1:1.5', n: 'C5', d: '8n' }, { time: '1:3.5', n: 'E5', d: '8n' },
    { time: '2:1.5', n: 'E5', d: '8n' }, { time: '2:3.5', n: 'G5', d: '8n' },
    { time: '3:1.5', n: 'D5', d: '8n' }, { time: '3:3.5', n: 'A4', d: '8n' },
    { time: '4:1.5', n: 'D5', d: '8n' }, { time: '4:3.5', n: 'G5', d: '8n' },
    { time: '5:1.5', n: 'C5', d: '8n' }, { time: '5:3.5', n: 'A4', d: '8n' },
    { time: '6:1.5', n: 'C5', d: '8n' }, { time: '6:3.5', n: 'E5', d: '8n' },
    { time: '7:1.5', n: 'G5', d: '8n' }, { time: '7:3.5', n: 'D5', d: '8n' },
  ]));
  pianoFill.loop = true;  pianoFill.loopEnd = '8m';  pianoFill.start(0);

  // Cello quarter-note bass
  const celloBass = _part(new Tone.Part((t, v) => {
    cello.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0', n: 'G2', d: '4n' }, { time: '0:1', n: 'G2', d: '4n' },
    { time: '0:2', n: 'G2', d: '4n' }, { time: '0:3', n: 'A2', d: '4n' },
    { time: '1:0', n: 'G2', d: '4n' }, { time: '1:1', n: 'G2', d: '4n' },
    { time: '1:2', n: 'G2', d: '4n' }, { time: '1:3', n: 'A2', d: '4n' },
    { time: '2:0', n: 'C3', d: '4n' }, { time: '2:1', n: 'C3', d: '4n' },
    { time: '2:2', n: 'C3', d: '4n' }, { time: '2:3', n: 'E3', d: '4n' },
    { time: '3:0', n: 'C3', d: '4n' }, { time: '3:1', n: 'C3', d: '4n' },
    { time: '3:2', n: 'C3', d: '4n' }, { time: '3:3', n: 'G2', d: '4n' },
    { time: '4:0', n: 'G2', d: '4n' }, { time: '4:1', n: 'G2', d: '4n' },
    { time: '4:2', n: 'G2', d: '4n' }, { time: '4:3', n: 'A2', d: '4n' },
    { time: '5:0', n: 'G2', d: '4n' }, { time: '5:1', n: 'G2', d: '4n' },
    { time: '5:2', n: 'G2', d: '4n' }, { time: '5:3', n: 'A2', d: '4n' },
    { time: '6:0', n: 'A2', d: '4n' }, { time: '6:1', n: 'A2', d: '4n' },
    { time: '6:2', n: 'A2', d: '4n' }, { time: '6:3', n: 'C3', d: '4n' },
    { time: '7:0', n: 'G2', d: '4n' }, { time: '7:1', n: 'G2', d: '4n' },
    { time: '7:2', n: 'G2', d: '4n' }, { time: '7:3', n: 'A2', d: '4n' },
  ]));
  celloBass.loop = true;  celloBass.loopEnd = '8m';  celloBass.start(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// BATTLE  "Do the Math!"
// Driving minor-key battle track.  A minor, 140 BPM, 4-bar loop.
// ─────────────────────────────────────────────────────────────────────────────
function _buildBattle({ piano, guitar, violin, cello }) {
  Tone.getTransport().bpm.value = 140;
  piano.volume.value  = -8;
  guitar.volume.value = -11;
  violin.volume.value = -11;
  cello.volume.value  = -8;

  // Piano carries the battle melody (A minor, dramatic peaks)
  const pianoMel = _part(new Tone.Part((t, v) => {
    piano.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0',   n: 'A5',  d: '8n' }, { time: '0:0.5', n: 'G5', d: '8n' },
    { time: '0:1',   n: 'A5',  d: '4n' },
    { time: '0:2',   n: 'C6',  d: '8n' }, { time: '0:2.5', n: 'A5', d: '8n' },
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
  pianoMel.loop = true;  pianoMel.loopEnd = '4m';  pianoMel.start(0);

  // Guitar 8th-note arpeggios: Am → F → C → E
  const guitarArpNotes = [
    'A3','C4','E4','A4','C5','E4','C4','A3',
    'F3','A3','C4','F4','A4','C4','A3','F3',
    'C3','E3','G3','C4','E4','G3','E3','C3',
    'E3','A3','E4','A4','C5','E4','A3','E3',
  ];
  const guitarArpEvents = guitarArpNotes.map((n, i) => ({
    time: `${Math.floor(i / 8)}:${(i % 8) * 0.5}`, n, d: '8n',
  }));
  const guitarArp = _part(new Tone.Part((t, v) => {
    guitar.triggerAttackRelease(v.n, v.d, t);
  }, guitarArpEvents));
  guitarArp.loop = true;  guitarArp.loopEnd = '4m';  guitarArp.start(0);

  // Violin tension stabs: 8th-note chord hits
  const violinStab = _part(new Tone.Part((t, v) => {
    violin.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0',   n: ['A4','C5','E5'], d: '8n' },
    { time: '0:1',   n: ['A4','C5','E5'], d: '8n' },
    { time: '0:2',   n: ['A4','C5'],      d: '8n' },
    { time: '0:3',   n: ['G4','C5'],      d: '8n' },
    { time: '1:0',   n: ['A4','C5','E5'], d: '8n' },
    { time: '1:2',   n: ['E4','G4','C5'], d: '4n' },
    { time: '2:0',   n: ['F4','A4','C5'], d: '8n' },
    { time: '2:1',   n: ['F4','A4','C5'], d: '8n' },
    { time: '2:2',   n: ['G4','B4','D5'], d: '8n' },
    { time: '2:3',   n: ['A4','C5','E5'], d: '8n' },
    { time: '3:0',   n: ['E4','G4','B4'], d: '4n' },
    { time: '3:2',   n: ['A4','C5','E5'], d: '4n' },
  ]));
  violinStab.loop = true;  violinStab.loopEnd = '4m';  violinStab.start(0);

  // Cello pumping bass
  const celloBass = _part(new Tone.Part((t, v) => {
    cello.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0',   n: 'A2', d: '8n' }, { time: '0:0.5', n: 'A2', d: '16n' },
    { time: '0:1',   n: 'A2', d: '8n' }, { time: '0:2',   n: 'A2', d: '8n'  },
    { time: '0:3',   n: 'G2', d: '8n' }, { time: '0:3.5', n: 'G2', d: '8n'  },
    { time: '1:0',   n: 'A2', d: '8n' }, { time: '1:0.5', n: 'A2', d: '16n' },
    { time: '1:1',   n: 'A2', d: '8n' }, { time: '1:2',   n: 'E2', d: '4n'  },
    { time: '1:3',   n: 'E2', d: '4n' },
    { time: '2:0',   n: 'F2', d: '8n' }, { time: '2:0.5', n: 'F2', d: '16n' },
    { time: '2:1',   n: 'F2', d: '8n' }, { time: '2:2',   n: 'F2', d: '8n'  },
    { time: '2:3',   n: 'G2', d: '8n' }, { time: '2:3.5', n: 'G2', d: '8n'  },
    { time: '3:0',   n: 'E2', d: '8n' }, { time: '3:0.5', n: 'E2', d: '16n' },
    { time: '3:1',   n: 'E2', d: '8n' }, { time: '3:2',   n: 'A2', d: '4n'  },
    { time: '3:3',   n: 'E2', d: '4n' },
  ]));
  celloBass.loop = true;  celloBass.loopEnd = '4m';  celloBass.start(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// BOSS  "Final Equation"
// Intense, dark boss encounter.  E Phrygian, 152 BPM, 4-bar loop.
// ─────────────────────────────────────────────────────────────────────────────
function _buildBoss({ piano, guitar, violin, cello }) {
  Tone.getTransport().bpm.value = 152;
  piano.volume.value  = -7;
  guitar.volume.value = -13;
  violin.volume.value = -10;
  cello.volume.value  = -7;

  // Piano carries the dark Phrygian modal melody (E-F-G-A-B-C-D)
  const pianoMel = _part(new Tone.Part((t, v) => {
    piano.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0',   n: 'E5', d: '8n' }, { time: '0:0.5', n: 'F5', d: '8n' },
    { time: '0:1',   n: 'G5', d: '4n' },
    { time: '0:2',   n: 'F5', d: '8n' }, { time: '0:2.5', n: 'E5', d: '8n' },
    { time: '0:3',   n: 'D5', d: '4n' },
    { time: '1:0',   n: 'C5', d: '8n' }, { time: '1:0.5', n: 'D5', d: '8n' },
    { time: '1:1',   n: 'E5', d: '4n' }, { time: '1:2',   n: 'G5', d: '4n' },
    { time: '1:3',   n: 'F5', d: '4n' },
    { time: '2:0',   n: 'E5', d: '8n' }, { time: '2:0.5', n: 'D5', d: '8n' },
    { time: '2:1',   n: 'C5', d: '4n' },
    { time: '2:2',   n: 'A4', d: '8n' }, { time: '2:2.5', n: 'C5', d: '8n' },
    { time: '2:3',   n: 'D5', d: '4n' },
    { time: '3:0',   n: 'E5', d: '4n' }, { time: '3:1',   n: 'E5', d: '4n' },
    { time: '3:2',   n: 'D5', d: '8n' }, { time: '3:2.5', n: 'C5', d: '8n' },
    { time: '3:3',   n: 'A4', d: '4n' },
  ]));
  pianoMel.loop = true;  pianoMel.loopEnd = '4m';  pianoMel.start(0);

  // Violin fast 16th-note arpeggios: Em → F → G → Am
  const violinArpNotes = [
    'E4','G4','E5','G5','E5','G4','E4','G3',
    'F3','A4','C5','F4','C5','A4','F4','A3',
    'G3','B3','D4','G4','D4','B3','G3','B3',
    'A3','C4','E4','A4','E4','C4','A3','C4',
  ];
  const violinArpEvents = violinArpNotes.map((n, i) => ({
    time: `${Math.floor(i / 8)}:${(i % 8) * 0.5}`, n, d: '16n',
  }));
  const violinArp = _part(new Tone.Part((t, v) => {
    violin.triggerAttackRelease(v.n, v.d, t);
  }, violinArpEvents));
  violinArp.loop = true;  violinArp.loopEnd = '4m';  violinArp.start(0);

  // Guitar accent stabs (sparse, on the beat)
  const guitarStab = _part(new Tone.Part((t, v) => {
    guitar.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0', n: 'E3', d: '8n' }, { time: '0:2', n: 'F3', d: '8n' },
    { time: '1:0', n: 'E3', d: '8n' }, { time: '1:3', n: 'G3', d: '8n' },
    { time: '2:0', n: 'G3', d: '8n' }, { time: '2:2', n: 'E3', d: '8n' },
    { time: '3:0', n: 'E3', d: '4n' }, { time: '3:2', n: 'E3', d: '8n' },
    { time: '3:3', n: 'F3', d: '8n' },
  ]));
  guitarStab.loop = true;  guitarStab.loopEnd = '4m';  guitarStab.start(0);

  // Cello heavy Phrygian bass
  const celloBass = _part(new Tone.Part((t, v) => {
    cello.triggerAttackRelease(v.n, v.d, t);
  }, [
    { time: '0:0',   n: 'E2', d: '8n' }, { time: '0:0.5', n: 'E2', d: '8n' },
    { time: '0:1',   n: 'E2', d: '8n' }, { time: '0:1.5', n: 'E2', d: '8n' },
    { time: '0:2',   n: 'F2', d: '8n' }, { time: '0:2.5', n: 'F2', d: '8n' },
    { time: '0:3',   n: 'G2', d: '8n' }, { time: '0:3.5', n: 'G2', d: '8n' },
    { time: '1:0',   n: 'E2', d: '8n' }, { time: '1:0.5', n: 'E2', d: '8n' },
    { time: '1:1',   n: 'E2', d: '8n' }, { time: '1:1.5', n: 'E2', d: '8n' },
    { time: '1:2',   n: 'C2', d: '8n' }, { time: '1:2.5', n: 'E2', d: '8n' },
    { time: '1:3',   n: 'E2', d: '4n' },
    { time: '2:0',   n: 'G2', d: '8n' }, { time: '2:0.5', n: 'G2', d: '8n' },
    { time: '2:1',   n: 'G2', d: '8n' }, { time: '2:1.5', n: 'G2', d: '8n' },
    { time: '2:2',   n: 'G2', d: '8n' }, { time: '2:2.5', n: 'E2', d: '8n' },
    { time: '2:3',   n: 'E2', d: '8n' }, { time: '2:3.5', n: 'C2', d: '8n' },
    { time: '3:0',   n: 'E2', d: '4n' }, { time: '3:1',   n: 'E2', d: '8n' },
    { time: '3:1.5', n: 'E2', d: '8n' }, { time: '3:2',   n: 'G2', d: '8n' },
    { time: '3:2.5', n: 'G2', d: '8n' }, { time: '3:3',   n: 'E2', d: '4n' },
  ]));
  celloBass.loop = true;  celloBass.loopEnd = '4m';  celloBass.start(0);
}
