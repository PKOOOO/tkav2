'use client'

import { useCallback, useRef, useState } from 'react'

export type ToolCall = { name: string; complete: boolean }
export type ChatMessage = {
    id: string
    role: 'user' | 'assistant'
    content: string
    tools: ToolCall[]
}
export type ChatStatus = 'idle' | 'sending' | 'streaming'

const ENDPOINT = '/api/chat'

/**
 * Consumes the SSE stream from `app/api/chat/route.ts` and keeps the message
 * list.
 *
 * This stands in for `useChat` from `@ai-sdk/react`, which the previous site
 * used. That package's stable line is now `@ai-sdk/react@4` against the
 * `3.0.0-beta` it pinned -- a different API generation -- so the transport is
 * hand-rolled while the *UI* is ported as-is. Each assistant message therefore
 * carries the same two things the previous site's renderer expected: the text,
 * and the tool calls that produced it.
 */
export function useChatStream() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [status, setStatus] = useState<ChatStatus>('idle')
    const abortRef = useRef<AbortController | null>(null)
    const sessionIdRef = useRef<string | null>(null)

    const stop = useCallback(() => {
        abortRef.current?.abort()
        abortRef.current = null
        setStatus('idle')
    }, [])

    const send = useCallback(
        async (text: string) => {
            const prompt = text.trim()
            if (!prompt || status !== 'idle') return

            const userTurn: ChatMessage = {
                id: `u${Date.now()}`,
                role: 'user',
                content: prompt,
                tools: [],
            }
            const replyId = `a${Date.now()}`

            // Snapshot history before adding the empty reply, so the request
            // never contains a blank assistant turn.
            const history = [...messages, userTurn].map(({ role, content }) => ({ role, content }))

            setMessages((prev) => [
                ...prev,
                userTurn,
                { id: replyId, role: 'assistant', content: '', tools: [] },
            ])
            setStatus('sending')

            sessionIdRef.current ??= crypto.randomUUID()
            const controller = new AbortController()
            abortRef.current = controller

            const patchReply = (fn: (m: ChatMessage) => ChatMessage) =>
                setMessages((prev) => prev.map((m) => (m.id === replyId ? fn(m) : m)))

            try {
                const response = await fetch(ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: history, sessionId: sessionIdRef.current }),
                    signal: controller.signal,
                })

                if (!response.ok || !response.body) {
                    patchReply((m) => ({
                        ...m,
                        content:
                            response.status === 429
                                ? 'That’s a lot of questions at once — give it a moment and try again.'
                                : 'Sorry, I couldn’t answer just now. Please try again.',
                    }))
                    setStatus('idle')
                    return
                }

                setStatus('streaming')

                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })

                    // Frames are separated by a blank line and can straddle two
                    // network chunks, so only complete frames are parsed.
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
                            const chunk = event.text
                            patchReply((m) => ({
                                ...m,
                                // Any tool still showing a spinner has clearly
                                // finished once the answer starts arriving.
                                tools: m.tools.map((t) => ({ ...t, complete: true })),
                                content: m.content + chunk,
                            }))
                        } else if (event.type === 'tool' && event.name) {
                            const name = event.name
                            patchReply((m) => ({
                                ...m,
                                tools: [...m.tools, { name, complete: false }],
                                /*
                                 * A tool call arriving after text means the
                                 * model said something, looked something up,
                                 * then carried on -- two text runs with
                                 * nothing between them, which renders as
                                 * "...ideal for a 10 year old.For your 10 year
                                 * old...". A blank line makes markdown treat
                                 * them as separate paragraphs.
                                 */
                                content: m.content && !m.content.endsWith('\n\n')
                                    ? `${m.content}\n\n`
                                    : m.content,
                            }))
                        } else if (event.type === 'error' && event.message) {
                            const message = event.message
                            patchReply((m) => ({
                                ...m,
                                tools: m.tools.map((t) => ({ ...t, complete: true })),
                                content: m.content ? `${m.content}\n\n${message}` : message,
                            }))
                        }
                    }
                }
            } catch (error) {
                if ((error as Error)?.name !== 'AbortError') {
                    patchReply((m) => ({
                        ...m,
                        content: m.content || 'Sorry, the connection dropped. Please try again.',
                    }))
                }
            } finally {
                // Never leave a chip spinning if the stream ended early.
                patchReply((m) => ({ ...m, tools: m.tools.map((t) => ({ ...t, complete: true })) }))
                abortRef.current = null
                setStatus('idle')
            }
        },
        [messages, status],
    )

    return { messages, status, send, stop }
}
