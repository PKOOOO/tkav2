/**
 * The team shown on /mentor.
 *
 * This is local data on purpose. The generated `mentor-section-2-mentor.jsx`
 * renders its cards from `<QueryData>` against a collection that is fetched
 * from Framer at runtime (`framerusercontent.com/cms/....framercms`), so the
 * four people in it cannot be changed or added to from this repo -- and
 * unframer's `useQueryData` resolves through a module-level cache with no
 * context to inject into, so there is no supported way to feed it this array
 * either. `components/TeamGrid.tsx` therefore replaces that section outright.
 *
 * Portraits are built from `public/brand/` by `scripts/extract-team.py`; run it
 * after adding or replacing a source. The card renders them with `contain` and
 * bottom alignment, so a portrait's own aspect ratio does not matter.
 */
export type TeamMember = {
    /** Also the portrait's filename: `public/team/<slug>.webp`. */
    slug: string
    name: string
    role: string
    /** Renders in the wide leading card rather than the grid. */
    featured?: boolean
}

export const hasMentorProfile = (member: TeamMember) =>
    member.slug !== 'paul-akwabi' && member.slug !== 'hebron-mwagodi'

/**
 * Card backgrounds, as the Framer colour styles rather than literal rgb, so
 * they keep tracking the token block in `app/globals.css`. These are the same
 * four the template's own mentor cards use.
 */
export const CARD_TOKENS = [
    'var(--token-e8cec243-b334-4568-a85b-a75cea534593, rgb(198, 220, 240))', // Soft Azure
    'var(--token-d0e4cb96-2373-4292-a52b-0c70e08d9898, rgb(230, 214, 240))', // Soft Violet
    'var(--token-78006fc2-4aed-468c-a9d5-0eb0993d6aea, rgb(214, 236, 255))', // Soft Sky
    'var(--token-9f7780f5-af12-4101-9125-2580d35c4118, rgb(207, 233, 230))', // Soft Teal
]

export const team: TeamMember[] = [
    { slug: 'paul-akwabi', name: 'Paul Akwabi', role: 'Founder', featured: true },
    { slug: 'hebron-mwagodi', name: 'Hebron Mwagodi', role: 'Programs, M&E and Partnerships' },
    { slug: 'brian-bii', name: 'Brian Bii', role: 'Marketing, Strategy and Partnerships' },
    { slug: 'najla-yusuf', name: 'Najla Yusuf', role: 'Admin, Hub Manager, Finance and Partnerships' },
    { slug: 'diana-wamboi', name: 'Diana Wamboi', role: 'Social Media Manager & Comms Assistant' },
    { slug: 'pius-khainja', name: 'Pius Khainja', role: 'ACTO & Lead Software Engineer' },
    { slug: 'avril-diamond', name: 'Avril Diamond', role: 'ASE & Learning Facilitator' },
    { slug: 'peter-lagat', name: 'Peter Lagat', role: 'CTO and Robotics Lead' },
    { slug: 'justin-njuguna', name: 'Justin Njuguna', role: 'Communications and Graphics' },
    { slug: 'clemence-kibet', name: 'Clemence Kibet', role: 'Robotics Trainer & Learning Facilitator' },
    { slug: 'hussein-mohammed', name: 'Hussein Mohammed', role: 'Learning Facilitator' },
    { slug: 'mimah-charo', name: 'Mimah Charo', role: 'Learning Facilitator' },
    { slug: 'mohammed', name: 'Mohammed', role: 'Learning Facilitator' },
    { slug: 'monica-akinyi', name: 'Monica Akinyi', role: 'Learning Facilitator' },
]
