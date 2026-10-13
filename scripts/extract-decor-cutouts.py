#!/usr/bin/env python3
"""Rebuild the non-portrait cut-outs in public/decor/ from public/brand/.

Same job and same file shape as scripts/extract-team.py -- a Canva export whose
`.svg` wraps an 8-bit grayscale alpha mask and an RGB photograph of identical
size, composited by a filter -- but these are section decor rather than team
portraits, so they land in public/decor/ beside the mascot clips instead of in
public/team/.

The composite and crop routines are **imported** from extract-team.py rather
than copied. Both the mask/photo pairing and the viewBox-as-crop inversion are
subtle enough that a second copy would drift; see that file's docstring for why
the viewBox is the crop and not the alpha bounding box.

`de.svg` is the only one left to convert. Its siblings `perez.svg` and
`peter.svg` were already turned into public/decor/perez.webp and
public/decor/peter.webp by hand, and app/globals.css only names them now in
comments -- do not re-add them here expecting a change.

    python3 scripts/extract-decor-cutouts.py
"""

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "public" / "brand"
OUT = ROOT / "public" / "decor"

# 1600 on the long edge sits between decor/peter.webp (1519) and
# decor/perez.webp (2438). The slot is a square footer figure scaled up to 1.18
# past 1200px wide, so this leaves headroom without carrying the full 2582px
# crop the viewBox yields.
MAX_SIDE = 1600
QUALITY = 82

SOURCES = {"de": "de"}  # source stem -> output stem


def _shared():
    """Load extract-team.py by path; its name is not a valid module name."""
    spec = importlib.util.spec_from_file_location(
        "extract_team", Path(__file__).with_name("extract-team.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    et = _shared()
    OUT.mkdir(parents=True, exist_ok=True)

    for stem, out_stem in SOURCES.items():
        svg = BRAND / f"{stem}.svg"
        if not svg.exists():
            raise SystemExit(
                f"missing source: public/brand/{stem}.svg\n"
                "full-resolution sources are archived beside the repo at "
                "~/Desktop/tka-v2-asset-sources"
            )

        raw = svg.read_bytes()
        image = et.composite(raw, svg.name)
        image = et.crop_to_view_box(image, et.strip_payloads(raw), svg.name)
        cropped = image.size
        image.thumbnail((MAX_SIDE, MAX_SIDE), et.Image.LANCZOS)

        target = OUT / f"{out_stem}.webp"
        image.save(target, "WEBP", quality=QUALITY, method=6)

        print(
            f"{stem}.svg {svg.stat().st_size/1048576:.2f}MB "
            f"-> decor/{out_stem}.webp {target.stat().st_size/1024:.0f}KB "
            f"(crop {cropped[0]}x{cropped[1]} -> {image.width}x{image.height}, "
            f"{image.mode})"
        )


if __name__ == "__main__":
    main()
