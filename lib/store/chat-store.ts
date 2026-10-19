import { createStore } from 'zustand/vanilla'

/**
 * Chat sheet visibility, ported from the previous Tech Kidz Africa site.
 *
 * `pendingMessage` is the part worth keeping deliberately: it lets anything on
 * the site open the chat *with a question already asked* -- a "Ask about this
 * programme" button on a course page, say -- rather than only opening an empty
 * panel. `ChatSheet` sends it on open and then clears it.
 *
 * No persistence: a chat should start closed on every page load.
 */
export interface ChatState {
    isOpen: boolean
    pendingMessage: string | null
}

export interface ChatActions {
    openChat: () => void
    openChatWithMessage: (message: string) => void
    closeChat: () => void
    toggleChat: () => void
    clearPendingMessage: () => void
}

export type ChatStore = ChatState & ChatActions

export const defaultInitState: ChatState = { isOpen: false, pendingMessage: null }

/** A factory, so each provider owns its own store rather than a module global. */
export const createChatStore = (initState: ChatState = defaultInitState) =>
    createStore<ChatStore>()((set) => ({
        ...initState,
        openChat: () => set({ isOpen: true }),
        openChatWithMessage: (message: string) => set({ isOpen: true, pendingMessage: message }),
        closeChat: () => set({ isOpen: false }),
        toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
        clearPendingMessage: () => set({ pendingMessage: null }),
    }))
