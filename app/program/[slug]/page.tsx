import type { Metadata } from 'next'

import ProgramDetail from '@/components/routes/ProgramDetail'
import { findProgram, programHref, programRouteSlugs, programs } from '@/lib/cms'
import { pageMetadata } from '@/lib/seo'

/**
 * cms.json is a build-time snapshot, so every program can be pre-rendered --
 * once each, at its public URL.
 *
 * This used to build both the public slug and Framer's original CMS slug
 * (`mathematics` as well as `animation-and-gamification`), which published two
 * indexable copies of every one of those four courses. The CMS slugs are now
 * 301s in `next.config.ts` instead, so `programHref` is the only thing that
 * resolves them and there is one URL per course.
 */
export function generateStaticParams() {
    return programs.map((item) => ({ slug: programRouteSlugs[item.slug] ?? item.slug }))
}

/**
 * Each course is reachable at two paths: its public slug and the original
 * Framer CMS slug it replaced (`mathematics` -> `animation-and-gamification`),
 * both built above so old links keep working. `programHref` resolves either to
 * the public one, so the canonical here points the alias at the real URL
 * instead of letting the two compete.
 */
export async function generateMetadata(props: PageProps<'/program/[slug]'>): Promise<Metadata> {
    const { slug } = await props.params
    const item = findProgram(slug)

    if (!item) {
        return { title: 'Program not found', robots: { index: false, follow: true } }
    }

    const description =
        typeof item.Description === 'string' && item.Description.trim()
            ? item.Description
            : `Learn ${item.Title} at Tech Kidz Africa — hands-on technology training for children and youth in Mombasa, Kenya.`

    return pageMetadata({
        title: item.Title,
        description,
        path: programHref(item.slug),
    })
}

export default async function Page(props: PageProps<'/program/[slug]'>) {
    const { slug } = await props.params
    return <ProgramDetail slug={slug} />
}
