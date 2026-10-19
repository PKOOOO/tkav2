'use client'

import { createContext, useContext, useRef, type ReactNode } from 'react'
import { useStore } from 'zustand'

import { createChatStore, defaultInitState, type ChatState, type ChatStore } from './chat-store'

export type ChatStoreApi = ReturnType<typeof createChatStore>

const ChatStoreContext = createContext<ChatStoreApi | undefined>(undefined)

export function ChatStoreProvider({
    children,
    initialState,
}: {
    children: ReactNode
    initialState?: ChatState
}) {
    const storeRef = useRef<ChatStoreApi | null>(null)
    if (storeRef.current === null) {
        storeRef.current = createChatStore(initialState ?? defaultInitState)
    }

    return (
        <ChatStoreContext.Provider value={storeRef.current}>{children}</ChatStoreContext.Provider>
    )
}

/**
 * Selector-based access. This is why the store is zustand rather than a
 * `useReducer` in context: `MainContentWrapper` wraps the entire Framer tree
 * and subscribes only to `isOpen`, so typing in the chat input does not
 * re-render the whole site.
 */
export const useChatStore = <T,>(selector: (store: ChatStore) => T): T => {
    const context = useContext(ChatStoreContext)
    if (!context) throw new Error('useChatStore must be used within ChatStoreProvider')
    return useStore(context, selector)
}

export const useIsChatOpen = () => useChatStore((state) => state.isOpen)
export const usePendingMessage = () => useChatStore((state) => state.pendingMessage)

/** Actions are stable zustand references, so destructuring is safe. */
export const useChatActions = () => ({
    openChat: useChatStore((state) => state.openChat),
    openChatWithMessage: useChatStore((state) => state.openChatWithMessage),
    closeChat: useChatStore((state) => state.closeChat),
    toggleChat: useChatStore((state) => state.toggleChat),
    clearPendingMessage: useChatStore((state) => state.clearPendingMessage),
})
