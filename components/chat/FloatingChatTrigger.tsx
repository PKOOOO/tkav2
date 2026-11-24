'use client'

import { usePathname } from 'next/navigation'

import { useChatActions, useIsChatOpen } from '@/lib/store/chat-store-provider'

/**
 * The floating launcher: the site's walking ladybug robot, with the "Talk to
 * Us" tooltip from the previous Tech Kidz Africa site.
 *
 * The motion is not done here. The <img> is the still, and `lib/useVideoDecor.ts`
 * mounts the same ladybug clip the Program CTA band plays over it -- found via
 * `data-video-decor-host` and the `#chat` fragment -- falling back to this
 * still wherever transparent video cannot play.
 *
 * Hidden rather than unmounted while the sheet is open: the decor hook only
 * rescans on navigation and on `.unframer-page` mutations, so a remounted
 * launcher would come back as a still until the next route change.
 */
export function FloatingChatTrigger() {
    const { toggleChat } = useChatActions()
    const isOpen = useIsChatOpen()
    const pathname = usePathname()

    // `/admin` is a dashboard, not a page for site visitors.
    if (pathname === '/admin' || pathname.startsWith('/admin/')) return null

    return (
        <div
            className={`group fixed right-6 bottom-6 z-[45] ${isOpen ? 'hidden' : ''}`}
            style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
            data-video-decor-host
        >
            {/* "Talk to Us" label, always shown; lifts slightly on hover. */}
            <div className="pointer-events-none absolute right-0 bottom-full mb-2 rounded-lg border border-white/40 bg-white/90 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-[#002b5b] shadow-[0_8px_32px_0_rgba(0,43,91,0.2)] backdrop-blur-xl transition-transform duration-300 group-hover:-translate-y-1">
                Talk to Us
                <div className="absolute -bottom-1 right-6 size-2 rotate-45 border-r border-b border-white/40 bg-white/90" />
            </div>

            <button
                type="button"
                onClick={toggleChat}
                aria-label="Talk to us"
                className="relative block size-20 transition-transform duration-300 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6a1383]"
            >
                {/* The video is appended into this span, absolutely inset. */}
                <span className="absolute inset-0 block drop-shadow-[0_6px_12px_rgba(0,43,91,0.35)]">
                    <img
                        src="/decor/ladybug.png#chat"
                        alt=""
                        aria-hidden
                        draggable={false}
                        className="size-full object-contain"
                    />
                </span>
            </button>
        </div>
    )
}
