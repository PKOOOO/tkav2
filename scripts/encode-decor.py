#!/usr/bin/env python3
"""Builds the animated mascot clips in public/decor/ from the sources in public/brand/.

    python3 scripts/encode-decor.py                  # rebuild every webm
    python3 scripts/encode-decor.py crab             # just one
    python3 scripts/encode-decor.py --frames-only DIR # write PNG sequences and stop

Each source is a screen recording of a robot on a flat studio background with no
alpha channel. This keys that background out, crops to the figure, and encodes
VP9 with a real alpha channel -- which is what `lib/useVideoDecor.ts` lays over
the still <img> on browsers that can decode it.

`--frames-only` is for `.github/workflows/decor-alpha-mp4.yml`, which needs the
keyed RGBA frames on a macOS runner to produce the HEVC-with-alpha MP4s that
WebKit needs. Keeping one pipeline means the two formats can never drift apart.

EVERY CLIP IS PLAYED FORWARD THEN BACK. Neither source loops: the crab's gait
never returns to its opening pose (the closest any later frame gets scores 24.2
mean-abs-diff against a 1.4 baseline for neighbours) and the ladybug ends
mid-blink while starting with its eyes open. Ping-ponging is seamless by
construction and costs double the frames.

Needs ffmpeg and python3 with Pillow and numpy.
"""

import argparse
import glob
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DECOR = {
    # The lego spider. Shot on pure black: 81% of the frame is luma 0 and only
    # 0.27% of pixels fall between 8 and 23, so a threshold in that gap lifts the
    # robot without punching holes in its own dark gears.
    'crab': {
        'source': 'public/brand/output.webm',
        'box': (240, 163, 1003, 715),   # union bbox of the figure across all frames
        'key': 'luma',
        'lo': 6.0,
        'hi': 22.0,
        'scale': (440, 318),
    },
    # The red ladybug. Shot on dark navy, NOT black, so a luma key lifts nothing.
    # Keying on distance-to-background is wrong too: the contact shadow is a
    # *darker* navy, which is far from the background by distance and would
    # survive as a dark blob. The shadow is the background colour scaled down,
    # though -- collinear with it -- so keying on the PERPENDICULAR distance to
    # that colour's direction collapses background and shadow together while
    # leaving the red body and grey panel alone.
    'ladybug': {
        'source': 'public/brand/ladybug.webm',
        'box': (134, 98, 826, 794),
        'key': 'perp',
        'bg': (0, 36, 74),
        'lo': 8.0,
        'hi': 28.0,
        # Whatever is left of the shadow is removed by shape, not by threshold.
        # Raising `lo` instead looks obvious and is wrong: the glossy black face
        # panel reflects the navy background, so it sits close to it in colour
        # and a higher floor turns the robot's face translucent. Dilating the
        # confident silhouette and masking the soft alpha with it drops the
        # detached haze while keeping the antialiased edges and antennae.
        'dilate': 7,
        'scale': (348, 350),
    },
}

CRF = 44


def keyed_frames(name, cfg, workdir):
    """Extract, key and crop every source frame. Returns them in order."""
    raw = os.path.join(workdir, 'raw')
    os.makedirs(raw, exist_ok=True)
    subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', os.path.join(ROOT, cfg['source']),
         '-vsync', '0', os.path.join(raw, '%04d.png')],
        check=True,
    )

    out = []
    for f in sorted(glob.glob(os.path.join(raw, '*.png'))):
        im = Image.open(f).convert('RGB').crop(cfg['box'])
        arr = np.asarray(im, dtype=np.float64)

        if cfg['key'] == 'luma':
            metric = np.asarray(im.convert('L'), dtype=np.float64)
        else:
            bg = np.array(cfg['bg'], dtype=np.float64)
            u = bg / np.linalg.norm(bg)
            metric = np.linalg.norm(arr - (arr @ u)[..., None] * u, axis=-1)

        alpha = np.clip((metric - cfg['lo']) / (cfg['hi'] - cfg['lo']), 0, 1)

        if cfg.get('dilate'):
            confident = Image.fromarray(((alpha >= 0.5) * 255).astype('uint8'))
            confident = confident.filter(ImageFilter.MaxFilter(cfg['dilate']))
            alpha = alpha * (np.asarray(confident, dtype=np.float64) / 255.0)

        im.putalpha(Image.fromarray(np.rint(alpha * 255).astype('uint8')))
        out.append(im)

    if not out:
        sys.exit('%s: no frames extracted from %s' % (name, cfg['source']))
    return out


def write_pingpong(frames, outdir):
    """Forward then back, without repeating either endpoint."""
    os.makedirs(outdir, exist_ok=True)
    order = list(range(len(frames))) + list(range(len(frames) - 2, 0, -1))
    for i, k in enumerate(order, start=1):
        frames[k].save(os.path.join(outdir, '%04d.png' % i))
    return len(order)


def encode_webm(seq, cfg, dest):
    w, h = cfg['scale']
    subprocess.run(
        ['ffmpeg', '-v', 'error', '-framerate', '24', '-i', os.path.join(seq, '%04d.png'),
         '-vf', 'scale=%d:%d:flags=lanczos' % (w, h),
         '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p',
         '-b:v', '0', '-crf', str(CRF), '-row-mt', '1', '-cpu-used', '2',
         '-g', '240', '-an', '-y', dest],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('names', nargs='*', metavar='NAME',
                    help='which clips to build (default: all of %s)' % ', '.join(DECOR))
    ap.add_argument('--frames-only', metavar='DIR',
                    help='write DIR/<name>/%%04d.png keyed RGBA sequences and stop')
    args = ap.parse_args()
    names = args.names or list(DECOR)
    unknown = [n for n in names if n not in DECOR]
    if unknown:
        sys.exit('unknown clip(s): %s -- known: %s' % (', '.join(unknown), ', '.join(DECOR)))

    for name in names:
        cfg = DECOR[name]
        work = tempfile.mkdtemp(prefix='decor-%s-' % name)
        try:
            frames = keyed_frames(name, cfg, work)
            if args.frames_only:
                seq = os.path.join(args.frames_only, name)
                n = write_pingpong(frames, seq)
                print('%-8s %d source frames -> %d in %s (%dx%d)'
                      % (name, len(frames), n, seq, *frames[0].size))
            else:
                seq = os.path.join(work, 'pp')
                n = write_pingpong(frames, seq)
                dest = os.path.join(ROOT, 'public/decor/%s.webm' % name)
                encode_webm(seq, cfg, dest)
                print('%-8s %d source frames -> %d -> %s (%d bytes)'
                      % (name, len(frames), n, os.path.relpath(dest, ROOT),
                         os.path.getsize(dest)))
        finally:
            shutil.rmtree(work, ignore_errors=True)


if __name__ == '__main__':
    main()
