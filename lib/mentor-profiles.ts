import { mentors, type Mentor, type CmsEmbed } from './cms'
import { team, hasMentorProfile } from './team'
import { MENTOR_CONTENT } from './mentor-content'

const template = mentors.find((mentor) => mentor.slug === 'alex-rivera')
if (!template) throw new Error('The shared Alex Rivera mentor template is missing')

/** Reuse the original embedded Framer components, including their colors. */
function patchEmbed(field: string, props: Record<string, unknown>): CmsEmbed[] {
    return (template!.byId[field] as CmsEmbed[]).map((embed, index) =>
        index === 0 ? { ...embed, props: { ...embed.props, ...props } } : embed,
    )
}

export const mentorProfiles: Mentor[] = [
    ...mentors,
    ...team.filter(hasMentorProfile).map((member): Mentor => {
        const content = MENTOR_CONTENT[member.slug]
        if (!content) throw new Error(`Missing profile content for ${member.name}`)
        const image = { url: `/team/${member.slug}.webp`, alt: member.name }
        const description = `${member.name} ${content.description}`
        const expertise = patchEmbed('zGSu5TpRv', Object.fromEntries(
            content.skills.map((skill, index) => [`title0${index + 1}`, skill]),
        ))
        const sessionFields = ['XNLdspowH', 'EJZU77C18', 'EkhrKhG8k']
        const sessions = Object.fromEntries(sessionFields.map((id, index) => [
            id, patchEmbed(id, { title: content.sessions[index][0], info: content.sessions[index][1] }),
        ]))
        return {
            ...template,
            id: member.slug,
            slug: member.slug,
            Title: member.name,
            Subject: content.subject,
            Role: content.role,
            Description: description,
            Info: description,
            Image: image,
            // No unverified ratings, experience or performance numbers.
            'Rating Badge': content.role,
            'Teaching Experience': undefined,
            Learners: undefined,
            'Rebook Rate': undefined,
            byId: {
                ...template.byId,
                QLObxbGfm: member.name,
                koQ7t_K7p: image.url,
                pueVll7k6: content.subject,
                s9bPlqbuP: content.role,
                YfmS2tChU: description,
                vb4FeIzT_: description,
                zGSu5TpRv: expertise,
                DogFf1FfV: content.role,
                ZcVHBg5Yy: null,
                M5IcI2Sjv: null,
                THai84wa4: null,
                ...sessions,
            },
        }
    }),
]

export const findMentorProfile = (slug: string) => mentorProfiles.find((mentor) => mentor.slug === slug)

/**
 * The four mentors that came with the Framer template -- Maya Chen, David
 * Okafor, Sarah Whitmore, Alex Rivera. They are invented people with invented
 * bios, and `alex-rivera` is still used as the layout template for the real
 * profiles above, so they cannot simply be dropped from `mentorProfiles`.
 *
 * Nothing links to them: `/mentor` renders `components/TeamGrid.tsx`, which
 * lists the real team. But `generateStaticParams` builds a page for every entry
 * here, so without this list four orphaned pages describing fictional staff --
 * one of which still names BrightPath -- would be live and indexable. They are
 * kept out of the sitemap and marked `noindex` in the route's metadata.
 */
export const TEMPLATE_MENTOR_SLUGS = mentors.map((mentor) => mentor.slug)

export const isTemplateMentor = (slug: string) => TEMPLATE_MENTOR_SLUGS.includes(slug)
