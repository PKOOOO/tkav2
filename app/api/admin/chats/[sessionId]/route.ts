import { requireAdmin } from '@/lib/admin-auth'
import { getChatMessages, validSessionId } from '@/lib/chat-history'
import { hasDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
    const denied = await requireAdmin()
    if (denied) return denied
    if (!hasDb()) return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 503 })

    const { sessionId } = await context.params
    if (!validSessionId(sessionId)) return Response.json({ error: 'Invalid session ID' }, { status: 400 })

    try {
        const messages = await getChatMessages(sessionId)
        if (!messages.length) return Response.json({ error: 'Session not found' }, { status: 404 })
        return Response.json({ messages }, { headers: { 'Cache-Control': 'private, no-store' } })
    } catch (error) {
        console.error('[admin] chat transcript query failed:', error)
        return Response.json({ error: 'Could not load this chat.' }, { status: 500 })
    }
}
