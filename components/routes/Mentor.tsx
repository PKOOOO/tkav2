'use client'

import { RESPONSIVE } from '@/components/breakpoints'

import MentorHero from '@/framer/mentor-section-1-hero.jsx'
import MentorList from '@/framer/mentor-section-2-mentor.jsx'
import MentorCta from '@/framer/cta-mentor.jsx'

/** Mentor listing. */
export default function Mentor() {
    return (
        <>
            <MentorHero.Responsive variants={RESPONSIVE} />
            <MentorList.Responsive variants={RESPONSIVE} />
            <MentorCta.Responsive variants={RESPONSIVE} />
        </>
    )
}
