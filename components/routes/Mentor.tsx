'use client'

import { RESPONSIVE } from '@/components/breakpoints'

import TeamGrid from '@/components/TeamGrid'

import MentorHero from '@/framer/mentor-section-1-hero.jsx'
import MentorCta from '@/framer/cta-mentor.jsx'

/**
 * Mentor listing.
 *
 * The middle section is ours rather than Framer's. `mentor-section-2-mentor`
 * draws its cards from a collection fetched from Framer at runtime, so it shows
 * the four template mentors and there is no way to add to them from here --
 * see the note at the top of lib/team.ts. The hero and the CTA around it are
 * still the generated components.
 */
export default function Mentor() {
    return (
        <>
            <MentorHero.Responsive variants={RESPONSIVE} />
            <TeamGrid />
            <MentorCta.Responsive variants={RESPONSIVE} />
        </>
    )
}
