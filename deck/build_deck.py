"""Builds deck/Encore_Zara_Round1_v4.pptx.

Run from the repository root:  python3 deck/build_deck.py
Needs python-pptx. Colours and type follow the app (design/tokens.json).
Screenshots in deck/assets are captured from the web app.
"""
import math
import os
import re

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")

PAPER, SURFACE, TILE, INK, STONE, RULE = "F7F5F1", "FFFFFF", "ECE9E3", "111111", "66625B", "D5D1C8"
BRASS, BRASS_FILL, MOSS, MOSS_FILL, CLAY = "85640F", "EADAAC", "2D5428", "DDE7D5", "A3411E"
SERIF, SANS = "Georgia", "Arial"
W, H = 13.333, 7.5
MX = 0.45
CW = W - 2 * MX

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(W), Inches(H)
prs.core_properties.author = "Victor Hsu"
prs.core_properties.last_modified_by = "Victor Hsu"
prs.core_properties.title = "Encore · BIC × Zara Round 1"
prs.core_properties.comments = "Student design concept. Not affiliated with or endorsed by Zara or Inditex."


def rgb(h):
    return RGBColor.from_string(h)


def slide():
    s = prs.slides.add_slide(prs.slide_layouts[6])
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = rgb(PAPER)
    return s


def rect(s, x, y, w, h, fill=None, line=None, lw=0.75):
    sh = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    style = sh._element.find(qn("p:style"))
    if style is not None:
        sh._element.remove(style)
    if fill:
        sh.fill.solid()
        sh.fill.fore_color.rgb = rgb(fill)
    else:
        sh.fill.background()
    if line:
        sh.line.color.rgb = rgb(line)
        sh.line.width = Pt(lw)
    else:
        sh.line.fill.background()
    return sh


def hline(s, x, y, w, color=RULE, pt=0.6):
    return rect(s, x, y, w, pt / 72, fill=color)


def R(t, **o):
    """A run of text with its own formatting."""
    return (t, o)


def B(t, **o):
    return (t, dict(bold=True, **o))


def smart(t):
    t = re.sub(r"(?<=\w)'(?=\w)", "\u2019", t)
    t = re.sub(r"(?<=\w)'(?=[\s,.;:)]|$)", "\u2019", t)
    t = re.sub(r'"([^"]*)"', "\u201c\\1\u201d", t)
    return t


def text(s, x, y, w, h, paras, size=9, color=INK, font=SANS, bold=False, italic=False,
         align="l", anchor="t", ls=1.14, after=0, track=None, caps=False):
    box = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    if isinstance(paras, (str, tuple)):
        paras = [paras]
    for i, p in enumerate(paras):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.alignment = {"l": PP_ALIGN.LEFT, "c": PP_ALIGN.CENTER, "r": PP_ALIGN.RIGHT}[align]
        para.line_spacing = ls
        para.space_after = Pt(after)
        for r in (p if isinstance(p, list) else [p]):
            t, o = (r, {}) if isinstance(r, str) else r
            run = para.add_run()
            run.text = smart(t.upper() if o.get("caps", caps) else t)
            f = run.font
            f.size = Pt(o.get("size", size))
            f.bold = o.get("bold", bold)
            f.italic = o.get("italic", italic)
            f.name = o.get("font", font)
            f.color.rgb = rgb(o.get("color", color))
            tr = o.get("track", track)
            if tr:
                run._r.get_or_add_rPr().set("spc", str(int(tr * 100)))
    return box


def eyebrow(s, x, y, w, t, color=STONE, size=7):
    return text(s, x, y, w, 0.18, t, size=size, color=color, bold=True, track=1.1, caps=True)


def plain(cell):
    if isinstance(cell, str):
        return cell
    if isinstance(cell, tuple):
        return cell[0]
    return "".join(c if isinstance(c, str) else c[0] for c in cell)


def lines_for(cell, w, size):
    chars_per_line = max(1, (w * 72) / (size * 0.485))
    return max(1, math.ceil(len(plain(cell)) / chars_per_line))


def table(s, x, y, widths, rows, head=None, size=7.3, pad=0.05, vpad=0.052, hl=None, ls=1.14, min_h=0):
    """Hairline table made of text boxes, so every cell stays editable."""
    total = sum(widths)
    cy = y
    if head:
        hh = 0.23
        if hl is not None:
            rect(s, x + sum(widths[:hl]), cy, widths[hl], hh, fill=TILE)
        cx = x
        for t, w in zip(head, widths):
            text(s, cx + pad, cy, w - 2 * pad, hh, t, size=6.2, color=STONE, bold=True, track=0.6, caps=True, anchor="m")
            cx += w
        cy += hh
        hline(s, x, cy, total, INK, 0.75)
    else:
        hline(s, x, cy, total, INK, 0.75)
    for row in rows:
        n = max(lines_for(c, w - 2 * pad, size) for c, w in zip(row, widths))
        rh = max(min_h, n * size * ls * 1.02 / 72 + 2 * vpad)
        if hl is not None:
            rect(s, x + sum(widths[:hl]), cy, widths[hl], rh, fill=TILE)
        cx = x
        for c, w in zip(row, widths):
            text(s, cx + pad, cy + vpad, w - 2 * pad, rh - 2 * vpad, [c] if not isinstance(c, list) else [c], size=size, ls=ls)
            cx += w
        cy += rh
        hline(s, x, cy, total, RULE, 0.5)
    return cy


def stat(s, x, y, w, number, caption, color=INK, nsize=24, csize=7.3):
    text(s, x, y, w, nsize * 1.25 / 72, number, size=nsize, font=SERIF, color=color)
    text(s, x, y + nsize * 1.3 / 72, w, 0.6, caption, size=csize, color=STONE)


def phone(s, name, x, y, w):
    pic = s.shapes.add_picture(os.path.join(ASSETS, name + ".png"), Inches(x), Inches(y), Inches(w))
    pic.auto_shape_type = MSO_SHAPE.ROUNDED_RECTANGLE
    geom = pic._element.spPr.find(qn("a:prstGeom"))
    av = geom.find(qn("a:avLst"))
    if av is None:
        av = etree.SubElement(geom, qn("a:avLst"))
    gd = etree.SubElement(av, qn("a:gd"))
    gd.set("name", "adj")
    gd.set("fmla", "val 7500")
    pic.line.color.rgb = rgb(INK)
    pic.line.width = Pt(1)
    return w * 1688 / 780


def header(s, kicker, headline, lead):
    eyebrow(s, MX, 0.4, CW, kicker)
    text(s, MX, 0.6, CW, 0.5, headline, size=22.5, font=SERIF)
    text(s, MX, 1.13, CW - 0.6, 0.62, lead, size=8.8, color=STONE, ls=1.2)


def footer(s, sources, n):
    hline(s, MX, 7.02, CW, RULE)
    if sources:
        text(s, MX, 7.07, CW - 2.6, 0.34, [[B("Sources  ", color=STONE), R(sources)]], size=5.6, color=STONE, ls=1.1)
    text(s, W - MX - 2.5, 7.07, 2.5, 0.16, "Encore · student design concept · %d" % n, size=5.6, color=STONE, align="r")


def band(s, x, y, w, h, label, body, fill=TILE, size=7.8):
    rect(s, x, y, w, h, fill=fill)
    text(s, x + 0.16, y + 0.12, w - 0.32, h - 0.24, [[B(label + "  "), R(body)]], size=size, ls=1.22, anchor="m")


YES, NO = R("✓", color=MOSS, bold=True), R("×", color=CLAY, bold=True)

# ------------------------------------------------------------------ 1 · Title
s = slide()
eyebrow(s, MX, 0.55, 6, "BIC × Zara case competition · Round 1 · Fall 2026")
text(s, MX, 0.95, 6.6, 1.5, "Encore.", size=92, font=SERIF, ls=1.0)
text(s, MX, 2.55, 6.6, 0.5, "Bring it back. Swipe it. Unlock the drop.", size=22, font=SERIF, italic=True)
text(s, MX, 3.2, 5.9, 1.1,
     "Zara's second life, run as the main event. Encore Bins turn returned garments into Archive Keys; Style Swipe, "
     "closets and city leagues turn circular actions into status; Archive Drops turn keys into the pieces everyone else "
     "will find sold out. Built inside the Zara app, on rails Zara already owns.",
     size=11, color=STONE, ls=1.3)
hline(s, MX, 4.5, 6.0, INK, 0.75)
for i, (n, c, col) in enumerate([
    ("100,000", "Zara items listed on Vinted every day", INK),
    ("€0", "what Zara's bin pays for a garment today", INK),
    ("<10 min", "for Galliano Re{form} accessories to sell out", INK),
]):
    stat(s, MX + i * 2.05, 4.66, 1.85, n, c, color=col, nsize=26, csize=8)
hline(s, MX, 5.72, 6.0, RULE)
text(s, MX, 5.9, 6, 0.2, [[B("Team captain   "), R("Victor Hsu")]], size=10)
text(s, MX, 6.17, 6, 0.2, [[B("Team members   "), R("Juliet Dong, Sophie Hsu, Kaitlyn Lavichant")]], size=10)
text(s, MX, 6.78, 6.4, 0.3,
     "Student concept. Screens are from the team's working prototype with placeholder garment art; "
     "not affiliated with or endorsed by Zara or Inditex.", size=6.5, color=STONE)
phone(s, "Main", 7.25, 1.5, 1.78)
phone(s, "KeyLanding", 9.2, 0.95, 1.98)
phone(s, "DropLive", 11.35, 1.5, 1.78)
text(s, 7.25, 5.5, 1.78, 0.2, "Home", size=6.5, color=STONE, align="c", bold=True, track=1.0, caps=True)
text(s, 9.2, 5.38, 1.98, 0.2, "A key lands", size=6.5, color=STONE, align="c", bold=True, track=1.0, caps=True)
text(s, 11.35, 5.5, 1.78, 0.2, "Tuesday's drop", size=6.5, color=STONE, align="c", bold=True, track=1.0, caps=True)

# ------------------------------------------------------------------ 2 · Behavior
s = slide()
header(s, "01 · The behavior we want to change",
       "Secondhand Zara has no status, no date and no drop, so buying new always wins",
       "The moment we target is the closet clean-out: an 18 to 25-year-old decides a Zara piece is done. Today it is listed on "
       "Vinted with 61.8 million other Zara items, dropped in a bin that pays €0, or left in the closet. Supply is not the problem; "
       "status is. A new drop has a date, an edit, visible scarcity and status for owning it, and secondhand Zara has none of them. "
       "Encore gives a returned garment all four and makes bringing it back the only way into the drops Zara's customers already queue for.")
c1, c2, c3 = MX, MX + 4.72, MX + 8.72
w1, w2, w3 = 4.45, 3.72, 3.71
y1 = 1.93
eyebrow(s, c1, y1, w1, "The status gap: what a drop has and secondhand lacks")
table(s, c1, y1 + 0.24, [1.95, 0.78, 0.94, 0.78],
      [["A date and an edit", [YES], [NO], [YES]], ["A drop moment", [YES], [NO], [YES]],
       ["Scarcity you can see", [YES], [NO], [YES]], ["Status for owning it", [YES], [NO], [YES]],
       ["Trusted condition and fit", [YES], [NO], [YES]], ["A reason to bring it back", [NO], [NO], [YES]]],
      head=["What makes a piece wanted", "New drop", "Secondhand", "Encore"], hl=3, size=7.6, vpad=0.062)

eyebrow(s, c2, y1, w2, "Why people skip secondhand (YouGov, Oct 2026)")
hline(s, c2, y1 + 0.24, w2, INK, 0.75)
for i, (lab, v) in enumerate([("Hygiene", 48), ("Condition", 45), ("Fit", 38), ("Limited styles", 22)]):
    by = y1 + 0.42 + i * 0.42
    text(s, c2, by, 0.95, 0.2, lab, size=7.6, anchor="m")
    rect(s, c2 + 1.0, by + 0.02, 2.2 * v / 48, 0.16, fill=INK)
    text(s, c2 + 1.05 + 2.2 * v / 48, by, 0.5, 0.2, "%d%%" % v, size=7.6, bold=True, anchor="m")

eyebrow(s, c3, y1, w3, "The numbers behind the gap")
hline(s, c3, y1 + 0.24, w3, INK, 0.75)
for i, (n, c) in enumerate([
    ("61.8M", "Zara items on Vinted, against 590 monthly searches for \"secondhand Zara\""),
    ("17,015 t", "came back to Zara bins in 2022 with \"no economic benefit\""),
    ("32%", "of clothes bought are never worn; 57% feel pressure to keep up (Oxfam 2026)"),
    ("0", "loyalty programs at Zara; Bershka's club has 40M members"),
]):
    stat(s, c3 + (i % 2) * 1.9, y1 + 0.36 + (i // 2) * 0.98, 1.75, n, c, nsize=20, csize=7)

y2 = 4.3
eyebrow(s, c1, y2, w1, "Why now")
table(s, c1, y2 + 0.24, [1.05, 3.4],
      [[[B("19 Jul 2026")], "EU ban on destroying unsold apparel applies"],
       [[B("27 Sep 2026")], "Green-claims directive: facts only, no vague \"sustainable\""],
       [[B("17 Apr 2028")], "Textile EPR schemes due, fees must penalise fast fashion"]], size=7.6, vpad=0.075)

eyebrow(s, c2, y2, w2, "Who we design for")
hline(s, c2, y2 + 0.24, w2, INK, 0.75)
text(s, c2, y2 + 0.34, w2, 0.8,
     [[B("Maya, 24, Madrid (illustrative). "),
       R("14 Zara pieces, 5 unworn for a year, 0 reasons to bring one back. She queued online for the Galliano drop and missed it. "
         "She thrifts on Depop for one-of-a-kind finds and posts fits, but has never resold a Zara piece because nothing makes it worth the effort.")]],
     size=7.4, ls=1.2)
text(s, c2, y2 + 1.1, w2, 0.4,
     [[B("Team survey, Nov 2026, n = [ ]: ", color=CLAY),
       R("[Y]% would bring a piece back for drop access · [Z]% would pay more for a dated, numbered Zara piece than the same piece on Vinted.", color=CLAY)]],
     size=6.8, ls=1.18)

eyebrow(s, c3, y2, w3, "Zara is growing, not fixing")
hline(s, c3, y2 + 0.24, w3, INK, 0.75)
stat(s, c3, y2 + 0.34, 1.75, "€19.8bn", "H1 2026 sales, +9.2% at constant currency; Q3 opened +9%", nsize=20, csize=7)
stat(s, c3 + 1.9, y2 + 0.34, 1.75, "58.7%", "gross margin; Zara concepts about 70% of the group", nsize=20, csize=7)
text(s, c3, y2 + 1.22, w3, 0.3, "Zara app peaked at 11.1M active users in Europe: the channel already exists.", size=7, color=STONE)

band(s, MX, 5.98, CW, 0.88, "Key takeaway",
     "Demand for a worn garment cannot be bought with discounts; it is earned with status. H&M's take-back vouchers were called "
     "\"an invitation to buy more\" and 76% of tracked items were destroyed, exported or warehoused. Encore pays for returns in the one "
     "currency Zara's customers already compete for: access to the drop. The format works at Zara: Galliano Re{form} accessories sold out "
     "in under ten minutes on 1 October, about €100M of sales from 157 pieces (Jefferies).", size=8.4)
footer(s, "FashionUnited (2024, 2026) · Marie Claire (2022) · Zara help center (2026) · Inditex SNFI 2022, FY2025, H1 2026 · Sensor Tower (2026) · "
          "YouGov (Oct 2026) · Oxfam (2026) · European Commission and Parliament (2026) · Changing Markets (2023) · Sina Finance; Jefferies via Benzinga (Oct 2026)", 2)

# ------------------------------------------------------------------ 3 · What we learned
s = slide()
header(s, "02 · What we learned from existing solutions",
       "Depop made secondhand social; deposits, leagues and earned drops make it a habit",
       "Depop has 7 million active buyers and 3 million sellers, nearly 90% of buyers under 34, and eBay paid about $1.2bn for it in July 2026. "
       "It feels like a social feed, not a store: people follow closets, curate a vibe, sell their own pieces and ask each other about fit. "
       "75% of its Gen Z users buy secondhand to reduce consumption, 55% for one-of-a-kind pieces and 45% to keep up with trends. What it lacks "
       "is a brand behind the garment. Encore takes Depop's social layer and adds what only Zara can: the label, the store, the drop.")
lx, lw = MX, 5.55
eyebrow(s, lx, 1.93, lw, "Why Gen Z lives on Depop, and what Encore borrows")
depop = [
    ("01", "Social-first feed", "Likes, follows and curated closets feel like Instagram, not a catalogue grid.", "Looks feed and closet pages with followers; hearts earn points."),
    ("02", "Vibe over transaction", "People buy an aesthetic: Y2K, 90s, \"Indie Vanguard\". Identity, not utility.", "Pieces sold in era edits: \"Zara 2012 · Indie Vanguard · No. 0417\"."),
    ("03", "Micro-entrepreneurship", "Anyone can flip finds and become \"Depop famous\" with a following.", "Sell from your closet on Zara Pre-Owned (+40 pts); Encore Curators."),
    ("04", "Peer-to-peer trust", "Buyers chat with sellers about size and styling.", "\"Ask about fit\" and fit notes from owners in your size (+5 pts)."),
    ("05", "Buying with a conscience", "75% buy secondhand to reduce consumption (Depop x Bain).", "City goal: every return counts toward what Zara does for the city."),
]
cy = 2.17
hline(s, lx, cy, lw, INK, 0.75)
for n, t, d, e in depop:
    text(s, lx, cy + 0.1, 0.35, 0.2, n, size=7, color=STONE, bold=True)
    text(s, lx + 0.4, cy + 0.07, 2.45, 0.25, t, size=12, font=SERIF)
    text(s, lx + 0.4, cy + 0.33, 2.45, 0.34, d, size=7.2, color=STONE)
    text(s, lx + 3.0, cy + 0.1, 2.5, 0.55, [[B("Encore  ", color=BRASS, size=6.2, track=0.6, caps=True), R(e)]], size=7.6, ls=1.2)
    cy += 0.71
    hline(s, lx, cy, lw, RULE, 0.5)

rx, rw = MX + 5.9, CW - 5.9
eyebrow(s, rx, 1.93, rw, "Precedents: what gets goods back and people hooked")
table(s, rx, 2.17, [1.95, 0.85, rw - 2.8],
      [["Germany deposit return", [B("98%")], "of containers return for €0.25 via 135,000 return points: make the return point obvious"],
       ["Trove in-store trade-in", [B("31%")], "of credits redeemed same day; Clare V.: 35% of resale buyers new to brand"],
       ["Nike SNKRS Exclusive Access", [B("earned")], "access won by engagement, bots banned: access is worth more than money"],
       [[R("H&M vouchers (counter-example)", color=CLAY)], [B("76%", color=CLAY)], "of take-back items destroyed or exported: vouchers drive new buying"],
       ["Rewards meta-analysis, 128 studies", [B("-0.36 / +0.33")], "tangible rewards cut motivation; status and feedback raise it"],
       ["Duolingo leaderboards", [B("+17%")], "learning time; engaged users tripled: weekly leagues work"],
       ["Starbucks Rewards tiers", [B("~60%")], "of US company revenue from 36M members climbing tiers by frequency"],
       ["Spotify Wrapped 2025", [B("500M")], "shares in days: a season recap people post"],
       ["Beli pairwise ranking", [B("120M")], "rankings of 2M places: taste is a game people play daily"],
       ["Galliano Re{form} at Zara", [B("<10 min")], "to sell out; about €100M from 157 pieces: Zara drops already work"],
       ["Supreme on StockX, H1 2026", [B("11% → 41%")], "resale premium: a drop you had to earn trades above retail"],
       ["Limited quantity vs limited time", [B("quantity")], "beats time for symbolic brands: state units, never count down"],
       ["Standalone swipe apps", [B("0 of 3")], "survived (Mallzee, Grabble, The Yes): build inside the Zara app"]],
      head=["Precedent", "Number", "Lesson Encore keeps"], size=7.2, vpad=0.047)

eyebrow(s, MX, 6.0, CW, "Five design rules we took away")
hline(s, MX, 6.24, CW, INK, 0.75)
rules = ["Earned, never bought", "Status, never discounts", "Quantities, never timers", "Inside the Zara app", "Community first, then rank"]
for i, r in enumerate(rules):
    x = MX + i * CW / 5
    text(s, x, 6.36, 0.35, 0.2, "0%d" % (i + 1), size=7, color=STONE, bold=True)
    text(s, x + 0.36, 6.32, CW / 5 - 0.4, 0.4, r, size=11.5, font=SERIF)
footer(s, "Retail Gazette (Jul 2026) · Depop x Bain (May 2021) · Depop trend reports (2024-2026) · TOMRA (2026) · Trove (2024) · Complex; Hypebeast (2021, 2023) · "
          "Changing Markets (2023) · Deci, Koestner and Ryan (2001) · Lenny's Newsletter (2023) · Starbucks (2026) · TechCrunch (Dec 2025) · Boston Globe (Aug 2026) · "
          "Sina Finance; Benzinga (Oct 2026) · StockX via FashionUnited (Aug 2026) · Aggarwal, Jun and Huh (2011) · Retail Dive; DIGIT (2017, 2018)", 3)

# ------------------------------------------------------------------ 4 · Idea, part 1
s = slide()
header(s, "03 · Our idea, part 1: earn it in store, spend it on the drop",
       "Encore Bins turn every Zara label into a key money can't buy; keys open the drop",
       "Phase 1 bridges store and app: scan the care label, drop the garment in the Encore Bin by the returns counter, and an Archive Key lands once "
       "the bin's reader and scale confirm it. Phase 3 is the reward: every Tuesday at 10:00 keys open three quantity-limited lanes. Keys are never sold, "
       "never expire and never discount new product; the key opens the door, money buys the piece. It all rides soft-tag RFID in every store, the NaviLens "
       "code on care labels, the Tuesday delivery and Cáritas Moda re-, which already collects 50.9M kg a year.")
LW = 8.75
eyebrow(s, MX, 1.93, LW, "Phase 1 · Encore Bins: four steps, about a minute")
hline(s, MX, 2.17, LW, INK, 0.75)
steps = [
    ("01", "At the label", "Scan the care label in Store Mode. The reference code returns photo, name and composition, the lookup Pre-Owned already uses. Any Zara piece, any condition, no receipt.",
     "No new hardware: RFID in 90%+ of products; NaviLens on all labels by SS27."),
    ("02", "At the bin", "Drop it in the Encore Bin. It weighs the piece; a UHF reader confirms recent RFID labels in ~1 s; older pieces by scan plus weight.",
     "Zebra FX9600 reader, scale, chute: ~€3,000 a bin, ~€6.3M for 2,089 stores."),
    ("03", "In the app", "The key lands: 1 per garment, 2 if graded A. A lot number shows where it goes. Capped at 10 keys a month.",
     "Keys cost nothing: an access right, opt-in under GDPR."),
    ("04", "At the DC", "Follow the lot: Verified on Pre-Owned, vintage lane, re-cut, or fiber. Owners are told when it sells.",
     "Rides the twice-weekly return run; Cáritas keeps every reusable piece."),
]
sw = (LW - 3 * 0.2) / 4
for i, (n, t, d, z) in enumerate(steps):
    x = MX + i * (sw + 0.2)
    text(s, x, 2.3, 0.3, 0.2, n, size=7, color=STONE, bold=True)
    text(s, x + 0.32, 2.25, sw - 0.32, 0.3, t, size=13, font=SERIF)
    text(s, x, 2.6, sw, 0.8, d, size=7.5, ls=1.2)
    hline(s, x, 3.42, sw, RULE, 0.5)
    text(s, x, 3.48, sw, 0.4, [[B("Zara  ", color=STONE, size=6.2, track=0.6, caps=True), R(z, color=STONE)]], size=7.1, ls=1.18)

eyebrow(s, MX, 4.03, LW, "Phase 3 · Archive Drops: three lanes every Tuesday at 10:00")
hline(s, MX, 4.27, LW, INK, 0.75)
lanes = [
    ("Vintage by era", "1 key", "Graded, cleaned Zara by trend and year. Grade A at the original price, grade B at 70%; never marked down.",
     "Depop: \"Indie Vanguard\", \"Neo Nostalgia\"; Pinterest \"dream thrift finds\" +550%; 62% of Zalando pre-owned sells in 7 days."),
    ("Re-cut editions", "5 keys", "Hand re-cut in the Arteixo cluster from garments graded unwearable; numbered editions of 20 to 200 at Atelier prices.",
     "RE/DONE re-cut 200,000+ Levi's; TNF Remade $50-400; Zara collab pieces resell at 2-4x."),
    ("First access", "3 keys", "The most wanted new pieces, 24 h before the public, at the same price. Sells out anyway, so it costs Zara nothing.",
     "73% of Gen Z and Millennials prefer experience rewards like early access (LoyaltyLion)."),
]
lw3 = (LW - 2 * 0.25) / 3
for i, (t, k, d, p) in enumerate(lanes):
    x = MX + i * (lw3 + 0.25)
    text(s, x, 4.37, lw3 - 0.75, 0.3, t, size=13, font=SERIF)
    rect(s, x + lw3 - 0.62, 4.4, 0.62, 0.21, fill=BRASS_FILL)
    text(s, x + lw3 - 0.62, 4.4, 0.62, 0.21, k, size=6.4, color=BRASS, bold=True, track=0.6, caps=True, align="c", anchor="m")
    text(s, x, 4.73, lw3, 0.5, d, size=7.5, ls=1.2)
    hline(s, x, 5.3, lw3, RULE, 0.5)
    text(s, x, 5.36, lw3, 0.42, [[B("Proof  ", color=STONE, size=6.2, track=0.6, caps=True), R(p, color=STONE)]], size=7.1, ls=1.18)

band(s, MX, 5.98, LW, 0.88, "Rules of the key",
     "Earned only by bringing Zara garments back · no cash value, no expiry, no transfer · never a discount on new product · 10 a month cap and a condition "
     "spot check stop gaming · RFID only confirms, the label code identifies (Zara's RFID can't survive washing) · claims are facts: \"pre-worn, graded A, "
     "lot 0417\", never \"sustainable\".", size=8)
px = MX + LW + 0.35
pw = (W - MX - px - 0.2) / 2
ph = phone(s, "KeyLanding", px, 1.98, pw)
phone(s, "DropLive", px + pw + 0.2, 1.98, pw)
text(s, px, 1.98 + ph + 0.1, pw, 0.3, [[B("In store  ", size=6.2, track=0.6, caps=True), R("Scan, drop, the key lands.")]], size=7, color=STONE)
text(s, px + pw + 0.2, 1.98 + ph + 0.1, pw, 0.3, [[B("Tuesday  ", size=6.2, track=0.6, caps=True), R("Three lanes, quantities stated.")]], size=7, color=STONE)
footer(s, "Inditex FY2025, H1 2026 · RFID News (Nov 2026) · Avery Dennison (2025, 2026) · Reason Why (Jul 2026) · Zara help center (2026) · Revista Cáritas (Mar 2026) · "
          "Zebra via BarcodePlanet (2026) · Depop (2024-2026) · Pinterest (2025) · Zalando (2026) · RE/DONE (2024) · Hypebeast (2020) · Glossy (Mar 2026) · "
          "LoyaltyLion (2025) · EUR-Lex Directive 2024/825", 4)

# ------------------------------------------------------------------ 5 · Idea, part 2
s = slide()
header(s, "04 · Our idea, part 2: the community that keeps people coming back",
       "Closets, leagues and a city goal make bringing it back as social as Depop",
       "Phase 2 keeps people in the Zara app between drops. A daily deck of 20 garments teaches the drop each user's taste. Every user has a closet page "
       "others follow. Looks, fit notes, returns, repairs and Pre-Owned sales earn a Circular Score that ranks people in a weekly league of 50 in their city, "
       "and every return also counts toward one city goal that unlocks something Zara does for everyone. Nothing is earned by spending, nothing expires and nothing counts down.")
pw = 1.6
ph = phone(s, "Closet", MX, 1.98, pw)
phone(s, "League", MX + pw + 0.16, 1.98, pw)
text(s, MX, 1.98 + ph + 0.1, pw, 0.3, [[B("Closets  ", size=6.2, track=0.6, caps=True), R("Follow, ask about fit.")]], size=7, color=STONE)
text(s, MX + pw + 0.16, 1.98 + ph + 0.1, pw, 0.3, [[B("League  ", size=6.2, track=0.6, caps=True), R("50 people, weekly.")]], size=7, color=STONE)
mx, mw = MX + 3.72, 4.05
eyebrow(s, mx, 1.93, mw, "The Depop layer: closets and curators")
hline(s, mx, 2.17, mw, INK, 0.75)
text(s, mx, 2.27, mw, 1.25, [
    "Every user has a closet: followers, aesthetic tags, pieces they brought back and where those are now, pieces for sale on Zara Pre-Owned, looks and fit notes.",
    "Follow, heart, \"ask about fit\", shop someone's edit. Encore Curators are the \"Depop famous\": status from taste and returns, never spending.",
    "Daily deck of 20: hype or pass; hyped pieces get first word on Tuesday and tell Arteixo what to make (early signals cut forecast error 30% → 9%, HBS).",
], size=7.4, ls=1.2, after=4)
eyebrow(s, mx, 3.68, mw, "City goal: everyone's returns add up")
cy = table(s, mx, 3.92, [0.55, mw - 0.55],
           [[[B("25k")], "Free repair weekend in every Zara in the city"], [[B("50k")], "5,000 paid training hours at Cáritas Moda re-"],
            [[B("75k")], "City votes a re-cut edition; proceeds to Cáritas"], [[B("100k")], "10,000 trees with the city's parks + Encore night"]],
           size=7.4, vpad=0.046)
text(s, mx, cy + 0.06, mw, 0.3, "Cities race on share of goal (Madrid 61%, Barcelona 54%, London 48%, illustrative). Stated as actions with numbers, never as offsets.", size=6.6, color=STONE)
eyebrow(s, mx, 5.42, mw, "What keeps it out of Shein territory", color=CLAY)
hline(s, mx, 5.66, mw, INK, 0.75)
text(s, mx, 5.74, mw, 1.2, [
    "No spend points, no expiry, no streaks: the leaked Digital Fairness Act draft (9 Nov 2026) lets users switch off streak rewards, fines up to 6% of turnover.",
    "No countdowns, no \"only 3 left\", no nagging: the practices in BEUC's 2025 Shein complaint; the Commission opened an addictive-design case on 17 Feb 2026 and fined Temu €200M under the DSA.",
    "Consent first: photos opt in, city declared not tracked, 16+, human plus AI moderation, one tap turns leagues off and keeps every key.",
], size=6.9, ls=1.16, after=3)

rx = mx + mw + 0.35
rw = W - MX - rx
eyebrow(s, rx, 1.93, rw, "City leagues: five tiers, weekly, Sunday reset")
cy = table(s, rx, 2.17, [0.65, 1.7, rw - 2.35],
           [[[B("Thread")], "Join; one circular action", "Daily deck and the city feed"],
            [[B("Stitch")], "A week in the top 20 of 50", "Fit notes from owners in your size"],
            [[B("Seam")], "Top 10 of Stitch, two weeks running", "Skip-the-line pass: drops 10 min early"],
            [[B("Cut")], "Top 10 of Seam + 2 garments back this season", "+1 bonus key a month; Style Battle entry"],
            [[B("Archive")], "Top 5% of the city at season end", "+2 keys a season, Insider badge, Encore night, first look at re-cuts"]],
           head=["Tier", "How you get there", "What it unlocks"], size=7.2, vpad=0.05)
eyebrow(s, rx, cy + 0.2, rw, "Circular Score: points only for circular actions")
cy2 = table(s, rx, cy + 0.44, [1.38, 1.05, 0.66, rw - 3.09],
      [["Bring a garment back", [B("+50, 1 key (2 if A)")], "10 keys/mo", "only way to earn keys"],
       ["Post a look in secondhand", [B("+15, +5 / 10 hearts")], "50 a post", "photos: top trust signal (52%)"],
       ["Fit note on a piece you own", [B("+5")], "25 a week", "fit: 3rd barrier (38%)"],
       ["Repair / Pre-Owned sale", [B("+30 / +40")], "none", "displace new buys most (WRAP)"],
       ["Finish the daily deck", [B("+5")], "35 a week", "taste data; no streaks"],
       [[B("Buy anything", color=CLAY)], [B("0", color=CLAY)], "none", "status is never bought"]],
      head=["Action", "Points", "Cap", "Why"], size=7.2, vpad=0.05)
for i, (n, c) in enumerate([("+17%", "Duolingo learning time with leagues"), ("60%", "of Starbucks US revenue from tiered members"), ("500M", "Spotify Wrapped shares: Encore Wrapped each season")]):
    stat(s, rx + i * rw / 3, cy2 + 0.2, rw / 3 - 0.15, n, c, nsize=16, csize=6.6)
footer(s, "Retail Gazette (Jul 2026) · Depop x Bain (2021) · HBS Working Knowledge · Lenny's Newsletter, Mazal (2023) · Starbucks Q4 FY26 · TechCrunch (Dec 2025) · "
          "Bazaarvoice (Mar 2025) · YouGov (Oct 2026) · WRAP (Feb 2025) · Drèze and Nunes (2009) · Sailer and Homner (2020) · Euronews (Feb, Nov 2026) · BEUC (Jun 2025) · "
          "TechPolicy Press (May 2026) · Revista Cáritas (Mar 2026)", 5)

# ------------------------------------------------------------------ 6 · Test
s = slide()
header(s, "05 · How we would test it",
       "A 20-store, 16-week pilot scored on eight metrics, with the decision rule written first",
       "10 test and 10 control stores in Madrid and London, both Pre-Owned markets. Encore Bins at the returns counter; Style Swipe, closets, the City League "
       "and the city goal behind a feature flag in the existing app; one Archive Drop every Tuesday from week 5. Cáritas Moda re- grades and cleans as consignee, "
       "so Zara owns no used stock; one partner atelier makes a 200-piece re-cut edition. Every metric comes from systems Zara already runs, so the numbers, "
       "not the debate, decide the rollout.")
hline(s, MX, 2.05, CW, INK, 0.75)
tl = [("Weeks 1-2", "Bins installed, flag on"), ("Weeks 3-4", "Keys, closets, leagues live"), ("Week 5", "First Tuesday drop"), ("Week 9", "Mid-point read"), ("Week 16", "Decision rule applied")]
for i, (wk, t) in enumerate(tl):
    x = MX + i * CW / 5
    rect(s, x, 2.0, 0.1, 0.1, fill=INK)
    text(s, x, 2.17, CW / 5 - 0.2, 0.2, [[B(wk + "   "), R(t, color=STONE)]], size=8.2)

lx, lw = MX, 4.75
eyebrow(s, lx, 2.62, lw, "Pilot design and cost (assumptions until the pilot reports)")
cy = table(s, lx, 2.86, [1.5, 2.45, 0.8],
           [["Encore Bins, 10 stores", "Reader, antenna, scale, chute, fit-out ~€3,000 each", [B("€30,000")]],
            ["App features behind a flag", "Swipe, closets, Circular Score, leagues, city goal, keys ledger, drop page", [B("€300,000")]],
            ["Grading and cleaning", "6,000 pieces, Cáritas as consignee at €3-6 a piece", [B("€27,000")]],
            ["Re-cut edition", "200 pieces, partner atelier ~€40 each, Atelier prices", [B("€8,000")]],
            ["Drops, signage, training", "Existing Tuesday deliveries; 30-min counter module", [B("€35,000")]],
            [[B("Total pilot")], [B("16 weeks, 20 stores")], [B("~€400,000", color=BRASS)]]],
           head=["Line", "Basis", "Cost"], size=7.1, vpad=0.045)
text(s, lx, cy + 0.1, lw, 0.75,
     [[B("Full scale  "), R("Bins in all 2,089 Zara stores ~€6.3M once; app layer ~€2-3M to build, €1M a year to run (team estimates). Keys cost nothing. "
                           "At a 58.7% gross margin it pays for itself if 2M key holders lift spend 2%, against McKinsey's +10% for active loyalty members and +25% for redeemers.", color=STONE)]],
     size=7, ls=1.2)

rx = lx + lw + 0.35
rw = W - MX - rx
eyebrow(s, rx, 2.62, rw, "Eight metrics, each with a published benchmark and a pilot bar")
table(s, rx, 2.86, [1.45, 2.05, rw - 4.55, 1.05],
      [["Drop-off to key use", "Keys used for a drop within 30 days", "Over half of Clare V. trade-in credit spent same day (Trove)", [B("40% in 30 days")]],
       ["Incremental spend", "Key holders vs matched control, 90 days", "Members +10%, redeemers +25% (McKinsey)", [B("+10% vs control")]],
       ["Community stickiness", "DAU/MAU of league and closet cohort; D30", "20% good, 25% excellent (Phiture); Duolingo ~40%", [B("20%; D30 10%")]],
       ["Bin throughput and grade", "Garments per bin per week; share A or B", "Patagonia 80% resellable; H&M 60% to reuse", [B("150/wk; 60%")]],
       ["Drop sell-through", "Units sold in 14 days, no markdown", "62% of Zalando pre-owned in 7 days", [B("70%")]],
       ["New-to-brand share", "Drop buyers with no Zara buy in 12 months", "35% of Clare V. resale buyers new (Trove)", [B("20%")]],
       ["Virgin material displaced", "Resold x weight x 64.6%, plus fiber reused", "Resale displaces 64.6%, repair 82.2% (WRAP)", [B("per lot, not 1:1")]],
       ["Time to earn", "Median days, first scan to first drop", "49.1% say rewards take too long (Antavo)", [B("under 14 days")]]],
      head=["Metric", "Definition", "Benchmark (source)", "Pilot bar"], hl=3, size=7.1, vpad=0.05)

band(s, MX, 5.72, 6.5, 1.14, "Decision rule, written before the pilot",
     "Scale to Spain, the UK and France if after 16 weeks: (1) bins take 150+ garments a week, 60%+ resellable; (2) 40%+ of keys used within 30 days; "
     "(3) drops sell 70%+ at full price in 14 days; (4) key holders spend 10%+ more than control, with new-purchase frequency not rising faster than circular actions. "
     "Two of four earns a second season; fewer folds bins into the Cáritas flow.", size=7.6)
rect(s, MX + 6.7, 5.72, CW - 6.7, 1.14, line=RULE)
text(s, MX + 6.86, 5.84, CW - 7.02, 0.9,
     [[B("Risks and the answer  ", color=CLAY), R("Unwashable RFID: the label code identifies. \"Little archive\": the archive is customers' closets, 61.8M pieces on Vinted. "
                                                  "Shein backlash: no spend rewards, expiry or timers. Cannibalization: nothing discounted; first access is to pieces that sell out anyway. "
                                                  "Charity displacement: Cáritas keeps every reusable garment. Claims law: facts and lot numbers.")]],
     size=7.6, ls=1.22, anchor="m")
footer(s, "McKinsey (2021) · Trove (2024) · ThredUp (2025, 2026) · Antavo (2026) · Duolingo (Feb 2026) · Phiture (2026) · Patagonia via Trellis (Oct 2026) · H&M Group (2026) · "
          "Zalando (2026) · WRAP (Feb 2025) · Zebra via BarcodePlanet (2026) · Inditex FY2025 and H1 2026 · team cost model, all inputs labeled as assumptions", 6)

# ------------------------------------------------------------------ 7 · Works cited
s = slide()
eyebrow(s, MX, 0.4, CW, "Sources")
text(s, MX, 0.6, CW, 0.5, "Works cited", size=22.5, font=SERIF)
text(s, MX, 1.13, CW - 0.6, 0.5,
     "Every number on slides 1 to 6 traces to a source below. Figures marked as estimates are team assumptions and will be replaced by pilot data; "
     "phone screens are from the team's working prototype with placeholder garment art. Only public sources, the team's own survey and the team's own "
     "observations as customers were used; nothing from a company employee, recycler, atelier or contact appears in this deck.", size=8.8, color=STONE, ls=1.2)
hline(s, MX, 1.78, CW, INK, 0.75)
entries = []
with open(os.path.join(HERE, "..", "docs", "SOURCES.md"), encoding="utf-8") as f:
    for line in f:
        if line.startswith("- "):
            m = re.match(r"- (.+?\)\.)\s*(.*)", line.strip())
            entries.append((m.group(1), m.group(2)) if m else (line[2:].strip(), ""))
total = sum(len(a) + len(b) + 40 for a, b in entries)
cols, acc, cur = [[]], 0, 0
for a, b in entries:
    if acc > total / 3 * (cur + 1) and cur < 2:
        cols.append([])
        cur += 1
    cols[cur].append((a, b))
    acc += len(a) + len(b) + 40
colw = (CW - 2 * 0.3) / 3
for i, col in enumerate(cols):
    text(s, MX + i * (colw + 0.3), 1.9, colw, 5.0,
         [[B(a + " "), R(b, color=STONE if "Team survey" not in a else CLAY)] for a, b in col], size=6.4, ls=1.16, after=2.6)
footer(s, "", 7)

out = os.path.join(HERE, "Encore_Zara_Round1_v4.pptx")
prs.save(out)
print("saved", out)
