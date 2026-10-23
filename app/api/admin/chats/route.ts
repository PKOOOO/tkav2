import { requireAdmin } from '@/lib/admin-auth'
import { listChatSessions } from '@/lib/chat-history'
import { hasDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const denied = await requireAdmin()
    if (denied) return denied
    if (!hasDb()) return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 503 })

    const raw = Number(new URL(request.url).searchParams.get('page') ?? '0')
    const page = Number.isSafeInteger(raw) && raw >= 0 && raw <= 10000 ? raw : 0

    try {
        return Response.json(await listChatSessions(page, (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 200)), {
            headers: { 'Cache-Control': 'private, no-store' },
        })
    } catch (error) {
        console.error('[admin] chat sessions query failed:', error)
        return Response.json({ error: 'Could not load chat sessions. Run the database setup if this is a new installation.' }, { status: 500 })
    }
}
