'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { ArrowDown, ArrowLeft, ArrowRight, Check, Copy, MessageCircle, MessageSquare, RefreshCw, Search, Sparkles, X } from 'lucide-react'

import type { ChatSession, SavedChatMessage } from '@/lib/chat-history'
import styles from './admin.module.css'

const fullDate = new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi',
})
const date = new Intl.DateTimeFormat('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi',
})
const time = new Intl.DateTimeFormat('en-KE', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi',
})

export default function ChatSessions() {
    const router = useRouter()
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [selected, setSelected] = useState<string | null>(null)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [loadedListKey, setLoadedListKey] = useState('')
    const [transcript, setTranscript] = useState<{
        key: string; messages: SavedChatMessage[]; error: string
    }>({ key: '', messages: [], error: '' })
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [search, setSearch] = useState('')
    const [revision, setRevision] = useState(0)
    const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
    const listKey = JSON.stringify([page, search, revision])
    const transcriptKey = `${selected}:${revision}`
    const loading = loadedListKey !== listKey
    const loadingMessages = Boolean(selected) && transcript.key !== transcriptKey
    const messages = transcript.key === transcriptKey ? transcript.messages : []
    const messageError = transcript.key === transcriptKey ? transcript.error : ''

    useEffect(() => {
        const timeout = setTimeout(() => { setSearch(query.trim()); setPage(0) }, 250)
        return () => clearTimeout(timeout)
    }, [query])

    useEffect(() => {
        const controller = new AbortController()
        fetch(`/api/admin/chats?page=${page}&q=${encodeURIComponent(search)}`, {
            cache: 'no-store', signal: controller.signal,
        })
            .then(async response => {
                if (response.status === 401) { router.refresh(); return null }
                const data = await response.json()
                if (!response.ok) throw new Error('We couldn’t load the conversations. Please try again.')
                return data as { sessions: ChatSession[]; hasMore: boolean }
            })
            .then(data => {
                if (!data || controller.signal.aborted) return
                setSessions(current => page
                    ? [...current, ...data.sessions.filter(item => !current.some(existing => existing.id === item.id))]
                    : data.sessions)
                setHasMore(data.hasMore)
                setError('')
            })
            .catch(cause => {
                if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load conversations.')
            })
            .finally(() => { if (!controller.signal.aborted) setLoadedListKey(listKey) })
        return () => controller.abort()
    }, [page, search, revision, router, listKey])

    useEffect(() => {
        const controller = new AbortController()
        if (!selected) return () => controller.abort()
        fetch(`/api/admin/chats/${selected}`, { signal: controller.signal, cache: 'no-store' })
            .then(async response => {
                if (response.status === 401) { router.refresh(); return null }
                const data = await response.json()
                if (!response.ok) throw new Error('We couldn’t load this conversation.')
                return data.messages as SavedChatMessage[]
            })
            .then(items => {
                if (items && !controller.signal.aborted) setTranscript({ key: transcriptKey, messages: items, error: '' })
            })
            .catch(cause => {
                if (!controller.signal.aborted) setTranscript({
                    key: transcriptKey, messages: [],
                    error: cause instanceof Error ? cause.message : 'Could not load this conversation.',
                })
            })
        return () => controller.abort()
    }, [selected, revision, router, transcriptKey])

    const active = sessions.find(session => session.id === selected)
    const refresh = () => { setPage(0); setRevision(value => value + 1) }

    async function copyTranscript() {
        if (!active || !messages.length) return
        const text = [
            `Tech Kidz Africa · Conversation ${active.id}`,
            `Started ${fullDate.format(new Date(active.startedAt))} EAT`,
            ...messages.map(message => `${message.role === 'user' ? 'Visitor' : 'AI Assistant'} · ${fullDate.format(new Date(message.createdAt))} EAT\n${message.content}`),
        ].join('\n\n')
        try {
            await navigator.clipboard.writeText(text)
            setCopyState('copied')
        } catch { setCopyState('failed') }
    }

    if (active) return (
        <section className={styles.conversationReader} aria-label="Conversation transcript">
            <div className={styles.readerToolbar}>
                <button className={styles.backButton} type="button" onClick={() => setSelected(null)}>
                    <ArrowLeft size={19} aria-hidden />All conversations
                </button>
                <div className={styles.readerActions}>
                    <button className={styles.secondaryButton} type="button" disabled={loadingMessages} onClick={() => setRevision(value => value + 1)}>
                        <RefreshCw size={17} className={loadingMessages ? styles.spinning : ''} aria-hidden />Refresh
                    </button>
                    <button className={styles.primaryButton} type="button" disabled={!messages.length || loadingMessages} onClick={() => void copyTranscript()}>
                        {copyState === 'copied' ? <Check size={17} aria-hidden /> : <Copy size={17} aria-hidden />}
                        {copyState === 'copied' ? 'Copied' : 'Copy transcript'}
                    </button>
                </div>
            </div>
            {copyState === 'failed' && <p className={styles.error} role="alert">Your browser couldn’t copy the transcript. You can select and copy the text below.</p>}
            <article className={styles.readerDocument}>
                <header className={styles.readerHeader}>
                    <span className={styles.recordLabel}><MessageSquare size={17} aria-hidden />CONVERSATION</span>
                    <h1>{active.preview.length > 180 ? `${active.preview.slice(0, 180)}…` : active.preview}</h1>
                    <p>Anonymous visitor <span>·</span> Session {active.id.slice(0, 8).toUpperCase()}</p>
                    <dl className={styles.recordFacts}>
                        <div><dt>Started</dt><dd>{fullDate.format(new Date(active.startedAt))}</dd></div>
                        <div><dt>Last activity</dt><dd>{fullDate.format(new Date(active.lastAt))}</dd></div>
                        <div><dt>Questions</dt><dd>{active.turns}</dd></div>
                        <div><dt>Messages</dt><dd>{loadingMessages ? '—' : messages.length}</dd></div>
                    </dl>
                </header>
                <div className={styles.transcriptSectionTitle}><h2>Full transcript</h2><span>All times in East Africa Time</span></div>
                {messageError && <div className={styles.readerNotice}><p className={styles.error} role="alert">{messageError}</p><button className={styles.secondaryButton} type="button" onClick={() => setRevision(value => value + 1)}>Try again</button></div>}
                {loadingMessages && <div className={styles.readerSkeleton} role="status"><span /><span /><span /><p>Loading the conversation…</p></div>}
                <div aria-live="polite" aria-busy={loadingMessages}>
                    {messages.map(message => (
                        <section key={message.id} className={`${styles.transcriptEntry} ${message.role === 'user' ? styles.visitorEntry : ''}`} aria-label={`${message.role === 'user' ? 'Visitor' : 'AI Assistant'} message`}>
                            <div className={styles.entryAuthor}>
                                <span className={styles.entryAvatar}>{message.role === 'user' ? <MessageCircle size={19} aria-hidden /> : <Sparkles size={19} aria-hidden />}</span>
                                <div><strong>{message.role === 'user' ? 'Visitor' : 'AI Assistant'}</strong><time dateTime={message.createdAt}>{time.format(new Date(message.createdAt))}</time></div>
                            </div>
                            <div className={styles.entryContent}>
                                {message.role === 'assistant'
                                    ? <ReactMarkdown components={{ a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{message.content}</ReactMarkdown>
                                    : <p className={styles.visitorText}>{message.content}</p>}
                            </div>
                        </section>
                    ))}
                </div>
                {!loadingMessages && messages.length > 0 && <footer className={styles.recordEnd}><Check size={16} aria-hidden />You’ve reached the end of this conversation.</footer>}
            </article>
        </section>
    )

    return (
        <section className={styles.conversationArchive} aria-label="Chat sessions">
            <div className={styles.archiveToolbar}>
                <div><h2>Conversation history <span>{sessions.length}{hasMore ? '+' : ''}</span></h2><p>Explore what visitors asked and how your assistant responded.</p></div>
                <button className={styles.secondaryButton} type="button" onClick={refresh} disabled={loading}>
                    <RefreshCw size={18} className={loading ? styles.spinning : ''} aria-hidden />Refresh
                </button>
            </div>
            <div className={styles.archiveFilters}>
                <label className={styles.archiveSearch}>
                    <Search size={19} aria-hidden />
                    <input type="search" aria-label="Search conversations" placeholder="Search questions or replies…" value={query} onChange={event => setQuery(event.target.value)} />
                    {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={17} aria-hidden /></button>}
                </label>
                <span className={styles.archiveOrder}><ArrowDown size={16} aria-hidden />Newest activity first</span>
            </div>
            {error && !loading && <div className={styles.readerNotice}><p className={styles.error} role="alert">{error}</p><button className={styles.secondaryButton} type="button" onClick={refresh}>Try again</button></div>}
            <div className={styles.sessionTableWrap} aria-busy={loading}>
                <table className={styles.sessionTable}>
                    <caption className={styles.srOnly}>Saved chatbot conversations, ordered by most recent activity</caption>
                    <thead><tr><th scope="col">Conversation</th><th scope="col">Last activity</th><th scope="col">Questions</th><th scope="col"><span className={styles.srOnly}>View transcript</span></th></tr></thead>
                    <tbody>
                        {loading && !sessions.length ? <tr><td colSpan={4}><div className={styles.archiveLoading} role="status"><RefreshCw size={22} className={styles.spinning} aria-hidden />Loading conversations…</div></td></tr> : sessions.map(session => (
                            <tr key={session.id}>
                                <td><div className={styles.sessionSummary}><span className={styles.sessionSymbol}><MessageSquare size={21} aria-hidden /></span><div><button type="button" className={styles.sessionTitle} onClick={() => { setSelected(session.id); setCopyState('idle') }}>{session.preview}</button><p>Anonymous visitor <span>·</span> {session.id.slice(0, 8).toUpperCase()}</p></div></div></td>
                                <td><time dateTime={session.lastAt} className={styles.sessionDate}>{date.format(new Date(session.lastAt))}<span>{time.format(new Date(session.lastAt))} EAT</span></time></td>
                                <td><span className={styles.questionCount}>{session.turns}</span></td>
                                <td><button className={styles.openConversation} type="button" aria-label={`Open conversation: ${session.preview}`} onClick={() => { setSelected(session.id); setCopyState('idle') }}>View chat<ArrowRight size={18} aria-hidden /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && !error && !sessions.length && <div className={styles.archiveEmpty}><MessageSquare size={36} strokeWidth={1.5} aria-hidden /><h3>{search ? 'No conversations found' : 'Ready for the first conversation'}</h3><p>{search ? 'Try another phrase, or clear the search to see all sessions.' : 'Conversations will appear here as visitors ask your AI assistant questions.'}</p>{search && <button className={styles.secondaryButton} type="button" onClick={() => setQuery('')}>Clear search</button>}</div>}
            </div>
            <footer className={styles.archiveFooter}>
                <p>{search ? 'Matching conversations' : 'Saved conversations'} <strong>{sessions.length}{hasMore ? '+' : ''}</strong><span>·</span>Times shown in EAT</p>
                {hasMore && <button className={styles.secondaryButton} type="button" disabled={loading} onClick={() => setPage(current => current + 1)}>{loading ? 'Loading…' : 'Load more conversations'}<ArrowDown size={16} aria-hidden /></button>}
            </footer>
        </section>
    )
}
