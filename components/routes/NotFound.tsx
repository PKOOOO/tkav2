'use client'

import { RESPONSIVE } from '@/components/breakpoints'

import NotFoundHero from '@/framer/404-section-1-hero.jsx'

/** 404. */
export default function NotFound() {
    return (
        <>
            <NotFoundHero.Responsive variants={RESPONSIVE} />
        </>
    )
}
