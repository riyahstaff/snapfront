"""Cuts the UGC film together from out/timing.json (cards.mjs): AI clips, cards, the app in a phone and the
tool loops, crossfaded; caption pills on the AI scenes; the corner mark; the end card; Cecily's voice over a
music bed that ducks under her; then the exports.
Needs: out/raw/<key>.mp4 (make.mjs animate), out/voice/<key>.wav (make.mjs voice), out/screens/<key>.mp4
(record.mjs), out/cards/<key>.mp4 and out/overlays/*.png (cards.mjs).
Run: python3 edit.py  →  out/final/ugc-film-1080.mp4, ugc-film-720.mp4, ugc-film.jpg, ugc-film.vtt, chapters.txt"""
import json, pathlib, subprocess, sys
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent
import os
FILM = "".join(ch for ch in os.environ.get("FILM", "ugc") if ch.isalnum() or ch == "-")
OUT = HERE / ("out" if FILM == "ugc" else f"out-{FILM}"); WORK = OUT / "edit"; FINAL = OUT / "final"
for d in (WORK, FINAL): d.mkdir(parents=True, exist_ok=True)
T = json.loads((OUT / "timing.json").read_text())
scenes, FPS, XF, TOTAL, META = T["scenes"], T["fps"], T["XF"], T["total"], T["meta"]
NAME = META["name"]
W, H = 1920, 1080
TRANSITIONS = ["fade", "smoothleft", "fade", "circleopen", "fade", "smoothup", "fade", "radial"]
def dur(f): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]).decode())
def ff(*args): subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *map(str, args)], check=True)
def mask(w, h, r, name):
    f = WORK / f"mask-{name}.png"
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255); m.save(f)
    return f

EXPORT_ONLY = "--export" in sys.argv   # just redo the exports from out/edit/master.mp4
# ---- pass 1: one picture per scene, exactly its length ----------------------------------------
ONLY = next((a.split("=", 1)[1].split(",") for a in sys.argv if a.startswith("--only=")), None)
P, L = T["phone"], T["loops"]
pm, lm = mask(P["w"], P["h"], 46, "phone"), mask(L[0]["w"], L[0]["h"], 28, "loop")
LOOP_SRC = {"avatar": ["avatars", "faceless"]}
parts = []
for s in scenes:
    out = WORK / f"{s['key']}.mp4"; parts.append(out); n = s["len"]
    if EXPORT_ONLY or (ONLY and s["key"] not in ONLY and out.exists()): continue
    enc = ["-c:v", "libx264", "-crf", "15", "-preset", "fast", "-r", FPS, "-pix_fmt", "yuv420p", "-an"]
    if s["type"] == "ai":
        src = OUT / "raw" / f"{s['key']}.mp4"; slow = max(1.0, (n + 0.1) / dur(src))
        ff("-i", src, "-vf", f"setpts={slow:.4f}*PTS,scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},eq=saturation=1.08:contrast=1.03,fps={FPS},trim=duration={n:.3f},setpts=PTS-STARTPTS", *enc, out)
    elif s["type"] == "card":
        ff("-i", OUT / "cards" / f"{s['key']}.mp4", "-vf", f"trim=duration={n:.3f},setpts=PTS-STARTPTS", *enc, out)
    elif s["type"] == "screen":
        rec = OUT / "screens" / f"{s['key']}.mp4"
        # The recording plays in the phone from 0.35 s in, and holds its last frame if the line runs longer.
        ff("-i", OUT / "cards" / f"{s['key']}.mp4", "-i", rec, "-i", pm, "-filter_complex",
           f"[1:v]crop=430:932:0:0,scale={P['w']}:{P['h']}:flags=lanczos,fps={FPS},tpad=start_duration=0.35:start_mode=clone:stop_mode=clone:stop_duration={n:.2f},format=rgba[r];"
           f"[2:v]format=gray,loop=-1:1,fps={FPS}[m];[r][m]alphamerge[rm];"
           f"[0:v][rm]overlay={P['x']}:{P['y']}:shortest=1,trim=duration={n:.3f},setpts=PTS-STARTPTS[v]", "-map", "[v]", *enc, out)
    elif s["type"] == "loop":
        a, b = (ROOT / "server/assets/site/tools" / f"{k}.mp4" for k in LOOP_SRC[s["key"]])
        sq = lambda i: f"[{i}:v]crop='min(iw,ih)':'min(iw,ih)',scale={L[0]['w']}:{L[0]['h']}:flags=lanczos,fps={FPS},format=rgba[l{i}];[l{i}][m{i}]alphamerge[q{i}]"
        ff("-i", OUT / "cards" / f"{s['key']}.mp4", "-stream_loop", "-1", "-i", a, "-stream_loop", "-1", "-i", b, "-i", lm, "-filter_complex",
           f"[3:v]format=gray,loop=-1:1,fps={FPS},split[m1][m2];{sq(1)};{sq(2)};"
           f"[0:v][q1]overlay={L[0]['x']}:{L[0]['y']}:shortest=1[t];[t][q2]overlay={L[1]['x']}:{L[1]['y']}:shortest=1,trim=duration={n:.3f},setpts=PTS-STARTPTS[v]", "-map", "[v]", *enc, out)
inputs = sum((["-i", p] for p in parts), [])
chain, prev = [], "[0:v]"
for i in range(1, len(scenes)):
    tag = f"[x{i}]"
    chain.append(f"{prev}[{i}:v]xfade=transition={TRANSITIONS[(i - 1) % len(TRANSITIONS)]}:duration={XF}:offset={scenes[i]['start']:.3f}{tag}")
    prev = tag
base = WORK / "base.mp4"
if not EXPORT_ONLY: ff(*inputs, "-filter_complex", ";".join(chain), "-map", prev, "-c:v", "libx264", "-crf", "15", "-preset", "fast", "-r", FPS, base)

# ---- pass 2: words on screen -----------------------------------------------------------------
ov = OUT / "overlays"; items = []
for s in scenes:
    if s["type"] != "ai" or s["end"]: continue
    caps, end = s["captions"], s["start"] + s["len"] - XF - 0.15
    for i, c in enumerate(caps):
        t_out = caps[i + 1]["at"] + s["start"] - 0.12 if i + 1 < len(caps) else end
        items.append((ov / f"cap-{s['key']}-{i}.png", "(W-w)/2", f"{int(H * 0.80)}-h/2", s["start"] + c["at"] - 0.08, t_out, 46))
e = scenes[-1]
items += [(ov / "end-shade.png", "(W-w)/2", "(H-h)/2", e["start"] + 0.2, TOTAL + 1, 0),
          (ov / "end-logo.png", "(W-w)/2", f"{int(H * 0.36)}-h/2", e["vstart"] - 0.2, TOTAL + 1, 30),
          (ov / "end-tag.png", "(W-w)/2", f"{int(H * 0.36) + 130}-h/2", e["vstart"] + 0.7, TOTAL + 1, 26),
          (ov / "end-cta.png", "(W-w)/2", f"{int(H * 0.36) + 268}-h/2", e["vstart"] + 2.0, TOTAL + 1, 30),
          (ov / "bug.png", "W-w-14", "10", 0.6, e["start"] + XF, 0)]
ins, fc, prev = ["-i", base], [], "[0:v]"
for k, (png, x, y, t0, t1, rise) in enumerate(items, start=1):
    ins += ["-loop", "1", "-t", f"{TOTAL:.3f}", "-framerate", str(FPS), "-i", png]
    fo = f",fade=out:st={t1:.3f}:d=0.22:alpha=1" if t1 < TOTAL else ""
    fc.append(f"[{k}:v]format=rgba,fade=in:st={t0:.3f}:d=0.28:alpha=1{fo}[o{k}]")
    yy = f"{y}+{rise}*pow(max(0\\,1-(t-{t0:.3f})/0.42)\\,3)" if rise else y
    fc.append(f"{prev}[o{k}]overlay=x={x}:y='{yy}':enable='between(t,{t0 - 0.05:.3f},{min(t1 + 0.3, TOTAL):.3f})':eval=frame[v{k}]")
    prev = f"[v{k}]"

# ---- sound -----------------------------------------------------------------------------------
music = OUT / "music.wav"
if not EXPORT_ONLY and (not music.exists() or dur(music) < TOTAL):
    subprocess.run([sys.executable, ROOT / "tools/promo/music.py", f"{TOTAL + 0.5:.2f}"], check=True, env={**__import__("os").environ, "MUSIC_OUT": str(music)})
a0 = len(items) + 1
ins += ["-i", music] + sum((["-i", OUT / "voice" / f"{s['key']}.wav"] for s in scenes), [])
vo = []
for i, s in enumerate(scenes):
    ms = int(s["vstart"] * 1000)
    fc.append(f"[{a0 + 1 + i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[vo{i}]"); vo.append(f"[vo{i}]")
fc.append(f"{''.join(vo)}amix=inputs={len(scenes)}:normalize=0,asplit=2[voice][key]")
fc.append(f"[{a0}:a]aresample=48000,volume=0.11[mus]")
fc.append("[mus][key]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=500:makeup=1[duck]")
fc.append(f"[voice][duck]amix=inputs=2:normalize=0,atrim=duration={TOTAL:.3f},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]")
master = WORK / "master.mp4"
if not EXPORT_ONLY: ff(*ins, "-filter_complex", ";".join(fc), "-map", prev, "-map", "[aout]", "-t", f"{TOTAL:.3f}", "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-r", FPS, "-c:a", "aac", "-b:a", "256k", master)

# ---- exports ---------------------------------------------------------------------------------
web = ["-movflags", "+faststart", "-pix_fmt", "yuv420p"]
ff("-i", master, "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-profile:v", "high", "-maxrate", "6M", "-bufsize", "12M", *web, "-c:a", "aac", "-b:a", "192k", FINAL / f"{NAME}-1080.mp4")
ff("-i", master, "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264", "-preset", "medium", "-crf", "25", "-maxrate", "2.2M", "-bufsize", "4.4M", *web, "-c:a", "aac", "-b:a", "128k", FINAL / f"{NAME}-720.mp4")
ff("-ss", f"{scenes[0]['vstart'] + 2.2:.2f}", "-i", master, "-frames:v", "1", "-vf", "scale=1280:720:flags=lanczos", "-q:v", "3", FINAL / f"{NAME}.jpg")
def ts(x): return f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{x % 60:06.3f}"
vtt = ["WEBVTT", ""]
for i, s in enumerate(scenes, start=1): vtt += [str(i), f"{ts(s['vstart'])} --> {ts(s['vstart'] + s['vdur'] + 0.2)}", s["say"], ""]
(FINAL / f"{NAME}.vtt").write_text("\n".join(vtt))
CH = [tuple(c) for c in META["chapters"]]
start = {s["key"]: s["start"] for s in scenes}
(FINAL / "chapters.txt").write_text("\n".join(f"{int((0 if k == CH[0][0] else start[k]) // 60)}:{int((0 if k == CH[0][0] else start[k]) % 60):02d} {t}" for k, t in CH) + "\n")
for f in sorted(FINAL.iterdir()): print(f.name, f"{f.stat().st_size / 1e6:.1f} MB")
