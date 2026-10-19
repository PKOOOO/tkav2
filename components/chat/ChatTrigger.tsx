'use client'

import { MessageCircle } from 'lucide-react'

import { useChatActions } from '@/lib/store/chat-store-provider'

/**
 * An inline button for use inside page content, ported from the previous site.
 *
 * Unlike the floating launcher this can carry a question: pass `question` and
 * it opens the sheet with that already asked — e.g. "Ask about this programme"
 * on a course page. That is what `openChatWithMessage` in the store is for.
 */
export function ChatTrigger({
    question,
    children = 'Ask us about this',
    className = '',
}: {
    question?: string
    children?: React.ReactNode
    className?: string
}) {
    const { openChat, openChatWithMessage } = useChatActions()

    return (
        <button
            type="button"
            onClick={() => (question ? openChatWithMessage(question) : openChat())}
            className={`inline-flex items-center gap-2 rounded-xl bg-[#6a1383] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#530e68] ${className}`}
        >
            <MessageCircle className="size-5" aria-hidden />
            {children}
        </button>
    )
}
