'use client'

import Link from 'next/link'
import Markdown from 'react-markdown'

/**
 * Renders one message's markdown, with every element mapped to the site's
 * palette. Ported from the previous site's `MessageContent`.
 *
 * `react-markdown` does not render raw HTML unless `rehype-raw` is added, so
 * a reply containing `<script>` is shown as literal text.
 *
 * Two changes from the original:
 *
 * 1. **Link targets are allow-listed.** The original passed any non-`/` href
 *    straight into an `<a>`, which would include `javascript:`. A model writes
 *    these hrefs, so only in-site paths, `mailto:`/`tel:` and this site's own
 *    https origin are linked; anything else degrades to plain text.
 * 2. **A label that is just its own path gets a readable name.** The prompt
 *    asks for word labels and Haiku complies only sometimes, so
 *    `[/contact](/contact)` would otherwise reach a visitor looking like a
 *    debug string.
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

function safeHref(raw?: string): string | null {
    const href = raw?.trim()
    if (!href) return null
    if (href.startsWith('/') && !href.startsWith('//')) return href
    if (/^(mailto:|tel:)[^\s]+$/i.test(href)) return href
    if (/^https:\/\/(www\.)?techkidzafrica\.co\.ke(\/|$)/i.test(href)) return href
    return null
}

const isBarePath = (text: string) => /^\/[\w\-/]*$/.test(text.trim())

function readableLabel(children: React.ReactNode, href: string): React.ReactNode {
    if (typeof children !== 'string' || !isBarePath(children)) return children
    const path = href.split(/[?#]/)[0].replace(/\/$/, '') || '/'
    if (PATH_LABELS[path]) return PATH_LABELS[path]
    const slug = path.split('/').filter(Boolean).pop()
    return slug ? slug.replace(/-/g, ' ') : 'this page'
}

const LINK_CLASS =
    'font-medium text-[#6a1383] underline underline-offset-2 transition-colors hover:text-[#530e68]'

export function MessageContent({
    content,
    closeChat,
    isUser,
}: {
    content: string
    closeChat: () => void
    isUser: boolean
}) {
    /**
     * Following a link on a phone should dismiss the panel -- it covers the
     * whole screen there, so the visitor would otherwise land on the new page
     * with the chat still over it. From `2xl` up the sheet sits beside the
     * site rather than on top, so it stays open. The 1535px here is that
     * breakpoint minus one -- it must track `MainContentWrapper`.
     */
    const handleNavigate = () => {
        if (window.matchMedia('(max-width: 1535px)').matches) closeChat()
    }

    return (
        <Markdown
            components={{
                a: ({ href, children }) => {
                    const safe = safeHref(href)
                    if (!safe) return <span>{children}</span>
                    const label = readableLabel(children, safe)
                    if (safe.startsWith('/')) {
                        return (
                            <Link href={safe} onClick={handleNavigate} className={LINK_CLASS}>
                                {label}
                            </Link>
                        )
                    }
                    return (
                        <a
                            href={safe}
                            target={safe.startsWith('http') ? '_blank' : undefined}
                            rel={safe.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className={LINK_CLASS}
                        >
                            {label}
                        </a>
                    )
                },
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                h1: ({ children }) => <h1 className="mb-2 text-base font-semibold">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-2 text-[15px] font-semibold">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
                ul: ({ children }) => (
                    <ul className="mb-2 ml-4 list-outside list-disc space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="mb-2 ml-4 list-outside list-decimal space-y-1">{children}</ol>
                ),
                li: ({ children }) => {
                    if (!children || (typeof children === 'string' && !children.trim())) return null
                    return <li className="pl-1">{children}</li>
                },
                hr: () => <hr className="my-4 border-[#dfeaf6]" />,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children, className }) =>
                    className ? (
                        <code className={className}>{children}</code>
                    ) : (
                        <code
                            className={`rounded px-1 py-0.5 font-mono text-xs ${
                                isUser ? 'bg-white/20 text-white' : 'bg-[#dfeaf6] text-[#00376f]'
                            }`}
                        >
                            {children}
                        </code>
                    ),
                pre: ({ children }) => (
                    <pre className="mb-2 overflow-x-auto rounded-lg bg-[#dfeaf6] p-3 text-xs">
                        {children}
                    </pre>
                ),
            }}
        >
            {content}
        </Markdown>
    )
}
