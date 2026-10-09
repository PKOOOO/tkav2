'use client'

import { RESPONSIVE } from '@/components/breakpoints'
import ProgramListing from '@/components/ProgramListing'
import ProgramIntroCopy from '@/components/ProgramIntroCopy'

import ProgramHero from '@/framer/program-section-1-hero.jsx'
import ProgramCta from '@/framer/cta-program.jsx'

/** Program listing. */
export default function Program() {
    return (
        <>
            <ProgramHero.Responsive variants={RESPONSIVE} className="local-program-listing" />
            <ProgramIntroCopy />
            <ProgramListing />
            <ProgramCta.Responsive variants={RESPONSIVE} />
        </>
    )
}
