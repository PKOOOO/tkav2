'use client'

import { RESPONSIVE } from '@/components/breakpoints'
import { findLegalPage } from '@/lib/cms'
import { NotFoundNotice } from '@/components/shared'

import Hero, { __bindCmsFields as bindHero } from '@/framer/legal-section-1-hero.jsx'

/**
 * `__bindCmsFields` assigns module-level vars inside the generated component, so
 * it must run during this render pass -- not in an effect, or the component
 * renders once with stale values. That module state is shared, which is why this
 * whole subtree is client-only: see the note in app/program/[slug]/page.tsx.
 */
export default function LegalDetail({ slug }: { slug: string }) {
    const page = findLegalPage(slug)
    if (!page) return <NotFoundNotice what='Page' backHref='/' />

    bindHero(page.byId)

    return <Hero.Responsive variants={RESPONSIVE} />
}
