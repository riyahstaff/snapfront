"""Digital planner sticker pack: transparent PNGs + GoodNotes sticker-book PDF."""
import math, os, zipfile
from PIL import Image, ImageDraw, ImageFont
from common import OUT, font

SS = 2  # supersample
INK = (43, 42, 40, 255)
PAL = {"tc": (200, 102, 75), "sand": (231, 201, 160), "sage": (139, 166, 138), "dusk": (125, 143, 179),
       "blush": (227, 181, 168), "olive": (185, 162, 126), "cream": (250, 246, 238), "plum": (150, 110, 140)}
def C(name, a=255): return PAL[name] + (a,)
COLS = ["tc", "sand", "sage", "dusk", "blush", "olive", "plum"]

def canvas(w, h):
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)

def finish(im):
    w, h = im.size
    return im.resize((w // SS, h // SS), Image.LANCZOS)

def F(name, size): return ImageFont.truetype(font(name), size * SS)

def centered(d, box, text, f, fill):
    x0, y0, x1, y1 = box
    bb = d.textbbox((0, 0), text, font=f)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    d.text((x0 + (x1 - x0 - tw) / 2 - bb[0], y0 + (y1 - y0 - th) / 2 - bb[1]), text, font=f, fill=fill)

stickers = []

# --- Label pills
labels = ["To do", "Due", "Payday", "Bills", "Appointment", "Gym", "Meal prep", "Self care",
          "Birthday", "Meeting", "Deadline", "Day off"]
for i, t in enumerate(labels):
    f = F("DMSans-Bold", 44)
    tmp = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    tw = tmp.textlength(t.upper(), font=f) / SS
    w, h = int(tw + 90), 100
    im, d = canvas(w, h)
    col = COLS[i % len(COLS)]
    d.rounded_rectangle((6 * SS, 6 * SS, (w - 6) * SS, (h - 6) * SS), radius=44 * SS, fill=C(col),
                        outline=(255, 255, 255, 255), width=6 * SS)
    txt = INK if col in ("sand", "blush") else (255, 255, 255, 255)
    centered(d, (0, 0, w * SS, h * SS), t.upper(), f, txt)
    stickers.append((f"label-{t.lower().replace(' ', '-')}", finish(im)))

# --- Weekday banners
for i, t in enumerate(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]):
    w, h = 220, 90
    im, d = canvas(w, h)
    col = COLS[i % len(COLS)]
    pts = [(0, 0), (w, 0), (w - 26, h / 2), (w, h), (0, h), (26, h / 2)]
    d.polygon([(x * SS, y * SS) for x, y in pts], fill=C(col))
    centered(d, (0, 0, w * SS, h * SS), t, F("DMSans-Bold", 40), INK if col in ("sand", "blush") else (255, 255, 255, 255))
    stickers.append((f"banner-{t.lower()}", finish(im)))

# --- Icons
def heart(d, s, col):
    m = Image.new("L", (s * SS, s * SS), 0); md = ImageDraw.Draw(m)
    _heart(md, s, 255); d.bitmap((0, 0), m, fill=col)

def _heart(d, s, col):
    cx, cy, r = s / 2, s / 2, s * 0.22
    d.ellipse(((cx - 2 * r) * SS, (cy - 1.6 * r) * SS, cx * SS, (cy + 0.4 * r) * SS), fill=col)
    d.ellipse((cx * SS, (cy - 1.6 * r) * SS, (cx + 2 * r) * SS, (cy + 0.4 * r) * SS), fill=col)
    d.polygon([((cx - 1.93 * r) * SS, (cy - 0.2 * r) * SS), ((cx + 1.93 * r) * SS, (cy - 0.2 * r) * SS), (cx * SS, (cy + 2.1 * r) * SS)], fill=col)

def star(d, s, col, points=5, inner=0.45):
    cx = cy = s / 2; R = s * 0.44
    pts = []
    for k in range(points * 2):
        ang = -math.pi / 2 + k * math.pi / points
        rr = R if k % 2 == 0 else R * inner
        pts.append(((cx + rr * math.cos(ang)) * SS, (cy + rr * math.sin(ang)) * SS))
    d.polygon(pts, fill=col)

def check(d, s, col):
    d.ellipse((s * .08 * SS, s * .08 * SS, s * .92 * SS, s * .92 * SS), fill=col)
    d.line([(s * .3 * SS, s * .52 * SS), (s * .45 * SS, s * .67 * SS), (s * .72 * SS, s * .36 * SS)], fill=(255, 255, 255, 255), width=int(s * .09 * SS), joint="curve")

def sun(d, s, col):
    cx = cy = s / 2
    for k in range(12):
        a = k * math.pi / 6
        d.line([((cx + s * .28 * math.cos(a)) * SS, (cy + s * .28 * math.sin(a)) * SS),
                ((cx + s * .44 * math.cos(a)) * SS, (cy + s * .44 * math.sin(a)) * SS)], fill=col, width=int(s * .06 * SS))
    d.ellipse(((cx - s * .22) * SS, (cy - s * .22) * SS, (cx + s * .22) * SS, (cy + s * .22) * SS), fill=col)

def moon(d, s, col):
    m = Image.new("L", (s * SS, s * SS), 0); md = ImageDraw.Draw(m)
    md.ellipse((s * .1 * SS, s * .1 * SS, s * .9 * SS, s * .9 * SS), fill=255)
    md.ellipse((s * .32 * SS, s * .02 * SS, s * 1.05 * SS, s * .75 * SS), fill=0)
    d.bitmap((0, 0), m, fill=col)

def cloud(d, s, col):
    for (x, y, r) in [(.35, .55, .2), (.55, .45, .25), (.72, .58, .17)]:
        d.ellipse(((x - r) * s * SS, (y - r) * s * SS, (x + r) * s * SS, (y + r) * s * SS), fill=col)
    d.rounded_rectangle((.15 * s * SS, .55 * s * SS, .89 * s * SS, .75 * s * SS), radius=int(.1 * s * SS), fill=col)

def rain(d, s, col):
    cloud(d, s, col)
    for x in (.35, .52, .69):
        d.line([(x * s * SS, .82 * s * SS), ((x - .05) * s * SS, .95 * s * SS)], fill=C("dusk"), width=int(.05 * s * SS))

def coffee(d, s, col):
    d.rounded_rectangle((.2 * s * SS, .35 * s * SS, .68 * s * SS, .85 * s * SS), radius=int(.08 * s * SS), fill=col)
    d.ellipse((.58 * s * SS, .45 * s * SS, .85 * s * SS, .72 * s * SS), outline=col, width=int(.06 * s * SS))
    for x in (.33, .47):
        d.arc((x * s * SS, .1 * s * SS, (x + .1) * s * SS, .3 * s * SS), 90, 270, fill=C("olive"), width=int(.035 * s * SS))

def flower(d, s, col):
    cx = cy = s / 2
    for k in range(6):
        a = k * math.pi / 3
        x, y = cx + s * .2 * math.cos(a), cy + s * .2 * math.sin(a)
        d.ellipse(((x - s * .16) * SS, (y - s * .16) * SS, (x + s * .16) * SS, (y + s * .16) * SS), fill=col)
    d.ellipse(((cx - s * .12) * SS, (cy - s * .12) * SS, (cx + s * .12) * SS, (cy + s * .12) * SS), fill=C("sand"))

def sparkle(d, s, col): star(d, s, col, points=4, inner=0.22)

def pin(d, s, col):
    d.ellipse((.25 * s * SS, .1 * s * SS, .75 * s * SS, .6 * s * SS), fill=col)
    d.polygon([(.3 * s * SS, .45 * s * SS), (.7 * s * SS, .45 * s * SS), (.5 * s * SS, .92 * s * SS)], fill=col)
    d.ellipse((.4 * s * SS, .25 * s * SS, .6 * s * SS, .45 * s * SS), fill=(255, 255, 255, 255))

def flag(d, s, col):
    d.line([(.25 * s * SS, .1 * s * SS), (.25 * s * SS, .92 * s * SS)], fill=INK, width=int(.05 * s * SS))
    d.polygon([(.27 * s * SS, .12 * s * SS), (.85 * s * SS, .28 * s * SS), (.27 * s * SS, .48 * s * SS)], fill=col)

icons = [("heart", heart, "tc"), ("star", star, "sand"), ("check", check, "sage"), ("sun", sun, "sand"),
         ("moon", moon, "dusk"), ("cloud", cloud, "blush"), ("rain", rain, "dusk"), ("coffee", coffee, "olive"),
         ("flower", flower, "blush"), ("sparkle", sparkle, "sand"), ("pin", pin, "tc"), ("flag", flag, "sage")]
for name, fn, col in icons:
    s = 220
    im, d = canvas(s, s)
    fn(d, s, C(col))
    stickers.append((f"icon-{name}", finish(im)))

# --- Washi tape strips
for i, kind in enumerate(["stripes", "dots", "grid", "zigzag", "solid-sage", "solid-blush"]):
    w, h = 600, 110
    im, d = canvas(w, h)
    base = [C("sand", 220), C("blush", 220), C("sage", 210), C("dusk", 210), C("sage", 230), C("blush", 230)][i]
    tape = Image.new("RGBA", (w * SS, h * SS), base); td = ImageDraw.Draw(tape)
    if kind == "stripes":
        for x in range(-h, w + h, 34):
            td.polygon([(x * SS, 0), ((x + 16) * SS, 0), ((x + 16 - h) * SS, h * SS), ((x - h) * SS, h * SS)], fill=C("tc", 200))
    elif kind == "dots":
        for y in range(18, h, 36):
            for x in range(18 + (y // 36 % 2) * 18, w, 36):
                td.ellipse(((x - 6) * SS, (y - 6) * SS, (x + 6) * SS, (y + 6) * SS), fill=C("cream", 255))
    elif kind == "grid":
        for x in range(0, w, 30): td.rectangle((x * SS, 0, (x + 15) * SS, h * SS), fill=C("cream", 120))
        for y in range(0, h, 30): td.rectangle((0, y * SS, w * SS, (y + 15) * SS), fill=C("cream", 120))
    elif kind == "zigzag":
        pts = [(x * SS, (h / 2 + (16 if (x // 30) % 2 else -16)) * SS) for x in range(0, w + 30, 30)]
        td.line(pts, fill=C("cream", 255), width=10 * SS, joint="curve")
    # torn ends mask
    mask = Image.new("L", tape.size, 0); md = ImageDraw.Draw(mask)
    poly = [(14 * SS, 0)]
    for y in range(0, h + 1, 10): poly.append(((4 if (y // 10) % 2 else 16) * SS, y * SS))
    for y in range(h, -1, -10): poly.append(((w - (4 if (y // 10) % 2 else 16)) * SS, y * SS))
    md.polygon(poly, fill=255)
    im.paste(tape, (0, 0), mask)
    stickers.append((f"washi-{kind}", finish(im)))

# --- Sticky notes
for i, col in enumerate(["sand", "blush", "sage", "dusk", "cream"]):
    s = 300
    im, d = canvas(s, s)
    d.rectangle((14 * SS, 18 * SS, (s - 8) * SS, (s - 4) * SS), fill=(0, 0, 0, 30))
    d.rectangle((8 * SS, 8 * SS, (s - 14) * SS, (s - 14) * SS), fill=C(col))
    d.polygon([((s - 60) * SS, (s - 14) * SS), ((s - 14) * SS, (s - 60) * SS), ((s - 14) * SS, (s - 14) * SS)], fill=(255, 255, 255, 0))
    d.polygon([((s - 60) * SS, (s - 14) * SS), ((s - 14) * SS, (s - 60) * SS), ((s - 60) * SS, (s - 60) * SS)], fill=tuple(max(0, v - 30) for v in PAL[col]) + (255,))
    d.rectangle(((s / 2 - 50) * SS, 0, (s / 2 + 50) * SS, 30 * SS), fill=(255, 255, 255, 150))
    stickers.append((f"note-{col}", finish(im)))

# --- Mood faces
moods = [("great", "sage", 1), ("good", "sand", .5), ("okay", "dusk", 0), ("low", "blush", -.5), ("rough", "tc", -1)]
for name, col, curve in moods:
    s = 180
    im, d = canvas(s, s)
    d.ellipse((6 * SS, 6 * SS, (s - 6) * SS, (s - 6) * SS), fill=C(col), outline=(255, 255, 255, 255), width=6 * SS)
    for ex in (.36, .64):
        d.ellipse(((ex * s - 9) * SS, (.4 * s - 9) * SS, (ex * s + 9) * SS, (.4 * s + 9) * SS), fill=INK)
    if curve == 0:
        d.line([(.34 * s * SS, .66 * s * SS), (.66 * s * SS, .66 * s * SS)], fill=INK, width=8 * SS)
    elif curve > 0:
        dep = .12 * curve
        d.arc((.3 * s * SS, (.5 - dep) * s * SS, .7 * s * SS, (.72 + dep / 2) * s * SS), 20, 160, fill=INK, width=8 * SS)
    else:
        dep = -.1 * curve
        d.arc((.3 * s * SS, .6 * s * SS, .7 * s * SS, (.82 + dep) * s * SS), 200, 340, fill=INK, width=8 * SS)
    stickers.append((f"mood-{name}", finish(im)))

# --- Save PNGs, zip, sticker book, preview
folder = os.path.join(OUT, "stickers"); os.makedirs(folder, exist_ok=True)
for f in os.listdir(folder): os.remove(os.path.join(folder, f))
for name, im in stickers:
    im.save(os.path.join(folder, f"{name}.png"))

def sheet(items, W=2048, H=1536, bg=(247, 243, 236, 255), pad=40):
    pages, page = [], None
    x = y = pad; row_h = 0
    for _, im in items:
        if page is None:
            page = Image.new("RGBA", (W, H), bg); x = y = pad + 60; row_h = 0
        if x + im.width > W - pad:
            x = pad; y += row_h + 30; row_h = 0
        if y + im.height > H - pad:
            pages.append(page); page = Image.new("RGBA", (W, H), bg); x = y = pad + 60; row_h = 0
        page.alpha_composite(im, (x, y)); x += im.width + 30; row_h = max(row_h, im.height)
    pages.append(page)
    return pages

pages = sheet(stickers)
rgb = [p.convert("RGB") for p in pages]
pdf = os.path.join(OUT, "Snapfront-Planner-Sticker-Book.pdf")
rgb[0].save(pdf, save_all=True, append_images=rgb[1:], resolution=200)
rgb[0].resize((1024, 768), Image.LANCZOS).save(os.path.join(OUT, "preview-stickers.png"))
with zipfile.ZipFile(os.path.join(OUT, "Snapfront-Planner-Sticker-Pack.zip"), "w", zipfile.ZIP_DEFLATED) as z:
    for name, _ in stickers: z.write(os.path.join(folder, f"{name}.png"), f"stickers/{name}.png")
    z.write(pdf, os.path.basename(pdf))
print(len(stickers), "stickers,", len(pages), "sheet pages")
