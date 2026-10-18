"""Cuts the promo together: scene clips timed to Cecily's lines, crossfades, big animated captions, a corner
mark, the end card, a music bed that ducks under the voice, then the web exports.
Needs out/raw/<key>.mp4, out/voice/<key>.wav, out/overlays/*.png (overlays.py) and out/music.wav (music.py).
Run: python3 edit.py  →  server/assets/site/promo/promo-{1080,720}.mp4, promo.jpg, promo.vtt (and promo-720.webm with --webm)"""
import json, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).parent
OUT = HERE / "out"; WORK = OUT / "edit"; WORK.mkdir(parents=True, exist_ok=True)
FINAL = HERE.parent.parent / "server/assets/site/promo"; FINAL.mkdir(parents=True, exist_ok=True)
W, H, FPS = 1920, 1080, 30
PRE, POST, XF = 0.45, 2.5, 0.6           # voice starts PRE into a scene; scenes overlap by XF
END_HOLD = 5.6                           # end card stays up after the last line
TRANSITIONS = ["fade", "circleopen", "smoothleft", "radial", "fadewhite", "zoomin", "smoothup", "circleclose", "fade"]

scenes = json.loads(subprocess.check_output(["node", "-e", "import('./scenes.mjs').then(m=>console.log(JSON.stringify(m.SCENES)))"], cwd=HERE))
def dur(f): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]).decode())
def ff(*args): subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *map(str, args)], check=True)

# ---- timing ----------------------------------------------------------------------------------
t = 0.0
for i, s in enumerate(scenes):
    s["voice"] = OUT / "voice" / f"{s['key']}.wav"; s["clip"] = OUT / "raw" / f"{s['key']}.mp4"
    if not s["clip"].exists() and "--stand-in" in sys.argv:   # preview the edit before every clip is back
        s["clip"] = WORK / f"standin-{s['key']}.mp4"
        ff("-loop", "1", "-i", OUT / "stills" / f"{s['key']}.jpg", "-vf", f"scale=3840:2160,zoompan=z='min(zoom+0.0008,1.12)':d=300:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},format=yuv420p", "-t", "10", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", s["clip"])
    missing = [p for p in (s["voice"], s["clip"]) if not p.exists()]
    if missing: sys.exit(f"missing {missing}")
    s["vdur"] = dur(s["voice"])
    s["len"] = PRE + s["vdur"] + (END_HOLD if s["key"] == "end" else POST)
    s["start"] = t; s["vstart"] = t + PRE
    t += s["len"] - XF
TOTAL = scenes[-1]["start"] + scenes[-1]["len"]
print(f"total {TOTAL:.1f}s")

# ---- pass 1: picture -------------------------------------------------------------------------
# Each clip is filled to 16:9, given a touch more colour, and slowed if it's shorter than its scene.
# Some clips only work for their first few seconds: those are stretched with motion-interpolated slow motion
# ("slow") or played forward then backward ("bounce"), instead of showing what goes wrong later.
FIX = {"snap": ("slow", 4.6), "digital": ("bounce", 2.7)}
ZOOM = {"end": 1.55}   # the end ring is enlarged so the logo and button fit inside it
# `--only=key,key` re-cuts just those scenes and reuses the others from the last run.
ONLY = next((a.split("=", 1)[1].split(",") for a in sys.argv if a.startswith("--only=")), None)
conformed = []
for s in scenes:
    src = s["clip"]
    if ONLY and s["key"] not in ONLY and (WORK / f"{s['key']}.mp4").exists():
        conformed.append(WORK / f"{s['key']}.mp4"); continue
    if s["key"] in FIX:
        mode, keep = FIX[s["key"]]; fixed = WORK / f"fix-{s['key']}.mp4"
        if mode == "slow":
            ff("-i", src, "-an", "-vf", f"trim=duration={keep},setpts=PTS-STARTPTS,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts={(s['len'] + 0.2) / keep:.4f}*PTS,fps={FPS}", "-c:v", "libx264", "-crf", "14", "-preset", "fast", fixed)
        else:
            reps = int(-(-(s["len"] + 0.2) // (2 * keep)))   # forward and back, as many times as the scene needs
            legs = "".join(f"[f{r}][b{r}]" for r in range(reps))
            ff("-i", src, "-an", "-filter_complex", f"[0:v]trim=duration={keep},setpts=PTS-STARTPTS,split=2[fw][bw];[bw]reverse[rv];"
               f"[fw]split={reps}{''.join(f'[f{r}]' for r in range(reps))};[rv]split={reps}{''.join(f'[b{r}]' for r in range(reps))};"
               f"{legs}concat=n={2 * reps}:v=1,minterpolate=fps={FPS}:mi_mode=blend", "-c:v", "libx264", "-crf", "14", "-preset", "fast", fixed)
        src = fixed
    d = dur(src); slow = max(1.0, (s["len"] + 0.1) / d); z = ZOOM.get(s["key"], 1)
    out = WORK / f"{s['key']}.mp4"
    ff("-i", src, "-an", "-vf",
       f"setpts={slow:.4f}*PTS,scale={round(W * z / 2) * 2}:{round(H * z / 2) * 2}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},"
       f"eq=saturation=1.10:contrast=1.03,fps={FPS},format=yuv420p,trim=duration={s['len']:.3f},setpts=PTS-STARTPTS",
       "-c:v", "libx264", "-crf", "14", "-preset", "fast", out)
    conformed.append(out)

inputs = sum((["-i", c] for c in conformed), [])
chain, prev, off = [], "[0:v]", 0.0
for i in range(1, len(scenes)):
    off += scenes[i - 1]["len"] - XF
    tag = f"[x{i}]"
    chain.append(f"{prev}[{i}:v]xfade=transition={TRANSITIONS[(i - 1) % len(TRANSITIONS)]}:duration={XF}:offset={off:.3f}{tag}")
    prev = tag
base = WORK / "base.mp4"
ff(*inputs, "-filter_complex", ";".join(chain), "-map", prev, "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-r", FPS, base)

# ---- pass 2: words on screen -----------------------------------------------------------------
ov = OUT / "overlays"
items = []   # (png, x expr, y expr, t_in, t_out, rise)
CAP_Y = int(H * 0.80)
for s in scenes:
    caps = s["captions"]; scene_end = s["start"] + s["len"] - XF - 0.15
    for i, (_text, at) in enumerate(caps):
        t_in = s["vstart"] + at - 0.08
        t_out = (s["vstart"] + caps[i + 1][1] - 0.12) if i + 1 < len(caps) else scene_end
        items.append((ov / f"cap-{s['key']}-{i}.png", "(W-w)/2", f"{CAP_Y}-h/2", t_in, t_out, 46))
end = scenes[-1]
items += [
    (ov / "end-shade.png", "(W-w)/2", "(H-h)/2", end["start"] + 0.2, TOTAL + 1, 0),
    (ov / "end-logo.png", "(W-w)/2", f"{int(H * 0.40)}-h/2", end["vstart"] - 0.25, TOTAL + 1, 30),
    (ov / "end-tag.png", "(W-w)/2", f"{int(H * 0.40) + 128}-h/2", end["vstart"] + 0.85, TOTAL + 1, 26),
    (ov / "end-cta.png", "(W-w)/2", f"{int(H * 0.40) + 262}-h/2", end["vstart"] + 2.35, TOTAL + 1, 30),
    (ov / "bug.png", "W-w-14", "10", 0.6, end["start"] + XF, 0),
]
ins, fc, prev = ["-i", base], [], "[0:v]"
for k, (png, x, y, t0, t1, rise) in enumerate(items, start=1):
    ins += ["-loop", "1", "-t", f"{TOTAL:.3f}", "-framerate", str(FPS), "-i", png]
    fade_out = f",fade=out:st={t1:.3f}:d=0.22:alpha=1" if t1 < TOTAL else ""
    fc.append(f"[{k}:v]format=rgba,fade=in:st={t0:.3f}:d=0.28:alpha=1{fade_out}[o{k}]")
    yy = f"{y}+{rise}*pow(max(0\\,1-(t-{t0:.3f})/0.42)\\,3)" if rise else y
    fc.append(f"{prev}[o{k}]overlay=x={x}:y='{yy}':enable='between(t,{t0 - 0.05:.3f},{min(t1 + 0.3, TOTAL):.3f})':eval=frame[v{k}]")
    prev = f"[v{k}]"

# ---- sound -----------------------------------------------------------------------------------
music = OUT / "music.wav"
if not music.exists() or dur(music) < TOTAL: subprocess.run([sys.executable, HERE / "music.py", f"{TOTAL + 0.5:.2f}"], check=True)
a0 = len(items) + 1
ins += ["-i", music] + sum((["-i", s["voice"]] for s in scenes), [])
vparts = []
for i, s in enumerate(scenes):
    ms = int(s["vstart"] * 1000)
    fc.append(f"[{a0 + 1 + i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[vo{i}]")
    vparts.append(f"[vo{i}]")
fc.append(f"{''.join(vparts)}amix=inputs={len(scenes)}:normalize=0,volume=1.0,asplit=2[voice][key]")
fc.append(f"[{a0}:a]aresample=48000,volume=0.15[mus]")
fc.append("[mus][key]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=500:makeup=1[duck]")
fc.append(f"[voice][duck]amix=inputs=2:normalize=0,atrim=duration={TOTAL:.3f},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]")

master = WORK / "master.mp4"
ff(*ins, "-filter_complex", ";".join(fc), "-map", prev, "-map", "[aout]", "-t", f"{TOTAL:.3f}",
   "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-r", FPS, "-c:a", "aac", "-b:a", "256k", master)

# ---- web exports -----------------------------------------------------------------------------
web = ["-movflags", "+faststart", "-pix_fmt", "yuv420p"]
ff("-i", master, "-c:v", "libx264", "-preset", "medium", "-crf", "25", "-profile:v", "high", "-maxrate", "3.4M", "-bufsize", "7M", *web, "-c:a", "aac", "-b:a", "160k", FINAL / "promo-1080.mp4")
ff("-i", master, "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-maxrate", "1.7M", "-bufsize", "3.4M", *web, "-c:a", "aac", "-b:a", "128k", FINAL / "promo-720.mp4")
if "--webm" in sys.argv: ff("-i", master, "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-c:a", "libopus", "-b:a", "112k", FINAL / "promo-720.webm")
ff("-ss", f"{scenes[0]['vstart'] + 0.9:.2f}", "-i", master, "-frames:v", "1", "-vf", "scale=1280:720:flags=lanczos", "-q:v", "3", FINAL / "promo.jpg")

# Subtitles: Cecily's full lines, for the CC button and screen readers.
def ts(x): return f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{x % 60:06.3f}"
vtt = ["WEBVTT", ""]
for i, s in enumerate(scenes, start=1):
    vtt += [str(i), f"{ts(s['vstart'])} --> {ts(s['vstart'] + s['vdur'] + 0.2)}", s["say"], ""]
(FINAL / "promo.vtt").write_text("\n".join(vtt))
(FINAL / "promo.json").write_text(json.dumps({"duration": round(TOTAL, 2), "scenes": [{"key": s["key"], "start": round(s["start"], 2)} for s in scenes]}, indent=1))
for f in sorted(FINAL.iterdir()): print(f.name, f"{f.stat().st_size / 1e6:.1f} MB")
