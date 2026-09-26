"""Generate the soundtrack for the PLACE LIBRE brand film v4.
120 BPM, D major, 28 s seamless loop. Hits are placed on the film's event times."""
import numpy as np
from scipy.signal import lfilter, butter, sosfilt, fftconvolve
import wave

SR = 48000
LEN = 28.0
N = int(SR * LEN)
BEAT = 0.5
rng = np.random.default_rng(3)

# film event times are authored in original animation time; map them to the beat-grid timeline
WARP = [(0, 0), (0.5, 0.595), (1.0, 0.945), (2.0, 1.79), (3.0, 3.2), (4.5, 4.62), (6.0, 6.3), (6.0001, 7.35), (6.25, 7.62), (7.0, 8.12),
        (10.0, 11.75), (10.5, 12.35), (11.5, 13.55), (12.5, 14.55), (14.0, 16.5), (15.0, 17.25), (16.0, 18.55), (17.0, 19.35), (18.0, 20.15),
        (19.0, 21.3), (20.5, 22.72), (21.0, 23.14), (22.25, 24.12), (23.0, 24.15), (24.0, 24.42), (28.0, 28.0)]
def new_t(old):
    for (a0, b0), (a1, b1) in zip(WARP, WARP[1:]):
        if b0 <= old <= b1 and b1 > b0:
            return a0 + (a1 - a0) * (old - b0) / (b1 - b0)
    return old

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def env_adsr(n, a, d, s, r, sus_len):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where((t >= a + d) & (t < sus_len), s, e)
    e = np.where(t >= sus_len, s * np.exp(-(t - sus_len) / max(r, 1e-4)), e)
    return e

# stereo buses (wrapped at the end so the loop is seamless)
TAIL = int(SR * 4)
L = np.zeros(N + TAIL); R = np.zeros(N + TAIL)
REV_L = np.zeros(N + TAIL); REV_R = np.zeros(N + TAIL)
DUCK = np.ones(N + TAIL)

def put(sig, t, gain=1.0, pan=0.0, rev=0.2):
    i = int(t * SR)
    if i >= len(L): return
    sig = sig[: len(L) - i]
    gl, gr = gain * np.sqrt((1 - pan) / 2) * 1.414, gain * np.sqrt((1 + pan) / 2) * 1.414
    L[i:i + len(sig)] += sig * gl; R[i:i + len(sig)] += sig * gr
    REV_L[i:i + len(sig)] += sig * gl * rev; REV_R[i:i + len(sig)] += sig * gr * rev

def additive(freq, dur, harm=10, bright=1.0, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for d in ([-detune, 0, detune] if detune else [0]):
        f = freq * 2 ** (d / 1200)
        ph = rng.random() * 6.28
        for h in range(1, harm + 1):
            if f * h > 16000: break
            out += np.sin(2 * np.pi * f * h * t + ph * h) / h ** (1.6 / bright)
    return out / (3 if detune else 1)

def lp(x, fc, order=2):
    sos = butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low', output='sos'); return sosfilt(sos, x)
def hp(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), 'high', output='sos'); return sosfilt(sos, x)
def bp(x, lo, hi):
    sos = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'); return sosfilt(sos, x)

# ---------- instruments ----------
def kick(g=1.0):
    t = np.arange(int(0.45 * SR)) / SR
    f = 45 + 95 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    s += 0.3 * np.exp(-t * 90) * rng.standard_normal(len(t)) * 0.3
    return np.tanh(s * 1.4) * g
def clap():
    t = np.arange(int(0.3 * SR)) / SR
    n = bp(rng.standard_normal(len(t)), 900, 5000)
    e = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25) * 0.6
    return (n * e * 0.45 + body) * 0.9
def hat(open_=False):
    t = np.arange(int((0.25 if open_ else 0.06) * SR)) / SR
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (14 if open_ else 70)) * 0.35
def pluck(m, dur=1.2, bright=1.4):
    t = np.arange(int(dur * SR)) / SR
    s = additive(midi(m), dur, 8, bright) * np.exp(-t * 4.5)
    return lp(s, 5000) * 0.35
def bell(m, dur=2.5):
    t = np.arange(int(dur * SR)) / SR
    f = midi(m)
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in [(1, 1, 1.8), (2.0, 0.3, 3.0), (3.0, 0.12, 5.0)])
    return s * 0.28 * np.minimum(t * 400, 1)
def boop(m, g=1.0):
    t = np.arange(int(0.35 * SR)) / SR
    f = midi(m - 36) * (1 + 1.2 * np.exp(-t * 30))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    click = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 120) * 0.25
    return np.tanh((body + click) * 1.3) * 0.55 * g
def whoosh(dur, up=True, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    k = t / dur if up else 1 - t / dur
    out = np.zeros(n)
    bands = [(200, 500), (400, 1000), (800, 2000), (1600, 4000), (3200, 8000), (6000, 14000)]
    for j, (lo, hi) in enumerate(bands):
        c = j / (len(bands) - 1)
        w = np.exp(-((k - c) / 0.28) ** 2)
        out += bp(x, lo, hi) * w
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5 if not up else (t / dur) ** 2
    return out * e * 0.45 * g
def impact(g=1.0):
    t = np.arange(int(1.6 * SR)) / SR
    s = kick(1.0)
    s = np.pad(s, (0, len(t) - len(s)))
    n = lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 5) * 0.35
    sub = np.sin(2 * np.pi * 38 * t) * np.exp(-t * 2.5) * 0.5
    return (s + n + sub) * g
def riser(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 200 * 2 ** (3 * t / dur)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15
    return (tone + whoosh(dur, True) * 0.8) * (t / dur) ** 2 * g
def boing(m, g=1.0):
    t = np.arange(int(0.6 * SR)) / SR
    f = midi(m - 36) * (1 + 0.12 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 3))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return lp(np.tanh(x * 1.5), 900) * np.exp(-t * 4) * 0.45 * g
def sparkle(t0, count, spread, notes, g=0.5, pan=0.6):
    for i in range(count):
        if i % 2: continue
        m = notes[i % len(notes)] - 24
        put(bell(m, 1.6) * 0.45, t0 + spread * i / count + rng.random() * 0.02, g * 0.6, (rng.random() * 2 - 1) * pan, 0.6)

# ---------- harmony ----------
# one chord per bar (2 s). D major: D  Bm  G  A
CH = {'D': [50, 57, 62, 66, 69], 'Bm': [47, 54, 59, 62, 66], 'G': [43, 55, 59, 62, 67], 'A': [45, 57, 61, 64, 69], 'Dsus': [50, 57, 62, 67, 69]}
PROG = ['D', 'Bm', 'G', 'A'] * 3 + ['D', 'G']
def pad_bar(bar, chord, gain, bright=0.8):
    dur = 2.0 + 1.2
    for m in CH[chord][1:]:
        s = additive(midi(m), dur, 9, bright, detune=8)
        s = lp(s, 900 + 600 * bright)
        e = env_adsr(len(s), 0.35, 0.3, 0.8, 0.5, 2.0)
        put(s * e * 0.12, bar * 2.0, gain, (m % 5 - 2) * 0.2, 0.45)
def bass_bar(bar, chord, gain, pattern):
    root = CH[chord][0] - 12
    for i, on in enumerate(pattern):
        if not on: continue
        t = np.arange(int(0.24 * SR)) / SR
        f = midi(root)
        s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 6) * np.minimum(t * 300, 1)
        put(s * 0.55, bar * 2.0 + i * 0.25, gain, 0, 0.05)

for bar, ch in enumerate(PROG):
    t0 = bar * 2.0
    intro = t0 < 6
    pause = 22.0 <= t0 < 24.0
    pad_bar(bar, ch, 0.55 if intro else (0.25 if pause else 0.8), bright=0.6 if intro else 1.0)
    if 6 <= t0 < 22:
        bass_bar(bar, ch, 1.0, [1, 0, 1, 1, 0, 1, 1, 0])
        tt = np.arange(int(2.0 * SR)) / SR
        put(np.sin(2 * np.pi * midi(CH[ch][0] - 24) * tt) * 0.35 * np.minimum(tt * 50, 1) * np.minimum((2.0 - tt) * 50, 1), t0, 1.0, 0, 0.0)
        for b in range(4):
            bt = t0 + b * BEAT
            put(kick(0.9), bt, 1.0, 0, 0.05)
            DUCK[int(bt * SR):int((bt + 0.3) * SR)] = np.minimum(DUCK[int(bt * SR):int((bt + 0.3) * SR)], np.linspace(0.45, 1, int(0.3 * SR)))
            if b % 2 == 1: put(clap(), bt, 0.8, 0.1, 0.35)
            put(hat(), bt + 0.25, 0.8, 0.3, 0.1)
            if t0 >= 14: put(hat(), bt + 0.125, 0.4, -0.3, 0.1)
        # arpeggio carries the story
        arp = CH[ch][1:] + [CH[ch][2] + 12]
        for i in range(8):
            put(lp(pluck(arp[i % len(arp)], 0.5, 2.2), 2200), t0 + i * 0.25, 0.6, (-1) ** i * 0.4, 0.3)
    if t0 >= 24:
        bass_bar(bar, ch, 0.7, [1, 0, 0, 0, 1, 0, 0, 0])

# intro heartbeat: soft kicks on the heads' landings
for tt, g in [(0.5, 0.6), (1.0, 0.6), (2.0, 1.0), (3.0, 0.5), (4.5, 1.0)]:
    put(kick(g), tt, 0.9, 0, 0.1)

# ---------- sound design on the film's events ----------
E = new_t
put(boop(69), E(0.595), 0.9, -0.4, 0.3); put(boop(74), E(0.945), 0.9, 0.4, 0.3)
put(boop(76, 0.4), E(0.25 + 0.95 * 2 / 2.75), 0.6, -0.4, 0.3); put(boop(81, 0.4), E(0.6 + 0.95 * 2 / 2.75), 0.6, 0.4, 0.3)
put(whoosh(0.35, False), E(1.42), 0.6, 0, 0.2)
put(impact(0.6), E(1.79), 0.8, 0, 0.35); sparkle(E(1.79), 6, 0.4, [74, 78, 81], 0.35)
put(riser(1.0, 0.7), E(3.2), 0.7, 0, 0.3)
put(whoosh(0.4, True), E(4.2), 0.7, 0, 0.2)
put(impact(1.0), E(4.62), 1.0, 0, 0.45); sparkle(E(4.62), 10, 0.8, [62, 66, 69, 74], 0.4)
put(riser(1.4, 0.9), E(5.55) - 0.2, 0.9, 0, 0.2)
put(whoosh(0.3, False, 1.2), E(7.36), 0.8, 0.5, 0.2)
put(impact(0.8), E(8.12), 0.9, 0, 0.5); sparkle(E(8.12), 14, 1.4, [74, 78, 81, 86], 0.45)
for i in range(3): put(boop(64 + i * 2, 0.5), E(7.62 + i * 0.17), 0.5, -0.5, 0.2)
put(whoosh(0.3, False), E(11.75), 0.7, -0.5, 0.2)
for i in range(3): put(kick(0.7), E(12.35 + i * 0.08), 0.6, 0, 0.2)
for i, m in enumerate([66, 69, 71]): put(boing(m), E(12.85 + i * 0.1), 0.7, (i - 1) * 0.4, 0.3)
for i in range(2): put(kick(0.7), E(13.55 + i * 0.08), 0.6, 0, 0.2)
put(boop(74), E(13.25 + 0.29), 0.6, -0.3, 0.2); put(boop(78), E(13.4 + 0.29), 0.6, 0.3, 0.2)
put(impact(0.7), E(14.55), 0.8, 0, 0.4)
put(boing(62, 1.2), E(16.05), 0.7, 0, 0.3); put(whoosh(0.45, False), E(16.05), 0.6, 0, 0.2)
put(whoosh(0.3, True), E(16.62) - 0.15, 0.6, -0.6, 0.2); put(kick(0.8), E(16.97), 0.7, -0.3, 0.2)
put(whoosh(0.3, True), E(16.95) - 0.15, 0.6, 0.6, 0.2); put(kick(0.8), E(17.3), 0.7, 0.3, 0.2)
put(boop(81, 1.0), E(17.25), 0.8, 0, 0.3); sparkle(E(17.25), 24, 1.0, [74, 78, 81, 83, 86], 0.4, 0.9)
for w in [18.55, 19.35, 20.15]:
    for i, m in enumerate([81, 83, 86]): put(boop(m, 0.5), E(w) + i * 0.06, 0.45, (i - 1) * 0.6, 0.35)
put(whoosh(0.3, True), E(21.0), 0.6, 0, 0.2)
put(riser(1.2, 0.8), E(21.75) - 0.2, 0.8, 0, 0.3)
put(impact(0.9), E(22.72), 0.9, 0, 0.5)
put(boop(69), E(23.14), 0.8, -0.4, 0.3); put(boop(74), E(23.29), 0.8, 0.4, 0.3)
for i in range(10): put(hat(), E(23.45 + i * 0.035), 0.5, (i - 5) * 0.12, 0.1)
# the pause: breath in, then the i-dot lands on the downbeat of bar 13
put(riser(1.6, 1.0), 22.4, 0.9, 0, 0.4)
put(impact(1.1), 24.0, 1.0, 0, 0.6)
for m in [38, 45, 50, 57, 62, 66, 69]:
    s = additive(midi(m), 4.0, 10, 1.1, detune=6)
    put(lp(s, 3500) * env_adsr(len(s), 0.01, 0.4, 0.5, 1.2, 1.5) * 0.12, 24.0, 1.0, (m % 7 - 3) * 0.12, 0.6)
sparkle(24.0, 16, 1.6, [74, 78, 81, 86, 90], 0.45, 0.9)
put(boop(86, 0.5), E(25.9), 0.5, 0.2, 0.4)

# ---------- mix ----------
def reverb(x):
    t = np.arange(int(2.6 * SR)) / SR
    ir = rng.standard_normal(len(t)) * np.exp(-t * 2.4)
    ir = lp(ir, 6000); ir /= np.sqrt(np.sum(ir ** 2))
    return fftconvolve(x, ir)[: len(x)] * 0.9
L += reverb(REV_L); R += reverb(REV_R)
# sidechain-ish breathing from the kick
L *= 0.6 + 0.4 * DUCK; R *= 0.6 + 0.4 * DUCK
# wrap the tail into the start for a seamless loop
L[:TAIL] += L[N:N + TAIL]; R[:TAIL] += R[N:N + TAIL]
L, R = L[:N], R[:N]
st = np.stack([L, R], 1)
st = np.tanh(st / (np.max(np.abs(st)) * 0.7))
st /= np.max(np.abs(st)) / 0.89
with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', N / SR)
