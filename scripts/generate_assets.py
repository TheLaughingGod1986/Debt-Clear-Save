#!/usr/bin/env python3
"""Generate App Store icon + splash for Debt Freedom.

Outputs three PNGs into frontend/assets/:
  icon.png         1024x1024 — App Store icon (Expo derives all device sizes)
  adaptive-icon.png 1024x1024 — Android foreground (transparent BG layer)
  splash.png       1242x2688 — launch screen (centred wordmark on ink)

Uses Georgia Bold for the display face (closest system serif to Newsreader).
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

# Brand tokens (mirror frontend/src/theme/theme.js)
INK    = (13, 27, 42)
PAPER  = (247, 244, 238)
WHITE  = (255, 255, 255)
GOLD   = (184, 134, 10)
SAVE   = (134, 239, 172)  # savingsBorder

SERIF_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
SANS_BOLD  = "/System/Library/Fonts/Helvetica.ttc"


def font(path, size):
    return ImageFont.truetype(path, size)


def make_icon(path: Path, size: int = 1024) -> None:
    """A bold mark: serif 'd' on ink, with a rising-arc accent."""
    img = Image.new("RGB", (size, size), INK)
    d = ImageDraw.Draw(img)

    # Subtle inner border (gives the icon a "printed" feel)
    pad = int(size * 0.06)
    d.rounded_rectangle(
        [(pad, pad), (size - pad, size - pad)],
        radius=int(size * 0.06),
        outline=(255, 255, 255, 25),
        width=2,
    )

    # Rising arc — represents the debt-free trajectory
    arc_box = [
        int(size * 0.18),
        int(size * 0.45),
        int(size * 0.82),
        int(size * 1.05),
    ]
    d.arc(arc_box, start=200, end=340, fill=GOLD, width=int(size * 0.025))

    # Display glyph — lowercase 'd' for "Debt"
    f = font(SERIF_BOLD, int(size * 0.62))
    text = "d"
    bbox = d.textbbox((0, 0), text, font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1] - int(size * 0.02)
    d.text((x, y), text, font=f, fill=WHITE)

    img.save(path, "PNG", optimize=True)
    print(f"wrote {path.name}  ({size}×{size})")


def make_adaptive_icon(path: Path, size: int = 1024) -> None:
    """Android foreground — same mark on transparent so the system applies
    its own shape mask / background."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Centred circle so it fills Android's adaptive mask cleanly
    margin = int(size * 0.12)
    d.ellipse([(margin, margin), (size - margin, size - margin)], fill=INK)

    arc_box = [
        int(size * 0.24),
        int(size * 0.48),
        int(size * 0.76),
        int(size * 1.00),
    ]
    d.arc(arc_box, start=200, end=340, fill=GOLD, width=int(size * 0.022))

    f = font(SERIF_BOLD, int(size * 0.50))
    text = "d"
    bbox = d.textbbox((0, 0), text, font=f)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1] - int(size * 0.02)
    d.text((x, y), text, font=f, fill=WHITE)

    img.save(path, "PNG", optimize=True)
    print(f"wrote {path.name}  ({size}×{size})")


def make_splash(path: Path, w: int = 1242, h: int = 2688) -> None:
    """Centred wordmark on ink. Expo scales this to all device sizes."""
    img = Image.new("RGB", (w, h), INK)
    d = ImageDraw.Draw(img)

    f_brand = font(SERIF_BOLD, 132)
    line1, line2 = "Debt", "Freedom"
    cx = w // 2

    b1 = d.textbbox((0, 0), line1, font=f_brand)
    b2 = d.textbbox((0, 0), line2, font=f_brand)
    line_h = (b1[3] - b1[1]) + 18
    y0 = h // 2 - line_h - int(h * 0.04)

    for line, y in ((line1, y0), (line2, y0 + line_h)):
        bb = d.textbbox((0, 0), line, font=f_brand)
        tw = bb[2] - bb[0]
        d.text((cx - tw // 2 - bb[0], y), line, font=f_brand, fill=WHITE)

    # Underline accent
    line_w = 180
    line_y = y0 + 2 * line_h + 40
    d.rectangle(
        [(cx - line_w // 2, line_y), (cx + line_w // 2, line_y + 5)],
        fill=GOLD,
    )

    # Subtle tagline far below the mark
    f_meta = font(SANS_BOLD, 36)
    tag = "Your path to financial freedom"
    bb = d.textbbox((0, 0), tag, font=f_meta)
    tw = bb[2] - bb[0]
    d.text(
        (cx - tw // 2 - bb[0], line_y + 80),
        tag,
        font=f_meta,
        fill=(255, 255, 255, 180),
    )

    img.save(path, "PNG", optimize=True)
    print(f"wrote {path.name}  ({w}×{h})")


if __name__ == "__main__":
    make_icon(OUT / "icon.png")
    make_adaptive_icon(OUT / "adaptive-icon.png")
    make_splash(OUT / "splash.png")
    print(f"\nAll assets in {OUT}/")
