import type { Metadata } from 'next'

import AdminLogin from '@/components/admin/AdminLogin'
import Dashboard from '@/components/admin/Dashboard'
import { adminConfigured, isAdmin } from '@/lib/admin-auth'
import { snapshot } from '@/lib/analytics-queries'
import { hasDb } from '@/lib/db'

/**
 * `noindex` rather than a `robots.txt` entry. A `Disallow: /admin` line would
 * publish the path to anyone who reads robots.txt -- which is everyone -- while
 * doing nothing a crawler is obliged to respect. The meta directive keeps it
 * out of the index without advertising it, and the session cookie is what
 * actually protects it.
 */
export const metadata: Metadata = {
    title: 'Analytics',
    robots: { index: false, follow: false },
}

/**
 * Nothing here may be cached or prerendered: the page's content depends on the
 * request's cookie, and a cached copy would either leak one visitor's
 * dashboard to the next or freeze the numbers.
 */
export const dynamic = 'force-dynamic'

export default async function Page() {
    /**
     * The gate is here, in a server component, before any data is fetched --
     * not in a client layout. The dashboard HTML is never produced for an
     * unauthenticated request, so there is nothing to reveal in the payload.
     * `app/api/admin/stats/route.ts` re-checks for the same reason.
     */
    if (!(await isAdmin())) {
        return <AdminLogin configured={adminConfigured()} />
    }

    if (!hasDb()) {
        return (
            <AdminLogin
                configured
                notice="DATABASE_URL is not configured, so there is nothing to show yet."
            />
        )
    }

    // Rendered server-side for the first paint; the client re-fetches from
    // /api/admin/stats when the window is changed.
    const initial = await snapshot(7)
    return <Dashboard initial={initial} />
}
