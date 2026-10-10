"""2027 Hyperlinked Digital Planner (landscape, iPad 4:3) for GoodNotes / Notability."""
import calendar
import datetime as dt
import os
from reportlab.pdfgen import canvas
from common import *

W, H = 1024, 768
TAB_W = 74
CW = W - TAB_W            # content width
M = 48                    # margin
YEAR = 2027
MONTHS = list(calendar.month_name)[1:]
MON_ABBR = [m[:3].upper() for m in MONTHS]
DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
cal = calendar.Calendar(firstweekday=0)

first_monday = dt.date(2026, 12, 28)
WEEKS = [first_monday + dt.timedelta(weeks=i) for i in range(53)]

def week_key(d):
    """Key of the weekly page that contains date d."""
    idx = (d - first_monday).days // 7
    return f"week{idx}" if 0 <= idx < len(WEEKS) else None

c = canvas.Canvas(os.path.join(OUT, "Snapfront-2027-Digital-Planner.pdf"), pagesize=(W, H))
c.setTitle("2027 Digital Planner")
c.setAuthor("Snapfront Studio")
c.setSubject("Hyperlinked digital planner for GoodNotes and Notability")

def link(key, x, y, w, h):
    c.linkRect("", key, (x, y, x + w, y + h), relative=0, thickness=0)

def bg():
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, stroke=0, fill=1)

def tabs(active=None):
    """Right-hand navigation strip that appears on every page."""
    c.setFillColor(HexColor("#EFE8DC"))
    c.rect(CW, 0, TAB_W, H, stroke=0, fill=1)
    items = [("YEAR", "year"), ("GOALS", "goals")] + \
            [(MON_ABBR[i], f"month{i}") for i in range(12)] + [("NOTES", "notes0")]
    th = (H - 24) / len(items)
    for i, (label, key) in enumerate(items):
        y = H - 12 - (i + 1) * th
        col = TAB_COLORS[i % len(TAB_COLORS)]
        is_active = key == active
        c.setFillColor(col)
        x0 = CW + (6 if is_active else 14)
        c.roundRect(x0, y + 3, TAB_W, th - 6, 8, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("DMSans-Bold" if is_active else "DMSans-Medium", 11)
        c.drawCentredString(x0 + (TAB_W - 14) / 2 + 2, y + th / 2 - 4, label)
        link(key, CW, y, TAB_W, th)

def header(title, sub=None):
    c.setFillColor(INK)
    c.setFont("Fraunces-SemiBold", 38)
    c.drawString(M, H - M - 28, title)
    if sub:
        c.setFont("DMSans-Medium", 13)
        c.setFillColor(SOFT_INK)
        c.drawString(M, H - M - 52, sub)

def lines(x, y_top, w, n, gap=26, color=LINE):
    c.setStrokeColor(color)
    c.setLineWidth(0.8)
    for i in range(n):
        y = y_top - (i + 1) * gap
        c.line(x, y, x + w, y)

def checkbox(x, y, s=11):
    c.setStrokeColor(SOFT_INK)
    c.setLineWidth(1)
    c.roundRect(x, y, s, s, 2.5, stroke=1, fill=0)

# ---------- Cover ----------
bg()
c.setFillColor(SAND); c.circle(CW * 0.72, H * 0.62, 210, stroke=0, fill=1)
c.setFillColor(TERRACOTTA); c.circle(CW * 0.60, H * 0.40, 120, stroke=0, fill=1)
c.setFillColor(SAGE); c.wedge(CW * 0.80 - 140, H * 0.22 - 140, CW * 0.80 + 140, H * 0.22 + 140, 0, 180, stroke=0, fill=1)
c.setFillColor(INK)
c.setFont("Fraunces-Light", 150); c.drawString(M + 10, H * 0.48, "2027")
c.setFont("Fraunces-Regular", 34); c.drawString(M + 16, H * 0.48 - 52, "the year I planned for")
c.setFont("DMSans-Medium", 13); c.setFillColor(SOFT_INK)
c.drawString(M + 18, M + 20, "HYPERLINKED DIGITAL PLANNER  ·  MONDAY START  ·  DEC 2026 – DEC 2027")
c.setFillColor(INK); c.roundRect(M + 16, H * 0.48 - 130, 170, 44, 22, stroke=0, fill=1)
c.setFillColor(PAPER); c.setFont("DMSans-Bold", 15); c.drawCentredString(M + 101, H * 0.48 - 113, "OPEN PLANNER  →")
link("howto", M + 16, H * 0.48 - 130, 170, 44)
tabs(); c.bookmarkPage("cover"); c.addOutlineEntry("Cover", "cover", 0); c.showPage()

# ---------- How to use ----------
bg(); tabs(); header("How to use your planner", "Two minutes now saves you a year of scrolling.")
tips = [
    ("Import", "Open the PDF in GoodNotes, Notability, Noteshelf or any PDF annotator. Import as a new notebook so links keep working."),
    ("Navigate", "Tap a tab on the right to jump to any month, your goals or notes. On the yearly page, tap a month to open it."),
    ("Go weekly", "On a monthly page, tap a week number (W01, W02…) to open that week. Tap the date on a weekly page to return to the month."),
    ("Write mode vs. read mode", "Links only work in read / view mode in most apps. Switch to the pen to write, then back to tap links."),
    ("Make it yours", "Add digital stickers, highlight priorities, duplicate notes pages as often as you like."),
]
y = H - 170
for i, (t, body) in enumerate(tips):
    c.setFillColor(TAB_COLORS[i]); c.circle(M + 16, y + 6, 16, stroke=0, fill=1)
    c.setFillColor(INK); c.setFont("DMSans-Bold", 15); c.drawCentredString(M + 16, y + 1, str(i + 1))
    c.setFont("DMSans-Bold", 17); c.drawString(M + 48, y + 6, t)
    c.setFont("DMSans-Regular", 13.5); c.setFillColor(SOFT_INK)
    from reportlab.lib.utils import simpleSplit
    for j, ln in enumerate(simpleSplit(body, "DMSans-Regular", 13.5, CW - 2 * M - 60)):
        c.drawString(M + 48, y - 16 - j * 18, ln)
    y -= 100
c.setFont("DMSans-Regular", 11); c.setFillColor(SOFT_INK)
c.drawString(M, 30, "Personal use licence. Please do not resell or share the file. © Snapfront Studio.")
c.bookmarkPage("howto"); c.showPage()

# ---------- Year at a glance ----------
bg(); tabs("year"); header(f"{YEAR} at a glance")
gw, gh = (CW - 2 * M) / 4, (H - 150 - M) / 3
for i in range(12):
    col, row = i % 4, i // 4
    x = M + col * gw
    y_top = H - 130 - row * gh
    c.setFillColor(TAB_COLORS[i % 6]); c.circle(x + 11, y_top + 1, 5, stroke=0, fill=1)
    c.setFillColor(INK); c.setFont("Fraunces-SemiBold", 16)
    c.drawString(x + 22, y_top - 4, MONTHS[i])
    cell = (gw - 24) / 7
    c.setFont("DMSans-Bold", 7.5); c.setFillColor(SOFT_INK)
    for d in range(7):
        c.drawCentredString(x + 6 + cell * d + cell / 2, y_top - 24, DOW[d][0])
    c.setFont("DMSans-Regular", 9.5); c.setFillColor(INK)
    for r, wk in enumerate(cal.monthdayscalendar(YEAR, i + 1)):
        for d, day in enumerate(wk):
            if day:
                c.drawCentredString(x + 6 + cell * d + cell / 2, y_top - 40 - r * 16, str(day))
    link(f"month{i}", x, y_top - gh + 20, gw - 10, gh - 10)
c.bookmarkPage("year"); c.addOutlineEntry("Year at a glance", "year", 0); c.showPage()

# ---------- Goals ----------
bg(); tabs("goals"); header(f"{YEAR} goals", "Pick fewer, finish more.")
areas = ["Health & energy", "Money", "Career & creative work", "Relationships", "Home & life admin", "Just for fun"]
bw, bh = (CW - 2 * M - 20) / 2, (H - 160 - M - 40) / 3
for i, a in enumerate(areas):
    x = M + (i % 2) * (bw + 20)
    y = H - 140 - (i // 2 + 1) * (bh + 20) + 20
    c.setFillColor(HexColor("#FFFFFF")); c.setStrokeColor(LINE)
    c.roundRect(x, y, bw, bh, 12, stroke=1, fill=1)
    c.setFillColor(TAB_COLORS[i]); c.roundRect(x, y + bh - 34, 8, 22, 3, stroke=0, fill=1)
    c.setFillColor(INK); c.setFont("DMSans-Bold", 14); c.drawString(x + 18, y + bh - 28, a)
    for k in range(4):
        yy = y + bh - 60 - k * 26
        checkbox(x + 18, yy)
        c.setStrokeColor(LINE); c.line(x + 38, yy, x + bw - 18, yy)
c.bookmarkPage("goals"); c.addOutlineEntry("Goals", "goals", 0); c.showPage()

# ---------- Months + habit trackers ----------
for i in range(12):
    m = i + 1
    weeks = cal.monthdatescalendar(YEAR, m)
    bg(); tabs(f"month{i}")
    header(MONTHS[i], f"{YEAR}  ·  tap a week number to open the week")
    c.setFont("DMSans-Medium", 12); c.setFillColor(TERRACOTTA)
    c.drawRightString(CW - M, H - M - 22, "HABITS →")
    link(f"habit{i}", CW - M - 80, H - M - 30, 80, 24)
    gx, gy_top = M + 50, H - 140
    gw7 = (CW - M - gx - 230) / 7
    gh_row = (gy_top - M) / len(weeks) - 2
    c.setFont("DMSans-Bold", 10); c.setFillColor(SOFT_INK)
    for d in range(7):
        c.drawCentredString(gx + gw7 * d + gw7 / 2, gy_top + 8, DOW[d])
    for r, wk in enumerate(weeks):
        y = gy_top - (r + 1) * gh_row
        key = week_key(wk[0])
        c.setFillColor(TAB_COLORS[i % 6]); c.roundRect(M, y + gh_row / 2 - 14, 40, 28, 14, stroke=0, fill=1)
        c.setFillColor(INK); c.setFont("DMSans-Bold", 11)
        c.drawCentredString(M + 20, y + gh_row / 2 - 4, f"W{wk[0].isocalendar()[1]:02d}")
        if key: link(key, M, y + gh_row / 2 - 14, 40, 28)
        for d, day in enumerate(wk):
            x = gx + gw7 * d
            inside = day.month == m
            c.setFillColor(HexColor("#FFFFFF") if inside else HexColor("#F1ECE3"))
            c.setStrokeColor(LINE); c.setLineWidth(0.8)
            c.rect(x, y, gw7, gh_row, stroke=1, fill=1)
            c.setFillColor(INK if inside else HexColor("#B8B1A5"))
            c.setFont("DMSans-Medium", 12); c.drawString(x + 7, y + gh_row - 17, str(day.day))
    nx = CW - M - 210
    c.setFillColor(INK); c.setFont("DMSans-Bold", 13); c.drawString(nx, gy_top + 8, "THIS MONTH")
    for k in range(5):
        checkbox(nx, gy_top - 30 - k * 26)
        c.setStrokeColor(LINE); c.line(nx + 18, gy_top - 30 - k * 26, CW - M, gy_top - 30 - k * 26)
    c.setFont("DMSans-Bold", 13); c.setFillColor(INK); c.drawString(nx, gy_top - 190, "NOTES")
    lines(nx, gy_top - 196, 210, 12, 24)
    c.bookmarkPage(f"month{i}"); c.addOutlineEntry(MONTHS[i], f"month{i}", 0); c.showPage()

    # habit tracker
    days = calendar.monthrange(YEAR, m)[1]
    bg(); tabs(f"month{i}"); header(f"{MONTHS[i]} habits", "Colour a square every day you show up.")
    c.setFont("DMSans-Medium", 12); c.setFillColor(TERRACOTTA)
    c.drawRightString(CW - M, H - M - 22, "← MONTH"); link(f"month{i}", CW - M - 80, H - M - 30, 80, 24)
    hx, hy = M + 180, H - 160
    cs = (CW - M - hx) / days
    c.setFont("DMSans-Bold", 8.5); c.setFillColor(SOFT_INK)
    for d in range(days):
        c.drawCentredString(hx + cs * d + cs / 2, hy + 8, str(d + 1))
    for r in range(14):
        y = hy - (r + 1) * 36
        c.setStrokeColor(LINE); c.line(M, y + 4, hx - 10, y + 4)
        for d in range(days):
            c.setFillColor(HexColor("#FFFFFF"))
            c.roundRect(hx + cs * d + 1.5, y + 4, cs - 3, 24, 3, stroke=1, fill=1)
    c.bookmarkPage(f"habit{i}"); c.showPage()

# ---------- Weekly pages ----------
for w, monday in enumerate(WEEKS):
    days = [monday + dt.timedelta(days=k) for k in range(7)]
    mi = days[3].month - 1 if days[3].year == YEAR else (0 if days[3].year < YEAR else 11)
    bg(); tabs(f"month{mi}")
    span = f"{days[0].strftime('%b %-d')} – {days[6].strftime('%b %-d, %Y')}"
    header(f"Week {monday.isocalendar()[1]:02d}", span)
    if w > 0:
        c.setFont("DMSans-Medium", 12); c.setFillColor(TERRACOTTA)
        c.drawString(CW - M - 170, H - M - 22, "← PREV"); link(f"week{w-1}", CW - M - 172, H - M - 30, 60, 24)
    if w < len(WEEKS) - 1:
        c.setFont("DMSans-Medium", 12); c.setFillColor(TERRACOTTA)
        c.drawRightString(CW - M, H - M - 22, "NEXT →"); link(f"week{w+1}", CW - M - 62, H - M - 30, 62, 24)
    bw = (CW - 2 * M - 30) / 4
    bh = (H - 150 - M - 16) / 2
    boxes = days + ["PRIORITIES"]
    for k, item in enumerate(boxes):
        col, row = k % 4, k // 4
        x = M + col * (bw + 10); y = H - 140 - (row + 1) * bh - row * 16
        c.setFillColor(HexColor("#FFFFFF")); c.setStrokeColor(LINE)
        c.roundRect(x, y, bw, bh, 10, stroke=1, fill=1)
        if isinstance(item, dt.date):
            accent = TAB_COLORS[(item.month - 1) % 6]
            c.setFillColor(accent); c.roundRect(x + 10, y + bh - 34, 58, 24, 12, stroke=0, fill=1)
            c.setFillColor(INK); c.setFont("DMSans-Bold", 11)
            c.drawCentredString(x + 39, y + bh - 26, f"{DOW[k]} {item.day}")
            c.setFont("DMSans-Regular", 10); c.setFillColor(SOFT_INK)
            c.drawString(x + 76, y + bh - 26, item.strftime("%B"))
            if item.year == YEAR:
                link(f"month{item.month-1}", x + 10, y + bh - 34, 58, 24)
            lines(x + 12, y + bh - 40, bw - 24, 8, 26)
        else:
            c.setFillColor(INK); c.setFont("DMSans-Bold", 12); c.drawString(x + 14, y + bh - 28, item)
            for j in range(8):
                yy = y + bh - 60 - j * 26
                checkbox(x + 14, yy)
                c.setStrokeColor(LINE); c.line(x + 32, yy, x + bw - 14, yy)
    c.bookmarkPage(f"week{w}")
    if w == 0: c.addOutlineEntry("Weekly pages", "week0", 0)
    c.showPage()

# ---------- Notes ----------
for n in range(10):
    bg(); tabs("notes0"); header("Notes", f"Page {n+1} of 10")
    if n < 9:
        c.setFont("DMSans-Medium", 12); c.setFillColor(TERRACOTTA)
        c.drawRightString(CW - M, H - M - 22, "NEXT →"); link(f"notes{n+1}", CW - M - 62, H - M - 30, 62, 24)
    c.setFillColor(HexColor("#D2C9B9"))
    for gx in range(int(M), int(CW - M) + 1, 22):
        for gy in range(int(M), int(H - 130), 22):
            c.circle(gx, gy, 1, stroke=0, fill=1)
    c.bookmarkPage(f"notes{n}")
    if n == 0: c.addOutlineEntry("Notes", "notes0", 0)
    c.showPage()

c.save()
print("planner done")
