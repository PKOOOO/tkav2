import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { SITE_NAME } from '@/lib/site'

export const alt = `${SITE_NAME} — coding, robotics and digital skills for children and youth in Mombasa, Kenya`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The social card, rendered once at build time.
 *
 * Drawn here rather than pointed at an existing asset because every image this
 * repo owns is either square (the app icons) or a photograph with no room for
 * the name. Scrapers centre-crop a square to 1.91:1, which on the app icon cuts
 * the figures in half.
 *
 * `ImageResponse` is Satori, not a browser: flexbox only, no grid, and any
 * element with more than one child needs an explicit `display: flex`. The
 * palette is the Framer project's, via the `--token-` overrides in
 * `app/globals.css` -- Dark Blue, Vivid Purple, Ice Blue.
 */
export default async function OpengraphImage() {
    const logo = await readFile(join(process.cwd(), 'public/fav/android-chrome-512x512.png'))
    const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: '0 90px',
                    backgroundColor: '#002b5b',
                    // Satori has no gradient shorthand parsing beyond this form;
                    // the purple sits bottom-right, behind the logo.
                    backgroundImage:
                        'radial-gradient(circle at 88% 78%, rgba(106, 19, 131, 0.85) 0%, rgba(0, 43, 91, 0) 55%)',
                    fontFamily: 'sans-serif',
                }}
            >
                <img src={logoSrc} width={132} height={132} alt='' style={{ borderRadius: 28 }} />

                <div
                    style={{
                        display: 'flex',
                        fontSize: 74,
                        fontWeight: 700,
                        color: '#ffffff',
                        marginTop: 38,
                        letterSpacing: '-0.02em',
                    }}
                >
                    {SITE_NAME}
                </div>

                <div
                    style={{
                        display: 'flex',
                        fontSize: 34,
                        color: '#eef4fa',
                        marginTop: 20,
                        maxWidth: 880,
                        lineHeight: 1.35,
                    }}
                >
                    Coding, robotics, 3D design and AI for children and youth — Mombasa, Kenya
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: 44,
                    }}
                >
                    <div style={{ display: 'flex', width: 64, height: 6, backgroundColor: '#38b6ff' }} />
                    <div style={{ display: 'flex', fontSize: 26, color: '#c6dcf0', marginLeft: 22 }}>
                        techkidzafrica.co.ke
                    </div>
                </div>
            </div>
        ),
        size,
    )
}
