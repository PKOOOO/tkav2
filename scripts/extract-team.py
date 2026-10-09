#!/usr/bin/env python3
"""Rebuild public/team/*.webp from the portraits in public/brand/.

The sources are cut-out portraits of the team, and despite the extension they
are not really vector. Each `.svg` wraps two embedded base64 PNGs of identical
size -- an 8-bit grayscale alpha mask and the RGB photograph -- which the SVG
composites with a filter. So there is nothing to rasterise: pull both rasters
out and put the mask into the photo's alpha channel. That is lossless and needs
no rsvg, Inkscape or cairo, none of which are installed here.

`naj.svg` carries a third, smaller image (a logo) that is not part of the
composite, so the pair is matched on size rather than on order.

**The viewBox is the crop, and it is the whole point.** Each photo is embedded
at full camera resolution and positioned by a `matrix(a,0,0,d,e,f)` transform;
the viewBox is the window the designer drew over it in Canva. Inverting the
transform turns that window back into pixel coordinates. An earlier version of
this script trimmed to the alpha bounding box instead, which silently replaced
every crop with "whatever encloses the figure" -- the tell was `paul` coming out
landscape at 1.158 when its viewBox says 0.928 portrait, and `mima` coming out
1.507 with both arms in frame against a square viewBox.

Twelve of the thirteen are square; `paul` is 712.5x768. Four crops begin above
the top of their raster, so the composite is cropped before anything is trimmed
and PIL pads the shortfall with transparency -- see crop_to_view_box.

Results are written as WebP with alpha, longest side MAX_SIDE. The card renders
them with `object-fit: contain` rather than `cover`, so a figure is never cut at
the arms or the crown of the head.

    python3 scripts/extract-team.py                  # everyone
    python3 scripts/extract-team.py pius avril clem  # selected sources
"""

import base64
import io
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "public" / "brand"
OUT = ROOT / "public" / "team"

MAX_SIDE = 820
QUALITY = 80

# source stem -> output stem. The output names are the slugs lib/team.ts uses.
PEOPLE = {
    "paul": "paul-akwabi",
    "hebron": "hebron-mwagodi",
    "bii": "brian-bii",
    "naj": "najla-yusuf",
    "diana": "diana-wamboi",
    "pius": "pius-khainja",
    "avril": "avril-diamond",
    "justin": "justin-njuguna",
    # `pete.svg`, not `peter.svg` -- the latter is the 7.6MB CTA mascot source
    # that public/decor/peter.webp is built from. Do not swap these.
    "pete": "peter-lagat",
    "clem": "clemence-kibet",
    "hussesin": "hussein-mohammed",
    "mody": "mohammed",
    "monica": "monica-akinyi",
    "mima": "mimah-charo",
}

DATA_URI = re.compile(rb"data:image/(?:png|jpeg|jpg);base64,([A-Za-z0-9+/=\s]+)")

VIEW_BOX = re.compile(rb'viewBox="([\d.+-]+) +([\d.+-]+) +([\d.+-]+) +([\d.+-]+)"')

# A <g transform="matrix(...)"> wrapping an <image width="N">. The b and c terms
# are ignored: all 13 files are pure scale plus translate, asserted below.
PLACEMENT = re.compile(
    rb'transform="matrix\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,'
    rb'\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)"[^<]*<image[^>]*?width="(\d+)"'
)


def strip_payloads(raw: bytes) -> bytes:
    """Drop the base64 blobs so the markup can be scanned cheaply."""
    return DATA_URI.sub(b"X", raw)


def composite(raw: bytes, name: str) -> Image.Image:
    """Put the embedded mask into the embedded photo's alpha channel."""
    embedded = [
        Image.open(io.BytesIO(base64.b64decode(re.sub(rb"\s", b"", m.group(1)))))
        for m in DATA_URI.finditer(raw)
    ]
    masks = [i for i in embedded if i.mode == "L"]
    if not masks:
        raise SystemExit(f"{name}: no grayscale mask among {len(embedded)} images")
    mask = masks[0]
    photos = [i for i in embedded if i.mode != "L" and i.size == mask.size]
    if not photos:
        raise SystemExit(f"{name}: no photo matching the mask's {mask.size}")

    out = photos[0].convert("RGB")
    out.putalpha(mask.convert("L"))
    return out


def crop_to_view_box(image: Image.Image, raw: bytes, name: str) -> Image.Image:
    """Apply the crop the designer drew, rather than re-deriving one.

    The photo is embedded whole and positioned by a transform; the viewBox is
    the window onto it. Inverting the transform turns that window back into
    pixel coordinates.
    """
    vx, vy, vw, vh = (float(g) for g in VIEW_BOX.search(raw).groups())

    placements = [
        tuple(float(g) for g in m.groups()[:6]) + (int(m.group(7)),)
        for m in PLACEMENT.finditer(raw)
    ]
    # The mask layer and the photo layer repeat the same matrix; naj.svg adds a
    # third, differently-placed 1024px logo layer. Match on the raster actually
    # decoded above rather than on document order or on "the biggest".
    for a, b, c, d, e, f, width in placements:
        if width != image.width:
            continue
        if b or c:
            raise SystemExit(f"{name}: placement is rotated or skewed, not handled")
        # Out-of-bounds edges are left alone: several of these crops start above
        # the top of the raster (paul by 124px), which is the designer leaving
        # headroom. PIL pads the shortfall with transparency, which is right --
        # clamping to 0 would quietly change the aspect ratio and reframe them.
        return image.crop(
            (
                round((vx - e) / a),
                round((vy - f) / d),
                round((vx + vw - e) / a),
                round((vy + vh - f) / d),
            )
        )

    raise SystemExit(f"{name}: no placement for the {image.width}px raster")


def main() -> int:
    requested = set(sys.argv[1:]) or set(PEOPLE)
    unknown = requested - PEOPLE.keys()
    if unknown:
        raise SystemExit(f"unknown portrait source(s): {', '.join(sorted(unknown))}")

    OUT.mkdir(parents=True, exist_ok=True)
    total = 0

    for stem, slug in PEOPLE.items():
        if stem not in requested:
            continue
        svg = BRAND / f"{stem}.svg"
        if not svg.exists():
            raise SystemExit(f"missing source for {slug}: brand/{stem}.svg")

        raw = svg.read_bytes()
        image = composite(raw, svg.name)
        image = crop_to_view_box(image, strip_payloads(raw), svg.name)

        # Blank the colour under fully-transparent pixels. WebP compresses the
        # colour plane independently of alpha, so whatever sat under a
        # transparent pixel bleeds back as a fringe around the figure.
        cleared = Image.new("RGBA", image.size, (0, 0, 0, 0))
        cleared.paste(image, mask=image.split()[3])
        image = cleared

        scale = MAX_SIDE / max(image.size)
        if scale < 1:
            image = image.resize(
                (round(image.width * scale), round(image.height * scale)),
                Image.LANCZOS,
            )

        target = OUT / f"{slug}.webp"
        image.save(target, "WEBP", quality=QUALITY, method=6)
        size = target.stat().st_size
        total += size
        print(
            f"{slug:18} {image.width:4}x{image.height:<4} "
            f"ratio {image.width / image.height:.3f}  {size / 1024:6.1f}KB"
        )

    print(f"{'':18} {'':13} {'total':>11}  {total / 1024:6.1f}KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
