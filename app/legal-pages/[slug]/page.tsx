import type { Metadata } from 'next'

import LegalDetail from '@/components/routes/LegalDetail'
import { legalPages } from '@/lib/cms'
import { pageMetadata } from '@/lib/seo'

/** cms.json is a build-time snapshot, so every legal page can be pre-rendered. */
export function generateStaticParams() {
    return legalPages.map((page) => ({ slug: page.slug }))
}

export async function generateMetadata(props: PageProps<'/legal-pages/[slug]'>): Promise<Metadata> {
    const { slug } = await props.params
    const page = legalPages.find((entry) => entry.slug === slug)

    if (!page) {
        return { title: 'Page not found', robots: { index: false, follow: true } }
    }

    return pageMetadata({
        title: page.Title,
        description: `${page.Title} for Tech Kidz Africa.`,
        path: `/legal-pages/${slug}`,
    })
}

export default async function Page(props: PageProps<'/legal-pages/[slug]'>) {
    const { slug } = await props.params
    return <LegalDetail slug={slug} />
}
