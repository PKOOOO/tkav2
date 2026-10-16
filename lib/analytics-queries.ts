import { db } from './db'

/**
 * Read side of the analytics store: everything `/admin` renders.
 *
 * **These read the raw `page_view` table, not the rollups.** That looks like
 * the mistake the old Sanity dashboard made, and is not, because of where the
 * counting happens: every function below aggregates with `group by` *inside
 * Postgres* and returns at most a few dozen rows. The old one shipped every
 * matching row to Node and counted in JavaScript. At ~45 views a day a 90-day
 * window is roughly 4,000 rows -- nothing for an indexed `group by`, and the
 * only way to offer breakdowns by browser, OS, country and campaign without
 * pre-aggregating every combination of them.
 *
 * The rollups still earn their place: raw rows are pruned at 90 days, so
 * `page_view_daily` / `visit_daily` are the permanent record and the source
 * for any window longer than that. `MAX_RAW_DAYS` is the boundary.
 */
export const MAX_RAW_DAYS = 90

const DAY_TZ = 'Africa/Nairobi'

/**
 * The dimensions `/admin` can group by, mapped to their columns.
 *
 * This map is the security boundary. A column name cannot be a bound
 * parameter -- it has to be interpolated into the SQL text -- so taking it
 * from the request would be textbook injection. The request supplies a *key*;
 * only a key present here resolves to a column, and anything else is refused
 * before a query is built.
 */
const DIMENSIONS = {
    path: 'path',
    route: 'route',
    hostname: 'hostname',
    referrer: 'referrer_host',
    country: 'country',
    device: 'device',
    browser: 'browser',
    os: 'os',
    utm_source: 'utm_source',
    utm_medium: 'utm_medium',
    utm_campaign: 'utm_campaign',
} as const

export type Dimension = keyof typeof DIMENSIONS
export const DIMENSION_KEYS = Object.keys(DIMENSIONS) as Dimension[]

export const isDimension = (value: unknown): value is Dimension =>
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(DIMENSIONS, value)

export type Totals = {
    views: number
    visitors: number
    /** Share of visitors who viewed exactly one page, 0-100. */
    bounceRate: number
}

export type Breakdown = { label: string; views: number; visitors: number }
export type DayPoint = { day: string; views: number; visitors: number }

/** Clamp a requested window to something the raw table can actually answer. */
export function windowDays(requested: unknown): number {
    const n = Number(requested)
    if (!Number.isFinite(n)) return 7
    return Math.min(Math.max(Math.trunc(n), 1), MAX_RAW_DAYS)
}

export async function totals(days: number): Promise<Totals> {
    const sql = db()
    /**
     * Bounce rate needs per-session counts, so it cannot come from the same
     * aggregate as views: it is a count over a grouped set. The CTE collapses
     * each session to its view count first, then the outer query counts the
     * ones that stopped at one page.
     *
     * Note what a "session" is here -- `lib/analytics.ts` rotates the hash
     * daily, so a visitor across two days is two sessions. For bounce rate
     * that is the behaviour you want anyway: two separate visits.
     */
    const rows = await sql`
        with per_session as (
            select session_hash, count(*) as views
            from page_view
            where ts >= now() - make_interval(days => ${days})
            group by session_hash
        )
        select
            coalesce(sum(views), 0)::int                          as views,
            count(*)::int                                         as visitors,
            count(*) filter (where views = 1)::int                 as bounced
        from per_session
    `
    const row = rows[0] ?? { views: 0, visitors: 0, bounced: 0 }
    const visitors = Number(row.visitors)
    return {
        views: Number(row.views),
        visitors,
        bounceRate: visitors === 0 ? 0 : Math.round((Number(row.bounced) / visitors) * 100),
    }
}

export async function breakdown(
    dimension: Dimension,
    days: number,
    limit = 12,
): Promise<Breakdown[]> {
    const column = DIMENSIONS[dimension]
    if (!column) throw new Error(`unknown dimension: ${dimension}`)

    const sql = db()
    // `column` is interpolated, which is only safe because it came out of
    // DIMENSIONS above; `days` and `limit` are bound parameters.
    const rows = await sql.query(
        `select coalesce(nullif(${column}, ''), '(none)') as label,
                count(*)::int                            as views,
                count(distinct session_hash)::int        as visitors
         from page_view
         where ts >= now() - make_interval(days => $1)
         group by 1
         order by visitors desc, views desc, label asc
         limit $2`,
        [days, limit],
    )
    return rows.map((r) => ({
        label: String(r.label),
        views: Number(r.views),
        visitors: Number(r.visitors),
    }))
}

/**
 * Daily series for the chart, with empty days filled in.
 *
 * `generate_series` then a left join, rather than grouping what exists: a day
 * with no traffic produces no rows, and a line chart that simply omits those
 * days draws a continuous line across a gap and silently misreports a quiet
 * week as a smooth one.
 */
export async function dailySeries(days: number): Promise<DayPoint[]> {
    const sql = db()
    const rows = await sql.query(
        `with span as (
             select generate_series(
                 (now() at time zone $2)::date - ($1::int - 1),
                 (now() at time zone $2)::date,
                 interval '1 day'
             )::date as day
         ),
         counted as (
             select (ts at time zone $2)::date        as day,
                    count(*)::int                    as views,
                    count(distinct session_hash)::int as visitors
             from page_view
             where ts >= ((now() at time zone $2)::date - ($1::int - 1))::timestamp at time zone $2
             group by 1
         )
         select to_char(span.day, 'YYYY-MM-DD')  as day,
                coalesce(counted.views, 0)       as views,
                coalesce(counted.visitors, 0)    as visitors
         from span left join counted using (day)
         order by span.day`,
        [days, DAY_TZ],
    )
    return rows.map((r) => ({
        day: String(r.day),
        views: Number(r.views),
        visitors: Number(r.visitors),
    }))
}

/** The cached AI summary, or null when the cron has not written one yet. */
export async function latestInsight(): Promise<{ day: string; body: string } | null> {
    const sql = db()
    const rows = await sql`
        select to_char(day, 'YYYY-MM-DD') as day, body
        from insight_daily order by day desc limit 1
    `
    if (!rows.length) return null
    return { day: String(rows[0].day), body: String(rows[0].body) }
}

export type Snapshot = {
    days: number
    totals: Totals
    series: DayPoint[]
    breakdowns: Record<Dimension, Breakdown[]>
    insight: { day: string; body: string } | null
}

/** Everything the dashboard needs, in one pass. */
export async function snapshot(days: number): Promise<Snapshot> {
    const [totalsRow, series, insight, ...lists] = await Promise.all([
        totals(days),
        dailySeries(days),
        latestInsight(),
        ...DIMENSION_KEYS.map((key) => breakdown(key, days)),
    ])

    const breakdowns = Object.fromEntries(
        DIMENSION_KEYS.map((key, index) => [key, lists[index]]),
    ) as Record<Dimension, Breakdown[]>

    return { days, totals: totalsRow, series, breakdowns, insight }
}
