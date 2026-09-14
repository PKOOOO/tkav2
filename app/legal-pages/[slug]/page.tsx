import type { Metadata } from 'next'

import LegalDetail from '@/components/routes/LegalDetail'
import { legalPages } from '@/lib/cms'

/** cms.json is a build-time snapshot, so every legal page can be pre-rendered. */
export function generateStaticParams() {
    return legalPages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata(props: PageProps<'/legal-pages/[slug]'>): Promise<Metadata> {
    const { slug } = await props.params
    const page = legalPages.find((entry) => entry.slug === slug)
    return { title: page ? `${page.Title} — BrightPath` : 'Page not found — BrightPath' }
}

export default async function Page(props: PageProps<'/legal-pages/[slug]'>) {
    const { slug } = await props.params
    return <LegalDetail slug={slug} />
}
