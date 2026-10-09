'use client'

import { RESPONSIVE } from '@/components/breakpoints'
import AboutImpactHighlights from '@/components/AboutImpactHighlights'
import AboutMissionVision from '@/components/AboutMissionVision'
import HomeMentors from '@/components/HomeMentors'
import { useAboutHeroCopy } from '@/lib/useAboutHeroCopy'
import { useAboutHeroVideo } from '@/lib/useAboutHeroVideo'
import { useAboutTeachCopy } from '@/lib/useAboutTeachCopy'
import { useAboutPrincipleCopy } from '@/lib/useAboutPrincipleCopy'
import { useAboutImpactStats } from '@/lib/useAboutImpactStats'
import { useAboutCtaCopy } from '@/lib/useAboutCtaCopy'

import AboutHero from '@/framer/about-section-1-hero.jsx'
import AboutCounter from '@/framer/about-section-2-counter.jsx'
import AboutTeach from '@/framer/about-section-3-teach.jsx'
import AboutOnline from '@/framer/about-section-4-online.jsx'
import AboutTeam from '@/framer/about-section-5-team.jsx'
import AboutPrinciple from '@/framer/about-section-6-principle.jsx'
import AboutCta from '@/framer/cta-about.jsx'

/** About. */
export default function About() {
    useAboutHeroCopy()
    useAboutHeroVideo()
    useAboutImpactStats()
    useAboutTeachCopy()
    useAboutPrincipleCopy()
    useAboutCtaCopy()

    return (
        <>
            <AboutHero.Responsive variants={RESPONSIVE} />
            <AboutCounter.Responsive variants={RESPONSIVE} />
            <AboutImpactHighlights />
            <AboutMissionVision />
            <AboutTeach.Responsive variants={RESPONSIVE} />
            <AboutOnline.Responsive variants={RESPONSIVE} />
            <AboutTeam.Responsive variants={RESPONSIVE} />
            <HomeMentors route='/about' />
            <AboutPrinciple.Responsive variants={RESPONSIVE} />
            <AboutCta.Responsive variants={RESPONSIVE} />
        </>
    )
}
