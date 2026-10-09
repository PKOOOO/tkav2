'use client'

import Link from 'next/link'

import { CARD_TOKENS, team, hasMentorProfile, type TeamMember } from '@/lib/team'
import styles from './TeamGrid.module.css'

/**
 * The team section on /mentor, replacing the generated
 * `mentor-section-2-mentor.jsx`.
 *
 * That section is not reusable here: its cards come from `<QueryData>` against
 * a collection fetched from Framer at runtime, the "Founder Card" component
 * that draws each tile is declared inside the generated file and never
 * exported, and the React Export subscription has lapsed so it cannot be ticked
 * and re-emitted. The card below is therefore a reimplementation, measured off
 * the live original -- see TeamGrid.module.css.
 *
 * Only this one section is replaced. The page's heading still comes from
 * `mentor-section-1-hero.jsx` and the CTA below it from `cta-mentor.jsx`.
 */
export default function TeamGrid() {
    const featured = team.find((member) => member.featured)
    const rest = team.filter((member) => !member.featured)

    return (
        <section className={styles.section}>
            <div className={styles.grid}>
                {featured && (
                    <article className={`${styles.card} ${styles.featured}`}>
                        <Portrait member={featured} priority />
                        <div className={styles.featuredBody}>
                            <span className={styles.pill}>{featured.role}</span>
                            <h2 className={styles.featuredName}>{featured.name}</h2>
                        </div>
                    </article>
                )}

                {rest.map((member, index) => (
                    <MentorDisplayCard key={member.slug} member={member}
                        color={CARD_TOKENS[index % CARD_TOKENS.length]} />
                ))}

                <article className={`${styles.card} ${styles.cta}`}>
                    <h2 className={styles.ctaTitle}>Share what you know. Shape what&rsquo;s next.</h2>
                    <p className={styles.role}>
                        Inspire students, share your expertise, and make learning more meaningful.
                    </p>
                    <Link className={styles.ctaButton} href='/contact'>
                        Join our mentors
                    </Link>
                </article>
            </div>
        </section>
    )
}

/** The demo's display card only: no floating customization controls. */
export function MentorDisplayCard({ member, color }: { member: TeamMember; color: string }) {
    const content = (
        <>
            <div className={styles.cardColor} style={{ background: color }} aria-hidden='true' />
            <Portrait member={member} />
            <div className={styles.cardBody}>
                <h2 className={styles.name}>{member.name}</h2>
                <p className={styles.role}>{member.role}</p>
            </div>
        </>
    )
    const className = `${styles.card} ${styles.displayCard}`
    if (!hasMentorProfile(member)) return <article className={className}>{content}</article>
    return (
        <Link href={`/mentor/${member.slug}`} aria-label={`View ${member.name}'s profile`}
            className={`${className} ${styles.profileLink}`}>
            {content}
        </Link>
    )
}

function Portrait({ member, priority }: { member: { slug: string; name: string }; priority?: boolean }) {
    return (
        <div className={styles.portrait}>
            {/* A plain <img>: these are pre-sized by scripts/extract-team.py to
             * the largest box the layout ever gives them and are already WebP,
             * so next/image would add a loader round-trip for no saving. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={`/team/${member.slug}.webp`}
                alt={member.name}
                loading={priority ? 'eager' : 'lazy'}
                decoding='async'
            />
        </div>
    )
}
