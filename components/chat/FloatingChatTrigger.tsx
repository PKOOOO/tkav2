'use client'

import { usePathname } from 'next/navigation'
import { MessageSquare, Sparkles } from 'lucide-react'

import { useChatActions, useIsChatOpen } from '@/lib/store/chat-store-provider'

/**
 * The floating launcher, ported from the previous Tech Kidz Africa site —
 * including the gradient, the two animated rings, the sparkle badge and the
 * "Talk to Us" tooltip. The gradient is the site's own three brand colours:
 * `#80569e` → `#6a1383` → `#38b6ff`.
 *
 * It hides itself while the sheet is open (the sheet has its own close button)
 * and toggles rather than only opening, as the original did.
 */
export function FloatingChatTrigger() {
    const { toggleChat } = useChatActions()
    const isOpen = useIsChatOpen()
    const pathname = usePathname()

    // `/admin` is a dashboard, not a page for site visitors.
    if (isOpen) return null
    if (pathname === '/admin' || pathname.startsWith('/admin/')) return null

    return (
        <div
            className="group fixed right-6 bottom-6 z-[45]"
            style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
        >
            {/* Animated rings */}
            <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-br from-[#80569e] to-[#38b6ff] opacity-20 blur-2xl [animation-duration:2s]" />
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-[#6a1383] to-[#38b6ff] opacity-30 blur-xl [animation-duration:3s]" />

            {/* Sparkle badge */}
            <div className="absolute -top-1 -right-1 z-10">
                <div className="flex size-6 animate-bounce items-center justify-center rounded-full bg-gradient-to-br from-[#38b6ff] to-[#6a1383] shadow-lg [animation-duration:2s]">
                    <Sparkles className="size-3 text-white" aria-hidden />
                </div>
            </div>

            {/* Tooltip */}
            <div className="pointer-events-none absolute right-0 bottom-full mb-2 scale-90 rounded-lg border border-white/40 bg-white/90 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-[#002b5b] opacity-0 shadow-[0_8px_32px_0_rgba(0,43,91,0.2)] backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-100 group-hover:opacity-100">
                Talk to Us
                <div className="absolute -bottom-1 right-6 size-2 rotate-45 border-r border-b border-white/40 bg-white/90" />
            </div>

            <button
                type="button"
                onClick={toggleChat}
                aria-label="Talk to us"
                className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-[#80569e] via-[#6a1383] to-[#38b6ff] shadow-[0_0_40px_rgba(106,19,131,0.4)] transition-all duration-500 hover:scale-110 hover:rotate-12 hover:shadow-[0_0_60px_rgba(106,19,131,0.6)]"
            >
                <MessageSquare className="size-7 text-white transition-transform group-hover:scale-110" aria-hidden />
            </button>
        </div>
    )
}
