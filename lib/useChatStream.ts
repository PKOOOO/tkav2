'use client'

import { useCallback, useRef, useState } from 'react'

export type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string }
export type ChatStatus = 'idle' | 'sending' | 'streaming'

const ENDPOINT = '/api/chat'

/**
 * Drives the chat: message list, send, and consuming the SSE stream from
 * `app/api/chat/route.ts`.
 *
 * Hand-rolled rather than `useChat` from the AI SDK. That hook is the reason
 * the previous site's chat UI was short, but its stable line is now `ai@7` /
 * `@ai-sdk/react@4` -- two majors past the betas that site pinned, and a
 * different API generation. Consuming seven framed event types off a
 * `fetch` body is less code than adopting an SDK whose current shape would
 * have to be re-learned, and it keeps the official Anthropic SDK as the only
 * model dependency.
 */
export function useChatStream() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [status, setStatus] = useState<ChatStatus>('idle')
    const [activity, setActivity] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const reset = useCallback(() => {
        abortRef.current?.abort()
        abortRef.current = null
        setMessages([])
        setStatus('idle')
        setActivity(null)
    }, [])

    const stop = useCallback(() => {
        abortRef.current?.abort()
        abortRef.current = null
        setStatus('idle')
        setActivity(null)
    }, [])

    const send = useCallback(
        async (text: string) => {
            const prompt = text.trim()
            if (!prompt || status !== 'idle') return

            const userTurn: ChatMessage = {
                id: `u${Date.now()}`,
                role: 'user',
                content: prompt,
            }
            const replyId = `a${Date.now()}`

            // Snapshot the history to send *before* adding the empty reply, so
            // the request never contains a blank assistant turn.
            const history = [...messages, userTurn].map(({ role, content }) => ({ role, content }))

            setMessages((prev) => [...prev, userTurn, { id: replyId, role: 'assistant', content: '' }])
            setStatus('sending')
            setActivity(null)

            const controller = new AbortController()
            abortRef.current = controller

            const appendToReply = (chunk: string) =>
                setMessages((prev) =>
                    prev.map((m) => (m.id === replyId ? { ...m, content: m.content + chunk } : m)),
                )

            try {
                const response = await fetch(ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: history }),
                    signal: controller.signal,
                })

                if (!response.ok || !response.body) {
                    const fallback =
                        response.status === 429
                            ? 'That’s a lot of questions at once — give it a moment and try again.'
                            : 'Sorry, I couldn’t answer just now. Please try again.'
                    appendToReply(fallback)
                    setStatus('idle')
                    return
                }

                setStatus('streaming')

                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''
                /**
                 * Tracks whether any text has landed yet in this reply. The
                 * model can emit a sentence, call a tool, then carry on — which
                 * arrives as two text runs with nothing between them and reads
                 * as "...enrolment is ongoing.It covers a great mix". A tool
                 * event after text therefore inserts a paragraph break.
                 */
                let hasText = false

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })

                    // SSE frames are separated by a blank line; a frame can
                    // straddle two network chunks, so only complete ones are parsed.
                    const frames = buffer.split('\n\n')
                    buffer = frames.pop() ?? ''

                    for (const frame of frames) {
                        const line = frame.split('\n').find((l) => l.startsWith('data: '))
                        if (!line) continue

                        let event: { type?: string; text?: string; name?: string; message?: string }
                        try {
                            event = JSON.parse(line.slice(6))
                        } catch {
                            continue
                        }

                        if (event.type === 'text' && event.text) {
                            hasText = true
                            setActivity(null)
                            appendToReply(event.text)
                        } else if (event.type === 'tool') {
                            if (hasText) appendToReply('\n\n')
                            setActivity(labelFor(event.name))
                        } else if (event.type === 'error' && event.message) {
                            appendToReply((hasText ? '\n\n' : '') + event.message)
                        }
                    }
                }
            } catch (error) {
                if ((error as Error)?.name !== 'AbortError') {
                    appendToReply('Sorry, the connection dropped. Please try again.')
                }
            } finally {
                abortRef.current = null
                setActivity(null)
                setStatus('idle')
            }
        },
        [messages, status],
    )

    return { messages, status, activity, send, stop, reset }
}

/** Turns a tool name into something a visitor would recognise. */
function labelFor(name?: string): string {
    switch (name) {
        case 'list_programmes':
        case 'get_programme':
            return 'Checking the programmes…'
        case 'list_mentors':
        case 'get_mentor':
            return 'Looking up the team…'
        case 'search_articles':
        case 'get_article':
            return 'Searching the articles…'
        case 'get_practical_info':
            return 'Finding the details…'
        default:
            return 'Looking that up…'
    }
}
