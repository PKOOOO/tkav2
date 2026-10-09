'use client'

import { RESPONSIVE } from '@/components/breakpoints'
import { hydrateEmbeds } from '@/lib/cms'
import { findMentorProfile } from '@/lib/mentor-profiles'
import { NotFoundNotice } from '@/components/shared'
import styles from './MentorDetail.module.css'

import Hero, { __bindCmsFields as bindHero } from '@/framer/mentor-detail-section-1-hero.jsx'
import Session, { __bindCmsFields as bindSession } from '@/framer/mentor-detail-section-2-session.jsx'
import Testimonial from '@/framer/mentor-detail-section-3-testimonial.jsx'
import Cta from '@/framer/cta-mentor.jsx'

/**
 * `__bindCmsFields` assigns module-level vars inside the generated component, so
 * it must run during this render pass -- not in an effect, or the component
 * renders once with stale values. That module state is shared, which is why this
 * whole subtree is client-only: see the note in app/program/[slug]/page.tsx.
 */
export default function MentorDetail({ slug }: { slug: string }) {
    const mentor = findMentorProfile(slug)
    if (!mentor) return <NotFoundNotice what='Mentor' backHref='/mentor' />

    const fields = hydrateEmbeds(mentor.byId)

    bindHero(fields)
    bindSession(fields)

    return (
        <>
            <Hero.Responsive variants={RESPONSIVE} className={styles.hero} />
            <Session.Responsive variants={RESPONSIVE} />
            <Testimonial.Responsive variants={RESPONSIVE} />
            <Cta.Responsive variants={RESPONSIVE} />
        </>
    )
}
