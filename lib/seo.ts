import type { Metadata } from 'next'

import { SITE_NAME } from './site'

/**
 * Builds a page's metadata from the four things that actually vary.
 *
 * Written as a helper because the three fields that matter most for sharing --
 * `alternates.canonical`, `openGraph.title/description/url` and the Twitter
 * pair -- restate the title and description verbatim, and hand-writing that on
 * twelve routes is how a page ends up with a `<title>` that disagrees with its
 * own OG card. The root layout supplies `metadataBase`, so `path` stays
 * relative here.
 *
 * `title` is passed through the root layout's `%s | Tech Kidz Africa` template,
 * so it must not repeat the site name. The OG title does not go through the
 * template, so it is composed explicitly below.
 */
export function pageMetadata({
    title,
    description,
    path,
    noindex = false,
}: {
    title: string
    description: string
    path: string
    /** For pages that must stay reachable but out of the index. */
    noindex?: boolean
}): Metadata {
    const social = `${title} | ${SITE_NAME}`

    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: {
            type: 'website',
            siteName: SITE_NAME,
            locale: 'en_KE',
            url: path,
            title: social,
            description,
        },
        twitter: {
            card: 'summary_large_image',
            title: social,
            description,
        },
        ...(noindex ? { robots: { index: false, follow: true } } : {}),
    }
}
