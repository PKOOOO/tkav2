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

/**
 * Words that carry no search signal. Deliberately short: anything that might
 * actually appear in an article -- "school", "holiday", "robotics", "ages" --
 * has to survive.
 */
const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'for', 'in', 'on', 'at', 'of', 'to', 'is', 'are', 'was',
    'any', 'anything', 'something', 'next', 'this', 'that', 'these', 'those', 'my', 'our',
    'your', 'do', 'does', 'did', 'you', 'we', 'have', 'has', 'there', 'about', 'with',
    'coming', 'upcoming', 'available', 'offer', 'got', 'can', 'would', 'please', 'tell',
    // Two-letter words, listed because the length floor is 2 and not 3 -- see
    // the token filter below for why it had to come down.
    'am', 'as', 'be', 'by', 'go', 'he', 'if', 'it', 'me', 'no', 'so', 'up', 'us',
])

const haystackFor = (post: (typeof blogPosts)[number]) =>
    [
        post.title,
        post.summary,
        post.topic,
        ...post.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.points ?? [])]),
    ]
        .join(' ')
        .toLowerCase()

/**
 * Searches summaries *and* bodies, for the reason in `getArticle`.
 *
 * **Tokenised, not a substring match.** The first version did
 * `haystack.includes(query)`, which looks reasonable until the assistant passes
 * a natural phrase. Asked "anything for the next school holiday?", it searched
 * `"next school holiday"` -- a string that appears in no article -- got zero
 * results, and correctly told the visitor nothing had been announced. The
 * November Holiday Tech Bootcamp was sitting right there: its title contains
 * "Holiday" and its body contains "school", but never those words adjacent.
 * The tool lied to the model, and the model passed the lie on.
 *
 * So the query is split into words, stopwords are dropped, and a post matches
 * if any word matches -- ranked by how many do.
 *
 * `matched: false` with the full list is returned rather than an empty array,
 * because "no post matched your words" and "nothing has been announced" are
 * very different claims and only the assistant can tell which to make. Handing
 * it everything lets it judge; handing it nothing invites the wrong answer.
 */
export function searchArticles(query: string) {
    const summarise = (post: (typeof blogPosts)[number]) => ({
        slug: post.slug,
        title: post.title,
        url: `/blogs/${post.slug}`,
        summary: post.summary,
        topic: post.topic,
    })

    /**
     * Two characters, not three. A three-character floor silently dropped
     * every token in "ai", "3d" and "vr" -- and an empty token list used to
     * mean "no query given", so the search reported all six articles as
     * matching a question about AI. That is the original substring bug
     * inverted: instead of hiding a real answer it manufactured five false
     * ones, which is worse, because the model has no way to tell. The cost of
     * the lower floor is a handful of two-letter English words, which is what
     * the tail of STOPWORDS is for.
     */
    const tokens = query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 2 && !STOPWORDS.has(word))

    // A query was given and carried no usable word, so nothing was actually
    // searched for. `matched: false` says that; `true` would claim six hits.
    if (!tokens.length) return { matched: false, articles: blogPosts.map(summarise) }

    /**
     * Matches a token, trying a de-pluralised form too.
     *
     * Without this, "holidays" misses an article that says "holiday" -- and
     * the damage is worse than a miss. Asked about "school holidays", "school"
     * matched a different article while "holidays" matched nothing, so the
     * wrong post scored 1, the right post scored 0, and the search returned
     * the wrong answer *confidently* instead of falling back to the full list.
     */
    const matches = (haystack: string, token: string) => {
        if (haystack.includes(token)) return true
        if (token.length > 4 && token.endsWith('es') && haystack.includes(token.slice(0, -2))) return true
        if (token.length > 3 && token.endsWith('s') && haystack.includes(token.slice(0, -1))) return true
        return false
    }

    const scored = blogPosts
        .map((post) => {
            const haystack = haystackFor(post)
            return { post, terms: tokens.filter((token) => matches(haystack, token)) }
        })
        .filter((row) => row.terms.length > 0)
        .sort((a, b) => b.terms.length - a.terms.length)

    if (!scored.length) {
        return { matched: false, articles: blogPosts.map(summarise) }
    }

    /**
     * `matchedTerms` is reported so a partial match cannot pass itself off as
     * a full one. Asked about the *December* holidays, this returns the
     * November bootcamp -- correctly, it is the only holiday article -- but on
     * the strength of "holiday" alone, with "december" matching nothing. Told
     * which word landed, the assistant can say "nothing in December, but there
     * is one running in November"; told only that the article matched, it is
     * one short step from announcing a December bootcamp that does not exist.
     */
    return {
        matched: true,
        articles: scored.map((row) => ({ ...summarise(row.post), matchedTerms: row.terms })),
    }
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
