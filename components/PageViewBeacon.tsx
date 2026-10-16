'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const ENDPOINT = '/api/analytics/pv'

/**
 * Reports a page view to `/api/analytics/pv`.
 *
 * **Why it watches `usePathname()` rather than firing once.** Nothing on this
 * site reloads the document: Framer's internal links are wired into
 * `next/navigation` by `components/Shell.tsx`, both through
 * `UnframerProvider`'s `navigate` and the document-level click handler that
 * catches the links bypassing it. A beacon that fired only on mount would
 * record the entry page and then nothing for the rest of the visit.
 *
 * **Why the `sent` ref.** `usePathname()` is stable across re-renders, but this
 * component re-renders whenever its parent does, and in development an effect
 * can run more than once for a single navigation. Comparing against the last
 * path actually sent makes a repeat a no-op, so one navigation is one row. It
 * also means an in-page anchor or a query-string change does not count again,
 * which matches `cleanPath` stripping both server-side.
 *
 * **Why `sendBeacon` first.** It hands the request to the browser, which
 * delivers it even if the page is being unloaded -- a `fetch` from a unloading
 * document is routinely cancelled, which would lose exactly the last view of
 * every visit. `keepalive` is the fallback for the rare browser without it.
 */
export default function PageViewBeacon() {
    const pathname = usePathname()
    const sent = useRef<string | null>(null)

    useEffect(() => {
        if (!pathname || sent.current === pathname) return

        // The dashboard is not site content. Counting it would mean every
        // check of the numbers inflated the numbers -- and on a site with
        // ~45 views a day, an operator reading /admin a few times would be a
        // visible share of the traffic they are trying to read.
        if (pathname === '/admin' || pathname.startsWith('/admin/')) return

        // Keep development traffic out of the production table. The same
        // DATABASE_URL is used locally, so without this every `pnpm dev` page
        // load would show up in the dashboard as real traffic. Set
        // NEXT_PUBLIC_ANALYTICS_DEBUG=1 to send anyway while testing.
        const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
        if (isLocal && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG !== '1') return

        sent.current = pathname

        // `referrer` is only meaningful for the first page of a visit; after a
        // client-side navigation it still points at wherever the visit started,
        // which would credit every internal page view to the same external
        // source. Send it only when it is genuinely external.
        const referrer =
            document.referrer && !document.referrer.startsWith(window.location.origin)
                ? document.referrer
                : null

        // Sent with the query string attached, even though the stored path has
        // it stripped: the server reads `utm_source`/`utm_medium`/
        // `utm_campaign` off it first, and those only ever arrive as query
        // parameters. Deduping still keys on `pathname` alone, so arriving at
        // the same page under two different campaign tags is one view, not two.
        const search = window.location.search
        const body = JSON.stringify({ path: pathname + search, referrer })

        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
                return
            }
        } catch {
            // Some browsers throw rather than returning false; fall through.
        }

        void fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
        }).catch(() => {
            // A dropped page view is not worth a console error on a visitor's
            // machine.
        })
    }, [pathname])

    return null
}
