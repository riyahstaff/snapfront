"""Shared fonts and palette for the Snapfront starter products."""
import os
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

for name in ["DMSans-Regular", "DMSans-Medium", "DMSans-Bold",
             "Fraunces-Light", "Fraunces-Regular", "Fraunces-SemiBold"]:
    pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS, name + ".ttf")))

def font(name):
    return os.path.join(FONTS, name + ".ttf")

PAPER = HexColor("#F7F3EC")
INK = HexColor("#2B2A28")
SOFT_INK = HexColor("#6E6A63")
LINE = HexColor("#DDD5C7")
TERRACOTTA = HexColor("#C8664B")
SAGE = HexColor("#8BA68A")
SAND = HexColor("#E7C9A0")
DUSK = HexColor("#7D8FB3")
BLUSH = HexColor("#E3B5A8")
TAB_COLORS = [TERRACOTTA, SAND, SAGE, DUSK, BLUSH, HexColor("#B9A27E")]
