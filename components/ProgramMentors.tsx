'use client'

import { AnimatedTestimonials, type Testimonial } from '@/components/ui/animated-testimonials'
import { PROGRAM_OVERRIDES } from '@/lib/cms-overrides'
import { MENTOR_CONTENT } from '@/lib/mentor-content'
import { team } from '@/lib/team'

import styles from './ProgramMentors.module.css'

const EXCLUDED_TEAM = new Set([
    'paul-akwabi',
    'hebron-mwagodi',
    'brian-bii',
    'diana-wamboi',
])

/** Every program shows the same team, with its own lead first. */
const ELIGIBLE_TEAM = team.filter(({ slug }) => !EXCLUDED_TEAM.has(slug))

const TEAM_BIOS: Record<string, string> = {
    'clemence-kibet': 'Clemence is a Robotics Trainer and Learning Facilitator at Tech Kidz Africa, bringing hands-on building and coding into the learning space.',
    'pius-khainja': 'Pius leads software engineering at Tech Kidz Africa, connecting web, mobile and server-side work to practical projects.',
    'peter-lagat': 'Peter leads robotics at Tech Kidz Africa, connecting physical builds with the software that drives them.',
    'avril-diamond': 'Avril combines assistant software engineering with learning facilitation at Tech Kidz Africa.',
}

export function hasProgramMentors(slug: string) {
    return typeof PROGRAM_OVERRIDES[slug]?.mentor === 'object'
}

export default function ProgramMentors({ slug }: { slug: string }) {
    const lead = PROGRAM_OVERRIDES[slug]?.mentor
    if (!lead || typeof lead === 'string') return null

    const profiles: Testimonial[] = [...new Set([lead.slug, ...ELIGIBLE_TEAM.map(({ slug }) => slug)])]
        .filter((mentorSlug) => !EXCLUDED_TEAM.has(mentorSlug))
        .map((mentorSlug) => {
            const member = team.find((person) => person.slug === mentorSlug)
            if (!member) return null
            return {
                name: mentorSlug === lead.slug ? lead.name : member.name,
                designation: mentorSlug === lead.slug ? lead.role : member.role,
                quote: mentorSlug === lead.slug
                    ? lead.description
                    : (TEAM_BIOS[mentorSlug]
                        ?? (MENTOR_CONTENT[mentorSlug]
                            ? member.name + ' ' + MENTOR_CONTENT[mentorSlug].description
                            : member.name + ' is a ' + member.role + ' at Tech Kidz Africa.')),
                src: mentorSlug === lead.slug ? lead.image : '/team/' + member.slug + '.webp',
            }
        })
        .filter((profile): profile is Testimonial => profile !== null)

    return (
        <section className={styles.section} aria-labelledby="program-mentors-heading">
            <div className={styles.inner}>
                <div className={styles.headingRow}>
                    <div>
                        <h2 id="program-mentors-heading" className={styles.heading}>Team behind the program</h2>
                    </div>
                </div>

                <AnimatedTestimonials
                    key={slug}
                    testimonials={profiles}
                    portraitStyle="team"
                    details={
                        <div className={styles.focusBlock}>
                            <p className={styles.topicsLabel}>Program focus</p>
                            <ul className={styles.topicList}>
                                {lead.expertise.map((topic) => (
                                    <li className={styles.topic} key={topic}>{topic}</li>
                                ))}
                            </ul>
                            <a className={styles.cta} href="/contact">Book asession</a>
                        </div>
                    }
                />
            </div>
        </section>
    )
}
