import type { Metadata } from 'next'

import ProgramDetail from '@/components/routes/ProgramDetail'
import { programs } from '@/lib/cms'

/** cms.json is a build-time snapshot, so every program can be pre-rendered. */
export function generateStaticParams() {
    return programs.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata(props: PageProps<'/program/[slug]'>): Promise<Metadata> {
    const { slug } = await props.params
    const item = programs.find((entry) => entry.slug === slug)
    return { title: item ? `${item.Title} — BrightPath` : 'Program not found — BrightPath' }
}

export default async function Page(props: PageProps<'/program/[slug]'>) {
    const { slug } = await props.params
    return <ProgramDetail slug={slug} />
}
