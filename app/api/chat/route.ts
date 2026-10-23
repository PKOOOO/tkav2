import { assistantConfigured, sanitiseTurns, streamReply } from '@/lib/ai/assistant'
import { saveExchange, validSessionId } from '@/lib/chat-history'
import { hasDb } from '@/lib/db'

/**
 * The chat endpoint. Streams the assistant's reply as Server-Sent Events.
 *
 * SSE rather than a plain chunked body because the stream carries more than
 * text: `tool` events let the UI say what it is looking up, and a mid-stream
 * `error` has to be distinguishable from the reply itself. One framed event
 * type per line keeps that unambiguous on the client.
 */

/** Never cached, and never prerendered: every response depends on the body. */
export const dynamic = 'force-dynamic'

/**
 * Crude per-IP limiter.
 *
 * This is a public endpoint that spends money on every call, so shipping it
 * without any ceiling would be an open invitation. It is deliberately simple,
 * and its limits are worth being honest about: the window lives in module
 * memory, so it resets on a cold start and is **per serverless instance**, not
 * global. It raises the cost of casual abuse; it is not a defence against
 * someone determined. If this ever needs to hold properly, move the counter
 * into Postgres or Vercel KV — at which point it costs a round trip per
 * message, which is why it does not start there.
 */
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 12
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
    const now = Date.now()
    const recent = (hits.get(ip) ?? []).filter((at) => now - at < WINDOW_MS)
    recent.push(now)
    hits.set(ip, recent)

    // Opportunistic sweep so the map cannot grow without bound on a
    // long-lived instance.
    if (hits.size > 500) {
        for (const [key, times] of hits) {
            if (times.every((at) => now - at >= WINDOW_MS)) hits.delete(key)
        }
    }

    return recent.length > MAX_PER_WINDOW
}

const encoder = new TextEncoder()
const sse = (event: unknown) => encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

export async function POST(request: Request) {
    if (!assistantConfigured()) {
        return Response.json({ error: 'assistant not configured' }, { status: 503 })
    }

    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'local'

    if (rateLimited(ip)) {
        return Response.json(
            { error: 'Too many messages. Give it a moment and try again.' },
            { status: 429 },
        )
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'invalid JSON' }, { status: 400 })
    }

    const turns = sanitiseTurns((body as { messages?: unknown })?.messages)
    if (!turns) {
        return Response.json({ error: 'messages must be a non-empty array of turns' }, { status: 400 })
    }

    const suppliedId = (body as { sessionId?: unknown })?.sessionId
    const sessionId = validSessionId(suppliedId) ? suppliedId : crypto.randomUUID()
    const question = turns[turns.length - 1].content

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            let answer = ''
            let completed = false
            try {
                for await (const event of streamReply(turns)) {
                    if (event.type === 'text') answer += event.text
                    if (event.type === 'done') completed = true
                    controller.enqueue(sse(event))
                }
                // Persistence is best effort so a database issue cannot interrupt the reply.
                if (completed && answer.trim() && hasDb()) {
                    try {
                        await saveExchange(sessionId, question, answer.trim())
                    } catch (error) {
                        console.error('[chat] could not save exchange:', error)
                    }
                }
            } catch (error) {
                console.error('[chat] route stream failed:', error)
                controller.enqueue(
                    sse({ type: 'error', message: 'Something went wrong. Please try again.' }),
                )
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            // Tells any proxy in front of this not to buffer the stream, which
            // would otherwise deliver the whole reply at once and defeat the point.
            'X-Accel-Buffering': 'no',
        },
    })
}
