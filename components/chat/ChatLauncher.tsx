'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'

import ChatPanel from './ChatPanel'

/**
 * The floating button that opens the assistant, and the panel's mount point.
 *
 * Rendered from `app/layout.tsx` **outside `<Shell>`**, for the same reason
 * `<Analytics />` and the page-view beacon are: `Shell` gates the entire Framer
 * tree on mount, so anything inside it is invisible until hydration finishes.
 * A help button that appears a beat late is a help button people miss.
 *
 * The panel itself is only mounted once opened, so a visitor who never asks a
 * question never downloads or runs the chat machinery.
 */
export default function ChatLauncher() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    // `/admin` is a dashboard, not a page for site visitors.
    const hidden = pathname === '/admin' || pathname.startsWith('/admin/')

    // Close on navigation: the panel is fixed-position, so it would otherwise
    // hang over whichever page the visitor just followed a link to.
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    // Stop the page behind scrolling while the panel covers it on a phone.
    useEffect(() => {
        if (!open) return
        const { overflow } = document.body.style
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = overflow
        }
    }, [open])

    if (hidden) return null

    return (
        <>
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Ask us anything"
                    className="fixed bottom-5 right-5 z-[997] flex items-center gap-2 rounded-full bg-[#6a1383] py-3 pl-4 pr-5 text-white shadow-lg shadow-[#002b5b]/20 transition-transform hover:bg-[#530e68] hover:scale-[1.03] active:scale-100"
                    style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
                >
                    <MessageCircle className="size-5" aria-hidden />
                    <span className="text-[14px] font-medium">Ask us</span>
                </button>
            )}

            {open && <ChatPanel onClose={() => setOpen(false)} />}
        </>
    )
}
