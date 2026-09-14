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
        'frames': 121,
    },
    # The red ladybug. `lady.webm` replaced an earlier take that was shot on dark
    # navy and needed the 'perp' key below; this one is on pure black like the
    # crab, with the same clean gap (66.8% of the frame at luma 0-7, 0.18%
    # between 8 and 23), so it keys the simple way and needs no shadow cleanup.
    'ladybug': {
        'source': 'public/brand/lady.webm',
        'box': (180, 102, 811, 758),
        'key': 'luma',
        'lo': 6.0,
        'hi': 22.0,
        'scale': (336, 350),
        'frames': 121,
    },
}

CRF = 44


def keyed_frames(name, cfg, workdir):
    """Extract, key and crop every source frame. Returns them in order."""
    raw = os.path.join(workdir, 'raw')
    os.makedirs(raw, exist_ok=True)
    # No rate flags here on purpose. Both sources are constant-rate 24fps, so a
    # plain extraction already yields every frame exactly once -- and the flag
    # that used to say so, `-vsync 0`, was REMOVED in ffmpeg 8 and fails outright
    # there. Its replacement, `-fps_mode`, does not exist before ffmpeg 5. This
    # script runs on both sides of that split (the webm is built on Linux, the
    # HEVC on a macOS runner with whatever Homebrew ships), so it names neither.
    subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', os.path.join(ROOT, cfg['source']),
         os.path.join(raw, '%04d.png')],
        check=True,
    )

    out = []
    for f in sorted(glob.glob(os.path.join(raw, '*.png'))):
        im = Image.open(f).convert('RGB').crop(cfg['box'])
        arr = np.asarray(im, dtype=np.float64)

        if cfg['key'] == 'luma':
            metric = np.asarray(im.convert('L'), dtype=np.float64)
        else:
            # 'perp' is for a source shot on a coloured background rather than
            # black. No clip uses it today, but one did and another might: the
            # trick is that a contact shadow is the background colour scaled
            # down, so it is collinear with it. Distance-to-background keeps
            # such a shadow (it is far away, just darker) while distance to the
            # background's *direction* collapses the two together.
            bg = np.array(cfg['bg'], dtype=np.float64)
            u = bg / np.linalg.norm(bg)
            metric = np.linalg.norm(arr - (arr @ u)[..., None] * u, axis=-1)

        alpha = np.clip((metric - cfg['lo']) / (cfg['hi'] - cfg['lo']), 0, 1)

        if cfg.get('dilate'):
            confident = Image.fromarray(((alpha >= 0.5) * 255).astype('uint8'))
            confident = confident.filter(ImageFilter.MaxFilter(cfg['dilate']))
            alpha = alpha * (np.asarray(confident, dtype=np.float64) / 255.0)

        # Blank the colour underneath anything fully transparent.
        #
        # Alpha is a separate, lossily-compressed plane, so "transparent" comes
        # back as a small non-zero value rather than exactly nothing -- and
        # whatever colour was left under it then tints the whole frame. The crab
        # got away with it because its studio background is pure black; the
        # ladybug's is navy, which painted a blue rectangle around it on iOS.
        # Only fully-transparent pixels are touched, so the soft edge keeps its
        # real colours and no halo appears along the silhouette.
        flat = np.asarray(im).copy()
        flat[alpha <= 0] = 0
        im = Image.fromarray(flat)

        im.putalpha(Image.fromarray(np.rint(alpha * 255).astype('uint8')))
        out.append(im)

    # The two output formats are built on different machines with different
    # ffmpeg majors, from this one function. If they ever disagreed about how
    # many frames the source has, the webm and the MP4 would quietly end up
    # different lengths. Pin it instead of discovering that on a phone.
    if len(out) != cfg['frames']:
        sys.exit('%s: extracted %d frames from %s, expected %d -- check the '
                 'ffmpeg version and the `frames` value in this script'
                 % (name, len(out), cfg['source'], cfg['frames']))
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
         '-g', '240', '-an',
         # Without these the Matroska muxer stamps a random 16-byte SegmentUID
         # at offset 285 and its own version string, so two runs over identical
         # frames produce files of identical length that differ in content. The
         # encode was always deterministic; only the container was not. Being
         # able to re-run this and diff the result against what shipped is the
         # whole point of the script, so make the bytes stable too.
         '-fflags', '+bitexact', '-flags:v', '+bitexact',
         '-y', dest],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('names', nargs='*', metavar='NAME',
                    help='which clips to build (default: all of %s)' % ', '.join(DECOR))
    ap.add_argument('--frames-only', metavar='DIR',
                    help='write DIR/<name>/%%04d.png keyed RGBA sequences and stop')
    ap.add_argument('--print-scale', action='store_true',
                    help="print each clip's target WIDTH:HEIGHT and stop, so the "
                         'macOS workflow encodes at the same size as the webm '
                         'instead of hardcoding a second copy of the numbers')
    args = ap.parse_args()
    names = args.names or list(DECOR)
    unknown = [n for n in names if n not in DECOR]
    if unknown:
        sys.exit('unknown clip(s): %s -- known: %s' % (', '.join(unknown), ', '.join(DECOR)))

    if args.print_scale:
        for name in names:
            print('%d:%d' % DECOR[name]['scale'])
        return

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
