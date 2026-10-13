import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import MentorDetail from '@/components/routes/MentorDetail'
import { mentorProfiles, findMentorProfile, isTemplateMentor } from '@/lib/mentor-profiles'
import { pageMetadata } from '@/lib/seo'

/**
 * cms.json is a build-time snapshot, so every mentor can be pre-rendered --
 * except the four Framer template mentors, which get no page at all.
 *
 * `noindex` alone was not enough. The template entries have to stay in
 * `mentorProfiles` because `alex-rivera` is the layout other profiles are built
 * from, but building them published four URLs describing invented staff with
 * invented credentials: "4.9/5, 120 reviews", "180+ Learners", "98% Rebook
 * rate", and a bio claiming five years at Tech Kidz Africa. The BrightPath
 * scrub in `lib/cms.ts` made that worse rather than better, by swapping the
 * template's name for the real company's in a fictional person's history.
 *
 * `noindex` keeps them out of Google; it does not stop a person reaching them,
 * and fabricated ratings on a real business site are not something to leave
 * one crawler-directive away from public. The real profiles deliberately carry
 * no unverified numbers (see `lib/mentor-profiles.ts`), so these contradicted
 * a decision already made.
 */
export function generateStaticParams() {
    return mentorProfiles
        .filter((item) => !isTemplateMentor(item.slug))
        .map((item) => ({ slug: item.slug }))
}

/**
 * Serve *only* the slugs listed above; anything else is a real 404.
 *
 * Leaving a slug out of `generateStaticParams` does not make it unreachable --
 * by default Next still renders it on demand. That rendered a page whose body
 * was the 404 design (the `notFound()` below did fire) but whose status was
 * **200**, and whose `<title>`, `og:title` and `twitter:title` still came from
 * `generateMetadata` -- so `/mentor/maya-chen` answered 200 and announced
 * "Maya Chen — Lead mentor" to anything reading the metadata, including link
 * previews. A soft 404 with a fictional staff member's name on it.
 *
 * With this, an unlisted slug never reaches `generateMetadata` or the page.
 * Every mentor comes from a build-time module, so nothing legitimate is lost.
 */
export const dynamicParams = false

export async function generateMetadata(props: PageProps<'/mentor/[slug]'>): Promise<Metadata> {
    const { slug } = await props.params
    const item = findMentorProfile(slug)

    if (!item) {
        return { title: 'Mentor not found', robots: { index: false, follow: true } }
    }

    const role = typeof item.Role === 'string' && item.Role.trim() ? item.Role : 'Mentor'
    const description =
        typeof item.Description === 'string' && item.Description.trim()
            ? item.Description
            : `${item.Title}, ${role} at Tech Kidz Africa in Mombasa, Kenya.`

    return pageMetadata({
        title: `${item.Title} — ${role}`,
        description,
        path: `/mentor/${slug}`,
    })
}

export default async function Page(props: PageProps<'/mentor/[slug]'>) {
    const { slug } = await props.params
    if (!findMentorProfile(slug)) notFound()
    return <MentorDetail slug={slug} />
}
