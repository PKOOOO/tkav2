'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, X } from 'lucide-react'

import { useChatActions, useIsChatOpen, usePendingMessage } from '@/lib/store/chat-store-provider'
import { useChatStream } from '@/lib/useChatStream'
import { MessageBubble } from './parts/MessageBubble'
import { ToolCallUI } from './parts/ToolCallUI'
import { WelcomeScreen } from './parts/WelcomeScreen'

/**
 * The chat sheet, ported from the previous Tech Kidz Africa site.
 *
 * The layout decision worth preserving: at `2xl` and up this is **380px wide
 * and the site shrinks to sit beside it** (see
 * `components/chat/MainContentWrapper.tsx`, which explains why the push is at
 * `2xl` and not `xl`), so a visitor can keep reading the page they were on
 * while they ask about it.
 *
 * Three bands, not two, because the width and the push part company:
 *
 * | viewport        | sheet   | site           | backdrop |
 * |-----------------|---------|----------------|----------|
 * | `2xl` and up    | 380px   | pushed aside   | no       |
 * | `xl` to `2xl`   | 380px   | covered, dimmed| yes      |
 * | below `xl`      | full    | covered, dimmed| yes      |
 *
 * The middle band is why the width stays at `xl` while the margin moved up.
 * Pushing the site at 1280px breaks the navigation (the other file has the
 * measurement), but a 1440px laptop still has ample room for a 380px panel —
 * making it full-screen there would hide the whole site to show one column of
 * chat. So below `2xl` the panel stops pushing and starts floating over a
 * backdrop, and only below `xl`, where 380px is most of the screen anyway,
 * does it take the whole width.
 */
export function ChatSheet() {
    const isOpen = useIsChatOpen()
    const { closeChat, clearPendingMessage } = useChatActions()
    const pendingMessage = usePendingMessage()

    const { messages, status, send } = useChatStream()
    const isLoading = status !== 'idle'

    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // A question handed over by `openChatWithMessage` is asked on open, then
    // cleared so re-opening the panel does not ask it again.
    useEffect(() => {
        if (isOpen && pendingMessage && !isLoading) {
            void send(pendingMessage)
            clearPendingMessage()
        }
    }, [isOpen, pendingMessage, isLoading, send, clearPendingMessage])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    useEffect(() => {
        if (isOpen) inputRef.current?.focus()
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeChat()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen, closeChat])

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!input.trim() || isLoading) return
        void send(input)
        setInput('')
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop — below 2xl only, where the sheet covers the page. */}
            <button
                type="button"
                aria-label="Close chat"
                onClick={closeChat}
                className="fixed inset-0 z-40 bg-[#002b5b]/50 2xl:hidden"
            />

            <div className="fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l border-[#dfeaf6] bg-white shadow-xl overscroll-contain xl:w-[380px]">
                <header className="shrink-0 border-b border-[#dfeaf6]">
                    <div className="flex h-16 items-center gap-2 px-3">
                        <button
                            type="button"
                            onClick={closeChat}
                            aria-label="Close chat"
                            className="rounded-lg p-2 text-[#41597a] transition-colors hover:bg-[#eef4fa] hover:text-[#002b5b]"
                        >
                            <X className="size-6" aria-hidden />
                        </button>
                        <span className="font-semibold text-[#002b5b]">Chat with Tech Kidz Africa</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                    {messages.length === 0 ? (
                        <WelcomeScreen onSuggestionClick={(text) => void send(text)} />
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => {
                                const hasContent = message.content.length > 0
                                const hasTools = message.tools.length > 0
                                if (!hasContent && !hasTools) return null

                                return (
                                    <div key={message.id} className="space-y-3">
                                        {message.tools.map((tool, index) => (
                                            <ToolCallUI
                                                key={`${message.id}-${tool.name}-${index}`}
                                                name={tool.name}
                                                complete={tool.complete}
                                            />
                                        ))}

                                        {hasContent && (
                                            <MessageBubble
                                                role={message.role}
                                                content={message.content}
                                                closeChat={closeChat}
                                            />
                                        )}
                                    </div>
                                )
                            })}

                            {/* Only while the reply has produced nothing at all yet. */}
                            {isLoading &&
                                messages[messages.length - 1]?.role === 'assistant' &&
                                !messages[messages.length - 1]?.content &&
                                messages[messages.length - 1]?.tools.length === 0 && (
                                    <div className="flex gap-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e6d6f0]">
                                            <Bot className="size-4 text-[#6a1383]" aria-hidden />
                                        </div>
                                        <div className="flex items-center rounded-2xl bg-[#eef4fa] px-4 py-2.5">
                                            <div className="flex gap-1">
                                                <span className="size-2 animate-bounce rounded-full bg-[#38b6ff] [animation-delay:-0.3s]" />
                                                <span className="size-2 animate-bounce rounded-full bg-[#38b6ff] [animation-delay:-0.15s]" />
                                                <span className="size-2 animate-bounce rounded-full bg-[#38b6ff]" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <div
                    className="shrink-0 border-t border-[#dfeaf6] px-4 py-4"
                    style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
                >
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Ask about Tech Kidz Africa.."
                            aria-label="Your question"
                            maxLength={2000}
                            disabled={isLoading}
                            className="min-w-0 flex-1 rounded-xl border border-[#dfeaf6] bg-white px-3.5 py-2.5 text-sm text-[#002b5b] outline-none placeholder:text-[#8aa0ba] focus:border-[#38b6ff] focus:ring-2 focus:ring-[#38b6ff]/30 disabled:bg-[#f6f9fc]"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            aria-label="Send"
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#6a1383] text-white transition-opacity hover:bg-[#530e68] disabled:opacity-40"
                        >
                            {isLoading ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : (
                                <Send className="size-4" aria-hidden />
                            )}
                        </button>
                    </form>
                    <p className="mt-2 text-[11px] leading-snug text-[#8aa0ba]">
                        Answers come from this site’s own pages. For fees or enrolment, please{' '}
                        <a href="/contact" className="underline underline-offset-2 hover:text-[#41597a]">
                            contact the team
                        </a>
                        .
                    </p>
                </div>
            </div>
        </>
    )
}
