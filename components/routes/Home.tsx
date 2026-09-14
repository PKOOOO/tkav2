'use client'

import { RESPONSIVE } from '@/components/breakpoints'

import HomeMain from '@/framer/section-1-main.jsx'

/** Home. Framer packs all ten home sections into one component. */
export default function Home() {
    return (
        <>
            <HomeMain.Responsive variants={RESPONSIVE} />
        </>
    )
}
