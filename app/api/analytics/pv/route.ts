import { after } from 'next/server'

import {
    browserFrom,
    cleanPath,
    deviceFrom,
    hostnameFrom,
    isBot,
    osFrom,
    recordPageView,
    referrerHost,
    routeFrom,
    sessionHash,
    utmFrom,
} from '@/lib/analytics'
import { hasDb } from '@/lib/db'

/**
 * Page-view ingest. Called by `components/PageViewBeacon.tsx`.
 *
 * Three things shape this handler:
 *
 * 1. **It answers before it writes.** The database is in `eu-central-1` while
 *    Vercel functions default to US East, so an awaited insert would put a
 *    transatlantic round trip in front of the response. `after()` runs the
 *    write once the response has been sent, so the browser sees a 204
 *    immediately and a slow or down database cannot slow the site down.
 *
 * 2. **The IP and user-agent are read but never stored.** They go into
 *    `sessionHash` and nothing else; what lands in the table is a coarse
 *    device string and a digest that is only valid for one day.
 *
 * 3. **Everything in the body is untrusted.** `cleanPath` and `referrerHost`
 *    normalise and reject rather than coerce, so a crafted payload cannot
 *    invent rows or smuggle a query string full of personal data into the
 *    table.
 *
 * Always 204, even on bad input or a missing database. This is a fire-and-
 * forget beacon on every page load: a 4xx/5xx here would show up as console
 * noise for visitors and tell a prober what it got wrong, and the client could
 * not act on either.
 */
export async function POST(request: Request) {
    const noContent = new Response(null, { status: 204 })

    // Both env vars, not just the database. `sessionHash` throws without
    // ANALYTICS_SALT, and that throw would escape as a 500 on every single page
    // load -- the most likely way to get here is deploying with DATABASE_URL
    // set and the salt forgotten, so it has to degrade as quietly as a missing
    // database does.
    if (!hasDb() || !process.env.ANALYTICS_SALT) return noContent

    const userAgent = request.headers.get('user-agent')
    if (isBot(userAgent)) return noContent

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return noContent
    }

    const payload = body as { path?: unknown; referrer?: unknown }

    // Order matters: the campaign tags have to be read off the raw value before
    // `cleanPath` throws the query string away.
    const utm = utmFrom(payload?.path)
    const path = cleanPath(payload?.path)
    if (!path) return noContent

    // Vercel sets both of these at the edge; locally they are absent, so dev
    // traffic hashes against a constant and counts as one visitor.
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'local'
    const country = request.headers.get('x-vercel-ip-country')

    const hash = await sessionHash(ip, userAgent)

    after(async () => {
        try {
            await recordPageView({
                path,
                route: routeFrom(path),
                hostname: hostnameFrom(request.headers.get('host')),
                referrerHost: referrerHost(payload?.referrer),
                device: deviceFrom(userAgent),
                browser: browserFrom(userAgent),
                os: osFrom(userAgent),
                country: country && country.length <= 4 ? country : null,
                utmSource: utm.source,
                utmMedium: utm.medium,
                utmCampaign: utm.campaign,
                sessionHash: hash,
            })
        } catch (error) {
            // Losing a page view is not worth surfacing to the visitor, but it
            // should be findable in the function logs.
            console.error('[analytics] page view insert failed:', error)
        }
    })

    return noContent
}
