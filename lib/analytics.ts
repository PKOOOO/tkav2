import { db } from './db'

/**
 * Collection and aggregation for the self-hosted page-view counter.
 *
 * Days are **Nairobi** days, not UTC days. The audience and the person reading
 * the dashboard are both in UTC+3, so a UTC boundary would file the first three
 * hours of every evening under the previous day. `DAY_TZ` is the single place
 * that is decided, and every query below converts through it.
 */
const DAY_TZ = 'Africa/Nairobi'

/** Raw rows are a buffer for the rollup, not the archive. */
export const RETENTION_DAYS = 90

/**
 * Obvious automated traffic, dropped before it reaches the table. This will
 * never be complete -- it is a cheap filter for the loudest offenders, not a
 * bot-detection system, and the numbers here should be read as "page views"
 * rather than "humans".
 */
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|monitor|curl|wget|python-requests|axios|node-fetch|vercel-screenshot|preview/i

export function isBot(userAgent: string | null): boolean {
    return !userAgent || BOT.test(userAgent)
}

export function deviceFrom(userAgent: string | null): 'desktop' | 'mobile' | 'tablet' {
    const ua = (userAgent ?? '').toLowerCase()
    // Tablet first: an iPad's UA also contains "mobile" on some iOS versions,
    // so testing mobile first would classify every tablet as a phone.
    if (/tablet|ipad|playbook|silk|android(?!.*mobile)/.test(ua)) return 'tablet'
    if (/mobile|android|iphone|ipod|iemobile|blackberry|opera mini/.test(ua)) return 'mobile'
    return 'desktop'
}

/**
 * The path is supplied by the browser, so it is untrusted input that ends up in
 * a `group by` and on a dashboard. Normalise hard rather than trusting it:
 * absolute URLs, query strings and fragments are stripped, and anything that
 * does not then look like a site path is rejected outright so junk cannot
 * accumulate as its own row.
 */
export function cleanPath(raw: unknown): string | null {
    if (typeof raw !== 'string') return null
    let path = raw.trim()
    if (!path) return null

    // Accept a full URL but keep only its pathname.
    if (/^https?:\/\//i.test(path)) {
        try {
            path = new URL(path).pathname
        } catch {
            return null
        }
    }

    path = path.split('?')[0].split('#')[0]
    if (!path.startsWith('/')) return null
    if (path.length > 300) return null
    if (/[\s<>"'\\]/.test(path)) return null

    // Collapse a trailing slash so `/about` and `/about/` are one row.
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
    return path
}

/** Only the referrer's host is kept -- a full external URL can carry PII in its query. */
export function referrerHost(raw: unknown): string | null {
    if (typeof raw !== 'string' || !raw.trim()) return null
    try {
        const host = new URL(raw).hostname.toLowerCase()
        return host.length > 120 ? null : host
    } catch {
        return null
    }
}

/**
 * A per-day, per-visitor digest that cannot be reversed into an IP.
 *
 * The date is part of the hashed input on purpose: the same person produces a
 * different hash tomorrow, so nothing here can follow anyone across days. That
 * is also why `sessions` throughout this file means "distinct visitors on that
 * day" and never anything longer-lived.
 *
 * `ANALYTICS_SALT` has to be secret. IPv4 is only ~4.3 billion values, so an
 * unsalted (or guessable-salt) digest of an IP is trivially brute-forced and
 * would make this table a record of who visited rather than how many.
 */
export async function sessionHash(ip: string, userAgent: string | null): Promise<string> {
    const salt = process.env.ANALYTICS_SALT
    if (!salt) throw new Error('ANALYTICS_SALT is not set')
    const day = new Date().toLocaleDateString('en-CA', { timeZone: DAY_TZ })
    const data = new TextEncoder().encode(`${ip}|${userAgent ?? ''}|${day}|${salt}`)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest).slice(0, 16))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

export type PageViewInput = {
    path: string
    referrerHost: string | null
    device: string
    country: string | null
    sessionHash: string
}

export async function recordPageView(view: PageViewInput): Promise<void> {
    const sql = db()
    await sql`
        insert into page_view (path, referrer_host, device, country, session_hash)
        values (${view.path}, ${view.referrerHost}, ${view.device}, ${view.country}, ${view.sessionHash})
    `
}

/**
 * Aggregate one day of raw rows into both rollup tables.
 *
 * Both statements are `on conflict ... do update`, so re-running for a day that
 * is already rolled up recomputes it rather than doubling it. That matters: the
 * cron can retry, and a day can legitimately be rolled up twice (once while
 * still in progress, once after it closes).
 *
 * The bounds are a half-open range on `ts` rather than
 * `(ts at time zone ...)::date = $1`, because wrapping the column in a function
 * would make the `page_view_ts_idx` index unusable.
 */
export async function rollupDay(day: string): Promise<{ paths: number; views: number }> {
    const sql = db()

    const perPath = await sql`
        insert into page_view_daily (day, path, device, views, sessions)
        select ${day}::date, path, device, count(*)::int, count(distinct session_hash)::int
        from page_view
        where ts >= (${day}::date::timestamp at time zone ${DAY_TZ})
          and ts <  ((${day}::date + 1)::timestamp at time zone ${DAY_TZ})
        group by path, device
        on conflict (day, path, device) do update
            set views = excluded.views, sessions = excluded.sessions
        returning views
    `

    // Separate pass, because unique-visitor counts cannot be summed out of the
    // per-path table: one visitor reading three pages appears in three rows.
    await sql`
        insert into visit_daily (day, views, sessions)
        select ${day}::date, count(*)::int, count(distinct session_hash)::int
        from page_view
        where ts >= (${day}::date::timestamp at time zone ${DAY_TZ})
          and ts <  ((${day}::date + 1)::timestamp at time zone ${DAY_TZ})
        on conflict (day) do update
            set views = excluded.views, sessions = excluded.sessions
    `

    return {
        paths: perPath.length,
        views: perPath.reduce((total, row) => total + Number(row.views), 0),
    }
}

/** Drop raw rows the rollups have already absorbed. */
export async function pruneRaw(days = RETENTION_DAYS): Promise<number> {
    const sql = db()
    const gone = await sql`
        delete from page_view
        where ts < now() - make_interval(days => ${days})
        returning id
    `
    return gone.length
}

/** Today and yesterday in the reporting timezone, as `YYYY-MM-DD`. */
export function reportingDays(): { today: string; yesterday: string } {
    const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: DAY_TZ })
    const now = new Date()
    return {
        today: fmt(now),
        yesterday: fmt(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
    }
}
