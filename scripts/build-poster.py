"""Build the A1 poster from the original images and checked project evidence.

Run with Python containing reportlab, Pillow and pypdf; pdftoppm exports the PNGs.
"""
import csv
import json
import shutil
import subprocess
from collections import Counter
from pathlib import Path

from PIL import Image, ImageChops
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/poster"
OUT.mkdir(parents=True, exist_ok=True)
METRICS = json.loads((ROOT / "ml/results/metrics.json").read_text())
with (ROOT / "docs/survey_responses.csv").open(newline="") as f:
    SURVEY = list(csv.reader(f))[1:]

# One runnable evidence check: fail before exporting if the poster needs updating.
assert len(SURVEY) == 10
assert sum(r[4] in ("Very difficult", "Extremely difficult") for r in SURVEY) == 8
outputs = Counter(r[7] for r in SURVEY)
assert outputs["Both text and speech"] == 5
assert outputs["Both text and speech"] + outputs["Text-to-speech audio"] == 7
assert outputs["Both text and speech"] + outputs["Text on screen"] == 7
assert Counter(r[8] for r in SURVEY).most_common(1)[0] == ("Ability to correct wrong predictions", 3)
uncertain = Counter(r[9] for r in SURVEY)
assert uncertain["Ask the user to repeat the sign"] == 4
assert uncertain["Allow the user to type the intended message"] == 3
assert sum(int(r[6]) for r in SURVEY) / len(SURVEY) == 3.0
assert METRICS["dataset"]["images_total"] == 42745
assert METRICS["dataset"]["test_size"] == 8377
assert METRICS["dataset"]["features"] == 85
assert METRICS["top_confusions_true_pred"][0] == [172, "9", "S"]
assert round((ROOT / "public/model/isl_mlp.json").stat().st_size / 1_000_000, 2) == 0.46
for name, value in [("kNN (k=5)", 97.79), ("Random Forest", 97.88),
                    ("SVM (RBF)", 97.88), ("MLP (128-64)", 97.86),
                    ("MLP (128-64), random split (leaky, reference only)", 99.95)]:
    assert METRICS["models"][name]["accuracy"] == value

FONT_DIR = Path("/System/Library/Fonts/Supplemental")
for name, filename in [("Arial", "Arial.ttf"), ("Arial-Bold", "Arial Bold.ttf"),
                       ("Arial-Italic", "Arial Italic.ttf")]:
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / filename)))
pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial-Italic")

BLUE = "#1d4ed8"
INK = "#111827"
MUTED = "#4b5563"
LINE = "#d9e1ed"
PALE = "#eff6ff"
GREEN = "#15803d"
AMBER = "#a16207"
W, H = 594 * mm, 841 * mm
PDF = OUT / "SignBridge_A1_Poster.pdf"
c = canvas.Canvas(str(PDF), pagesize=(W, H), pageCompression=1)
c.setTitle("SignBridge - Real-Time Indian Sign Language Recognition in the Browser")
c.setAuthor("Bittu Mandal; Chinmay Ghule; Dev Krishan; Himanshu Raj - IIIT Pune")
c.setSubject("HCI + ML research poster; A1 portrait; original project figures")


def box(x, y, w, h, fill=None, stroke=None, radius=0):
    c.setFillColor(colors.HexColor(fill or "#ffffff"))
    c.setStrokeColor(colors.HexColor(stroke or fill or "#ffffff"))
    c.setLineWidth(0.7)
    c.roundRect(x * mm, H - (y + h) * mm, w * mm, h * mm,
                radius * mm, fill=bool(fill), stroke=bool(stroke))


def text(value, x, y, w, size=21, color=INK, bold=False, leading=None, max_h=None, center=False):
    style = ParagraphStyle("poster", fontName="Arial-Bold" if bold else "Arial",
                           fontSize=size, leading=leading or size * 1.18,
                           textColor=colors.HexColor(color),
                           alignment=TA_CENTER if center else 0)
    p = Paragraph(value, style)
    _, height = p.wrap(w * mm, H)
    assert x >= 0 and x + w <= 594.1 and y + height / mm <= 841, value
    if max_h is not None:
        assert height <= max_h * mm, f"Text overflow ({height / mm:.1f} > {max_h} mm): {value}"
    p.drawOn(c, x * mm, H - y * mm - height)
    return height / mm


def section(n, title, x, y):
    box(x, y, 275, 12, BLUE, radius=1.3)
    text(f"{n:02}", x + 1, y + 2.1, 11, 19, "#ffffff", True, center=True)
    text(title, x + 16, y + 1.5, 255, 23, "#ffffff", True, max_h=10)


def bullets(items, x, y, w=275, size=21, gap=3):
    for item in items:
        text("•", x, y, 5, size, BLUE)
        y += text(item, x + 7, y, w - 7, size, max_h=29) + gap
    return y


ASSETS = ["docs/screenshots/S3_live_recognising.png", "docs/screenshots/S4_result.png",
          "docs/screenshots/S8_supported_signs.png", "ml/results/confusion_matrix.png",
          "docs/wireframes/W2.png", "docs/wireframes/flow.png", "docs/poster/iiitp_logo.png"]


def image(path, x, y, w, h=None):
    path = ROOT / path
    iw, ih = Image.open(path).size
    height = w * ih / iw
    if h is not None and height > h:
        w, height = h * iw / ih, h
    assert y + height <= 841
    c.drawImage(str(path), x * mm, H - (y + height) * mm,
                width=w * mm, height=height * mm, mask="auto")
    return height


def arrow(x, y, length=4):
    c.setStrokeColor(colors.HexColor(BLUE))
    c.setLineWidth(1.2)
    c.line(x * mm, H - y * mm, (x + length) * mm, H - y * mm)
    c.line((x + length - 1.6) * mm, H - (y - 1.2) * mm, (x + length) * mm, H - y * mm)
    c.line((x + length - 1.6) * mm, H - (y + 1.2) * mm, (x + length) * mm, H - y * mm)


L, R, CW = 16, 303, 275

# Place the full-resolution original in a tight PDF viewport; no logo pixels are edited.
with Image.open(ROOT / ASSETS[6]) as logo:
    bounds = ImageChops.difference(logo.convert("RGB"), Image.new("RGB", logo.size, "white"))
    bounds = bounds.convert("L").point(lambda value: 255 if value > 25 else 0).getbbox()
    assert bounds is not None, "College logo is blank"
    x0, y0, x1, y1 = bounds
    x0, y0, x1, y1 = max(0, x0 - 16), max(0, y0 - 16), min(logo.width, x1 + 16), min(logo.height, y1 + 16)
    scale = 64 / max(x1 - x0, y1 - y0)
    c.saveState()
    viewport = c.beginPath()
    viewport.rect(16 * mm, H - 78 * mm, 64 * mm, 64 * mm)
    c.clipPath(viewport, stroke=0)
    image(ASSETS[6], 16 - x0 * scale, 14 - y0 * scale, logo.width * scale)
    c.restoreState()

text("IIIT PUNE  /  HUMAN–COMPUTER INTERACTION + MACHINE LEARNING", 90, 12, 488, 15, BLUE, True)
text("SignBridge", 88, 23, 490, 77, BLUE, True, max_h=34)
text("Real-Time Indian Sign Language Recognition in the Browser", 90, 57, 488,
     30.5, INK, True, max_h=14)
text("A user-centred HCI study and on-device ML prototype", 90, 72, 488, 21, MUTED)
text("Bittu Mandal (112415048) · Chinmay Ghule (112415054) · "
     "Dev Krishan (112415057) · Himanshu Raj (112415082) — IIIT Pune",
     16, 88, 562, 18.1, INK, max_h=9)
box(16, 99, 562, 0.8, BLUE)

# Read left-to-right across each numbered row.
section(1, "PROBLEM", L, 105)
bullets(["Few hearing people know ISL. Names, numbers and spellings are hard to share without an interpreter.",
         "Accuracy alone misses how results are shown and how users recover when the system is wrong."],
        L, 121, size=22, gap=2)
section(2, "USER GROUPS", R, 105)
text("<b>PRIMARY</b>", R, 121, 70, 15.5, BLUE)
text("ISL users · Hearing communication partners:<br/>family, staff and classmates", R, 129, CW, 22, max_h=22)
text("<b>SECONDARY</b>  ISL learners · Technical evaluators", R, 151, CW, 20, max_h=10)

section(3, "RESEARCH METHOD", L, 167)
text("10-question survey · 10 respondents · 6 literature sources", L, 183, CW, 20.2)
steps = ["User<br/>survey", "Findings", "3<br/>personas", "Literature<br/>review", "Research<br/>gaps", "Wire-<br/>frames", "Working<br/>prototype", "Testing"]
for i, label in enumerate(steps):
    x = L + i * 34.9
    box(x, 197, 30, 22, PALE, LINE, 1.5)
    text(label, x + 1, 202, 28, 16.2, BLUE, True, leading=19, center=True, max_h=15)
    if i < 7:
        arrow(x + 30.4, 208, 4.1)
text("Survey → design requirements → tested prototype", L, 224, CW, 19.5, MUTED)

section(4, "PERSONAS", R, 167)
text("Survey-derived composites; names and ages are illustrative.", R, 183, CW, 17, MUTED)
people = [("Meera, 24", "Deaf ISL signer", "Names and numbers without an interpreter; apps need reliability."),
          ("Rohit, 21", "Hearing classmate; no ISL", "Real-time text + speech, with a way to fix wrong results."),
          ("Sana, 20", "ISL learner", "Speech, privacy, and typing when a sign is not recognised.")]
for i, (name, role, need) in enumerate(people):
    x = R + i * 93.3
    box(x, 195, 88.4, 40, "#f8fafc", LINE, 1.5)
    text(name, x + 4, 198, 80.4, 22, BLUE, True)
    text(role, x + 4, 208, 80.4, 14.4, MUTED, max_h=7)
    text(need, x + 4, 217, 80.4, 16, max_h=20)

section(5, "KEY FINDINGS", L, 242)
text("SURVEY · n = 10", L + 188, 245, 83, 14, "#ffffff", center=True)
bullets(["<b>8/10</b> rate communication very or extremely difficult.",
         "<b>7/10 want speech; 7/10 want text</b> (5 want both).",
         "<b>Correction</b> is the most-wanted feature (3/10).",
         "When unsure: <b>4 ask to repeat; 3 want to type.</b><br/>Show uncertainty and offer a recovery path.",
         "Mean usefulness: <b>3.0/5.</b> Reliability must be earned."],
        L, 258, size=21.2, gap=2)
section(6, "LITERATURE INSIGHTS", R, 242)
bullets(["<b>Design beyond accuracy.</b> Involve Deaf users.<br/><font color='#4b5563'>Bragg et al., ASSETS 2019</font>",
         "<b>Word signs need temporal modelling.</b> INCLUDE uses video.<br/><font color='#4b5563'>Sridhar et al., ACM MM 2020</font>",
         "<b>Static letters suit hand keypoints.</b> On-device tracking enables a lightweight pipeline.<br/><font color='#4b5563'>Zhang et al. 2020; Velmathi &amp; Goyal 2023</font>"],
        R, 258, size=20.7, gap=2)

section(7, "RESEARCH GAPS", L, 327)
bullets(["Results need confidence and a clear correction path.",
         "Server recognition adds privacy and internet barriers.",
         "Word-level video models exceed this prototype’s scope.",
         "Controlled datasets and frame leakage inflate accuracy."],
        L, 343, size=22, gap=2.5)
section(8, "SYSTEM", R, 327)
pipeline = [("Camera", "User-controlled"), ("MediaPipe", "2 hands × 21 points"),
            ("Features", "85 normalised"), ("MLP", "85-128-64-35"),
            ("Smoothing", "12 frames; ≥60%"), ("Output", "Result + speech")]
for i, (name, detail) in enumerate(pipeline):
    x = R + i * 46.65
    box(x, 343, 41.5, 26, PALE, LINE, 1.5)
    text(name, x + 1, 347, 39.5, 17, BLUE, True, center=True, max_h=8)
    text(detail, x + 1, 358, 39.5, 13.2, MUTED, center=True, max_h=12)
    if i < 5:
        arrow(x + 42, 356, 4)
text("Locks when 9 of 12 frames agree and confidence ≥60%.", R, 374, CW, 19.6, MUTED)
box(R, 386, CW, 12, PALE, radius=1.5)
text("Runs 100% in the browser — no video leaves the device", R + 3, 389, CW - 6, 18.8, BLUE, True, center=True)

section(9, "ML RESULTS", L, 406)
box(L, 423, 133, 25, PALE, radius=2)
box(L + 141, 423, 134, 25, PALE, radius=2)
text("97.86%", L + 5, 425, 123, 37, BLUE, True)
text("MLP · BLOCKED TEST ACCURACY", L + 5, 441, 123, 12.5, BLUE, True)
text("35 classes", L + 146, 426, 124, 33, BLUE, True)
text("STATIC FINGERSPELLING · A–Z, 1–9", L + 146, 441, 124, 12.5, BLUE, True)
text("42,745 source images · Blocked test: 8,377 images", L, 454, CW, 22, max_h=12)

table_x, table_y, table_w = L, 471, 98
box(table_x, table_y, table_w, 10, BLUE, radius=1)
text("Model", table_x + 3, table_y + 2, 55, 17.8, "#ffffff", True)
text("Accuracy", table_x + 63, table_y + 2, 33, 17.8, "#ffffff", True)
for i, (name, result) in enumerate([("kNN", "97.79%"), ("Random Forest", "97.88%"),
                                    ("SVM", "97.88%"), ("MLP (chosen)", "97.86%")]):
    y = table_y + 10 + i * 10
    box(table_x, y, table_w, 10, PALE if i == 3 else "#f8fafc")
    text(name, table_x + 3, y + 2, 61, 17.5, BLUE if i == 3 else INK, i == 3)
    text(result, table_x + 65, y + 2, 31, 17.5, BLUE if i == 3 else INK, i == 3)
text("<b>Chosen for deployment</b><br/>0.46 MB model; inference in plain TypeScript.", L, 528, 98, 21, max_h=38)
box(L, 569, 98, 55, "#fffbeb", radius=2)
text("<b>Split matters</b><br/>Random split: <b>99.95%</b>.<br/>Near-duplicate frames inflate the result.",
     L + 4, 574, 90, 20.4, AMBER, max_h=47)
image(ASSETS[3], L + 103, 471, 172)
text("<b>Main error: 9 → S</b><br/>172 held-out frames confused.", L + 103, 632, 172, 20, max_h=23)
text("Last 20% of frames per class held out. Generalisation to new<br/>signers and backgrounds still needs live evaluation.",
     L, 657, CW, 18, MUTED, max_h=17)

section(10, "PROTOTYPE", R, 406)
text("Original interface captures and low-fidelity design", R, 422, CW, 19.8, MUTED)
figures = [(ASSETS[0], "Live recognition with hand skeleton<br/>and live confidence", R, 435),
           (ASSETS[1], "Result with reference photo,<br/>confirm / incorrect / undo", R + 141, 435),
           (ASSETS[2], "Supported signs with<br/>reference photos", R, 541),
           (ASSETS[4], "Low-fidelity wireframe (W2)", R + 141, 541)]
for path, caption, x, y in figures:
    h = image(path, x, y, 134)
    box(x, y, 134, h, stroke=LINE)
    text(caption, x, y + h + 3, 134, 17.4, MUTED, max_h=17)
text("UI demonstrations use a recorded test feed.<br/>They are not a live-user evaluation.",
     R, 657, CW, 18, MUTED, max_h=17)

section(11, "SHNEIDERMAN’S 8 GOLDEN RULES", L, 681)


def icon(kind, x, y):
    """Eight small vector icons, kept sharp at print size."""
    c.saveState()
    c.translate(x * mm, H - y * mm)
    c.scale(mm, -mm)
    c.setStrokeColor(colors.HexColor(AMBER if kind == 4 else GREEN if kind == 5 else BLUE))
    c.setLineWidth(0.45)
    if kind == 0:
        for xx in (0, 3.3):
            for yy in (0, 3.3):
                c.rect(xx, yy, 2.2, 2.2, stroke=1, fill=0)
    elif kind == 1:
        c.roundRect(-0.5, 0, 7, 5.2, 0.6, stroke=1, fill=0)
        for xx in (1, 2.8, 4.6):
            c.line(xx, 1.5, xx + 0.5, 1.5)
        c.line(1.2, 3.4, 4.8, 3.4)
    elif kind == 2:
        for xx, height in [(0, 2), (2.5, 4), (5, 6)]:
            c.line(xx, 6, xx, 6 - height)
    elif kind == 3:
        c.rect(-0.5, -0.2, 6.3, 6.3, stroke=1, fill=0)
        c.lines([(0.6, 2.8, 2.2, 4.2), (2.2, 4.2, 4.8, 1.2)])
    elif kind == 4:
        c.lines([(2.6, -0.5, -0.6, 5.5), (-0.6, 5.5, 5.8, 5.5), (5.8, 5.5, 2.6, -0.5),
                 (2.6, 1.2, 2.6, 3.2), (2.6, 4.1, 2.6, 4.4)])
    elif kind == 5:
        c.arc(-0.2, -0.2, 5.8, 5.8, startAng=25, extent=290)
        c.lines([(0.7, 0.1, -0.6, 0.1), (-0.6, 0.1, -0.6, 1.5)])
    elif kind == 6:
        c.lines([(0, 0, 0, 6), (2.7, 0, 2.7, 6), (5.4, 0, 5.4, 6)])
        c.circle(0, 1.4, 0.8, stroke=1, fill=0)
        c.circle(2.7, 4.3, 0.8, stroke=1, fill=0)
        c.circle(5.4, 2.5, 0.8, stroke=1, fill=0)
    else:
        c.rect(-0.3, 0, 6.5, 5.6, stroke=1, fill=0)
        c.circle(4.6, 1.5, 0.5, stroke=1, fill=0)
        c.lines([(0.4, 4.8, 2.4, 2.5), (2.4, 2.5, 3.8, 4), (3.8, 4, 4.5, 3.3), (4.5, 3.3, 5.6, 4.8)])
    c.restoreState()


rules = [("Consistency", "Same layout and colours"),
         ("Shortcuts", "Space, C, X, S, R, U, ?"),
         ("Informative feedback", "Hand skeleton + live confidence"),
         ("Closure", "“Saved” notice + View history"),
         ("Error prevention", "60% threshold; uncertain state"),
         ("Easy reversal", "Undo everywhere"),
         ("User control", "Camera + recognition on command; auto-save toggle"),
         ("Low memory load", "Reference photo beside every result")]
for i, (name, detail) in enumerate(rules):
    y = 698 + i * 12.6
    box(L, y, CW, 11.1, "#f1f5f9", radius=1)
    icon(i, L + 4, y + 2.5)
    text(f"<b>{name}</b> · {detail}", L + 16, y + 2.1, CW - 19, 18.2, max_h=8)

section(12, "CONCLUSION &amp; FUTURE WORK", R, 681)
text("Real-time, private ISL fingerspelling recognition, with an interface built around uncertainty and correction.",
     R, 698, 198, 23.5, max_h=35)
text("<b>NEXT</b>", R, 728, 80, 18, BLUE)
for i, item in enumerate(["<b>Data</b> · More signers and backgrounds",
                          "<b>Models</b> · Word-level signs (sequence models)",
                          "<b>Evaluation</b> · Study with Deaf ISL users"]):
    y = 740 + i * 21
    box(R, y, 198, 18.5, PALE, radius=1.3)
    text(item, R + 4, y + 4.2, 190, 20, max_h=10)
image(ASSETS[5], R + 207, 698, 68, 96)
text("Interaction flow", R + 207, 797, 68, 14, MUTED, center=True)

box(16, 811, 562, 0.5, LINE)
text("REFERENCES", 16, 817, 44, 13, BLUE, True)
text("Bragg et al. 2019; Adeyanju et al. 2021; Sridhar et al. 2020; Velmathi &amp; Goyal 2023; "
     "Zhang et al. 2020; Shneiderman et al. 2016.", 62, 817, 516, 13, MUTED, max_h=14)
c.showPage()
c.save()

# Prove physical size, page count and lossless preservation of every original.
reader = PdfReader(PDF)
assert len(reader.pages) == 1
page = reader.pages[0]
assert abs(float(page.mediabox.width) - W) < 0.01
assert abs(float(page.mediabox.height) - H) < 0.01
embedded = {(im.image.size, im.image.convert("RGB").tobytes()) for im in page.images}
for path in ASSETS:
    with Image.open(ROOT / path) as original:
        assert (original.size, original.convert("RGB").tobytes()) in embedded, path
poster_text = page.extract_text()
for required in ["97.86%", "8,377", "42,745", "99.95%", "3.0/5", "Meera", "Rohit", "Sana"]:
    assert required in poster_text, required

renderer = shutil.which("pdftoppm")
if not renderer:
    raise RuntimeError("PDF created and checked. Install Poppler to export the PNGs.")
for dpi, name in [(300, "SignBridge_A1_Poster_300dpi"), (65, "SignBridge_A1_Poster_preview")]:
    subprocess.run([renderer, "-singlefile", "-png", "-r", str(dpi), str(PDF), str(OUT / name)], check=True)
    path = OUT / f"{name}.png"
    with Image.open(path) as im:
        assert abs(im.width - 594 / 25.4 * dpi) <= 1
        assert abs(im.height - 841 / 25.4 * dpi) <= 1
print("PASS: evidence counts, one A1 page, all six original figures plus college logo preserved losslessly, PNG dimensions.")
print(PDF)
print(OUT / "SignBridge_A1_Poster_300dpi.png")
