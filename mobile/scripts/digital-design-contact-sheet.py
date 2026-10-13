#!/usr/bin/env python3
"""Create reviewable contact sheets from the actual packaged original digital designs."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
mobile = Path(__file__).resolve().parents[1]
repo = mobile.parent
args.output.mkdir(parents=True, exist_ok=True)
formats = [('guide', 'MINI E-BOOKS'), ('checklist', 'CHECKLISTS & WORKSHEETS'), ('hooks', 'CONTENT PROMPT PACKS'), ('quotes', 'QUOTE PRINTS'), ('planner', 'PLANNERS')]
font_path = repo / 'server/assets/fonts/DMSans-Regular.ttf'
font_bold_path = repo / 'server/assets/fonts/DMSans-Bold.ttf'
font = ImageFont.truetype(str(font_path), 21)
small = ImageFont.truetype(str(font_path), 16)
bold = ImageFont.truetype(str(font_bold_path), 27)
for key, title in formats:
    sheet = Image.new('RGB', (1500, 920), '#090B0E')
    draw = ImageDraw.Draw(sheet)
    draw.text((38, 28), 'SNAPFRONT / ORIGINAL DIGITAL DESIGNS', font=small, fill='#AEB5BF')
    draw.text((38, 58), title, font=bold, fill='#F5F6FA')
    draw.text((38, 98), 'Editable text, pages, colors and pictures. Covers shown are actual renderer output.', font=small, fill='#AEB5BF')
    for i in range(10):
        tid = f'{key}-{i+1:02d}'
        meta = json.loads((repo / f'server/src/digital-templates/{tid}.json').read_text())
        x = 38 + (i % 5) * 291
        y = 150 + (i // 5) * 378
        image = Image.open(mobile / f'assets/digital-designs/{tid}.png').convert('RGB')
        image.thumbnail((254, 309), Image.Resampling.LANCZOS)
        sheet.paste(image, (x + (254 - image.width) // 2, y))
        draw.text((x, y + 318), meta['name'], font=font, fill='#F5F6FA')
        draw.text((x, y + 347), tid.upper(), font=small, fill='#AEB5BF')
    target = args.output / f'{key}-10-designs.jpg'
    sheet.save(target, quality=92)
    print(target)
