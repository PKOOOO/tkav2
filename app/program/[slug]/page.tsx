import type { Metadata } from 'next'

import ProgramDetail from '@/components/routes/ProgramDetail'
import { findProgram, programRouteSlugs, programs } from '@/lib/cms'

/** cms.json is a build-time snapshot, so every program can be pre-rendered. */
export function generateStaticParams() {
    return [
        ...programs.map((item) => ({ slug: item.slug })),
        ...Object.values(programRouteSlugs).map((slug) => ({ slug })),
    ]
}

export async function generateMetadata(props: PageProps<'/program/[slug]'>): Promise<Metadata> {
    const { slug } = await props.params
    const item = findProgram(slug)
    return { title: item ? `${item.Title} — Tech Kidz Africa` : 'Program not found — Tech Kidz Africa' }
}

export default async function Page(props: PageProps<'/program/[slug]'>) {
    const { slug } = await props.params
    return <ProgramDetail slug={slug} />
}
