"""A soft, hypnotic synth bed for the promo (made here, so there are no licensing questions).
Dreamy pads, a sub, a looping plucked arpeggio with ping-pong delay and a light shaker.
Run: python3 music.py SECONDS  →  out/music.wav (48 kHz stereo)"""
import sys, pathlib
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
LEN = float(sys.argv[1]) if len(sys.argv) > 1 else 90
BPM = 88; BEAT = 60 / BPM; BAR = 4 * BEAT
N = int(LEN * SR)
rng = np.random.default_rng(7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# D major, dreamy: Dmaj9 – Bm9 – Gmaj9 – Asus2, two bars each.
CHORDS = [[50, 57, 61, 64, 66], [47, 54, 57, 61, 62], [43, 50, 54, 57, 59], [45, 52, 57, 59, 64]]
def chord_at(t): return CHORDS[int(t // (2 * BAR)) % len(CHORDS)]

def lp(x, f, order=2): return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)
def saw(f, t, ph=0.0): return 2 * ((f * t + ph) % 1) - 1

L = np.zeros(N); R = np.zeros(N)
t_all = np.arange(N) / SR

# Pads: each chord swells in and overlaps the next.
seg = 2 * BAR
for k in range(int(LEN / seg) + 2):
    start = k * seg - 0.6; dur = seg + 1.6
    a = max(0, int(start * SR)); b = min(N, int((start + dur) * SR))
    if b <= a: continue
    t = t_all[a:b]; tl = t - start
    env = np.minimum(1, tl / 1.2) * np.minimum(1, np.maximum(0, (dur - tl) / 1.4))
    sigL = np.zeros(b - a); sigR = np.zeros(b - a)
    for m in CHORDS[k % len(CHORDS)][1:]:
        f = hz(m + 12)
        for d, pan in ((-0.09, 0.8), (0.0, 0.5), (0.11, 0.2)):
            s = saw(f * 2 ** (d / 12), t, rng.random())
            sigL += s * pan; sigR += s * (1 - pan)
    wob = 1 + 0.25 * np.sin(2 * np.pi * 0.11 * t)
    L[a:b] += lp(sigL, 1400) * env * wob * 0.035
    R[a:b] += lp(sigR, 1400) * env * wob * 0.035

# Sub: the chord's root, two octaves down, breathing with each bar.
sub = np.zeros(N)
for i, t0 in enumerate(np.arange(0, LEN, BAR)):
    a = int(t0 * SR); b = min(N, int((t0 + BAR) * SR)); t = t_all[a:b] - t0
    f = hz(chord_at(t0)[0] - 12)
    sub[a:b] = np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.08) * np.exp(-t * 0.6) * np.minimum(1, (BAR - t) / 0.12)
L += sub * 0.16; R += sub * 0.16

# Arpeggio: eighth notes walking up and down the chord, two octaves up; plucked and bell-like.
arp = np.zeros(N); step = BEAT / 2
pattern = [0, 2, 3, 4, 3, 2, 1, 3]
for i, t0 in enumerate(np.arange(4 * BAR / 2, LEN, step)):   # enters after the first bar
    notes = chord_at(t0)[1:]
    m = notes[pattern[i % len(pattern)] % len(notes)] + 24 + (12 if (i // 16) % 4 == 3 and i % 2 else 0)
    f = hz(m); a = int(t0 * SR); b = min(N, a + int(1.2 * SR)); t = t_all[a:b] - t0
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 9) + 0.12 * np.sin(2 * np.pi * 3.01 * f * t)
    arp[a:b] += tone * np.minimum(1, t / 0.004) * np.exp(-t * 4.2) * (0.9 if i % 2 == 0 else 0.7)
arp = lp(arp, 6000)
d1 = int(3 * step / 2 * SR)   # dotted-eighth ping-pong delay
dl = np.zeros(N); dr = np.zeros(N)
dl[d1:] += arp[:-d1] * 0.45; dr[2 * d1:] += arp[:-2 * d1] * 0.32; dl[3 * d1:] += arp[:-3 * d1] * 0.18
L += (arp * 0.6 + dl) * 0.085; R += (arp * 0.6 + dr) * 0.085

# Shaker: soft filtered noise on the off-beats, from bar 5.
sh = np.zeros(N)
for i, t0 in enumerate(np.arange(4 * BAR, LEN, BEAT / 2)):
    a = int(t0 * SR); b = min(N, a + int(0.09 * SR)); t = t_all[a:b] - t0
    sh[a:b] += rng.standard_normal(b - a) * np.exp(-t * 55) * (1.0 if i % 2 else 0.45)
sh = hp(sh, 7000)
L += sh * 0.018; R += np.roll(sh, int(0.012 * SR)) * 0.018

# Shimmer: a high bell at the start of every chord.
for k, t0 in enumerate(np.arange(0, LEN, 2 * BAR)):
    a = int(t0 * SR); b = min(N, a + int(4 * SR)); t = t_all[a:b] - t0
    f = hz(chord_at(t0)[-1] + 36)
    bell = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.3) * 0.03
    (L if k % 2 else R)[a:b] += bell; (R if k % 2 else L)[a:b] += bell * 0.5

# Space: a cheap stereo reverb from a few decaying taps, then fades and normalisation.
for ms, g in ((37, 0.28), (61, 0.22), (89, 0.17), (131, 0.12), (197, 0.08)):
    s = int(ms / 1000 * SR); L[s:] += lp(R[:-s], 3000) * g; R[s:] += lp(L[:-s], 3000) * g
fade = np.minimum(1, t_all / 2.5) * np.minimum(1, (LEN - t_all) / 4)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
out = np.stack([L, R], 1) / peak * 0.7
import os
out_path = pathlib.Path(os.environ.get("MUSIC_OUT") or pathlib.Path(__file__).parent / "out" / "music.wav")   # MUSIC_OUT: other films reuse the bed
wavfile.write(out_path, SR, (out * 32767).astype(np.int16))
print("music", out_path, f"{LEN:.1f}s")
