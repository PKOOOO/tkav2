import { requireAdmin } from '@/lib/admin-auth'
import { snapshot, windowDays } from '@/lib/analytics-queries'
import { hasDb } from '@/lib/db'

/**
 * The dashboard's data, behind the session cookie.
 *
 * `requireAdmin()` is the first statement for a reason -- see the note in
 * `lib/admin-auth.ts`. The equivalent route on the old site had no check and
 * served visitor data to anyone who requested it.
 */
export async function GET(request: Request) {
    const denied = await requireAdmin()
    if (denied) return denied

    if (!hasDb()) {
        return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 500 })
    }

    // Clamped in `windowDays`, so `?days=99999` cannot ask for a table scan
    // the raw retention window could not answer anyway.
    const days = windowDays(new URL(request.url).searchParams.get('days'))

    try {
        return Response.json(await snapshot(days))
    } catch (error) {
        console.error('[analytics] snapshot failed:', error)
        return Response.json({ error: 'query failed' }, { status: 500 })
    }
}
