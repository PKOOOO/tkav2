/**
 * Canonical facts about the business, in one place.
 *
 * Four things consume this and they must not drift apart: the root metadata,
 * the JSON-LD block, `sitemap.ts`, and every page's `alternates.canonical`.
 * A name/address/phone that disagrees with the Google Business Profile is the
 * single most effective way to suppress a local-search ranking, so the values
 * below are also what should be in that profile, character for character.
 *
 * The contact details are duplicated at runtime by
 * `components/ContactDetails.tsx` and `scripts/patch-text-overrides.mjs`, which
 * rewrite the Framer template's placeholders in the DOM. Those exist because
 * the generated markup cannot be edited; this file is the server-side source.
 * If a detail changes, it has to change in all three.
 */

export const SITE_URL = 'https://techkidzafrica.co.ke'

export const SITE_NAME = 'Tech Kidz Africa'

export const SITE_DESCRIPTION =
    'Tech Kidz Africa is a technology academy in Mombasa, Kenya, teaching children and youth coding, robotics, 3D design, digital literacy and AI through hands-on projects.'

/** Street address, as it should read on the Google Business Profile. */
export const ADDRESS = {
    street: 'Bustani Close, Off Links Road, Nyali',
    locality: 'Mombasa',
    region: 'Mombasa County',
    country: 'KE',
} as const

export const EMAIL = 'info@techkidzafrica.co.ke'

/** E.164, which is what `telephone` in schema.org expects. */
export const PHONE = '+254780754126'

export const OPENING_HOURS = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '08:00',
    closes: '17:00',
} as const

/**
 * Profiles Google can use to reconcile this site with the entity behind it.
 * Kept in step with the footer's four links, set in
 * `scripts/patch-text-overrides.mjs` -- a `sameAs` pointing somewhere the site
 * does not visibly link is worth nothing.
 */
export const SOCIAL_PROFILES = [
    'https://www.instagram.com/techkidzafrica/',
    'https://x.com/techkidzafrica',
    'https://www.youtube.com/@techkidzafrica',
    'https://ke.linkedin.com/company/tech-kidz-africa',
]

/** Absolute URL for a site-relative path, for canonicals and the sitemap. */
export const absolute = (path: string) => (path === '/' ? SITE_URL : `${SITE_URL}${path}`)
