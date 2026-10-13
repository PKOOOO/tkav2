import {
    ADDRESS,
    EMAIL,
    OPENING_HOURS,
    PHONE,
    SITE_DESCRIPTION,
    SITE_NAME,
    SITE_URL,
    SOCIAL_PROFILES,
    absolute,
} from '@/lib/site'

/**
 * Organization + LocalBusiness, as JSON-LD in the document head.
 *
 * This is a server component on purpose, and it is the reason it is worth
 * writing at all. `components/Shell.tsx` gates the whole Framer tree behind
 * `mounted`, so the HTML a crawler is served contains no headings, no body
 * copy and no links -- only what the server rendered. Everything below is in
 * that HTML, which makes it the one place a non-rendering crawler can learn
 * what this site is, who runs it, and where they are.
 *
 * Both nodes live in a single `@graph` with `@id`s so the LocalBusiness and
 * the Organization are understood as one entity rather than two businesses
 * that happen to share an address.
 */

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

const postalAddress = {
    '@type': 'PostalAddress',
    streetAddress: ADDRESS.street,
    addressLocality: ADDRESS.locality,
    addressRegion: ADDRESS.region,
    addressCountry: ADDRESS.country,
}

const graph = [
    {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        email: EMAIL,
        telephone: PHONE,
        address: postalAddress,
        logo: {
            '@type': 'ImageObject',
            url: absolute('/fav/android-chrome-512x512.png'),
            width: 512,
            height: 512,
        },
        sameAs: SOCIAL_PROFILES,
    },
    {
        // `EducationalOrganization` is the accurate type, but it is not one of
        // the LocalBusiness subtypes Google reads opening hours and address
        // from. Declaring both keeps the semantics and the local-pack
        // eligibility, and the shared `@id` above stops it reading as a
        // second business.
        '@type': ['LocalBusiness', 'EducationalOrganization'],
        '@id': `${SITE_URL}/#localbusiness`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        email: EMAIL,
        telephone: PHONE,
        address: postalAddress,
        image: absolute('/opengraph-image'),
        parentOrganization: { '@id': ORGANIZATION_ID },
        areaServed: {
            '@type': 'City',
            name: 'Mombasa',
        },
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [...OPENING_HOURS.days],
                opens: OPENING_HOURS.opens,
                closes: OPENING_HOURS.closes,
            },
        ],
    },
    {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: { '@id': ORGANIZATION_ID },
        inLanguage: 'en',
    },
]

export default function StructuredData() {
    return (
        <script
            type='application/ld+json'
            // Every value is a literal from `lib/site.ts` -- no user input
            // reaches this, so there is nothing here to escape.
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
            }}
        />
    )
}
