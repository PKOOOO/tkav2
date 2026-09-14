'use client'

import { RESPONSIVE } from '@/components/breakpoints'

import AboutHero from '@/framer/about-section-1-hero.jsx'
import AboutCounter from '@/framer/about-section-2-counter.jsx'
import AboutTeach from '@/framer/about-section-3-teach.jsx'
import AboutOnline from '@/framer/about-section-4-online.jsx'
import AboutTeam from '@/framer/about-section-5-team.jsx'
import AboutPrinciple from '@/framer/about-section-6-principle.jsx'
import AboutCta from '@/framer/cta-about.jsx'

/** About. */
export default function About() {
    return (
        <>
            <AboutHero.Responsive variants={RESPONSIVE} />
            <AboutCounter.Responsive variants={RESPONSIVE} />
            <AboutTeach.Responsive variants={RESPONSIVE} />
            <AboutOnline.Responsive variants={RESPONSIVE} />
            <AboutTeam.Responsive variants={RESPONSIVE} />
            <AboutPrinciple.Responsive variants={RESPONSIVE} />
            <AboutCta.Responsive variants={RESPONSIVE} />
        </>
    )
}
