import { db } from '@/lib/db'

export const CHAT_PAGE_SIZE = 30

export type ChatSession = {
    id: string
    startedAt: string
    lastAt: string
    turns: number
    preview: string
}

export type SavedChatMessage = {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const validSessionId = (value: unknown): value is string =>
    typeof value === 'string' && UUID.test(value)

export async function saveExchange(sessionId: string, question: string, answer: string) {
    await db()`
        insert into chat_message (session_id, role, content)
        values (${sessionId}::uuid, 'user', ${question}),
               (${sessionId}::uuid, 'assistant', ${answer})
    `
}

export async function listChatSessions(page: number, search = '') {
    const rows = await db()`
        select session_id::text as id,
               min(created_at) as started_at,
               max(created_at) as last_at,
               count(*) filter (where role = 'user')::int as turns,
               (array_agg(content order by id) filter (where role = 'user'))[1] as preview
        from chat_message
        where ${search} = '' or session_id in (
            select session_id from chat_message
            where strpos(lower(content), lower(${search})) > 0
        )
        group by session_id
        order by last_at desc, session_id desc
        limit ${CHAT_PAGE_SIZE + 1} offset ${page * CHAT_PAGE_SIZE}
    `
    return {
        sessions: rows.slice(0, CHAT_PAGE_SIZE).map((row): ChatSession => ({
            id: String(row.id),
            startedAt: String(row.started_at),
            lastAt: String(row.last_at),
            turns: Number(row.turns),
            preview: String(row.preview ?? ''),
        })),
        hasMore: rows.length > CHAT_PAGE_SIZE,
    }
}

export async function getChatMessages(sessionId: string): Promise<SavedChatMessage[]> {
    const rows = await db()`
        select id::text, role, content, created_at
        from chat_message
        where session_id = ${sessionId}::uuid
        order by id asc
    `
    return rows.map((row) => ({
        id: String(row.id),
        role: row.role as SavedChatMessage['role'],
        content: String(row.content),
        createdAt: String(row.created_at),
    }))
}
