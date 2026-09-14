'use client'

import { RESPONSIVE } from '@/components/breakpoints'
import { findProgram, hydrateEmbeds } from '@/lib/cms'
import { NotFoundNotice } from '@/components/shared'

import Hero, { __bindCmsFields as bindHero } from '@/framer/program-detail-section-1-hero.jsx'
import Course, { __bindCmsFields as bindCourse } from '@/framer/program-detail-section-2-course.jsx'
import Mentor, { __bindCmsFields as bindMentor } from '@/framer/program-detail-section-3-mentor.jsx'
import Faqs, { __bindCmsFields as bindFaqs } from '@/framer/program-detail-section-4-fa-qs.jsx'
import Cta from '@/framer/cta-program.jsx'

/**
 * `__bindCmsFields` assigns module-level vars inside the generated component, so
 * it must run during this render pass -- not in an effect, or the component
 * renders once with stale values. That module state is shared, which is why this
 * whole subtree is client-only: see the note in app/program/[slug]/page.tsx.
 */
export default function ProgramDetail({ slug }: { slug: string }) {
    const program = findProgram(slug)
    if (!program) return <NotFoundNotice what='Program' backHref='/program' />

    // Rich-text fields backed by component embeds arrive as descriptors; turn
    // them into real Framer components before they reach the bindings.
    const fields = hydrateEmbeds(program.byId)

    bindHero(fields)
    bindCourse(fields)
    bindMentor(fields)
    bindFaqs(fields)

    return (
        <>
            <Hero.Responsive variants={RESPONSIVE} />
            <Course.Responsive variants={RESPONSIVE} />
            <Mentor.Responsive variants={RESPONSIVE} />
            <Faqs.Responsive variants={RESPONSIVE} />
            <Cta.Responsive variants={RESPONSIVE} />
        </>
    )
}
