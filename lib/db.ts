import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

/**
 * The Neon client, shared by the ingest route, the rollup cron and /admin.
 *
 * `neon()` is the **HTTP** driver: every query is a one-shot `fetch`, with no
 * connection held open between calls. That is why the project's direct
 * endpoint works here rather than the `-pooler` one -- there is no pool to
 * exhaust, so the usual serverless advice about pooled connection strings does
 * not apply. If anything here ever moves to the `Pool`/WebSocket driver or to
 * `pg`, switch `DATABASE_URL` to the `-pooler` host at the same time.
 *
 * Resolved lazily rather than at module scope. `app/sitemap.ts` and the route
 * tree are evaluated during `next build`, and a module-level `neon(...)` throw
 * on a missing env var would fail the build on a machine that has no database
 * configured, for pages that never touch the database.
 *
 * Typed as `NeonQueryFunction<false, false>` rather than
 * `ReturnType<typeof neon>`: `neon` is an overloaded generic, so `ReturnType`
 * widens to a union covering every array-mode/full-results combination, and
 * query results then come back as `any[][] | Record<string, any>[] |
 * FullQueryResults` -- a type with no `.length` or `.map`. Naming the two
 * defaults keeps rows as `Record<string, any>[]`.
 */
let client: NeonQueryFunction<false, false> | null = null

export function db() {
    if (client) return client
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    client = neon(url)
    return client
}

/** True when a database is configured at all, so callers can degrade quietly. */
export const hasDb = () => Boolean(process.env.DATABASE_URL)
