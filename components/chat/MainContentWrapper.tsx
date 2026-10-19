'use client'

import type { ReactNode } from 'react'

import { useIsChatOpen } from '@/lib/store/chat-store-provider'

/**
 * Pushes the site aside when the chat opens, instead of covering it.
 *
 * This is the behaviour that makes the panel feel built-in rather than bolted
 * on: at `2xl` and up the whole site gets a 380px right margin — matching the
 * sheet's width — and animates across in 300ms, so the visitor keeps reading
 * the page they were asking about. Below that there is no room, so the margin
 * is dropped and the sheet covers the screen over a backdrop.
 *
 * Ported from the previous site's `MainContentWrapper`, with one thing to watch
 * that did not apply there. This site's content is a Framer export: components
 * authored at a fixed 1200px that `app/globals.css` stretches with
 * `.unframer-page > * { width: 100% !important }`. Narrowing the container
 * therefore squeezes the *Desktop* variant rather than switching to Tablet,
 * because `WithFramerBreakpoints` picks its variant from the **viewport**
 * width, not the container's. The squeezed variant is still the one drawn for
 * 1200px, and `.unframer-page { overflow-x: clip }` quietly clips what no
 * longer fits rather than scrolling it.
 *
 * **This was measured, and `xl` was too low.** Pushing from 1280px leaves the
 * site 900px wide, and at 900px the navigation runs out of room: "Blogs"
 * disappears behind the Get started button, with no overflow to reveal it.
 * Hence `2xl` — from 1536px the site keeps 1156px, near enough the 1200px it
 * was drawn for that nothing collides. The cost is that 1280–1535px now gets
 * the overlay instead of the push, which is why the backdrop in `ChatSheet`
 * and the dismiss-on-navigate query in `MessageContent` move to the same
 * breakpoint. All three have to agree: a sheet that covers the page without a
 * backdrop, or that stays open after a link is followed, is worse than either
 * behaviour on its own.
 */
export function MainContentWrapper({ children }: { children: ReactNode }) {
    const isOpen = useIsChatOpen()

    return (
        <div
            className={`flex min-h-screen flex-col transition-all duration-300 ${
                isOpen ? '2xl:mr-[380px]' : ''
            }`}
        >
            {children}
        </div>
    )
}
