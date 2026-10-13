'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { RESPONSIVE } from '@/components/breakpoints'
import ContactDetails from '@/components/ContactDetails'
import ContactRequestDialog from '@/components/ContactRequestDialog'
import Image from 'next/image'
import styles from './Contact.module.css'

import ContactHero from '@/framer/contact-section-1-hero.jsx'
import ContactProcess from '@/framer/contact-section-2-process.jsx'
import ContactFaqs from '@/framer/contact-section-3-fa-qs.jsx'

function ContactCrab() {
    const [section, setSection] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const page = document.querySelector<HTMLElement>('.unframer-page[data-route="/contact"]')
        if (!page) return

        const findSection = () => {
            const next = page.querySelector<HTMLElement>('section[data-framer-name="FAQs"]')
            setSection((current) => current === next ? current : next)
        }

        findSection()
        const observer = new MutationObserver(findSection)
        observer.observe(page, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    return section && createPortal(
        <div className={styles.crabSlot} aria-hidden="true">
            <Image src="/decor/crab.png" alt="" width={215} height={162} unoptimized />
        </div>,
        section,
    )
}

/** Contact. */
export default function Contact() {
    return (
        <>
            <ContactHero.Responsive variants={RESPONSIVE} />
            <ContactDetails />
            <ContactRequestDialog />
            <ContactProcess.Responsive variants={RESPONSIVE} />
            <ContactFaqs.Responsive variants={RESPONSIVE} />
            <ContactCrab />
        </>
    )
}
