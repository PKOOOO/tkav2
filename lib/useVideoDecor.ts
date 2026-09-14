import { useEffect } from 'react'

/**
 * Plays a looping video in place of one of the generated decorations.
 *
 * Every other asset swap on this site is a line of CSS in `app/globals.css` --
 * `content: url(...)` replaces what an <img> renders without touching the
 * generated markup. That trick has a hard limit: `content` takes images, so a
 * video cannot go through it, and an animated WebP of this clip weighs 1.3MB
 * against the 368KB of VP9. Hence the only piece of DOM surgery in the repo.
 *
 * It stays deliberately small. The <img> is never removed -- a <video> is added
 * beside it inside unframer's inset-0 `[data-framer-background-image-wrapper]`,
 * and the <img> is only hidden once the video is actually playing. So every path
 * that ends in no video (a failed alpha probe, a decode failure, a blocked
 * autoplay, this hook not running at all) leaves the original still frame on
 * screen, which is why the PNG override in `globals.css` stays where it is.
 *
 * WebKit is the path that matters: it decodes VP9 but flattens the alpha to
 * black, so it gets the still. See `supportsAlphaVideo` -- that branch is
 * decided by decoding a frame, never by reading the user agent.
 *
 * This is the transparent-video arrangement, and it is deliberate. An attempt to
 * give WebKit motion too -- by dropping alpha and baking the section colour into
 * the clip -- was reverted: the baked rectangle stayed visible against the
 * section on every device tried, and the cause was never pinned down. If it is
 * picked up again, start by reading the real `backgroundColor` of the section
 * and the real decoded corner pixel of the video out of a live browser, because
 * neither could be established from the generated source.
 */

type Decor = {
    /** Substring of the Framer asset id the <img> still carries in its `src`. */
    match: string
    /** VP9 with alpha. Blink and Gecko. */
    src: string
    /**
     * HEVC with alpha, for WebKit, which is every browser on iOS. Optional and
     * expected to be absent: it cannot be built on Linux, so it is produced by
     * `.github/workflows/decor-alpha-mp4.yml` on a macOS runner and dropped into
     * `public/decor/` by hand. A 404 here costs nothing -- the video errors and
     * the still PNG stays, which is what iOS shows today.
     */
    webkitSrc?: string
}

const DECOR: Decor[] = [
    // The lego spider on the Program and About CTA bands. `crab.webm` is the
    // same robot walking: `public/brand/output.webm` keyed off its black
    // background into a real alpha channel, cropped to the figure and played
    // forward-then-back, because the source gait never returns to its opening
    // pose and a plain loop popped every five seconds.
    {
        match: 'WIi0h4VBtEtbQNYaatXFHT8TzDg',
        src: '/decor/crab.webm',
        webkitSrc: '/decor/crab.hevc.mp4',
    },
    // The red ladybug robot on the other side of the same bands, from
    // `public/brand/ladybug.webm`. Also ping-ponged: it ends mid-blink and
    // starts with its eyes open, so a plain loop snapped the eyes back open.
    {
        match: 'XDA48ZBlyMaqovRVgRqqtE0wsE',
        src: '/decor/ladybug.webm',
        webkitSrc: '/decor/ladybug.hevc.mp4',
    },
]

const FLAG = 'data-video-decor'

/**
 * A 64x64 two-frame VP9 clip whose left half is transparent and right half is
 * opaque red, 661 bytes inline. It is the only honest way to ask this question.
 *
 * VP9 carries alpha in WebM, but WebKit decodes VP9 and then composites it over
 * black -- on the teal CTA band that is a black card with a robot in it. No API
 * reports alpha support, and the user agent cannot stand in for one: *every*
 * browser on iOS renders with WebKit, so Chrome there ("CriOS") and Firefox
 * there ("FxiOS") fail exactly the way Safari does while claiming not to be it.
 *
 * So decode a frame and look at it. Draw the clip's top-left corner onto a
 * cleared canvas: where alpha survives the pixel is still transparent, and where
 * it does not the corner arrives opaque black. The red half is checked too, so a
 * clip that never decoded at all reads as unsupported rather than as success.
 */
const PROBE = 'data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAJlEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggEpTbuMU6uEHFO7a1OsggJP7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjAuMTYuMTAwV0GNTGF2ZjYwLjE2LjEwMESJiEBUAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYjNGLgLS66AKZyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAJiWgDglLCBQLqBQJqBAlPAgQFVsIRVuYEBElTDZ0CAc3OgY8CAZ8iaRaOHRU5DT0RFUkSHjUxhdmY2MC4xNi4xMDBzc9pjwItjxYjNGLgLS66AKWfIpUWjh0VOQ09ERVJEh5hMYXZjNjAuMzEuMTAyIGxpYnZweC12cDlnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAwLjA4MDAwMDAwMAAfQ7Z1QJrngQCg4qGzgQAAAIJJg0IAA/AD9gA4JBwYjAAAMGAAAGc///7UOQWv/yCWf////yD7/////qIw6tlAdaGqpqjugQGlo4JJg0IAA/AD9gA4JBwYjAAAMGAAACin//9z1e///ugegAAAoLGhk4EAKACGAECSnABUAAADIAAAVHB1oZamlO6BAaWPhgBAkpwAVAAAAyAAAFRw+4HYHFO7a5G7j7OBALeK94EB8YIBr/CBAw=='

let probe: Promise<boolean> | null = null

function supportsAlphaVideo(): Promise<boolean> {
    probe ??= new Promise<boolean>((resolve) => {
        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.preload = 'auto'
        // Anything unexpected -- a decode failure, a browser that never fires
        // the event, a future codec change -- resolves false and keeps the PNG,
        // which is the branch that always looks right.
        const timer = setTimeout(() => resolve(false), 2000)
        const done = (result: boolean) => {
            clearTimeout(timer)
            resolve(result)
        }

        video.addEventListener('error', () => done(false), { once: true })
        video.addEventListener(
            'loadeddata',
            () => {
                try {
                    const canvas = document.createElement('canvas')
                    canvas.width = canvas.height = 2
                    const ctx = canvas.getContext('2d', { willReadFrequently: true })
                    if (!ctx) return done(false)
                    ctx.clearRect(0, 0, 2, 2)
                    // Left column of the clip (transparent) and right (red).
                    ctx.drawImage(video, 0, 0, 1, 1, 0, 0, 1, 1)
                    ctx.drawImage(video, 63, 0, 1, 1, 1, 0, 1, 1)
                    const pixels = ctx.getImageData(0, 0, 2, 1).data
                    const transparent = pixels[3] === 0
                    const decoded = pixels[7] > 0
                    done(transparent && decoded)
                } catch {
                    done(false)
                }
            },
            { once: true },
        )

        video.src = PROBE
        video.load()
    })
    return probe
}

/**
 * Sources this browser has already proved it cannot use -- a 404 because nobody
 * has built the HEVC files yet, a decode failure, or alpha that did not survive.
 *
 * Giving up permanently is the point. Everything here is driven by a
 * MutationObserver, and dropping a failed <video> is itself a mutation: without
 * this the observer wakes, re-scans, finds the slot empty again and re-attaches,
 * which turns one missing file into an endless stream of requests for it.
 *
 * Module scope, so one failure settles it for every slot and every route change
 * for the rest of the session.
 */
const broken = new Set<string>()

/**
 * Does this element's current frame still have the transparency it was encoded
 * with? Both clips are cropped to the figure, so every corner is transparent in
 * every frame -- a corner that comes back opaque means the decoder threw the
 * alpha away and the clip would paint a solid card over the section.
 */
function alphaSurvived(video: HTMLVideoElement) {
    try {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 1
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return false
        ctx.clearRect(0, 0, 1, 1)
        ctx.drawImage(video, 0, 0, 1, 1, 0, 0, 1, 1)
        return ctx.getImageData(0, 0, 1, 1).data[3] < 8
    } catch {
        return false
    }
}

function attach(
    decor: Decor,
    img: HTMLImageElement,
    observer: IntersectionObserver,
    src: string,
    /**
     * Whether to re-check the alpha on the decoded frame before revealing. The
     * webm path is already vouched for by the inline probe, but the HEVC path
     * has nothing standing behind it: the file is built on a machine none of us
     * can test on, by an encoder this repo cannot run, for a browser that
     * silently flattens alpha rather than refusing it. So that one proves
     * itself on the actual device, and falls back to the still if it cannot.
     */
    verify: boolean,
) {
    const wrapper = img.parentElement
    if (!wrapper || broken.has(src) || wrapper.querySelector(`video[${FLAG}]`)) return

    const video = document.createElement('video')
    video.setAttribute(FLAG, decor.match)
    video.src = src
    video.muted = true
    video.loop = true
    video.autoplay = true
    video.playsInline = true
    video.preload = 'auto'
    video.setAttribute('aria-hidden', 'true')
    Object.assign(video.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        // `contain`, not the <img>'s `cover`: the clip is cropped to the robot's
        // own bounds, so `cover` would shave the leg tips off against the slot's
        // slightly narrower authored aspect. The bars `contain` leaves over are
        // transparent, so they cost nothing.
        objectFit: 'contain',
        pointerEvents: 'none',
        opacity: '0',
    })

    const giveUp = () => {
        broken.add(src)
        video.remove()
    }

    // A missing or unplayable file -- the usual case for the HEVC path, which
    // is absent until someone runs the workflow -- just leaves the PNG alone.
    video.addEventListener('error', giveUp, { once: true })

    // Only take over once there are real frames to show.
    video.addEventListener(
        'playing',
        () => {
            if (verify && !alphaSurvived(video)) {
                giveUp()
                return
            }
            video.style.opacity = '1'
            img.style.visibility = 'hidden'
        },
        { once: true },
    )

    wrapper.appendChild(video)
    observer.observe(video)
    void video.play().catch(() => {})
}

export function useVideoDecor(resetKey?: string) {
    useEffect(() => {
        let frame = 0
        let observer: MutationObserver | null = null
        let cancelled = false

        // Decoding a looping video the reader has scrolled past is pure waste,
        // and browsers do not pause offscreen <video> on their own.
        const visibility = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const video = entry.target as HTMLVideoElement
                    if (entry.isIntersecting) void video.play().catch(() => {})
                    else video.pause()
                }
            },
            { rootMargin: '200px' },
        )

        // Set once the probe settles: which file each slot should get, and
        // whether it has to prove its own alpha before being shown.
        let pick: ((decor: Decor) => { src: string; verify: boolean } | null) | null = null

        const scan = () => {
            if (!pick) return
            for (const decor of DECOR) {
                const chosen = pick(decor)
                if (!chosen) continue
                const images = document.querySelectorAll<HTMLImageElement>(
                    `.unframer-page img[src*="${decor.match}"]`,
                )
                for (const img of images) {
                    attach(decor, img, visibility, chosen.src, chosen.verify)
                }
            }
        }
        const schedule = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(scan)
        }

        // The probe decodes a frame, so it settles a tick or two after mount.
        // Nothing is attached until it comes back, and it is memoised, so this
        // costs one decode for the whole session rather than one per route.
        void supportsAlphaVideo().then((supported) => {
            if (cancelled) return

            // VP9 alpha works: Blink and Gecko take the webm, already vouched
            // for. Otherwise this is WebKit, which needs the HEVC file -- and
            // that one has to prove itself, because WebKit flattens alpha it
            // cannot carry rather than reporting an error.
            pick = supported
                ? (decor) => ({ src: decor.src, verify: false })
                : (decor) =>
                      decor.webkitSrc ? { src: decor.webkitSrc, verify: true } : null

            // Nothing to attach at all on WebKit until the MP4s are built, so
            // skip the scanning and the observer entirely and leave the stills.
            if (!DECOR.some((decor) => pick!(decor))) return

            schedule()

            // Sections mount after their breakpoint is measured, and switching
            // breakpoint remounts them, so one pass on navigation misses them --
            // watch for them arriving, the same way `useCompactSections` does.
            const root = document.querySelector('.unframer-page')
            observer = root ? new MutationObserver(schedule) : null
            observer?.observe(root!, { childList: true, subtree: true })
        })

        return () => {
            cancelled = true
            cancelAnimationFrame(frame)
            observer?.disconnect()
            visibility.disconnect()
            // Hand the slots back exactly as they were found.
            for (const video of document.querySelectorAll<HTMLVideoElement>(`video[${FLAG}]`)) {
                const img = video.parentElement?.querySelector('img')
                if (img) img.style.visibility = ''
                video.remove()
            }
        }
    }, [resetKey])
}
