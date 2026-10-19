import type { ReactNode } from 'react'
import Link from 'next/link'

/**
 * Renders the small slice of markdown the assistant actually produces:
 * paragraphs, `- ` bullets, `**bold**` and `[text](/path)` links.
 *
 * Deliberately not `react-markdown`. That would pull the remark stack in to
 * support a syntax surface the system prompt never asks for, and this is the
 * one place in the app where **model output is rendered to a visitor** — so the
 * narrow, auditable version is the safer trade.
 *
 * Two rules make it safe:
 *
 * 1. **It builds React elements, never HTML.** There is no
 *    `dangerouslySetInnerHTML` anywhere, so every text node goes through
 *    React's own escaping and a reply containing `<script>` renders as those
 *    literal characters.
 * 2. **Link targets are allow-listed.** A model can emit any href it likes,
 *    including `javascript:`; `safeHref` accepts only in-site paths plus
 *    `mailto:`/`tel:`, and anything else degrades to plain text. The prompt
 *    only ever wants internal links, so nothing legitimate is lost.
 */

const BOLD_OR_LINK = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/

/**
 * Readable labels for in-site paths.
 *
 * The system prompt asks for word labels, but a smaller model complies only
 * sometimes and emits `[/contact](/contact)`, which reads to a visitor like a
 * debug string. Presentation invariants the code can guarantee should not be
 * delegated to the model, so a label that is just its own path gets rewritten
 * here instead.
 */
const PATH_LABELS: Record<string, string> = {
    '/': 'the home page',
    '/program': 'our programmes',
    '/mentor': 'our mentors',
    '/blogs': 'our articles',
    '/pricing': 'the pricing page',
    '/gallery': 'the gallery',
    '/contact': 'contact the team',
    '/about': 'about us',
}

const looksLikeBarePath = (label: string) => /^\/[\w\-/]*$/.test(label.trim())

function labelFor(label: string, href: string): string {
    if (!looksLikeBarePath(label)) return label
    const path = href.split(/[?#]/)[0].replace(/\/$/, '') || '/'
    if (PATH_LABELS[path]) return PATH_LABELS[path]
    // Fall back to the last segment: /program/robotics-and-tinkering ->
    // "robotics and tinkering".
    const slug = path.split('/').filter(Boolean).pop()
    return slug ? slug.replace(/-/g, ' ') : 'this page'
}

function safeHref(raw: string): string | null {
    const href = raw.trim()
    if (href.startsWith('/') && !href.startsWith('//')) return href
    if (/^(mailto:|tel:)[^\s]+$/i.test(href)) return href
    if (/^https:\/\/(www\.)?techkidzafrica\.co\.ke(\/|$)/i.test(href)) return href
    return null
}

function inline(text: string, keyPrefix: string): ReactNode[] {
    return text
        .split(BOLD_OR_LINK)
        .filter((part) => part !== '')
        .map((part, index) => {
            const key = `${keyPrefix}-${index}`

            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                return <strong key={key}>{part.slice(2, -2)}</strong>
            }

            const link = part.match(LINK)
            if (link) {
                const href = safeHref(link[2])
                // A rejected target keeps the label as text rather than
                // silently dropping it.
                if (!href) return <span key={key}>{link[1]}</span>
                const text = labelFor(link[1], href)
                if (href.startsWith('/')) {
                    return (
                        <Link key={key} href={href} className="font-medium text-[#6a1383] underline underline-offset-2 hover:text-[#530e68]">
                            {text}
                        </Link>
                    )
                }
                return (
                    <a key={key} href={href} className="font-medium text-[#6a1383] underline underline-offset-2 hover:text-[#530e68]">
                        {text}
                    </a>
                )
            }

            return <span key={key}>{part}</span>
        })
}

export default function RichText({ text }: { text: string }) {
    const blocks: ReactNode[] = []
    const lines = text.split('\n')
    let paragraph: string[] = []
    let bullets: string[] = []

    const flushParagraph = () => {
        if (!paragraph.length) return
        const key = `p${blocks.length}`
        blocks.push(
            <p key={key} className="whitespace-pre-wrap">
                {inline(paragraph.join(' '), key)}
            </p>,
        )
        paragraph = []
    }

    const flushBullets = () => {
        if (!bullets.length) return
        const key = `l${blocks.length}`
        blocks.push(
            <ul key={key} className="list-disc space-y-1 pl-5">
                {bullets.map((item, index) => (
                    <li key={`${key}-${index}`}>{inline(item, `${key}-${index}`)}</li>
                ))}
            </ul>,
        )
        bullets = []
    }

    for (const raw of lines) {
        const line = raw.trim()

        if (!line) {
            flushParagraph()
            flushBullets()
            continue
        }

        const bullet = line.match(/^[-*]\s+(.*)$/)
        if (bullet) {
            flushParagraph()
            bullets.push(bullet[1])
            continue
        }

        // Headings are stripped to bold text: a chat bubble is too small for
        // an <h2>, and the prompt asks for none.
        const heading = line.match(/^#{1,4}\s+(.*)$/)
        if (heading) {
            flushParagraph()
            flushBullets()
            const key = `h${blocks.length}`
            blocks.push(
                <p key={key} className="font-semibold">
                    {inline(heading[1], key)}
                </p>,
            )
            continue
        }

        flushBullets()
        paragraph.push(line)
    }

    flushParagraph()
    flushBullets()

    return <div className="space-y-2.5 text-[14.5px] leading-relaxed">{blocks}</div>
}
