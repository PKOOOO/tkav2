import { createElement, Fragment } from 'react'
import type { ReactElement } from 'react'

import data from './cms.json'
import {
    PROGRAM_FIELD_IDS,
    PROGRAM_MENTOR_FIELD_ID,
    PROGRAM_OVERRIDES,
    type ProgramFieldName,
} from './cms-overrides'

import SubjectCard from '../framer/subject-card.jsx'
import SessionTypeCard from '../framer/session-type-card.jsx'
import GeneralAccordion from '../framer/general-accordion.jsx'
import TeamExpertise from '../framer/team-expertise.jsx'
import SessionCard from '../framer/session-card.jsx'

export type CmsImage = { url: string; alt: string }

/** Raw CMS values keyed by Framer field id, fed to a component's __bindCmsFields. */
export type ById = Record<string, unknown>

export type Mentor = {
    id: string
    slug: string
    byId: ById
    Title: string
    Founder?: boolean
    Subject?: string
    Image?: CmsImage
    Info?: string
    'BG Color'?: string
    'Info Color'?: string
    'Title Color'?: string
    'Rating Badge'?: string
    Role?: string
    Description?: string
    'Teaching Experience'?: string
    Learners?: string
    'Rebook Rate'?: string
}

export type Program = {
    id: string
    slug: string
    byId: ById
    Title: string
    'BG Color'?: string
    Icon?: CmsImage
    'Icon BG Color'?: string
    'Icon Border'?: string
    Info?: string
    Thumbnail?: CmsImage
    Image?: CmsImage
    'Level Tag'?: string
    Description?: string
    'Label 01'?: string
    'Value 01'?: string
    'Label 02'?: string
    'Value 02'?: string
    'Label 03'?: string
    'Value 03'?: string
}

export type LegalPage = {
    id: string
    slug: string
    byId: ById
    Title: string
    Date?: string
    Content?: string
}

const cms = data as unknown as {
    Program: Program[]
    Mentor: Mentor[]
    'Legal Pages': LegalPage[]
}

export const mentors = cms.Mentor
export const legalPages = cms['Legal Pages']

/**
 * A CMS rich-text cell whose content is a Framer component embed rather than
 * text -- see the comment in scripts/export-cms.framer.js for why these need
 * their own representation in cms.json.
 *
 * Declared up here because the override layer below runs at module load and
 * calls `isEmbedList`; a `const` defined further down would still be in its
 * temporal dead zone by then.
 */
export type CmsEmbed = {
    /** Framer component id, resolved through EMBED_COMPONENTS below. */
    component: string
    width?: string
    props: Record<string, unknown>
}

const isEmbedList = (value: unknown): value is CmsEmbed[] =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((e) => !!e && typeof e === 'object' && 'component' in e && 'props' in e)

/**
 * Applies `lib/cms-overrides.ts` on top of the snapshot -- see that file for why
 * the content lives there rather than in `cms.json`.
 *
 * Every write lands twice, on the Framer field id and on the human field name.
 * Only the id reaches the rendered page (`ProgramDetail` binds `program.byId`),
 * but `generateMetadata` and the route helpers read the named fields, and a
 * programme whose <title> disagreed with its own heading would be a genuinely
 * confusing bug to chase.
 */
const overrideProgram = (item: Program): Program => {
    const override = PROGRAM_OVERRIDES[item.slug]
    if (!override) return item

    const next: Program = { ...item, byId: { ...item.byId } }
    const write = (name: ProgramFieldName, value: unknown) => {
        next.byId[PROGRAM_FIELD_IDS[name]] = value
        // The named fields are individually typed (Title: string, and so on) and
        // the override values arrive as `unknown`, so the write needs the cast.
        ;(next as Record<string, unknown>)[name] = value
    }

    for (const [name, value] of Object.entries(override.fields ?? {})) {
        write(name as ProgramFieldName, value)
    }

    // Embeds are patched rather than replaced, so the override only restates
    // text and the snapshot keeps supplying icons and `--token-` colours.
    for (const [name, patches] of Object.entries(override.embeds ?? {})) {
        const current = next.byId[PROGRAM_FIELD_IDS[name as ProgramFieldName]]
        if (!isEmbedList(current)) {
            console.warn(`cms: ${item.slug}.${name} is not an embed list; override skipped`)
            continue
        }
        write(
            name as ProgramFieldName,
            current.map((embed, i) =>
                patches[i] ? { ...embed, props: { ...embed.props, ...patches[i] } } : embed,
            ),
        )
    }

    if (override.mentor) {
        const mentor = mentors.find((m) => m.slug === override.mentor)
        if (!mentor) {
            console.warn(`cms: no mentor "${override.mentor}" for ${item.slug}; link left as-is`)
        } else {
            // The link field carries the slug; the mentor block reads the copy
            // flattened beside it, so both have to move together.
            next.byId[PROGRAM_MENTOR_FIELD_ID] = mentor.slug
            ;(next as Record<string, unknown>).Team = mentor.slug
            for (const [id, value] of Object.entries(mentor.byId)) {
                next.byId[`${PROGRAM_MENTOR_FIELD_ID}_${id}`] = value
            }
        }
    }

    return next
}

export const programs = cms.Program.map(overrideProgram)

export const findMentor = (slug?: string) => mentors.find((m) => m.slug === slug)
export const findProgram = (slug?: string) => programs.find((p) => p.slug === slug)
export const findLegalPage = (slug?: string) => legalPages.find((l) => l.slug === slug)

/**
 * The components those embeds resolve to. Each must stay ticked in Framer's
 * React Export plugin, or `npm run framer` stops emitting its file and the
 * import below breaks the build.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated Framer modules are untyped
const EMBED_COMPONENTS: Record<string, any> = {
    IhND4CwUH: SubjectCard,
    n7fi7gTQ_: SessionTypeCard,
    wde271kTF: GeneralAccordion,
    dGuk6jhMX: TeamExpertise,
    XNaU_Oq_y: SessionCard,
}

/** Framer image controls want {src, alt}; the CMS gives a bare URL or {url, alt}. */
const toImageProp = (value: unknown) => {
    if (typeof value === 'string') return { src: value }
    if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>
        if (typeof v.url === 'string') return { src: v.url, alt: (v.alt ?? v.altText ?? '') as string }
    }
    return value
}

/**
 * unframer's RichText renders `children` only when it is a *single* element:
 *
 *     children: isValidElement(content) ? content : void 0
 *
 * An array is not a valid element, so several embeds have to be wrapped in a
 * Fragment or the container silently renders empty.
 */
const toElement = (embeds: CmsEmbed[]): ReactElement | undefined => {
    const elements = embeds.flatMap((embed, i) => {
        const Component = EMBED_COMPONENTS[embed.component]
        if (!Component) {
            console.warn(`cms: no component registered for embed ${embed.component}`)
            return []
        }
        const props: Record<string, unknown> = { ...embed.props, key: i }
        if ('icon' in props) props.icon = toImageProp(props.icon)
        // The embed is a block inside rich text, so it spans the container.
        if (embed.width === 'fill') props.style = { width: '100%' }
        return [createElement(Component, props)]
    })
    if (elements.length === 0) return undefined
    return elements.length === 1 ? elements[0] : createElement(Fragment, null, ...elements)
}

/**
 * Turns embed descriptors into real Framer components before the values reach
 * __bindCmsFields. The generated components render these bindings as React
 * children and gate them with `isSet`, which treats any non-empty, non-null
 * value as set -- so a single element passes the gate and renders.
 *
 * Values that are not embeds pass through untouched.
 */
export const hydrateEmbeds = (byId: ById): ById => {
    const out: ById = {}
    for (const [id, value] of Object.entries(byId)) {
        out[id] = isEmbedList(value) ? toElement(value) : value
    }
    return out
}

/** Design tokens lifted from the Framer project's colour styles. */
export const theme = {
    ivory: 'rgb(244, 240, 229)',
    forest: 'rgb(20, 38, 29)',
    slate: 'rgb(69, 86, 75)',
    orange: 'rgb(232, 114, 44)',
    warmBeige: 'rgb(234, 228, 211)',
    white: 'rgb(255, 255, 255)',
    display: '"Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif',
    body: '"Instrument Sans", Inter, system-ui, sans-serif',
}
