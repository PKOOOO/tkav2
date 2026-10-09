'use client'

import { RESPONSIVE } from '@/components/breakpoints'
import HomeScratchProgramArt from '@/components/HomeScratchProgramArt'
import HomeProgramCards from '@/components/HomeProgramCards'
import HomeHeroSquigglyText from '@/components/HomeHeroSquigglyText'
import HomeImpactStats from '@/components/HomeImpactStats'
import HomeMentors from '@/components/HomeMentors'

import HomeMain from '@/framer/section-1-main.jsx'

/** Home. Framer packs all ten home sections into one component. */
export default function Home() {
    return (
        <>
            <HomeMain.Responsive variants={RESPONSIVE} />
            <HomeProgramCards />
            <HomeHeroSquigglyText />
            <HomeScratchProgramArt />
            <HomeImpactStats />
            <HomeMentors />
        </>
    )
}
