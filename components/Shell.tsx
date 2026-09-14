'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { UnframerProvider } from 'unframer'

import { useSmoothScroll } from '@/lib/useSmoothScroll'
import { useCompactSections } from '@/lib/useCompactSections'
import { useVideoDecor } from '@/lib/useVideoDecor'
import CustomCursor from '@/components/CustomCursor'
import { NAV_RESPONSIVE, RESPONSIVE } from '@/components/breakpoints'

import Navigation from '@/framer/navigation.jsx'
import Footer from '@/framer/footer.jsx'

/**
 * The chrome every route shares: navigation, footer, and the site-level
 * behaviours the component-only Framer export cannot provide.
 *
 * In the Vite version this lived in `App.tsx` alongside a hand-rolled History
 * API router. Next owns routing now, so all that remains here is wiring
 * Framer's internal links into `next/navigation`.
 *
 * The Framer tree renders on the client only. Two reasons, both load-bearing:
 *
 * 1. unframer's font store fetches `framerusercontent.com` when it renders on a
 *    server, so `next build` fails to prerender any page from a machine that
 *    cannot reach Framer's CDN -- including most locked-down CI.
 * 2. `WithFramerBreakpoints` server-renders every breakpoint variant and then
 *    strips the inactive ones from the DOM as soon as its module is evaluated in
 *    the browser -- which happens *before* React hydrates. That DOM surgery is
 *    what a hydration mismatch is made of.
 *
 * The Vite app was a pure client-side SPA, so this is parity, not a regression.
 * Routing, metadata and 404 status all still come from the server.
 */
export default function Shell({ children }: { children: ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    useSmoothScroll(pathname)
    useCompactSections(pathname)
    useVideoDecor(pathname)

    const navigate = useCallback(
        (url: string) => {
            // Leave external links and non-http schemes to the browser.
            if (/^([a-z]+:)?\/\//i.test(url) || /^(mailto|tel):/i.test(url)) {
                window.location.href = url
                return
            }
            const target = new URL(url, window.location.origin)
            if (target.origin !== window.location.origin) {
                window.location.href = url
                return
            }
            router.push(target.pathname + target.search + target.hash)
        },
        [router],
    )

    // Not every link inside the Framer components goes through unframer's
    // navigate hook, so catch same-origin anchor clicks that reach the document
    // and route them client-side instead of triggering a full page load.
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) return
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            const anchor = (event.target as HTMLElement | null)?.closest?.('a')
            const href = anchor?.getAttribute('href')
            if (!anchor || !href || anchor.target === '_blank') return
            if (href.startsWith('#') || /^(mailto|tel):/i.test(href)) return
            const url = new URL(href, window.location.origin)
            if (url.origin !== window.location.origin) return
            event.preventDefault()
            router.push(url.pathname + url.search)
        }
        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [router])

    // Gate on the client rather than `next/dynamic`, so one flag covers the
    // shared chrome and the page together and the two can never render out of
    // step. useSyncExternalStore is the hydration-safe way to ask "am I on the
    // client": it returns the server snapshot during hydration, so the first
    // client render still matches the server, and only then flips.
    const mounted = useSyncExternalStore(subscribe, () => true, () => false)

    return (
        <UnframerProvider navigate={navigate}>
            <div
                className='unframer-page'
                // Lets CSS target a single route without a class per page.
                data-route={pathname}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                    // Matches the Ice Blue page ground; the Framer sections
                    // paint their own, this covers the gaps (nav strip, overscroll).
                    background: 'rgb(238, 244, 250)',
                }}
            >
                {mounted && (
                    <>
                        <Navigation.Responsive variants={NAV_RESPONSIVE} />
                        {children}
                        <Footer.Responsive variants={RESPONSIVE} />
                    </>
                )}
            </div>

            <CustomCursor />
        </UnframerProvider>
    )
}

/** The gate never changes after hydration, so nothing ever needs to notify. */
const subscribe = () => () => {}

export { RESPONSIVE }
