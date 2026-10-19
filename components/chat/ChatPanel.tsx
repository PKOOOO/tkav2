'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react'

import { useChatStream } from '@/lib/useChatStream'
import RichText from './RichText'

const OPENERS = [
    'What programmes do you offer?',
    'Anything for the next school holiday?',
    'Which programme suits a 9-year-old?',
]

/**
 * The chat panel: a slide-over on the right, full width on phones.
 *
 * Laid out after the panel on the previous site, recoloured to the site's own
 * tokens (`#002b5b` ink, `#6a1383` accent, `#eef4fa` wash) rather than that
 * version's zinc-and-blue, so it sits beside `/admin` as one family.
 */
export default function ChatPanel({ onClose }: { onClose: () => void }) {
    const { messages, status, activity, send } = useChatStream()
    const [draft, setDraft] = useState('')
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const busy = status !== 'idle'

    // Keep the newest message in view as tokens arrive.
    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [messages, activity])

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // Escape closes, which is what a visitor expects of an overlay.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    const submit = (event: React.FormEvent) => {
        event.preventDefault()
        const text = draft.trim()
        if (!text || busy) return
        setDraft('')
        void send(text)
    }

    const ask = (question: string) => {
        if (busy) return
        void send(question)
    }

    return (
        <>
            <button
                type="button"
                aria-label="Close chat"
                onClick={onClose}
                className="fixed inset-0 z-[998] bg-[#002b5b]/40 xl:hidden"
            />

            <aside
                role="dialog"
                aria-label="Ask Tech Kidz Africa"
                className="fixed inset-y-0 right-0 z-[999] flex w-full flex-col border-l border-[#dfeaf6] bg-white shadow-2xl xl:w-[400px]"
            >
                <header className="flex shrink-0 items-center gap-3 border-b border-[#dfeaf6] px-4 py-3.5">
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#e6d6f0]">
                        <Sparkles className="size-[18px] text-[#6a1383]" aria-hidden />
                    </span>
                    <span className="flex-1">
                        <span className="block text-[15px] font-semibold text-[#002b5b]">Ask us anything</span>
                        <span className="block text-xs text-[#41597a]">Programmes, mentors, holidays</span>
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close chat"
                        className="rounded-lg p-2 text-[#41597a] transition-colors hover:bg-[#eef4fa] hover:text-[#002b5b]"
                    >
                        <X className="size-5" aria-hidden />
                    </button>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                    {messages.length === 0 ? (
                        <div className="space-y-4">
                            <p className="text-[14.5px] leading-relaxed text-[#41597a]">
                                Hi! I can tell you about our programmes, who teaches them, and what’s
                                coming up in the holidays. What would you like to know?
                            </p>
                            <div className="space-y-2">
                                {OPENERS.map((question) => (
                                    <button
                                        key={question}
                                        type="button"
                                        onClick={() => ask(question)}
                                        className="w-full rounded-xl border border-[#dfeaf6] bg-[#eef4fa] px-3.5 py-2.5 text-left text-[13.5px] text-[#00376f] transition-colors hover:border-[#c6dcf0] hover:bg-[#dfeaf6]"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) =>
                                message.role === 'user' ? (
                                    <div key={message.id} className="flex justify-end">
                                        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#002b5b] px-3.5 py-2.5 text-[14.5px] leading-relaxed text-white">
                                            {message.content}
                                        </p>
                                    </div>
                                ) : (
                                    <div key={message.id} className="flex gap-2.5">
                                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e6d6f0]">
                                            <Bot className="size-4 text-[#6a1383]" aria-hidden />
                                        </span>
                                        <div className="min-w-0 flex-1 text-[#00376f]">
                                            {message.content ? (
                                                <RichText text={message.content} />
                                            ) : (
                                                /* Only shown while the first token is still pending. */
                                                <span className="flex items-center gap-1.5 py-1.5" aria-label="Thinking">
                                                    {[0, 1, 2].map((i) => (
                                                        <span
                                                            key={i}
                                                            className="size-1.5 animate-bounce rounded-full bg-[#38b6ff]"
                                                            style={{ animationDelay: `${i * 0.15}s` }}
                                                        />
                                                    ))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ),
                            )}

                            {activity && (
                                <p className="pl-[38px] text-xs italic text-[#41597a]" aria-live="polite">
                                    {activity}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <form
                    onSubmit={submit}
                    className="shrink-0 border-t border-[#dfeaf6] px-4 py-3"
                    style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
                >
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder="Ask about a programme…"
                            aria-label="Your question"
                            maxLength={2000}
                            className="min-w-0 flex-1 rounded-xl border border-[#dfeaf6] bg-white px-3.5 py-2.5 text-[14.5px] text-[#002b5b] outline-none placeholder:text-[#8aa0ba] focus:border-[#38b6ff] focus:ring-2 focus:ring-[#38b6ff]/30"
                        />
                        <button
                            type="submit"
                            disabled={busy || !draft.trim()}
                            aria-label="Send"
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#6a1383] text-white transition-opacity hover:bg-[#530e68] disabled:opacity-40"
                        >
                            {busy ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : (
                                <Send className="size-4" aria-hidden />
                            )}
                        </button>
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-[#8aa0ba]">
                        Answers come from this site’s own pages. For enrolment or fees, please{' '}
                        <a href="/contact" className="underline underline-offset-2 hover:text-[#41597a]">
                            contact the team
                        </a>
                        .
                    </p>
                </form>
            </aside>
        </>
    )
}
