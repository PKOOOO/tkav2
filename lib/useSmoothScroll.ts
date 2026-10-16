import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

/**
 * Framer runs the site through a Smooth Scroll component backed by Lenis,
 * configured as `new Lenis({ duration: intensity / 10 })`. Every page in the
 * project sets intensity to 20, so the published site eases with duration 2.
 * (Home is the exception -- it uses a local copy left at the default 10.)
 */
export const SCROLL_DURATION = 2

/**
 * `enabled` exists for routes that are not part of the Framer site -- `/admin`
 * in particular. Lenis attaches to `document` and drives a `requestAnimationFrame`
 * loop whether or not any Framer content is on the page, so unlike
 * `useCompactSections` and `useVideoDecor` (which query `.unframer-page` and
 * quietly find nothing) it cannot opt itself out. It has to be told.
 *
 * It is a parameter rather than an early `return` in the caller because the
 * caller is one component rendering every route: skipping the hook on some
 * paths would change the hook order between renders, which React rejects.
 */
export function useSmoothScroll(resetKey?: string, duration = SCROLL_DURATION, enabled = true) {
    const lenisRef = useRef<Lenis | null>(null)

    useEffect(() => {
        if (!enabled) return

        const lenis = new Lenis({ duration })
        lenisRef.current = lenis

        let frame = requestAnimationFrame(function raf(time) {
            lenis.raf(time)
            frame = requestAnimationFrame(raf)
        })

        // Anchor links have to be handed to Lenis, otherwise the native jump
        // fights the eased scroll and the page snaps.
        const onClick = (event: MouseEvent) => {
            const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]')
            const href = anchor?.getAttribute('href')
            if (!href || href === '#') return
            // Leave the hash-based page router alone; it is not an in-page anchor.
            if (href.startsWith('#/')) return
            if (!document.querySelector(href)) return
            event.preventDefault()
            lenis.scrollTo(href)
        }
        document.addEventListener('click', onClick)

        return () => {
            document.removeEventListener('click', onClick)
            cancelAnimationFrame(frame)
            lenis.destroy()
            lenisRef.current = null
        }
    }, [duration, enabled])

    // Framer jumps to the top on navigation; without this a short page keeps
    // the previous page's scroll offset and opens part-way down.
    useEffect(() => {
        lenisRef.current?.scrollTo(0, { immediate: true })
    }, [resetKey])
}
