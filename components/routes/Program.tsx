'use client'

import { RESPONSIVE } from '@/components/breakpoints'

import ProgramHero from '@/framer/program-section-1-hero.jsx'
import ProgramCta from '@/framer/cta-program.jsx'

/** Program listing. */
export default function Program() {
    return (
        <>
            <ProgramHero.Responsive variants={RESPONSIVE} />
            <ProgramCta.Responsive variants={RESPONSIVE} />
        </>
    )
}
