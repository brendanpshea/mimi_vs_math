#!/usr/bin/env python3
"""
generate_audio.py  —  Procedural SFX generator for Mimi vs Math.

Outputs 16-bit mono WAV files to  assets/audio/
using only numpy + the built-in `wave` module.

DSP chain (16/32-bit era quality):
  oscillators  →  ADSR envelope  →  lowpass filter  →  reverb  →  master gain

Usage:
    python tools/generate_audio.py
"""

import wave
from pathlib import Path

import numpy as np

# ── Config ────────────────────────────────────────────────────────────────────
SR      = 44100
OUT_DIR = Path(__file__).parent.parent / 'assets' / 'audio'
VOLUME  = 0.82   # master output ceiling

rng = np.random.default_rng(42)


# ── MIDI helpers ──────────────────────────────────────────────────────────────
def hz(midi: int) -> float:
    """MIDI note → Hz  (A4 = 69 = 440 Hz)"""
    return 440.0 * 2 ** ((midi - 69) / 12)

# Note constants
G2                          = 43
A2 = 45;  B2 = 47
C3, D3, E3, F3, G3, A3, B3 = 48, 50, 52, 53, 55, 57, 59
Bb3 = 58
C4, D4, E4, F4, G4, A4, B4 = 60, 62, 64, 65, 67, 69, 71
C5, D5, E5, F5, G5, A5, B5 = 72, 74, 76, 77, 79, 81, 83
C6 = 84


# ── Phase-accurate time + phase accumulator ───────────────────────────────────
def _n(dur: float) -> int:
    return int(SR * dur)


def _phase(freq_array: np.ndarray) -> np.ndarray:
    """Integrate a (possibly varying) frequency array to get instantaneous phase."""
    return np.cumsum(freq_array) / SR * 2 * np.pi


def _const_phase(freq: float, dur: float) -> np.ndarray:
    return _phase(np.full(_n(dur), freq))


# ── Band-limited oscillators (no aliasing) ────────────────────────────────────
def _bl_square(phase: np.ndarray, harmonics: int = 24) -> np.ndarray:
    """Band-limited square via odd-harmonic Fourier series."""
    out = np.zeros_like(phase)
    for k in range(1, harmonics + 1, 2):
        out += np.sin(k * phase) / k
    return out * (4 / np.pi)


def _bl_sawtooth(phase: np.ndarray, harmonics: int = 20) -> np.ndarray:
    """Band-limited sawtooth."""
    out = np.zeros_like(phase)
    for k in range(1, harmonics + 1):
        out += ((-1) ** (k + 1)) * np.sin(k * phase) / k
    return out * (2 / np.pi)


def sine(freq: float, dur: float) -> np.ndarray:
    return np.sin(_const_phase(freq, dur))


def square(freq: float, dur: float) -> np.ndarray:
    return _bl_square(_const_phase(freq, dur))


def soft_square(freq: float, dur: float) -> np.ndarray:
    """Softer square — fewer harmonics, warmer SNES-like timbre."""
    return _bl_square(_const_phase(freq, dur), harmonics=8)


def sawtooth(freq: float, dur: float) -> np.ndarray:
    return _bl_sawtooth(_const_phase(freq, dur))


def triangle(freq: float, dur: float) -> np.ndarray:
    ph = _const_phase(freq, dur)
    return 2 * np.abs(2 * (ph / (2 * np.pi) % 1) - 1) - 1


def noise_white(dur: float) -> np.ndarray:
    return rng.uniform(-1, 1, _n(dur))


def noise_pink(dur: float) -> np.ndarray:
    """Approximate pink noise via 1/f IIR of white noise."""
    w = rng.uniform(-1, 1, _n(dur))
    b0 = b1 = b2 = b3 = 0.0
    out = np.empty_like(w)
    for i, x in enumerate(w):
        b0 = 0.99886 * b0 + x * 0.0555179
        b1 = 0.99332 * b1 + x * 0.0750759
        b2 = 0.96900 * b2 + x * 0.1538520
        b3 = 0.86650 * b3 + x * 0.3104856
        out[i] = (b0 + b1 + b2 + b3 + x * 0.5329522) * 0.11
    return out


def silence(dur: float) -> np.ndarray:
    return np.zeros(_n(dur))


# ── FM synthesis ──────────────────────────────────────────────────────────────
def fm_tone(
    carrier_hz: float,
    dur:        float,
    mod_ratio:  float = 2.0,
    mod_depth:  float = 2.5,
    mod_decay:  float = 0.5,
) -> np.ndarray:
    """Phase-modulation synthesis — SNES-DX style richer timbre."""
    n = _n(dur)
    t = np.linspace(0, dur, n, endpoint=False)
    mod_env = np.exp(-t * (1.0 / (dur * mod_decay + 1e-9)))
    fm_hz   = carrier_hz * mod_ratio
    mod     = np.sin(2 * np.pi * fm_hz * t) * mod_depth * mod_env
    return np.sin(2 * np.pi * carrier_hz * t + mod)


def fm_pad(
    carrier_hz: float,
    dur:        float,
    mod_ratio:  float = 1.5,
    mod_depth:  float = 1.0,
) -> np.ndarray:
    """Soft pad-like FM tone with slow LFO vibrato."""
    n = _n(dur)
    t = np.linspace(0, dur, n, endpoint=False)
    vibrato = np.sin(2 * np.pi * 5.5 * t) * 0.004 * carrier_hz
    freq    = carrier_hz + vibrato
    phase   = _phase(freq)
    mod_ph  = _phase(np.full(n, carrier_hz * mod_ratio))
    return np.sin(phase + np.sin(mod_ph) * mod_depth)


# ── Envelope ──────────────────────────────────────────────────────────────────
def adsr(
    sig:     np.ndarray,
    attack:  float = 0.010,
    decay:   float = 0.050,
    sustain: float = 0.70,
    release: float = 0.10,
) -> np.ndarray:
    n = len(sig)
    env = np.empty(n)
    a = min(int(attack  * SR), n)
    d = min(int(decay   * SR), n - a)
    r = min(int(release * SR), n)
    s_start = a + d
    s_end   = max(n - r, s_start)

    if a:
        env[:a] = np.linspace(0, 1, a) ** 0.5         # sqrt = snappier
    if d:
        env[a:a + d] = np.linspace(1, sustain, d) ** 1.4
    env[s_start:s_end] = sustain
    if r:
        rem = min(r, n - s_end)
        env[s_end:s_end + rem] = np.linspace(sustain, 0, rem) ** 1.6
    return sig * env


# ── Filtering ─────────────────────────────────────────────────────────────────
def lowpass_fast(sig: np.ndarray, cutoff_hz: float) -> np.ndarray:
    """First-order IIR lowpass (RC filter)."""
    rc    = 1.0 / (2 * np.pi * cutoff_hz)
    alpha = (1.0 / SR) / (rc + 1.0 / SR)
    out = np.empty_like(sig)
    y = 0.0
    for i in range(len(sig)):
        y += alpha * (sig[i] - y)
        out[i] = y
    return out


# ── Reverb (Schroeder allpass + comb) ─────────────────────────────────────────
def reverb(
    sig:     np.ndarray,
    room:    float = 0.35,
    wet:     float = 0.30,
    damping: float = 0.45,
) -> np.ndarray:
    """Freeverb-inspired reverb using comb + allpass filters."""
    n = len(sig)
    comb_delays = [
        int(0.0297 * SR * (0.9 + 0.2 * room)),
        int(0.0371 * SR * (0.9 + 0.2 * room)),
        int(0.0411 * SR * (0.9 + 0.2 * room)),
        int(0.0437 * SR * (0.9 + 0.2 * room)),
    ]
    fb = 0.55 + 0.40 * room
    out = np.zeros(n)
    for delay in comb_delays:
        buf = np.zeros(delay)
        filt = 0.0
        pos  = 0
        cb   = np.empty(n)
        for i in range(n):
            input_s = buf[pos]
            filt    = input_s * (1 - damping) + filt * damping
            buf[pos] = sig[i] + filt * fb
            pos      = (pos + 1) % delay
            cb[i]    = input_s
        out += cb
    ap_delays = [int(0.0051 * SR), int(0.0127 * SR)]
    for delay in ap_delays:
        buf = np.zeros(delay)
        pos = 0
        ap  = np.empty(n)
        for i in range(n):
            bv      = buf[pos]
            buf[pos] = out[i] + bv * 0.5
            pos     = (pos + 1) % delay
            ap[i]   = bv - out[i] * 0.5
        out = ap
    out /= (len(comb_delays) + 1e-9)
    return sig * (1 - wet) + out * wet


def light_reverb(sig: np.ndarray, wet: float = 0.22) -> np.ndarray:
    return reverb(sig, room=0.25, wet=wet, damping=0.50)


def hall_reverb(sig: np.ndarray, wet: float = 0.38) -> np.ndarray:
    return reverb(sig, room=0.55, wet=wet, damping=0.35)


# ── Pitch-sweep note ──────────────────────────────────────────────────────────
def sweep_note(
    freq_start: float,
    freq_end:   float,
    dur:        float,
    attack:     float = 0.005,
    decay_t:    float = 0.04,
    sustain:    float = 0.65,
    release:    float = 0.08,
    amp:        float = 1.0,
) -> np.ndarray:
    n        = _n(dur)
    t        = np.linspace(0, 1, n, endpoint=False)
    freq_arr = freq_start + (freq_end - freq_start) * t
    phase    = _phase(freq_arr)
    sig      = np.sin(phase)
    return adsr(sig, attack=attack, decay=decay_t,
                sustain=sustain, release=release) * amp


# ── Note helpers ──────────────────────────────────────────────────────────────
def note(
    osc,
    freq:    float,
    dur:     float,
    attack:  float = 0.005,
    decay:   float = 0.05,
    sustain: float = 0.70,
    release: float = 0.08,
    amp:     float = 1.0,
) -> np.ndarray:
    return adsr(osc(freq, dur), attack=attack, decay=decay,
                sustain=sustain, release=release) * amp


def fm_note(
    freq:      float,
    dur:       float,
    mod_ratio: float = 2.0,
    mod_depth: float = 2.5,
    mod_decay: float = 0.5,
    attack:    float = 0.005,
    decay_t:   float = 0.06,
    sustain:   float = 0.70,
    release:   float = 0.08,
    amp:       float = 1.0,
) -> np.ndarray:
    return adsr(
        fm_tone(freq, dur, mod_ratio, mod_depth, mod_decay),
        attack=attack, decay=decay_t, sustain=sustain, release=release,
    ) * amp


# ── Mixing helpers ────────────────────────────────────────────────────────────
def overlay(*arrays: np.ndarray) -> np.ndarray:
    n = max(len(a) for a in arrays)
    out = np.zeros(n)
    for a in arrays:
        out[:len(a)] += a
    return out


def concat(*arrays: np.ndarray) -> np.ndarray:
    return np.concatenate(arrays)


# ── WAV export ────────────────────────────────────────────────────────────────
def save(filename: str, samples: np.ndarray) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / filename

    peak = np.max(np.abs(samples))
    if peak > 0:
        samples = samples / peak * VOLUME

    pcm = np.clip(samples * 32767, -32767, 32767).astype(np.int16)

    with wave.open(str(path), 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())

    print(f'  ✓  {filename:<26}  {len(samples)/SR:.2f}s')


# ═════════════════════════════════════════════════════════════════════════════
# Sound definitions  (16/32-bit era quality)
# ═════════════════════════════════════════════════════════════════════════════

def sfx_correct():
    """Bright ascending arpeggio — correct answer!  FM bell-tones + reverb."""
    kw = dict(mod_ratio=3.0, mod_depth=1.8, mod_decay=0.9,
              attack=0.005, decay_t=0.04, sustain=0.72, release=0.07)
    n0 = fm_note(hz(C5), 0.13, **kw)
    n1 = fm_note(hz(E5), 0.13, **kw)
    n2 = fm_note(hz(G5), 0.13, **kw)
    n3 = fm_note(hz(C6), 0.22, mod_ratio=2.5, mod_depth=1.4, mod_decay=1.2,
                 attack=0.007, decay_t=0.06, sustain=0.78, release=0.12)
    shimmer = adsr(soft_square(hz(C6) * 2, 0.22) * 0.08,
                   attack=0.02, decay=0.04, sustain=0.3, release=0.14)
    seq = concat(n0, n1, n2, overlay(n3, shimmer))
    return light_reverb(seq, wet=0.28)


def sfx_wrong():
    """Descending dissonant buzz — wrong answer.  Pitch-bent + lowpass."""
    bend  = sweep_note(hz(Bb3) * 1.07, hz(G3) * 0.85, 0.28,
                       attack=0.005, decay_t=0.08, sustain=0.45, release=0.12)
    clash = sweep_note(hz(B3) * 1.05, hz(G3), 0.22,
                       attack=0.010, decay_t=0.07, sustain=0.35, release=0.10,
                       amp=0.45)
    thud  = adsr(noise_pink(0.18) * 0.50,
                 attack=0.002, decay=0.09, sustain=0.08, release=0.08)
    mix   = overlay(bend, clash, thud)
    return lowpass_fast(light_reverb(mix, wet=0.18), cutoff_hz=2800)


def sfx_click():
    """Crisp UI click — short metallic tick."""
    dur  = 0.065
    body = fm_note(hz(A5), dur, mod_ratio=5.5, mod_depth=3.0, mod_decay=0.12,
                   attack=0.001, decay_t=0.012, sustain=0.10, release=0.035)
    tick = adsr(noise_pink(dur) * 0.55,
                attack=0.001, decay=0.010, sustain=0.00, release=0.025)
    return lowpass_fast(body + tick, cutoff_hz=8000)


def sfx_hit_enemy():
    """Impact pop — Mimi's hit lands.  FM punch + noise transient."""
    body  = sweep_note(hz(G4) * 1.25, hz(G4) * 0.70, 0.09,
                       attack=0.002, decay_t=0.032, sustain=0.18, release=0.04)
    bite  = fm_note(hz(G4), 0.07, mod_ratio=4.0, mod_depth=3.5, mod_decay=0.15,
                    attack=0.001, decay_t=0.025, sustain=0.05, release=0.03, amp=0.55)
    crack = adsr(noise_pink(0.06) * 0.70,
                 attack=0.001, decay=0.022, sustain=0.00, release=0.025)
    mix   = overlay(body, bite, crack)
    return lowpass_fast(light_reverb(mix, wet=0.14), cutoff_hz=7000)


def sfx_hit_player():
    """Heavier thud — player takes damage.  Deep FM + sub + noise."""
    thud  = fm_note(hz(D3) * 0.88, 0.16, mod_ratio=1.5, mod_depth=4.0, mod_decay=0.25,
                    attack=0.003, decay_t=0.06, sustain=0.28, release=0.08, amp=0.75)
    sub   = adsr(sine(hz(G2), 0.16) * 0.45,
                 attack=0.003, decay=0.05, sustain=0.22, release=0.09)
    snap  = adsr(noise_pink(0.08) * 0.80,
                 attack=0.001, decay=0.035, sustain=0.05, release=0.04)
    mix   = overlay(thud, sub, snap)
    return lowpass_fast(light_reverb(mix, wet=0.22), cutoff_hz=5500)


def sfx_chest_open():
    """Treasure harp arpeggio — chest opens.  FM harp tones + hall reverb."""
    kw = dict(mod_ratio=2.0, mod_depth=0.8, mod_decay=0.8,
              attack=0.006, decay_t=0.06, sustain=0.65, release=0.14)
    notes = [
        fm_note(hz(C4), 0.14, **kw),
        fm_note(hz(E4), 0.14, **kw),
        fm_note(hz(G4), 0.14, **kw),
        fm_note(hz(C5), 0.14, **kw),
        fm_note(hz(E5), 0.28, mod_ratio=2.0, mod_depth=0.6, mod_decay=1.2,
                attack=0.008, decay_t=0.08, sustain=0.78, release=0.22),
    ]
    sparkle = adsr(triangle(hz(C6), 0.30) * 0.15,
                   attack=0.025, decay=0.10, sustain=0.35, release=0.18)
    seq = concat(*notes)
    pad = sum(_n(0.14) for _ in range(4))
    out = np.array(seq, dtype=float)
    end = pad + len(sparkle)
    if end <= len(out):
        out[pad:end] += sparkle
    return hall_reverb(out, wet=0.38)


def sfx_battle_start():
    """Battle begins — FM power-chord swell + kick drum + high sting."""
    root  = fm_note(hz(G3), 0.22, mod_ratio=1.0, mod_depth=2.5, mod_decay=0.4,
                    attack=0.008, decay_t=0.06, sustain=0.65, release=0.10, amp=0.60)
    fifth = fm_note(hz(D4), 0.22, mod_ratio=1.0, mod_depth=2.0, mod_decay=0.4,
                    attack=0.010, decay_t=0.06, sustain=0.55, release=0.10, amp=0.45)
    kick  = adsr(overlay(sine(hz(G2), 0.18) * 0.80,
                         noise_pink(0.07) * 0.60),
                 attack=0.002, decay=0.07, sustain=0.12, release=0.10)
    sting = fm_note(hz(G5), 0.16, mod_ratio=2.0, mod_depth=1.8, mod_decay=0.3,
                    attack=0.003, decay_t=0.04, sustain=0.40, release=0.09)
    body  = overlay(root, fifth, kick)
    seq   = concat(body, silence(0.025), sting)
    return light_reverb(seq, wet=0.25)


def sfx_victory():
    """Victory jingle — warm bell melody + harmony pads."""
    kw  = dict(mod_ratio=3.5, mod_depth=1.2, mod_decay=1.0,
               attack=0.007, decay_t=0.05, sustain=0.72, release=0.12)
    kw2 = dict(mod_ratio=3.5, mod_depth=0.9, mod_decay=1.4,
               attack=0.008, decay_t=0.07, sustain=0.80, release=0.22)
    seq = concat(
        fm_note(hz(C4), 0.10, **kw),
        fm_note(hz(E4), 0.10, **kw),
        fm_note(hz(G4), 0.10, **kw),
        silence(0.030),
        fm_note(hz(G4), 0.09, **kw),
        fm_note(hz(C5), 0.09, **kw),
        silence(0.018),
        fm_note(hz(C5), 0.26, **kw2),
    )
    pad_start = _n(0.10) * 3 + _n(0.030) + _n(0.09) * 2 + _n(0.018)
    harm_e = fm_note(hz(E5), 0.26, **kw2) * 0.45
    harm_g = fm_note(hz(G5), 0.26, **kw2) * 0.35
    total  = max(len(seq), pad_start + len(harm_e))
    full   = np.zeros(total)
    full[:len(seq)] += seq
    full[pad_start:pad_start + len(harm_e)] += harm_e
    full[pad_start:pad_start + len(harm_g)] += harm_g
    return hall_reverb(full, wet=0.36)


def sfx_boss_intro():
    """Boss revealed — ominous FM swell, thunder crack, high screech."""
    low   = fm_pad(hz(G2), 0.50, mod_ratio=1.5, mod_depth=1.6)
    low   = adsr(low,  attack=0.18, decay=0.09, sustain=0.70, release=0.14) * 0.60
    fifth = fm_pad(hz(D3), 0.50, mod_ratio=1.5, mod_depth=1.4)
    fifth = adsr(fifth, attack=0.20, decay=0.09, sustain=0.62, release=0.14) * 0.50
    crack = adsr(lowpass_fast(noise_pink(0.22) * 1.0, cutoff_hz=1800),
                 attack=0.001, decay=0.07, sustain=0.06, release=0.14)
    sting = fm_note(hz(G5), 0.14, mod_ratio=2.0, mod_depth=2.2, mod_decay=0.25,
                    attack=0.003, decay_t=0.04, sustain=0.35, release=0.09)
    swell = overlay(low, fifth, crack)
    seq   = concat(swell, silence(0.025), sting)
    return hall_reverb(seq, wet=0.45)


def sfx_page_turn():
    """Story page advance — pitch-swept noise whoosh + chime."""
    n   = _n(0.16)
    t   = np.linspace(0, 1, n)
    freq_env = np.interp(t, [0, 0.3, 1.0], [300, 1400, 600])
    phase    = _phase(freq_env)
    sweep    = np.sin(phase) * 0.35 + noise_pink(0.16) * 0.42
    sweep    = adsr(sweep, attack=0.010, decay=0.055, sustain=0.22, release=0.08)
    sweep    = lowpass_fast(sweep, cutoff_hz=4500)
    chime    = adsr(fm_tone(hz(A5), 0.12, mod_ratio=4.0, mod_depth=0.6, mod_decay=1.5) * 0.55,
                    attack=0.004, decay=0.03, sustain=0.45, release=0.10)
    out = np.zeros(max(len(sweep), len(chime)))
    out[:len(sweep)] += sweep
    out[:len(chime)] += chime
    return light_reverb(out, wet=0.20)


def sfx_level_up():
    """Region cleared — ascending FM fanfare with warm pads."""
    kw  = dict(mod_ratio=3.0, mod_depth=1.4, mod_decay=0.9,
               attack=0.006, decay_t=0.05, sustain=0.72, release=0.10)
    kw2 = dict(mod_ratio=2.5, mod_depth=1.0, mod_decay=1.5,
               attack=0.006, decay_t=0.06, sustain=0.82, release=0.22)
    seq = concat(
        fm_note(hz(C4), 0.08, **kw),
        fm_note(hz(G4), 0.08, **kw),
        fm_note(hz(E5), 0.08, **kw),
        fm_note(hz(C5), 0.08, **kw),
        silence(0.025),
        fm_note(hz(C5), 0.08, **kw),
        fm_note(hz(E5), 0.08, **kw),
        fm_note(hz(G5), 0.28, **kw2),
    )
    pad_start = _n(0.08) * 6 + _n(0.025)
    pad_g = adsr(fm_pad(hz(G5), 0.36, mod_ratio=1.5, mod_depth=0.7) * 0.35,
                 attack=0.04, decay=0.05, sustain=0.70, release=0.20)
    pad_e = adsr(fm_pad(hz(E5), 0.36, mod_ratio=1.5, mod_depth=0.7) * 0.28,
                 attack=0.04, decay=0.05, sustain=0.60, release=0.20)
    total = max(len(seq), pad_start + len(pad_g))
    full  = np.zeros(total)
    full[:len(seq)] += seq
    full[pad_start:pad_start + len(pad_g)] += pad_g
    full[pad_start:pad_start + len(pad_e)] += pad_e
    return hall_reverb(full, wet=0.33)


def sfx_npc_talk():
    """NPC dialogue start — two chipper FM chime blips."""
    kw = dict(mod_ratio=3.5, mod_depth=0.8, mod_decay=0.6,
              attack=0.004, decay_t=0.020, sustain=0.55, release=0.06)
    seq = concat(fm_note(hz(E5), 0.07, **kw), silence(0.020),
                 fm_note(hz(G5), 0.07, **kw) * 0.90)
    return light_reverb(seq, wet=0.18)


def sfx_damage_critical():
    """Boss / critical hit — sub boom + noise explosion + metallic ring."""
    boom  = sweep_note(hz(D3), hz(G2) * 0.65, 0.22,
                       attack=0.003, decay_t=0.07, sustain=0.32, release=0.10, amp=0.75)
    body  = fm_note(hz(D3) * 0.80, 0.20, mod_ratio=1.2, mod_depth=5.0, mod_decay=0.3,
                    attack=0.002, decay_t=0.06, sustain=0.22, release=0.12, amp=0.55)
    blast = adsr(lowpass_fast(noise_pink(0.18) * 1.0, cutoff_hz=3500),
                 attack=0.001, decay=0.055, sustain=0.12, release=0.10)
    ring  = adsr(fm_tone(hz(G4), 0.14, mod_ratio=6.0, mod_depth=4.0, mod_decay=0.2) * 0.30,
                 attack=0.001, decay=0.035, sustain=0.10, release=0.09)
    mix   = overlay(boom, body, blast, ring)
    return light_reverb(mix, wet=0.28)


# ═════════════════════════════════════════════════════════════════════════════
# Manifest  —  {output filename: generator function}
# ═════════════════════════════════════════════════════════════════════════════

SOUNDS = {
    'sfx_correct.wav':        sfx_correct,
    'sfx_wrong.wav':          sfx_wrong,
    'sfx_click.wav':          sfx_click,
    'sfx_hit_enemy.wav':      sfx_hit_enemy,
    'sfx_hit_player.wav':     sfx_hit_player,
    'sfx_chest_open.wav':     sfx_chest_open,
    'sfx_battle_start.wav':   sfx_battle_start,
    'sfx_victory.wav':        sfx_victory,
    'sfx_boss_intro.wav':     sfx_boss_intro,
    'sfx_page_turn.wav':      sfx_page_turn,
    'sfx_level_up.wav':       sfx_level_up,
    'sfx_npc_talk.wav':       sfx_npc_talk,
    'sfx_damage_critical.wav':sfx_damage_critical,
}


if __name__ == '__main__':
    print(f'Generating {len(SOUNDS)} SFX → {OUT_DIR}\n')
    for filename, fn in SOUNDS.items():
        save(filename, fn())
    print(f'\nDone!  Files are in  assets/audio/')
