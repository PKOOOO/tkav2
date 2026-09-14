'use client'

import { RESPONSIVE } from '@/components/breakpoints'

import ContactHero from '@/framer/contact-section-1-hero.jsx'
import ContactProcess from '@/framer/contact-section-2-process.jsx'
import ContactFaqs from '@/framer/contact-section-3-fa-qs.jsx'

/** Contact. */
export default function Contact() {
    return (
        <>
            <ContactHero.Responsive variants={RESPONSIVE} />
            <ContactProcess.Responsive variants={RESPONSIVE} />
            <ContactFaqs.Responsive variants={RESPONSIVE} />
        </>
    )
}
