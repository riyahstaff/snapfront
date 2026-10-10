"""Printable wall art set: 6 minimalist motivational prints, 8x10 in @ 300 dpi (4:5)."""
import os, zipfile
from PIL import Image, ImageDraw, ImageFont
from common import OUT, font

W, H = 2400, 3000
PAPER = (247, 243, 236)
INK = (43, 42, 40)
TC, SAND, SAGE, DUSK, BLUSH, OLIVE = (200, 102, 75), (231, 201, 160), (139, 166, 138), (125, 143, 179), (227, 181, 168), (185, 162, 126)

def serif(size):
    f = ImageFont.truetype(font("Fraunces-Regular"), size)
    return f

def sans(size):
    return ImageFont.truetype(font("DMSans-Medium"), size)

def base():
    im = Image.new("RGB", (W, H), PAPER)
    return im, ImageDraw.Draw(im)

def caption(d, text, y=2420, size=150, sub=None):
    f = serif(size)
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=f)
        d.text(((W - tw) / 2, y + i * size * 1.15), ln, font=f, fill=INK)
    if sub:
        fs = sans(48)
        tw = d.textlength(sub, font=fs)
        d.text(((W - tw) / 2, y + len(lines) * size * 1.15 + 50), sub, font=fs, fill=(110, 106, 99))

prints = []

# 1 — arches
im, d = base()
cx, by = W // 2, 2150
for r, col in zip([820, 640, 460, 280], [SAND, TC, BLUSH, SAGE]):
    d.pieslice((cx - r, by - r, cx + r, by + r), 180, 360, fill=col)
    d.rectangle((cx - r, by, cx + r, by + 0), fill=col)
d.rectangle((300, by, W - 300, by + 12), fill=INK)
caption(d, "slow down,\nyou're doing fine.", y=2330, size=140)
prints.append(("01-slow-down", im))

# 2 — sun over hills
im, d = base()
d.ellipse((W/2 - 420, 520, W/2 + 420, 1360), fill=TC)
d.ellipse((-600, 1300, 1700, 3200), fill=SAND)
d.ellipse((900, 1500, 3200, 3600), fill=SAGE)
d.rectangle((0, 2250, W, H), fill=PAPER)
caption(d, "begin anywhere.", y=2450, size=170)
prints.append(("02-begin-anywhere", im))

# 3 — bloom
im, d = base()
d.line((W/2, 2150, W/2, 1000), fill=SAGE, width=40)
d.ellipse((W/2 - 520, 1500, W/2 - 20, 1800), fill=SAGE)
d.ellipse((W/2 + 20, 1300, W/2 + 520, 1600), fill=SAGE)
for i, (dx, dy) in enumerate([(0, -260), (250, -80), (155, 210), (-155, 210), (-250, -80)]):
    d.ellipse((W/2 + dx - 210, 900 + dy - 210, W/2 + dx + 210, 900 + dy + 210), fill=[BLUSH, TC, SAND, BLUSH, TC][i])
d.ellipse((W/2 - 130, 770, W/2 + 130, 1030), fill=SAND)
caption(d, "bloom at your\nown pace.", y=2300, size=150)
prints.append(("03-bloom", im))

# 4 — stacked pills
im, d = base()
for i, col in enumerate([DUSK, SAND, TC, SAGE, BLUSH]):
    y = 500 + i * 330
    w = [1300, 1000, 1500, 800, 1150][i]
    d.rounded_rectangle((W/2 - w/2, y, W/2 + w/2, y + 260), radius=130, fill=col)
caption(d, "make room\nfor joy.", y=2300, size=170)
prints.append(("04-make-room", im))

# 5 — moon
im, d = base()
d.rectangle((0, 0, W, 2200), fill=(58, 63, 82))
d.ellipse((W/2 - 500, 600, W/2 + 500, 1600), fill=SAND)
d.ellipse((W/2 - 260, 480, W/2 + 740, 1480), fill=(58, 63, 82))
for (x, y, r) in [(500, 500, 18), (1900, 800, 14), (1700, 350, 10), (420, 1500, 12), (2000, 1700, 20), (900, 1900, 9)]:
    d.ellipse((x - r, y - r, x + r, y + r), fill=PAPER)
caption(d, "rest is productive too.", y=2450, size=140)
prints.append(("05-rest", im))

# 6 — steps
im, d = base()
cols = [SAGE, SAND, TC, DUSK]
for i in range(4):
    x0 = 400 + i * 400
    top = 2000 - (i + 1) * 330
    d.rectangle((x0, top, x0 + 400, 2000), fill=cols[i])
d.ellipse((1900 - 90, 2000 - 4 * 330 - 260, 1900 + 90, 2000 - 4 * 330 - 80), fill=INK)
caption(d, "small steps\nstill move you.", y=2250, size=160)
prints.append(("06-small-steps", im))

folder = os.path.join(OUT, "wall-art")
os.makedirs(folder, exist_ok=True)
paths = []
for name, im in prints:
    p = os.path.join(folder, f"Snapfront-Print-{name}-8x10.png")
    im.save(p, dpi=(300, 300), optimize=True)
    paths.append(p)
pdf = os.path.join(OUT, "Snapfront-Wall-Art-Set-6-prints.pdf")
ims = [im for _, im in prints]
ims[0].save(pdf, save_all=True, append_images=ims[1:], resolution=300)

# preview grid for listing
thumb = [im.resize((480, 600), Image.LANCZOS) for im in ims]
grid = Image.new("RGB", (3 * 480 + 4 * 40, 2 * 600 + 3 * 40), (233, 226, 214))
for i, t in enumerate(thumb):
    grid.paste(t, (40 + (i % 3) * 520, 40 + (i // 3) * 640))
grid.save(os.path.join(OUT, "preview-wall-art.png"))

with zipfile.ZipFile(os.path.join(OUT, "Snapfront-Wall-Art-Set.zip"), "w", zipfile.ZIP_DEFLATED) as z:
    for p in paths:
        z.write(p, os.path.basename(p))
    z.write(pdf, os.path.basename(pdf))
print("wall art done")
