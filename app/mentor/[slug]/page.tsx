import type { Metadata } from 'next'

import MentorDetail from '@/components/routes/MentorDetail'
import { mentors } from '@/lib/cms'

/** cms.json is a build-time snapshot, so every mentor can be pre-rendered. */
export function generateStaticParams() {
    return mentors.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata(props: PageProps<'/mentor/[slug]'>): Promise<Metadata> {
    const { slug } = await props.params
    const item = mentors.find((entry) => entry.slug === slug)
    return { title: item ? `${item.Title} — BrightPath` : 'Mentor not found — BrightPath' }
}

export default async function Page(props: PageProps<'/mentor/[slug]'>) {
    const { slug } = await props.params
    return <MentorDetail slug={slug} />
}
