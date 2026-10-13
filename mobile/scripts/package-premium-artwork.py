#!/usr/bin/env python3
"""Optimize original generated artwork for self-contained SVG/PDF digital previews."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2] / 'server/assets/digital-artwork'
ids = ['chrome-gateway', 'pearl-sculpture', 'amethyst-glass', 'emerald-architecture', 'optical-silver', 'silk-silver', 'ice-prism', 'copper-orbit', 'stone-silver']
for name in ids:
    source = root / f'{name}-master.png'
    if not source.exists():
        raise SystemExit(f'Missing original artwork: {source}')
    with Image.open(source) as im:
        image = im.convert('RGB')
        image.thumbnail((1000, 1334), Image.Resampling.LANCZOS)
        target = root / f'{name}.jpg'
        for quality in [84, 78, 72, 66, 60]:
            image.save(target, 'JPEG', quality=quality, optimize=True, progressive=True)
            if target.stat().st_size <= 140_000:
                break
        if target.stat().st_size > 140_000:
            raise SystemExit(f'Artwork exceeds native transport bound: {target}')
        print(f'{name}: {image.width}x{image.height}, {target.stat().st_size} bytes')
