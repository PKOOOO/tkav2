import { PROGRAM_FIELD_IDS, type ProgramFieldName } from '@/lib/cms-overrides'
import { type CmsEmbed, type Program, programHref, programs } from '@/lib/cms'
import { blogPosts } from '@/lib/blog-posts'
import { isTemplateMentor, mentorProfiles } from '@/lib/mentor-profiles'
import { ADDRESS, EMAIL, OPENING_HOURS, PHONE, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'

/**
 * The site's own content, flattened into plain objects the assistant can read.
 *
 * ## Why this reads modules and not the database
 *
 * Every answer here comes from `lib/cms.ts`, `lib/mentor-profiles.ts`,
 * `lib/blog-posts.ts` and `lib/site.ts` -- in process, synchronously. The
 * analytics tables in Neon are deliberately not involved.
 *
 * It is tempting to copy this content into Postgres so the chatbot can "query
 * the database", but it would make the bot *less* accurate, not more:
 *
 *   - `lib/cms.json` is a snapshot that `pnpm cms` regenerates, and
 *     `lib/cms-overrides.ts` exists because anything written into the snapshot
 *     is lost on the next export. A database copy would be a third layer, and
 *     the only one that drifts **silently** -- no rebuild, no diff, nothing to
 *     notice. The failure mode is the assistant quoting a schedule or a price
 *     the page no longer shows, to a parent deciding whether to enrol.
 *   - Reading the same modules the pages read makes "what the bot says" and
 *     "what the page says" the same object by construction.
 *   - It is 8 programmes, 12 mentors and 6 articles. A `group by` is not
 *     needed, and a round trip to eu-central-1 from a US-East function would
 *     cost more latency than the whole lookup costs now.
 *
 * Neon earns its place for data written at request time -- page views, and
 * chat transcripts if those are ever kept. Not for content compiled into the
 * build.
 *
 * ## Why the shapes are rebuilt rather than passed through
 *
 * A `Program` from `lib/cms.ts` is Framer's record: `byId` keyed by opaque
 * field ids, with the syllabus, session types and FAQs held as *component
 * embeds* rather than text. Handing that to a model wastes tokens on
 * `topicBGColor` and invites it to quote a field id at a visitor. These
 * helpers pull out the text and drop the presentation.
 */

const str = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
}

/** Field values live under opaque ids; `PROGRAM_FIELD_IDS` is the name → id map. */
const field = (program: Program, name: ProgramFieldName): unknown =>
    program.byId[PROGRAM_FIELD_IDS[name]]

const embeds = (program: Program, name: ProgramFieldName): CmsEmbed[] => {
    const value = field(program, name)
    return Array.isArray(value) ? (value as CmsEmbed[]) : []
}

/**
 * A syllabus part is one `Subject Card` embed: a stage (`topic`), a subject,
 * and up to five `listItem0N` rows. `listItem05: ''` is meaningful -- the card
 * hides that row -- so empty strings are dropped rather than rendered.
 */
function syllabus(program: Program) {
    const parts: { stage?: string; subject?: string; items: string[] }[] = []

    for (const name of [
        'Syllabus Part 01',
        'Syllabus Part 02',
        'Syllabus Part 03',
        'Syllabus Part 04',
    ] as const) {
        for (const embed of embeds(program, name)) {
            const items = [1, 2, 3, 4, 5]
                .map((n) => str(embed.props[`listItem0${n}`]))
                .filter((item): item is string => Boolean(item))
            const stage = str(embed.props.topic)
            const subject = str(embed.props.subject)
            if (stage || subject || items.length) parts.push({ stage, subject, items })
        }
    }

    return parts
}

function sessionTypes(program: Program) {
    const types: { title: string; description?: string }[] = []
    for (const name of ['Session Type 01', 'Session Type 02', 'Session Type 03'] as const) {
        for (const embed of embeds(program, name)) {
            const title = str(embed.props.title)
            if (title) types.push({ title, description: str(embed.props.description) })
        }
    }
    return types
}

/** One `General Accordion` embed holds all five Q/A pairs as `_0NQuestion`. */
function faqs(program: Program) {
    const pairs: { question: string; answer: string }[] = []
    for (const embed of embeds(program, 'FAQs')) {
        for (const n of [1, 2, 3, 4, 5]) {
            const question = str(embed.props[`_0${n}Question`])
            const answer = str(embed.props[`_0${n}Answer`])
            if (question && answer) pairs.push({ question, answer })
        }
    }
    return pairs
}

export type ProgramSummary = {
    slug: string
    title: string
    url: string
    summary?: string
    level?: string
}

export type ProgramDetail = ProgramSummary & {
    description?: string
    facts: { label: string; value: string }[]
    syllabus: ReturnType<typeof syllabus>
    sessionTypes: ReturnType<typeof sessionTypes>
    faqs: ReturnType<typeof faqs>
    mentor?: { name: string; role?: string; url?: string }
}

/**
 * `programHref` resolves Framer's original CMS slug (`mathematics`) to the
 * public URL (`/program/animation-and-gamification`). Links the assistant
 * hands a visitor must be the public one -- the CMS slug is a 301.
 */
const summarise = (program: Program): ProgramSummary => ({
    slug: program.slug,
    title: program.Title,
    url: programHref(program.slug),
    summary: str(program.Info),
    level: str(program['Level Tag']),
})

export const listPrograms = (): ProgramSummary[] => programs.map(summarise)

export function getProgram(query: string): ProgramDetail | null {
    const needle = query.trim().toLowerCase()
    if (!needle) return null

    const program =
        programs.find((p) => p.slug.toLowerCase() === needle) ??
        programs.find((p) => programHref(p.slug).toLowerCase().endsWith(`/${needle}`)) ??
        programs.find((p) => p.Title.toLowerCase() === needle) ??
        programs.find((p) => p.Title.toLowerCase().includes(needle)) ??
        programs.find((p) => needle.includes(p.Title.toLowerCase()))

    if (!program) return null

    const facts = ([
        ['Label 01', 'Value 01'],
        ['Label 02', 'Value 02'],
        ['Label 03', 'Value 03'],
    ] as const)
        .map(([labelName, valueName]) => ({
            label: str(field(program, labelName)),
            value: str(field(program, valueName)),
        }))
        .filter((fact): fact is { label: string; value: string } =>
            Boolean(fact.label && fact.value),
        )

    /**
     * The programme → mentor link is flattened as `<linkId>_<mentorFieldId>`,
     * so the mentor's name lands beside the programme rather than inside it.
     *
     * It is only reported when it resolves to a real profile. In the raw
     * snapshot this field still reads "Maya Chen" -- one of the four invented
     * template people -- and `cms-overrides.ts` is what replaces it. If an
     * override is ever missing, passing the bare name through would present a
     * fabricated person as a real mentor, which is exactly the problem the
     * mentor pages were fixed for. An unresolvable name is dropped instead:
     * no mentor shown beats a made-up one.
     */
    const mentorName = str(program.byId.bw5wYLxeb_QLObxbGfm)
    const linked = mentorName
        ? mentorProfiles.find((m) => m.Title === mentorName && !isTemplateMentor(m.slug))
        : undefined

    return {
        ...summarise(program),
        description: str(program.Description),
        facts,
        syllabus: syllabus(program),
        sessionTypes: sessionTypes(program),
        faqs: faqs(program),
        mentor: linked
            ? { name: linked.Title, role: str(linked.Role), url: `/mentor/${linked.slug}` }
            : undefined,
    }
}

/**
 * Template mentors are excluded. The Framer template shipped four invented
 * people (Maya Chen and friends) carrying fabricated ratings and credentials;
 * their pages already 404. The assistant must never present them as staff.
 */
export const listMentors = () =>
    mentorProfiles
        .filter((mentor) => !isTemplateMentor(mentor.slug))
        .map((mentor) => ({
            slug: mentor.slug,
            name: mentor.Title,
            url: `/mentor/${mentor.slug}`,
            role: str(mentor.Role),
            subject: str(mentor.Subject),
            about: str(mentor.Description),
        }))

export function getMentor(query: string) {
    const needle = query.trim().toLowerCase()
    if (!needle) return null
    const all = listMentors()
    return (
        all.find((m) => m.slug === needle) ??
        all.find((m) => m.name.toLowerCase() === needle) ??
        all.find((m) => m.name.toLowerCase().includes(needle)) ??
        all.find((m) => needle.includes(m.name.toLowerCase())) ??
        null
    )
}

export const listArticles = () =>
    blogPosts.map((post) => ({
        slug: post.slug,
        title: post.title,
        url: `/blogs/${post.slug}`,
        summary: post.summary,
        topic: post.topic,
        readMinutes: post.readMinutes,
        ageRange:
            post.minAge && post.maxAge ? `${post.minAge}-${post.maxAge}` : undefined,
    }))

/**
 * Returns the article's full body.
 *
 * The old site learned this the hard way: holiday bootcamps, dates and
 * enrolment links are announced in articles rather than added as structured
 * records, so an assistant that only reads summaries tells visitors it has no
 * registration link while the link sits in the body two paragraphs down.
 */
export function getArticle(query: string) {
    const needle = query.trim().toLowerCase()
    if (!needle) return null

    const post =
        blogPosts.find((p) => p.slug === needle) ??
        blogPosts.find((p) => p.title.toLowerCase() === needle) ??
        blogPosts.find((p) => p.title.toLowerCase().includes(needle)) ??
        blogPosts.find((p) => p.topic.toLowerCase().includes(needle)) ??
        blogPosts.find((p) =>
            p.sections.some((s) => s.heading.toLowerCase().includes(needle)),
        )

    if (!post) return null

    return {
        slug: post.slug,
        title: post.title,
        url: `/blogs/${post.slug}`,
        summary: post.summary,
        topic: post.topic,
        sections: post.sections.map((section) => ({
            heading: section.heading,
            paragraphs: section.paragraphs,
            points: section.points ?? [],
        })),
    }
}

/** Searches summaries *and* bodies, for the reason in `getArticle`. */
export function searchArticles(query: string) {
    const needle = query.trim().toLowerCase()
    if (!needle) return listArticles()

    return blogPosts
        .filter((post) => {
            const haystack = [
                post.title,
                post.summary,
                post.topic,
                ...post.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.points ?? [])]),
            ]
                .join(' ')
                .toLowerCase()
            return haystack.includes(needle)
        })
        .map((post) => ({
            slug: post.slug,
            title: post.title,
            url: `/blogs/${post.slug}`,
            summary: post.summary,
            topic: post.topic,
        }))
}

export const practicalInfo = () => ({
    name: SITE_NAME,
    about: SITE_DESCRIPTION,
    address: `${ADDRESS.street}, ${ADDRESS.locality}, ${ADDRESS.region}`,
    email: EMAIL,
    phone: PHONE,
    openingHours: OPENING_HOURS,
    pages: {
        programmes: '/program',
        mentors: '/mentor',
        articles: '/blogs',
        pricing: '/pricing',
        gallery: '/gallery',
        contact: '/contact',
        about: '/about',
    },
})
