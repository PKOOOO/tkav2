import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema'

import {
    getArticle,
    getMentor,
    getProgram,
    listArticles,
    listMentors,
    listPrograms,
    practicalInfo,
    searchArticles,
} from './content'

/**
 * What the assistant can look up. Every tool resolves against the site's own
 * modules -- see the note at the top of `./content.ts` for why that is the
 * database rather than Neon.
 *
 * ## Only tools for data that exists
 *
 * The site this is ported from had ten tools, including `getEvents`,
 * `getCareers`, `getImpactStats` and `getProjects`. Those are deliberately
 * absent here, because the corresponding content is absent: `/careers`,
 * `/events`, `/impact` and `/projects` are retired routes that now redirect
 * (see `next.config.ts`). Declaring a tool for them would be worse than not
 * having one -- the model would reach for `getEvents`, receive an empty list,
 * and either tell a visitor there are no events (when really we have no events
 * *page*) or start guessing. A missing tool makes it say "I don't have that";
 * an empty tool makes it sound authoritative about nothing.
 *
 * Returned payloads are JSON strings. Each is a few hundred tokens at most,
 * because `content.ts` already stripped the Framer presentation fields.
 */

const json = (value: unknown) => JSON.stringify(value)

const listProgrammesTool = betaTool({
    name: 'list_programmes',
    description:
        'List every programme Tech Kidz Africa teaches, with a one-line summary and the page URL. Call this when the visitor asks what is offered, what their child could learn, or which courses exist.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: () => json({ programmes: listPrograms() }),
})

const getProgrammeTool = betaTool({
    name: 'get_programme',
    description:
        'Full detail for one programme: description, what is covered stage by stage, session formats, the mentor who teaches it, and its frequently asked questions. Call this before answering anything specific about a named programme — never describe a programme from memory.',
    inputSchema: {
        type: 'object',
        properties: {
            programme: {
                type: 'string',
                description:
                    'Programme name or slug, e.g. "Robotics & Tinkering", "robotics", or "ai-and-machine-learning". Partial names work.',
            },
        },
        required: ['programme'],
        additionalProperties: false,
    },
    run: ({ programme }) => {
        const found = getProgram(programme)
        if (!found) {
            return json({
                error: `No programme matches "${programme}".`,
                available: listPrograms().map((p) => p.title),
            })
        }
        return json(found)
    },
})

const listMentorsTool = betaTool({
    name: 'list_mentors',
    description:
        'List the mentors and team members, with their roles and subjects. Call this for questions about who teaches, staff, or the team.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: () => json({ mentors: listMentors() }),
})

const getMentorTool = betaTool({
    name: 'get_mentor',
    description: 'Detail for one mentor by name or slug.',
    inputSchema: {
        type: 'object',
        properties: {
            mentor: { type: 'string', description: 'Mentor name or slug, e.g. "Peter Lagat".' },
        },
        required: ['mentor'],
        additionalProperties: false,
    },
    run: ({ mentor }) => {
        const found = getMentor(mentor)
        if (!found) {
            return json({
                error: `No mentor matches "${mentor}".`,
                available: listMentors().map((m) => m.name),
            })
        }
        return json(found)
    },
})

const searchArticlesTool = betaTool({
    name: 'search_articles',
    description:
        'Search the articles, including their full body text, not just titles and summaries. Bootcamps, holiday programmes, festivals and anything tied to a specific month or season are announced in articles rather than kept as structured records — so call this for any question about dates, seasons, bootcamps, holiday activities or events, even when nothing obviously matches a programme. Omit the query to list every article.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Words to look for, e.g. "bootcamp", "November", "holiday", "festival".',
            },
        },
        additionalProperties: false,
    },
    run: ({ query }) =>
        json({ articles: query ? searchArticles(query) : listArticles() }),
})

const getArticleTool = betaTool({
    name: 'get_article',
    description:
        'The full text of one article, section by section. Call this before telling a visitor you do not have a detail they asked for — schedules, age ranges, what is included and how to take part are usually in the body rather than the summary.',
    inputSchema: {
        type: 'object',
        properties: {
            article: { type: 'string', description: 'Article title, slug or topic.' },
        },
        required: ['article'],
        additionalProperties: false,
    },
    run: ({ article }) => {
        const found = getArticle(article)
        if (!found) {
            return json({
                error: `No article matches "${article}".`,
                available: listArticles().map((a) => a.title),
            })
        }
        return json(found)
    },
})

const practicalInfoTool = betaTool({
    name: 'get_practical_info',
    description:
        'Where Tech Kidz Africa is, how to reach them, opening hours, and the URL of each page on the site. Call this for location, contact, enrolment or "where do I sign up" questions.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: () => json(practicalInfo()),
})

export const siteTools = [
    listProgrammesTool,
    getProgrammeTool,
    listMentorsTool,
    getMentorTool,
    searchArticlesTool,
    getArticleTool,
    practicalInfoTool,
]
