import type { MetadataRoute } from 'next'

import { absolute, SITE_URL } from '@/lib/site'

/**
 * Nothing on this site is private, so the only job here is pointing crawlers at
 * the sitemap.
 *
 * `/programs` used to be disallowed here, as a duplicate of `/program`. It is
 * now a 301 to `/program` instead (see `next.config.ts`), and the disallow had
 * to go with it: `/programs` is the URL Google indexed on the site this
 * replaces, and a blocked URL cannot be crawled, so the redirect would never
 * be seen and the stale entry would sit in the index indefinitely. A redirect
 * only works if the crawler is allowed to follow it.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
            },
        ],
        sitemap: absolute('/sitemap.xml'),
        host: SITE_URL,
    }
}
