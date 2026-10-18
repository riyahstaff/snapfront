"""Renders the promo's on-screen text as transparent PNGs (captions, end card, corner mark) with the site's
Figtree font, so the words are crisp and on-brand instead of drawn by the video model.
Run: python3 overlays.py  →  out/overlays/*.png"""
import base64, json, pathlib, subprocess
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
OUT = HERE / "out" / "overlays"; OUT.mkdir(parents=True, exist_ok=True)
FONTS = HERE.parent.parent / "mobile/node_modules/@expo-google-fonts/figtree"
MARK = HERE.parent.parent / "mobile/assets/brand-mark.png"
scenes = json.loads(subprocess.check_output(["node", "-e", "import('./scenes.mjs').then(m=>console.log(JSON.stringify(m.SCENES)))"], cwd=HERE))

def font(weight, file):
    data = base64.b64encode((FONTS / file).read_bytes()).decode()
    return f"@font-face{{font-family:F;font-weight:{weight};src:url(data:font/ttf;base64,{data})}}"

# Each caption gets its own bright gradient, cycling through the palette.
GRADS = ["#FF3CAC,#784BA0,#2B86C5", "#FF8A00,#FF2D95", "#00E0B8,#2B86C5,#8E2DE2", "#FFD000,#FF6A00,#FF2D95",
         "#7F00FF,#E100FF", "#00C6FF,#0072FF,#B620E0", "#F7971E,#FFD200", "#FF5F6D,#FFC371"]
mark = base64.b64encode(MARK.read_bytes()).decode()
CSS = font(800, "800ExtraBold/Figtree_800ExtraBold.ttf") + font(700, "700Bold/Figtree_700Bold.ttf") + """
html,body{margin:0;background:transparent}
.cap{display:inline-block;padding:18px 44px 24px;border-radius:999px;font:800 88px/1.05 F;letter-spacing:-1.5px;color:#fff;
  background:linear-gradient(100deg,var(--g));box-shadow:0 18px 60px rgba(0,0,0,.45),0 0 70px color-mix(in srgb,var(--c) 55%,transparent);
  text-shadow:0 3px 12px rgba(0,0,0,.35);white-space:nowrap;margin:90px 110px}
.logo{display:inline-flex;align-items:center;gap:26px;margin:70px}
.logo img{width:132px;height:132px;filter:drop-shadow(0 0 30px rgba(255,255,255,.35))}
.logo span{font:800 124px/1 F;letter-spacing:-3px;color:#fff;text-shadow:0 0 40px rgba(255,120,200,.55)}
.tag{display:inline-block;font:700 58px/1.1 F;color:#fff;letter-spacing:-.5px;text-shadow:0 4px 24px rgba(0,0,0,.6);margin:50px}
.cta{display:inline-block;margin:110px;padding:26px 64px 30px;border-radius:999px;background:#fff;color:#11151B;font:800 64px/1 F;
  letter-spacing:-1px;box-shadow:0 0 0 6px rgba(255,255,255,.18),0 0 90px rgba(255,140,60,.75)}
.bug{display:inline-flex;align-items:center;gap:12px;margin:24px;opacity:.92}
.bug img{width:44px;height:44px}.bug span{font:800 38px/1 F;color:#fff;letter-spacing:-.6px;text-shadow:0 2px 10px rgba(0,0,0,.6)}
"""

def shot(page, html, name):
    page.set_content(f"<style>{CSS}</style><div id=w style='display:inline-block'>{html}</div>")
    page.evaluate("document.fonts.ready")
    page.locator("#w").screenshot(path=str(OUT / f"{name}.png"), omit_background=True)

with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(viewport={"width": 1920, "height": 1080})
    n = 0
    for s in scenes:
        for i, (text, _t) in enumerate(s["captions"]):
            g = GRADS[n % len(GRADS)]; n += 1
            shot(page, f"<div class=cap style='--g:{g};--c:{g.split(',')[0]}'>{text.replace('&', '&amp;')}</div>", f"cap-{s['key']}-{i}")
    shot(page, f"<div class=logo><img src='data:image/png;base64,{mark}'><span>snapfront</span></div>", "end-logo")
    shot(page, "<div class=tag>Snap a product. Open a store.</div>", "end-tag")
    shot(page, "<div style='width:1300px;height:900px;background:radial-gradient(closest-side,rgba(0,0,0,.82),rgba(0,0,0,.55) 55%,rgba(0,0,0,0))'></div>", "end-shade")
    shot(page, "<div class=cta>Start here &rarr;</div>", "end-cta")
    shot(page, f"<div class=bug><img src='data:image/png;base64,{mark}'><span>snapfront</span></div>", "bug")
    b.close()
print("overlays", len(list(OUT.glob("*.png"))))
