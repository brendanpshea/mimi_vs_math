#!/usr/bin/env python3
"""
download_samples.py  —  Fetch instrument sample MP3s for Mimi vs Math BGM.

Downloads a minimal curated set of notes per instrument from the
public-domain nbrosowsky/tonejs-instruments library hosted on GitHub Pages.
Tone.Sampler pitch-shifts between samples, so every chromatic note is NOT needed.

Output:  assets/audio/samples/{instrument}/{note}.mp3

Usage:
    python tools/download_samples.py
"""

import urllib.request
import urllib.error
from pathlib import Path

BASE_URL = "https://nbrosowsky.github.io/tonejs-instruments/samples"
OUT_DIR  = Path(__file__).parent.parent / "assets" / "audio" / "samples"

# ── Samples to fetch ──────────────────────────────────────────────────────────
# Only the notes actually used as anchor points by Tone.Sampler.
# Keys are instrument folder names; values are the note filenames (without .mp3).
#
# Instrument roles in the BGM tracks:
#   piano        — lead melodies across all 5 tracks
#   guitar-nylon — arpeggios (title, explore, battle)
#   violin       — pad / chord sustain layers
#   cello        — bass lines
#
# The repo uses 's' for sharp: Cs4 = C#4, Ds4 = D#4, Fs4 = F#4, Gs4 = G#4.

DOWNLOADS: dict[str, list[str]] = {
    # Piano: every 3 semitones from A1–A6 → 18 files
    "piano": [
        "A1",
        "A2", "C2", "Ds2", "Fs2",
        "A3", "C3", "Ds3", "Fs3",
        "A4", "C4", "Ds4", "Fs4",
        "A5", "C5", "Ds5", "Fs5",
        "A6",
    ],

    # Guitar-nylon: sparse natural open-string spread → 9 files
    "guitar-nylon": [
        "E2", "A2",
        "D3", "G3",
        "Cs4", "Fs4",
        "B4", "E5", "A5",
    ],

    # Violin: available anchor notes across its range → 12 files
    "violin": [
        "G3",
        "C4", "E4", "G4", "A4",
        "C5", "E5", "G5", "A5",
        "C6", "E6", "A6",
    ],

    # Cello: covers the bass range C2–G3 → 7 files
    "cello": [
        "C2", "E2", "G2", "A2",
        "C3", "E3", "G3",
    ],
}


def download_all() -> None:
    total = sum(len(v) for v in DOWNLOADS.values())
    done  = 0
    skipped = 0
    failed: list[str] = []

    print(f"Downloading {total} sample files → {OUT_DIR}\n")

    for instrument, notes in DOWNLOADS.items():
        inst_dir = OUT_DIR / instrument
        inst_dir.mkdir(parents=True, exist_ok=True)
        print(f"  [{instrument}]")

        for note in notes:
            filename = f"{note}.mp3"
            dest     = inst_dir / filename
            url      = f"{BASE_URL}/{instrument}/{filename}"

            if dest.exists() and dest.stat().st_size > 0:
                print(f"    skip   {filename}")
                skipped += 1
                done    += 1
                continue

            print(f"    dl     {filename} ...", end=" ", flush=True)
            try:
                urllib.request.urlretrieve(url, dest)
                size = dest.stat().st_size
                print(f"✓  ({size // 1024} KB)")
            except urllib.error.HTTPError as e:
                print(f"✗  HTTP {e.code}")
                dest.unlink(missing_ok=True)
                failed.append(f"{instrument}/{filename}")
            except Exception as e:
                print(f"✗  {e}")
                dest.unlink(missing_ok=True)
                failed.append(f"{instrument}/{filename}")
            done += 1

        print()

    print(f"Done.  {done - len(failed)} downloaded"
          f"  |  {skipped} already cached"
          f"  |  {len(failed)} failed")
    if failed:
        print("\nFailed files:")
        for f in failed:
            print(f"  • {f}")


if __name__ == "__main__":
    download_all()
