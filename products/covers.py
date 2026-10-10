"""Square 1200x1200 listing images for each product (used by the storefront + for Etsy/Instagram)."""
import os, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from common import OUT, font

S = 1200
BG = (239, 232, 220)
INK = (43, 42, 40)
TC, SAND, SAGE, DUSK, BLUSH = (200, 102, 75), (231, 201, 160), (139, 166, 138), (125, 143, 179), (227, 181, 168)
tmp = "/tmp/claude-0/-home-claude/d655e26d-850f-5153-8b9f-99d810802b56/scratchpad"
covers = os.path.join(OUT, "covers"); os.makedirs(covers, exist_ok=True)

def f(n, s): return ImageFont.truetype(font(n), s)

def shadow(base, im, xy, radius=24, off=18):
    sh = Image.new("RGBA", (im.width + 80, im.height + 80), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((40, 40, 40 + im.width, 40 + im.height), radius, fill=(0, 0, 0, 70))
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    base.alpha_composite(sh, (xy[0] - 40 + off // 2, xy[1] - 40 + off))
    mask = Image.new("L", im.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width, im.height), radius, fill=255)
    base.paste(im, xy, mask)

def band(base, title, sub, col):
    d = ImageDraw.Draw(base)
    d.rectangle((0, S - 190, S, S), fill=col)
    d.text((60, S - 165), title, font=f("Fraunces-SemiBold", 62), fill=INK if col in (SAND, BLUSH) else (255, 255, 255))
    d.text((62, S - 85), sub, font=f("DMSans-Medium", 28), fill=INK if col in (SAND, BLUSH) else (255, 255, 255))

def pdf_page(path, page, w):
    out = os.path.join(tmp, f"pg_{os.path.basename(path)}_{page}")
    subprocess.run(["pdftoppm", "-png", "-r", "110", "-f", str(page), "-l", str(page), "-singlefile", path, out], check=True)
    im = Image.open(out + ".png").convert("RGBA")
    return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)

# planner: tablet frame
base = Image.new("RGBA", (S, S), BG + (255,))
pg = pdf_page(os.path.join(OUT, "Snapfront-2027-Digital-Planner.pdf"), 5, 900)
frame = Image.new("RGBA", (pg.width + 50, pg.height + 50), (30, 30, 32, 255))
frame.paste(pg, (25, 25))
shadow(base, frame, ((S - frame.width) // 2, 140), radius=36)
pg2 = pdf_page(os.path.join(OUT, "Snapfront-2027-Digital-Planner.pdf"), 1, 380)
shadow(base, pg2, (60, 60), radius=12)
band(base, "2027 Digital Planner", "Hyperlinked · GoodNotes & Notability · 91 pages", TC)
base.convert("RGB").save(os.path.join(covers, "planner.jpg"), quality=90)

# wall art
base = Image.new("RGBA", (S, S), BG + (255,))
prints = sorted(os.listdir(os.path.join(OUT, "wall-art")))
for i, (pidx, x, y, w) in enumerate([(0, 90, 120, 330), (4, 450, 70, 400), (2, 880, 140, 260)]):
    im = Image.open(os.path.join(OUT, "wall-art", prints[pidx])).convert("RGBA")
    im = im.resize((w, int(w * 1.25)), Image.LANCZOS)
    fr = Image.new("RGBA", (w + 30, im.height + 30), (255, 255, 255, 255)); fr.paste(im, (15, 15))
    shadow(base, fr, (x, y), radius=4)
band(base, "Printable Wall Art Set", "6 minimalist prints · 8×10 at 300 dpi", SAGE)
base.convert("RGB").save(os.path.join(covers, "wall-art.jpg"), quality=90)

# hooks workbook
base = Image.new("RGBA", (S, S), BG + (255,))
p = os.path.join(OUT, "Snapfront-30-Day-Viral-Hooks-Content-Calendar.pdf")
inner = pdf_page(p, 4, 470); shadow(base, inner, (640, 150), radius=8)
cov = pdf_page(p, 1, 520); shadow(base, cov, (110, 80), radius=8)
band(base, "30-Day Viral Hooks", "100 hooks · 5 scripts · content calendar", INK)
base.convert("RGB").save(os.path.join(covers, "hooks.jpg"), quality=90)

# budget tracker: stylised spreadsheet
base = Image.new("RGBA", (S, S), BG + (255,))
sheet = Image.new("RGBA", (1000, 760), (255, 255, 255, 255)); d = ImageDraw.Draw(sheet)
d.rectangle((0, 0, 1000, 70), fill=INK); d.text((30, 18), "Monthly Summary", font=f("DMSans-Bold", 30), fill=(255, 255, 255))
cols = ["Category", "Jan", "Feb", "Mar", "Total"]
xs = [30, 360, 520, 680, 840]
for x, c in zip(xs, cols): d.text((x, 95), c, font=f("DMSans-Bold", 22), fill=INK)
rows = [("Groceries", 486, 512, 470), ("Rent", 1500, 1500, 1500), ("Transport", 212, 240, 198), ("Eating out", 165, 210, 120),
        ("Subscriptions", 45, 45, 52), ("Savings", 500, 500, 650)]
for i, (nm, a, b, c_) in enumerate(rows):
    y = 145 + i * 62
    d.rectangle((0, y - 10, 1000, y + 50), fill=(248, 245, 239) if i % 2 else (255, 255, 255))
    d.text((30, y), nm, font=f("DMSans-Regular", 22), fill=INK)
    for x, v in zip(xs[1:], (a, b, c_, a + b + c_)):
        d.text((x, y), f"${v:,}", font=f("DMSans-Regular", 22), fill=INK)
for i, (h, col) in enumerate([(120, SAGE), (170, TC), (140, SAGE), (190, TC), (150, SAGE), (160, TC)]):
    d.rounded_rectangle((60 + i * 70, 740 - h, 110 + i * 70, 740), 6, fill=col)
d.text((520, 600), "Savings goal", font=f("DMSans-Bold", 22), fill=INK)
d.rounded_rectangle((520, 640, 960, 670), 15, fill=(235, 230, 220)); d.rounded_rectangle((520, 640, 830, 670), 15, fill=SAGE)
d.text((520, 685), "72% of emergency fund", font=f("DMSans-Regular", 20), fill=(110, 106, 99))
shadow(base, sheet, (100, 90), radius=16)
band(base, "Budget & Savings Tracker", "Excel + Google Sheets · auto-calculating", SAND)
base.convert("RGB").save(os.path.join(covers, "budget.jpg"), quality=90)

# stickers
base = Image.new("RGBA", (S, S), BG + (255,))
sp = Image.open(os.path.join(OUT, "preview-stickers.png")).convert("RGBA").resize((1080, 810), Image.LANCZOS)
shadow(base, sp, (60, 90), radius=20)
band(base, "Planner Sticker Pack", "47 transparent PNG stickers · GoodNotes ready", BLUSH)
base.convert("RGB").save(os.path.join(covers, "stickers.jpg"), quality=90)
print(sorted(os.listdir(covers)))
