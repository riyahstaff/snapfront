#!/usr/bin/env python3
"""Render classic screenshots from actual isolated fixture HTML.
Requires Python Playwright, Pillow and Chromium; not used by EAS build.
Usage: python3 mobile/scripts/render-classic-previews.py <html-directory>
"""
from pathlib import Path
import io
import json
import sys
from PIL import Image
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
html_dir = Path(sys.argv[1])
output = root / 'assets/theme-previews'
output.mkdir(parents=True, exist_ok=True)
ids = json.loads((html_dir / 'ids.json').read_text())
sample = root.parent / 'server/assets/themes/candles-hero.webp'
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1280,'height':800}, reduced_motion='reduce')
    def intercept(route):
        url = route.request.url
        if '/img/classic-sample.webp' in url or '/assets/camera-test.webp' in url:
            route.fulfill(path=str(sample), content_type='image/webp')
        elif url.startswith('https://fonts.googleapis.com/') or url.startswith('https://fonts.gstatic.com/'):
            route.continue_()
        else:
            route.abort()
    page.route('**/*', intercept)
    for theme_id in ids:
        page.set_content((html_dir / f'{theme_id}.html').read_text(), wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        page.wait_for_function('''() => [...document.querySelectorAll('img')].every(i=>i.complete && i.naturalWidth>0)''')
        # Actual viewport pixels, resized preserving the full screenshot aspect ratio.
        image=Image.open(io.BytesIO(page.screenshot())).convert('RGB')
        image.thumbnail((960,600),Image.Resampling.LANCZOS)
        image.save(output / f'classic-{theme_id}-preview.webp','WEBP',quality=85,method=6)
        print(f'Actual classic renderer screenshot: {theme_id}',flush=True)
    browser.close()
assert len(ids)==20
