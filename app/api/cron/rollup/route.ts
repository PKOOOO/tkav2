import { pruneRaw, reportingDays, rollupDay, RETENTION_DAYS } from '@/lib/analytics'
import { hasDb } from '@/lib/db'
import { canGenerateInsight, generateInsight } from '@/lib/insight'

/**
 * Nightly aggregation: fold raw page views into the daily rollups, then drop
 * raw rows older than the retention window.
 *
 * Scheduled by `vercel.json` as `10 21 * * *`. **Vercel Cron schedules are
 * UTC**, and `lib/analytics.ts` reports in `Africa/Nairobi` (UTC+3), so 21:10
 * UTC is 00:10 Nairobi -- ten minutes after the reporting day it is meant to
 * close actually closes. A literal `10 0 * * *` would run at 03:10 Nairobi and
 * spend three hours each night with yesterday still unrolled. That file is
 * strict JSON and cannot hold a comment, which is why this note lives here.
 *
 * **Both yesterday and today are rolled up, every run.** Yesterday is the day
 * that just closed and is the real target. Today is included so the dashboard
 * is not blank until the next midnight -- it reads only the rollup tables, so
 * without a partial row for the current day it would show nothing for up to 24
 * hours. `rollupDay` upserts, so recomputing a day already rolled up replaces
 * its numbers instead of adding to them, which is what makes that safe.
 *
 * Pruning happens after the rollups, never before: a raw row must be counted
 * before it is allowed to disappear.
 */
export async function GET(request: Request) {
    const secret = process.env.CRON_SECRET
    if (!secret) {
        return Response.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
    }

    // Vercel Cron sends this header automatically when CRON_SECRET is set on
    // the project. Without the check the endpoint is a public button that
    // anyone can hold down -- each press is a full table scan.
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
        return Response.json({ error: 'unauthorized' }, { status: 401 })
    }

    if (!hasDb()) {
        return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 500 })
    }

    const { today, yesterday } = reportingDays()

    try {
        const rolled = {
            [yesterday]: await rollupDay(yesterday),
            [today]: await rollupDay(today),
        }
        const pruned = await pruneRaw()

        /**
         * The AI note shares this cron rather than having its own, because
         * Vercel's cron allowance is small and the two always want to run
         * together anyway.
         *
         * Its failure is reported, not thrown: the rollups and the prune have
         * already committed by this point, and losing a 500 over a missing API
         * key or a rate limit would make the cron look like it did nothing. The
         * dashboard treats a missing note as "no note yet", which is also what
         * it shows before the first run.
         */
        const insight = canGenerateInsight()
            ? await generateInsight(today).catch((error) => {
                  console.error('[analytics] insight failed:', error)
                  return { ok: false as const, reason: 'threw' }
              })
            : { ok: false as const, reason: 'ANTHROPIC_API_KEY is not set' }

        return Response.json({
            ok: true,
            rolled,
            pruned,
            retentionDays: RETENTION_DAYS,
            insight: insight.ok
                ? { generated: !insight.cached, model: insight.model }
                : { generated: false, reason: insight.reason },
        })
    } catch (error) {
        console.error('[analytics] rollup failed:', error)
        return Response.json({ error: 'rollup failed' }, { status: 500 })
    }
}
