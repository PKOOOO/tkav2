'use client'

import { RESPONSIVE } from '@/components/breakpoints'

import PricingHero from '@/framer/pricing-section-1-hero.jsx'
import PricingComparison from '@/framer/pricing-section-2-comparison.jsx'
import PricingPromise from '@/framer/pricing-section-3-promise.jsx'
import PricingFaqs from '@/framer/pricing-section-4-fa-qs.jsx'

/** Pricing. */
export default function Pricing() {
    return (
        <>
            <PricingHero.Responsive variants={RESPONSIVE} />
            <PricingComparison.Responsive variants={RESPONSIVE} />
            <PricingPromise.Responsive variants={RESPONSIVE} />
            <PricingFaqs.Responsive variants={RESPONSIVE} />
        </>
    )
}
