#!/usr/bin/env python3
"""Shrink the photographs that `app/globals.css` serves straight out of public/brand/.

Every one of these is a camera original -- most are 6960x4640, a 32-megapixel
frame -- and they reach the browser untouched. `content: url()` is a CSS
property, so Next's image optimizer never sees them: no resize, no WebP, no
`srcset`. Whatever is on disk is what a phone on mobile data downloads.

So the fix has to happen on disk. Each file is resized to MAX_SIDE on its
longest edge and re-encoded as a progressive JPEG, **keeping its name and
extension** -- the point is that not one of the ~50 `url(/brand/...)` rules in
globals.css has to change, which keeps this off the override layer that holds
the site's artwork together.

That makes the operation destructive: the camera original is replaced. The
originals are in the asset-source archive beside the repo (see ARCHIVE below)
and in git history before this commit, so re-running against an already-shrunk
file is the real hazard -- it would recompress a 1920px JPEG a second time.
Hence the SKIP guard: anything already within MAX_SIDE is left alone, so the
script is idempotent and safe to re-run.

Only files CSS or TSX actually request are listed. The source-only material in
public/brand/ (the team portraits that scripts/extract-team.py consumes, the
mascot clips, the Canva cut-outs) is deliberately absent -- those are inputs to
other scripts and must keep their full resolution.

    python3 scripts/optimize-brand-photos.py           # report, change nothing
    python3 scripts/optimize-brand-photos.py --write    # actually re-encode
"""

import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "public" / "brand"
ARCHIVE = "~/Desktop/tka-v2-asset-sources"

# 1920 on the long edge covers a full-bleed hero on a 2x laptop display. The
# largest slot any of these lands in is a half-width figure, so this is already
# generous; the visible difference against a 6960px original is nil.
MAX_SIDE = 1920
QUALITY = 82

# Served directly by a `content: url(/brand/...)` rule in app/globals.css, or by
# a string literal in lib/. Verified against both, with comments stripped --
# several brand files are named only in CSS comments and are NOT served.
SERVED = [
    "3d.jpg",
    "ai.jpg",
    "ann.jpg",
    "hand.jpg",
    "i.jpg",
    "kids.jpg",
    "lit.jpg",
    "main-photo.jpg",
    "main.jpg",
    "net.jpg",
    "november.jpg",
    "online.jpg",
    "se.jpg",
    "small.jpg",
    "stud.jpg",
]


def main() -> None:
    write = "--write" in sys.argv
    before = after = 0
    rows = []

    for name in SERVED:
        path = BRAND / name
        if not path.exists():
            raise SystemExit(f"missing: public/brand/{name}")

        size = path.stat().st_size
        before += size
        image = Image.open(path)

        if max(image.size) <= MAX_SIDE:
            after += size
            rows.append((name, f"{image.width}x{image.height}", size, size, "skip"))
            continue

        # EXIF orientation has to be applied before the resize, or a portrait
        # shot that a phone stored as landscape-plus-a-flag comes out rotated
        # once the tag is dropped on save.
        out = ImageOps.exif_transpose(image).convert("RGB")
        out.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)

        if write:
            out.save(path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
            new = path.stat().st_size
        else:
            from io import BytesIO

            buf = BytesIO()
            out.save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)
            new = buf.tell()

        after += new
        rows.append((name, f"{out.width}x{out.height}", size, new, "ok"))

    width = max(len(r[0]) for r in rows)
    print(f"{'file':<{width}}  {'new dims':>11}  {'before':>9}  {'after':>9}")
    for name, dims, old, new, note in rows:
        mark = "  (already small)" if note == "skip" else ""
        print(f"{name:<{width}}  {dims:>11}  {old/1048576:>7.2f}MB  {new/1048576:>7.2f}MB{mark}")

    print(
        f"\ntotal {before/1048576:.1f}MB -> {after/1048576:.1f}MB "
        f"({before/max(after,1):.1f}x smaller)"
    )
    if not write:
        print("\ndry run -- nothing written. re-run with --write to apply.")
        print(f"originals are archived at {ARCHIVE}")


if __name__ == "__main__":
    main()
