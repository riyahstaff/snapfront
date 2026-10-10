"""30-Day Viral Hooks & Content Calendar — creator workbook (US Letter)."""
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                PageBreak, Table, TableStyle, KeepTogether, NextPageTemplate)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from common import *
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
BOX = "<font name='DejaVu'>☐</font>"

PW, PH = letter
OUTFILE = os.path.join(OUT, "Snapfront-30-Day-Viral-Hooks-Content-Calendar.pdf")

S = {
    "h1": ParagraphStyle("h1", fontName="Fraunces-SemiBold", fontSize=30, leading=36, textColor=INK, spaceAfter=6),
    "h2": ParagraphStyle("h2", fontName="Fraunces-SemiBold", fontSize=18, leading=23, textColor=INK, spaceBefore=12, spaceAfter=6),
    "kick": ParagraphStyle("kick", fontName="DMSans-Bold", fontSize=9.5, leading=12, textColor=TERRACOTTA, spaceAfter=4),
    "body": ParagraphStyle("body", fontName="DMSans-Regular", fontSize=10.5, leading=15.5, textColor=INK, spaceAfter=7),
    "soft": ParagraphStyle("soft", fontName="DMSans-Regular", fontSize=10, leading=14, textColor=SOFT_INK, spaceAfter=6),
    "hook": ParagraphStyle("hook", fontName="DMSans-Regular", fontSize=10, leading=13.5, textColor=INK),
    "cell": ParagraphStyle("cell", fontName="DMSans-Regular", fontSize=8.8, leading=11.5, textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName="DMSans-Bold", fontSize=8.8, leading=11.5, textColor=INK),
    "cellw": ParagraphStyle("cellw", fontName="DMSans-Bold", fontSize=8.8, leading=11.5, textColor=PAPER),
}

def on_page(c, doc):
    c.saveState()
    c.setFillColor(PAPER); c.rect(0, 0, PW, PH, stroke=0, fill=1)
    c.setFillColor(TERRACOTTA); c.rect(0, PH - 10, PW, 10, stroke=0, fill=1)
    c.setFont("DMSans-Medium", 8.5); c.setFillColor(SOFT_INK)
    c.drawString(54, 30, "30-DAY VIRAL HOOKS & CONTENT CALENDAR")
    c.drawRightString(PW - 54, 30, str(doc.page))
    c.restoreState()

def on_cover(c, doc):
    c.saveState()
    c.setFillColor(INK); c.rect(0, 0, PW, PH, stroke=0, fill=1)
    c.setFillColor(TERRACOTTA); c.circle(PW - 120, PH - 150, 190, stroke=0, fill=1)
    c.setFillColor(SAND); c.circle(PW - 260, PH - 330, 70, stroke=0, fill=1)
    c.setFillColor(SAGE); c.rect(0, 0, PW, 120, stroke=0, fill=1)
    c.setFillColor(PAPER)
    c.setFont("DMSans-Bold", 12); c.drawString(54, PH - 300, "THE CREATOR WORKBOOK")
    c.setFont("Fraunces-SemiBold", 64); c.drawString(50, PH - 380, "30-Day")
    c.drawString(50, PH - 450, "Viral Hooks")
    c.setFont("Fraunces-Light", 34); c.drawString(54, PH - 500, "& Content Calendar")
    c.setFont("DMSans-Regular", 13)
    c.drawString(54, PH - 545, "100 fill-in-the-blank hooks · 5 script templates ·")
    c.drawString(54, PH - 563, "30 daily prompts · analytics trackers")
    c.setFillColor(INK); c.setFont("DMSans-Bold", 11)
    c.drawString(54, 54, "FOR TIKTOK · INSTAGRAM REELS · YOUTUBE SHORTS")
    c.restoreState()

doc = BaseDocTemplate(OUTFILE, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=60, bottomMargin=56,
                      title="30-Day Viral Hooks & Content Calendar", author="Snapfront Studio")
frame = Frame(54, 56, PW - 108, PH - 116, id="f")
doc.addPageTemplates([PageTemplate("cover", [frame], onPage=on_cover),
                      PageTemplate("page", [frame], onPage=on_page)])
story = [NextPageTemplate("page"), PageBreak()]

def P(t, s="body"): return Paragraph(t, S[s])

def card_table(rows, widths, header=True, zebra=True, pad=6):
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    st = [("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("GRID", (0, 0), (-1, -1), 0.6, LINE),
          ("BACKGROUND", (0, 0), (-1, -1), HexColor("#FFFFFF")),
          ("TOPPADDING", (0, 0), (-1, -1), pad), ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
          ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7)]
    if header:
        st += [("BACKGROUND", (0, 0), (-1, 0), INK), ("TEXTCOLOR", (0, 0), (-1, 0), PAPER)]
    t.setStyle(TableStyle(st))
    return t

# ---- Start here
story += [P("START HERE", "kick"), P("Why the first 3 seconds decide everything", "h1"),
    P("On short-form video, the scroll is the enemy. Most viewers decide whether to stay before your second sentence finishes. "
      "A hook is the line, image or movement that earns the next few seconds. This workbook gives you 100 proven hook "
      "<b>structures</b> — not copy-paste lines — so every video starts strong in your own voice."),
    P("How to use this workbook", "h2"),
    P("<b>1. Pick your three content pillars</b> (page 3). Every video you post should sit inside one of them."),
    P("<b>2. Follow the 30-day calendar.</b> Each day gives you a format, a prompt and a suggested hook number."),
    P("<b>3. Fill in the hook.</b> Swap the [brackets] for your niche. Say it out loud — if it sounds like an ad, rewrite it."),
    P("<b>4. Track it.</b> Log views, watch time and saves in the weekly tracker. After 30 days you'll know exactly which hooks your audience loves."),
    P("The anatomy of a hook that works", "h2"),
]
anat = [[P("Layer", "cellw"), P("What it does", "cellw"), P("Example", "cellw")],
        [P("Spoken hook", "cell"), P("The first sentence you say. Short, specific, curiosity-driven.", "cell"), P("“I wasted $400 on skincare so you don't have to.”", "cell")],
        [P("Text hook", "cell"), P("On-screen text in the first frame — many people watch muted.", "cell"), P("“$400 of skincare, ranked.”", "cell")],
        [P("Visual hook", "cell"), P("Movement or an unexpected image in frame one.", "cell"), P("Dumping a full bag of products onto the bed.", "cell")],
        [P("Payoff promise", "cell"), P("Tells viewers what they get if they stay to the end.", "cell"), P("“…and the $9 one that beat them all.”", "cell")]]
t = card_table(anat, [95, 200, 209]); t.setStyle(TableStyle([("TEXTCOLOR", (0, 0), (-1, 0), PAPER)]))
story += [t, Spacer(1, 10),
          P("Tip: stack at least two layers. A spoken hook plus a matching text hook is the single easiest upgrade most creators can make.", "soft"),
          PageBreak()]

# ---- Pillars
story += [P("FOUNDATION", "kick"), P("Your three content pillars", "h1"),
          P("Pillars stop you from staring at a blank screen. Choose three themes your ideal viewer cares about and that you can talk about for a year."),
          Spacer(1, 6)]
for i, (name, hint) in enumerate([("Pillar 1 — Teach", "What can you show people how to do?"),
                                  ("Pillar 2 — Show", "What does your process, product or day look like behind the scenes?"),
                                  ("Pillar 3 — Connect", "What opinions, stories or lessons make people feel seen?")]):
    rows = [[P(f"<b>{name}</b><br/><font color='#6E6A63'>{hint}</font>", "cell")]] + [[P("&nbsp;", "cell")] for _ in range(3)]
    tt = Table(rows, colWidths=[PW - 108], rowHeights=[34] + [22] * 3)
    tt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), HexColor("#FFFFFF")), ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                            ("LINEBELOW", (0, 1), (-1, -2), 0.5, LINE), ("LINEBEFORE", (0, 0), (0, -1), 5, TAB_COLORS[i])]))
    story += [tt, Spacer(1, 14)]
story += [P("My ideal viewer is…", "h2")]
tt = Table([[P("&nbsp;", "cell")]] * 3, colWidths=[PW - 108], rowHeights=[24] * 3)
tt.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE)])); story += [tt, PageBreak()]

# ---- 100 hooks
HOOKS = {
    "Curiosity": [
        "Nobody talks about this part of [topic].", "I tried [thing] for [time] and here's what actually happened.",
        "This is the [topic] mistake I see every single day.", "Here's what [expert/insider] won't tell you about [topic].",
        "I can't believe this [small thing] changed my [result].", "Watch this before you buy another [product].",
        "There's a reason your [thing] isn't working — and it's not what you think.", "The [topic] trick I learned way too late.",
        "This looks wrong, but it's the right way to [task].", "I finally figured out why [common problem] keeps happening.",
        "Wait until you see what happens at the end.", "Everyone's doing [trend] wrong. Here's why.",
        "The weirdest [topic] advice that actually works.", "I almost didn't post this.", "Don't scroll — this will save you [time/money]."],
    "Pain point": [
        "If your [thing] always [bad outcome], watch this.", "Struggling with [problem]? Try this tonight.",
        "Stop doing [habit] if you want [result].", "You're not lazy — your [system] is broken.",
        "This is why you're always [frustration].", "Tired of [problem]? Here's the 2-minute fix.",
        "The reason you can't [goal] has nothing to do with willpower.", "If [task] takes you hours, you need this.",
        "POV: you finally stopped [frustrating habit].", "I used to [pain] every week until I did this.",
        "The [problem] nobody warned me about.", "You don't need more [thing], you need [better thing]."],
    "Numbers & lists": [
        "3 things I'd never do as a [role].", "5 [products] under $[price] that feel expensive.",
        "I tested [number] [items] so you don't have to.", "[Number] signs you're ready to [goal].",
        "The only [number] [tools] you need to [result].", "[Number] mistakes that cost me $[amount].",
        "Ranking every [item] I've tried from worst to best.", "1 minute, 3 ingredients, zero excuses.",
        "[Number] [topic] tips in under 60 seconds.", "My [number]-step routine for [result].",
        "I spent $[amount] on [thing]. Here's what was worth it.", "[Number] apps I can't live without as a [role].",
        "The 80/20 of [topic]: what actually matters."],
    "Transformation": [
        "From [before] to [after] in [time]. Here's how.", "This is what [time] of [habit] did to my [result].",
        "Day 1 vs. Day [number] of [challenge].", "Watch me turn [ordinary thing] into [impressive result].",
        "How I went from [low number] to [high number] [metric].", "I rebuilt my [thing] from scratch. Here's the before.",
        "Same [space/item], [budget] makeover.", "Let's fix this [mess] together.", "The glow-up nobody expected: [thing] edition.",
        "Here's what changed when I stopped [old habit].", "[Time] ago I [struggle]. Today I [win]."],
    "Story": [
        "The worst [job/experience] I ever had taught me this.", "I got [rejected/fired/ignored] — best thing that ever happened.",
        "A customer said something that changed how I [do thing].", "This is the story behind [product/brand].",
        "I made a huge mistake with [thing]. Here's what I learned.", "My [family member] said I'd never [goal].",
        "Storytime: the day I almost quit [thing].", "Nobody believed this [idea] would work.",
        "The text that changed my business.", "What I wish I knew at [age].", "One year ago today I [event]."],
    "Contrarian": [
        "Unpopular opinion: [common belief] is overrated.", "I don't [popular practice], and here's why.",
        "[Popular advice] is ruining your [result].", "Hot take: you don't need [expensive thing] to [goal].",
        "Everyone recommends [thing]. I'm not.", "Why I stopped [trend everyone's doing].",
        "The [industry] doesn't want you to know this is free.", "[Thing] isn't the problem. [Real cause] is.",
        "I'm going to get hate for this, but [opinion].", "Respectfully, [common advice] is wrong."],
    "Behind the scenes": [
        "Pack an order with me — it's a big one.", "What a [day/week] as a [role] really looks like.",
        "How I make [product] from start to finish.", "Come with me to [place] for [business reason].",
        "The part of running a small business nobody films.", "Real numbers: what I made from [product] this month.",
        "My entire setup for [task], explained.", "Testing new [product] before I sell it.",
        "Here's what $[amount] of [supplies] looks like.", "Things I do every morning before I open my shop."],
    "Direct & authority": [
        "As a [credential], here's what I'd do if I were starting [thing] today.", "Save this for the next time you [situation].",
        "If you only learn one thing about [topic], make it this.", "The fastest way to [result], explained simply.",
        "Here's exactly how to [task], step by step.", "I've done [thing] [number] times — here's the shortcut.",
        "Beginner [topic] guide in 30 seconds.", "Use this template to [result] tonight.",
        "Copy my exact [system/routine/script].", "Answering the question I get asked the most.",
        "You asked, so here's my full [process].", "Do this, not that: [topic] edition.",
        "This is your sign to finally [action].", "Comment '[word]' and I'll send you the [resource].",
        "Read this if you're about to [big decision].", "Here's the one [tool] I'd keep if I lost everything else.",
        "Let me save you [number] hours of research.", "This free [resource] is better than the paid one."],
}
assert sum(len(v) for v in HOOKS.values()) == 100, sum(len(v) for v in HOOKS.values())
story += [P("THE HOOK LIBRARY", "kick"), P("100 fill-in-the-blank hooks", "h1"),
          P("Swap every [bracket] for something specific to your niche. Specific beats clever: “3 desk plants that survive a dark office” beats “plant tips.”"),
          Spacer(1, 4)]
n = 1
for ci, (cat, hooks) in enumerate(HOOKS.items()):
    rows = [[P(f"<b>{cat.upper()}</b>", "cellb"), ""]]
    for h in hooks:
        rows.append([P(f"<font color='#C8664B'><b>{n:03d}</b></font>", "cell"), P(h, "hook")]); n += 1
    t = Table(rows, colWidths=[38, PW - 108 - 38])
    t.setStyle(TableStyle([("SPAN", (0, 0), (-1, 0)), ("BACKGROUND", (0, 0), (-1, 0), TAB_COLORS[ci % 6]),
                           ("BACKGROUND", (0, 1), (-1, -1), HexColor("#FFFFFF")),
                           ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    story += [t, Spacer(1, 12)]
story += [PageBreak()]

# ---- Script templates
story += [P("SCRIPTS", "kick"), P("5 script templates that keep people watching", "h1"),
          P("Each template runs 20–45 seconds. Write the hook last if you're stuck — it's easier once you know the payoff.")]
scripts = [
    ("The Problem → Fix", [("0–3s", "Hook naming the problem (try #016–#027)."), ("3–10s", "Show the problem happening — make it relatable."),
                           ("10–30s", "The fix, step by step. One step per cut."), ("30–40s", "Result + call to action: save, follow, or link in bio.")]),
    ("The Before / After", [("0–3s", "Flash the 'after' first, then cut to 'before' (try #042–#052)."), ("3–25s", "Speed through the process with 1–2s cuts."),
                            ("25–35s", "Slow reveal of the after. Let it breathe."), ("35–40s", "Tell them what you used / where to get it.")]),
    ("The Ranked List", [("0–3s", "Number hook (try #029–#041)."), ("3–30s", "Count down, worst to best. Keep #1 secret till the end."),
                         ("30–40s", "Reveal #1 and why it wins."), ("40–45s", "Ask: 'What's your #1?' to drive comments.")]),
    ("The Story Arc", [("0–3s", "Drop in mid-moment (try #053–#063)."), ("3–20s", "Set-up: what was at stake?"),
                       ("20–35s", "Turning point: what happened?"), ("35–45s", "Lesson for the viewer, in one sentence.")]),
    ("The Behind-the-Scenes", [("0–3s", "Invite them in (try #074–#083)."), ("3–30s", "Satisfying process shots with captions, no talking needed."),
                               ("30–40s", "One surprising detail or real number."), ("40–45s", "Soft CTA: 'Shop's in my bio if you want one.'")]),
]
for i, (name, beats) in enumerate(scripts):
    rows = [[P(f"<b>{i+1}. {name}</b>", "cellb"), "", P("<b>My version</b>", "cellb")]]
    for tme, beat in beats:
        rows.append([P(f"<b>{tme}</b>", "cell"), P(beat, "cell"), ""])
    t = Table(rows, colWidths=[44, 230, PW - 108 - 274])
    t.setStyle(TableStyle([("SPAN", (0, 0), (1, 0)), ("BACKGROUND", (0, 0), (-1, 0), TAB_COLORS[i]),
                           ("BACKGROUND", (0, 1), (-1, -1), HexColor("#FFFFFF")), ("GRID", (0, 0), (-1, -1), 0.5, LINE),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story += [KeepTogether([t]), Spacer(1, 12)]
story += [PageBreak()]

# ---- 30-day calendar
DAYS = [
    ("Teach", "Your #1 beginner tip", 92), ("Show", "Your workspace or setup tour", 82), ("Connect", "Why you started", 59),
    ("Teach", "A mistake beginners make", 3), ("Show", "Process video, no talking", 76), ("Teach", "3 tools you love", 33),
    ("Connect", "An unpopular opinion in your niche", 64), ("Teach", "Answer your most-asked question", 85), ("Show", "Before / after", 42),
    ("Connect", "A lesson from a failure", 57), ("Teach", "Myth vs. fact", 89), ("Show", "Day in the life", 75),
    ("Teach", "Step-by-step tutorial", 88), ("Connect", "Reply to a comment on video", 85), ("Show", "Unboxing or new arrival", 81),
    ("Teach", "Ranking video", 35), ("Connect", "What I wish I knew", 63), ("Show", "Real numbers / results", 79),
    ("Teach", "A free resource roundup", 96), ("Connect", "Customer or community shoutout", 55), ("Show", "Speed-run a task", 50),
    ("Teach", "Do this, not that", 89), ("Connect", "Hot take", 67), ("Show", "Packing orders / prep", 73),
    ("Teach", "Budget version of a pricey thing", 66), ("Connect", "Storytime", 59), ("Show", "Re-do your best video, better", 46),
    ("Teach", "Save-worthy checklist", 79), ("Connect", "30-day reflection", 52), ("Show", "Launch / offer video with clear CTA", 91),
]
story += [P("THE PLAN", "kick"), P("Your 30-day content calendar", "h1"),
          P("Post one video a day. The hook number points to the library — adapt it, don't copy it word-for-word.")]
for half in (0, 15):
    rows = [[P("<b>Day</b>", "cellb"), P("<b>Pillar</b>", "cellb"), P("<b>Prompt</b>", "cellb"), P("<b>Hook</b>", "cellb"),
             P("<b>My hook / idea</b>", "cellb"), P("<b>Done</b>", "cellb")]]
    for k in range(half, half + 15):
        pil, prompt, hk = DAYS[k]
        rows.append([P(f"<b>{k+1}</b>", "cell"), P(pil, "cell"), P(prompt, "cell"), P(f"#{hk:03d}", "cell"), "", P(BOX, "cell")])
    t = Table(rows, colWidths=[30, 58, 150, 40, PW - 108 - 318, 40], rowHeights=[22] + [33] * 15)
    st = TableStyle([("BACKGROUND", (0, 0), (-1, 0), SAND), ("BACKGROUND", (0, 1), (-1, -1), HexColor("#FFFFFF")),
                     ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")])
    t.setStyle(st)
    story += [t]
    if half == 0:
        story += [PageBreak(), P("Your 30-day content calendar (continued)", "h2")]
story += [PageBreak()]

# ---- Captions & CTAs
story += [P("CONVERT", "kick"), P("Captions & calls to action", "h1"),
          P("A great video with no call to action leaves money on the table. Pick one action per video."), Spacer(1, 4)]
ctas = [("Save", "“Save this for the next time you [situation].”"), ("Follow", "“Follow for part 2 — I'm testing [thing] next.”"),
        ("Comment", "“Comment [word] and I'll send you the [resource].”"), ("Share", "“Send this to the friend who always [habit].”"),
        ("Shop", "“It's the first link in my bio — [product] is back in stock.”"), ("Debate", "“Which one would you pick — A or B?”")]
rows = [[P("Goal", "cellw"), P("Formula", "cellw")]] + [[P(f"<b>{a}</b>", "cell"), P(b, "cell")] for a, b in ctas]
t = card_table(rows, [80, PW - 108 - 80]); story += [t, Spacer(1, 12)]
story += [P("Caption formula", "h2"),
          P("<b>Line 1:</b> restate the hook in different words (it shows in the preview).<br/>"
            "<b>Line 2–3:</b> one extra tip or detail that isn't in the video.<br/>"
            "<b>Line 4:</b> your call to action.<br/>"
            "<b>Hashtags:</b> 3–5 specific tags beat 30 generic ones."),
          P("Posting checklist", "h2")]
for item in ["Hook lands in the first 2 seconds — spoken AND on screen", "Captions/subtitles on (most people watch muted)",
             "Something moves or changes every 2–3 seconds", "One clear call to action", "Cover frame is readable as a thumbnail",
             "Replied to the first 10 comments within an hour"]:
    story += [P(f"{BOX}&nbsp;&nbsp;{item}")]
story += [PageBreak()]

# ---- Trackers
for wk in range(1, 5):
    story += [P("MEASURE", "kick"), P(f"Week {wk} tracker", "h1"),
              P("Fill this in 48 hours after posting. Watch-through rate tells you if the hook worked; saves and shares tell you if the content did.", "soft")]
    rows = [[P(f"<b>{h}</b>", "cellb") for h in ["Day", "Hook #", "Views", "Avg watch", "Likes", "Saves", "Shares", "Follows"]]]
    rows += [[P(str((wk - 1) * 7 + d + 1) if (wk - 1) * 7 + d < 30 else "", "cell")] + [""] * 7 for d in range(7)]
    t = Table(rows, colWidths=[40, 52] + [(PW - 108 - 92) / 6] * 6, rowHeights=[24] + [30] * 7)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), SAGE), ("BACKGROUND", (0, 1), (-1, -1), HexColor("#FFFFFF")),
                           ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story += [t, Spacer(1, 16), P("What worked best this week?", "h2")]
    def ruled(n=4):
        r = Table([[""]] * n, colWidths=[PW - 108], rowHeights=[24] * n)
        r.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE)])); return r
    story += [ruled(), P("What will I try next week?", "h2"), ruled()]
    story += [PageBreak()]

story += [P("Thank you", "h1"),
          P("You now have a month of content planned and a system to repeat it. Come back to the hook library whenever you're stuck — "
            "and when a hook works, write your version in the margin. That's your personal swipe file."),
          Spacer(1, 10),
          P("Personal use licence: use these hooks and templates in your own content. Please don't resell or redistribute this PDF. © Snapfront Studio.", "soft")]
doc.build(story)
print("hooks done")
