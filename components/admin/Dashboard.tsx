'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, ChevronRight, ExternalLink, Globe2, LayoutDashboard, LogOut, MessageSquare, Monitor, MousePointer2, RefreshCw, Sparkles, Users, X, type LucideIcon } from 'lucide-react'

import type { Breakdown, Dimension, Snapshot } from '@/lib/analytics-queries'
import ChatSessions from './ChatSessions'
import styles from './admin.module.css'

const WINDOWS = [7, 30, 90]
const nf = new Intl.NumberFormat('en-KE')
const regions = new Intl.DisplayNames(['en'], { type: 'region' })
const PANELS: { title: string; icon: LucideIcon; tabs: { key: Dimension; label: string }[] }[] = [
    { title: 'Top content', icon: MousePointer2, tabs: [{ key: 'path', label: 'Pages' }, { key: 'route', label: 'Routes' }, { key: 'hostname', label: 'Hostnames' }] },
    { title: 'Where visitors come from', icon: ArrowDownRight, tabs: [{ key: 'referrer', label: 'Referrers' }, { key: 'utm_source', label: 'Source' }, { key: 'utm_medium', label: 'Medium' }, { key: 'utm_campaign', label: 'Campaign' }] },
    { title: 'Around the world', icon: Globe2, tabs: [{ key: 'country', label: 'Countries' }] },
    { title: 'Devices & browsers', icon: Monitor, tabs: [{ key: 'device', label: 'Devices' }, { key: 'browser', label: 'Browsers' }, { key: 'os', label: 'Operating systems' }] },
]

export default function Dashboard({ initial }: { initial: Snapshot }) {
    const router = useRouter()
    const [data, setData] = useState(initial)
    const [days, setDays] = useState(initial.days)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [view, setView] = useState<'analytics' | 'chats'>('analytics')
    const requestRef = useRef(0)
    const insightDialog = useRef<HTMLDialogElement>(null)

    const load = useCallback(async (next: number) => {
        const request = ++requestRef.current
        setBusy(true)
        setError('')
        try {
            const response = await fetch(`/api/admin/stats?days=${next}`, { cache: 'no-store' })
            if (response.status === 401) { router.refresh(); return }
            if (!response.ok) throw new Error('Could not update the overview. Please try again.')
            const updated: Snapshot = await response.json()
            if (request === requestRef.current) { setData(updated); setDays(next) }
        } catch (cause) {
            if (request === requestRef.current) setError(cause instanceof Error ? cause.message : 'Could not update the overview.')
        } finally {
            if (request === requestRef.current) setBusy(false)
        }
    }, [router])

    async function signOut() {
        try {
            const response = await fetch('/api/admin/login', { method: 'DELETE' })
            if (!response.ok) throw new Error()
            router.refresh()
        } catch { setError('Could not sign out. Please try again.') }
    }

    const { totals, series, breakdowns, insight } = data

    return (
        <div className={styles.shell}>
            <a className={styles.skipLink} href="#admin-content">Skip to content</a>
            <aside className={styles.sidebar}>
                <a href="/admin" className={styles.brand} aria-label="Tech Kidz Africa admin home">
                    <Image src="/brand/logo-nav.png" alt="Tech Kidz Africa" width={192} height={48} priority className={styles.websiteLogo} />
                </a>
                <p className={styles.navLabel}>Admin workspace</p>
                <nav className={styles.adminNav} aria-label="Admin sections">
                    <button type="button" className={`${styles.navItem} ${view === 'analytics' ? styles.navItemOn : ''}`} aria-current={view === 'analytics' ? 'page' : undefined} onClick={() => setView('analytics')}><LayoutDashboard size={18} aria-hidden />Overview<ChevronRight size={15} aria-hidden /></button>
                    <button type="button" className={`${styles.navItem} ${view === 'chats' ? styles.navItemOn : ''}`} aria-current={view === 'chats' ? 'page' : undefined} onClick={() => setView('chats')}><MessageSquare size={18} aria-hidden />Conversations<ChevronRight size={15} aria-hidden /></button>
                </nav>
                <div className={styles.sidebarBottom}>
                    <a href="/" target="_blank" rel="noopener noreferrer" className={styles.siteCard}>
                        <span className={styles.siteIcon}><Globe2 size={19} aria-hidden /></span>
                        <span>Your website<small>techkidzafrica.co.ke</small></span>
                        <ArrowUpRight size={16} aria-hidden />
                    </a>
                    <div className={styles.account}>
                        <span className={styles.avatar}>TK</span>
                        <span>Administrator<small>Tech Kidz Africa</small></span>
                        <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={18} aria-hidden /></button>
                    </div>
                </div>
            </aside>

            <div className={styles.workspace}>
                <div className={styles.topbar}>
                    <div className={styles.breadcrumb}>Workspace<ChevronRight size={14} aria-hidden /><span>{view === 'analytics' ? 'Overview' : 'Conversations'}</span></div>
                    <a href="/" target="_blank" rel="noopener noreferrer" className={styles.visitSite}>Visit website<ExternalLink size={13} aria-hidden /></a>
                </div>
                <main id="admin-content" className={styles.main}>
                    <header className={styles.header}>
                        <div>
                            <p className={styles.eyebrow}>{view === 'analytics' ? 'YOUR WEBSITE, AT A GLANCE' : 'YOUR ASSISTANT, IN CONTEXT'}</p>
                            <h1 className={styles.title}>{view === 'analytics' ? 'Overview' : 'Conversations'}<span>.</span></h1>
                            <p className={styles.subtitle}>{view === 'analytics' ? 'Understand your audience. See what sparks their curiosity.' : 'Review visitor questions and your AI assistant’s responses.'}</p>
                        </div>
                        {view === 'analytics' && <div className={styles.headerActions}>
                            <div className={styles.windows} aria-label="Analytics period"><CalendarDays size={15} aria-hidden />{WINDOWS.map((option) => <button key={option} type="button" aria-pressed={days === option} onClick={() => void load(option)} className={`${styles.window} ${days === option ? styles.windowOn : ''}`}>{option} days</button>)}</div>
                            <button type="button" className={styles.iconButton} aria-label="Refresh analytics" title="Refresh analytics" disabled={busy} onClick={() => void load(days)}><RefreshCw size={17} className={busy ? styles.spinning : ''} aria-hidden /></button>
                        </div>}
                    </header>
                    {error && <p role="alert" className={styles.error}>{error}</p>}
                    {view === 'chats' ? <ChatSessions /> : <div aria-busy={busy} className={styles.overview}>
                        <div className={styles.tiles}>
                            <Tile label="Total visitors" value={nf.format(totals.visitors)} hint="Unique visitors, counted daily" icon={Users} values={series.map(p => p.visitors)} tone="purple" />
                            <Tile label="Page views" value={nf.format(totals.views)} hint="Every page opened on your website" icon={MousePointer2} values={series.map(p => p.views)} tone="blue" />
                            <Tile label="Bounce rate" value={`${totals.bounceRate}%`} hint={totals.visitors ? 'Visits that ended after a single page' : 'Waiting for your first visitors'} icon={ArrowUpRight} rate={totals.bounceRate} tone="orange" />
                        </div>
                        <div className={styles.chartRow}>
                            <Chart series={series} days={days} />
                            <section className={styles.insight}>
                                <div className={styles.insightTop}><span className={styles.insightIcon}><Sparkles size={20} aria-hidden /></span><span className={styles.insightBadge}>DAILY INSIGHT</span></div>
                                <h2>The bigger picture.</h2>
                                {insight ? <><p className={`${styles.insightBody} ${styles.insightPreview}`}>{insight.body}</p><button type="button" className={styles.insightReadMore} onClick={() => insightDialog.current?.showModal()}>Read full insight<ArrowUpRight size={13} aria-hidden /></button></> : <><p className={styles.insightBody}>Every visit tells a story.</p><p className={styles.insightDescription}>Once there’s traffic to explore, a daily summary will help you make sense of the numbers.</p></>}
                                <div className={styles.insightFooter}><span className={styles.statusDot} />{insight ? `Summary · ${formatDay(insight.day)}` : 'A fresh perspective, every night'}</div>
                            </section>
                        </div>
                        {insight && <dialog ref={insightDialog} className={styles.insightDialog} aria-labelledby="insight-title" onClick={event => { if (event.target === event.currentTarget) insightDialog.current?.close() }}>
                            <div className={styles.insightDialogHead}><span className={styles.insightBadge}>DAILY INSIGHT · {formatDay(insight.day)}</span><button className={styles.iconButton} type="button" aria-label="Close insight" onClick={() => insightDialog.current?.close()}><X size={18} aria-hidden /></button></div>
                            <h2 id="insight-title">The bigger picture.</h2><p>{insight.body}</p>
                        </dialog>}
                        <div className={styles.sectionHeading}><h2>Explore your audience</h2><span>Last {days} days</span></div>
                        <div className={styles.grid}>{PANELS.map(panel => <Panel key={panel.title} panel={panel} breakdowns={breakdowns} />)}</div>
                        <footer className={styles.pageFooter}><span>Tech Kidz Africa <span>·</span> Made for curious minds.</span><span>Analytics without tracking cookies</span></footer>
                    </div>}
                </main>
            </div>
        </div>
    )
}

function Tile({ label, value, hint, icon: Icon, values, rate, tone }: { label: string; value: string; hint: string; icon: LucideIcon; values?: number[]; rate?: number; tone: string }) {
    const peak = Math.max(1, ...(values ?? []))
    const points = values?.map((v, i) => `${i * 100 / Math.max(1, values.length - 1)},${35 - v / peak * 29}`).join(' ')
    return <section className={`${styles.tile} ${styles[tone]}`}>
        <div className={styles.tileTop}><span>{label}</span><span className={styles.tileIcon}><Icon size={17} aria-hidden /></span></div>
        <div className={styles.tileNumber}><strong>{value}</strong>{values ? <svg className={styles.sparkline} viewBox="0 0 100 40" aria-hidden><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg className={styles.rateRing} viewBox="0 0 40 40" aria-hidden><circle cx="20" cy="20" r="15" fill="none" stroke="var(--tone-soft)" strokeWidth="5" /><circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray={`${(rate ?? 0) * .9425} 94.25`} transform="rotate(-90 20 20)" strokeLinecap="round" /></svg>}</div>
        <p className={styles.tileHint}>{hint}</p>
    </section>
}

function formatDay(day: string) { return new Date(`${day.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', timeZone: 'Africa/Nairobi' }) }

function Chart({ series, days }: { series: Snapshot['series']; days: number }) {
    const gradientId = useId()
    const [metric, setMetric] = useState<'visitors' | 'views'>('visitors')
    const [hovered, setHovered] = useState<number | null>(null)
    const peak = Math.max(4, ...series.map(p => p[metric]))
    const ceiling = Math.ceil(peak / 4) * 4
    const points = series.map((p, i) => ({ x: series.length === 1 ? 500 : i * 1000 / (series.length - 1), y: 210 - p[metric] / ceiling * 190 }))
    const line = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')
    const area = points.length ? `${line} L ${points[points.length - 1].x} 210 L ${points[0].x} 210 Z` : ''
    const selected = hovered === null ? null : series[hovered]
    const total = series.reduce((sum, p) => sum + p[metric], 0)
    const every = Math.max(1, Math.ceil(series.length / 7))

    return <section className={`${styles.card} ${styles.chartCard}`}>
        <div className={styles.cardHead}><div><h2 className={styles.cardTitle}>Visitor activity</h2><p className={styles.cardDescription}>How your audience shows up over time</p></div><span className={styles.periodBadge}>{days} days</span></div>
        <div className={styles.chartToolbar}><div className={styles.chartTotal}>{nf.format(series.at(-1)?.[metric] ?? 0)}<span>{metric === 'visitors' ? 'visitors today' : 'page views today'}</span></div><div className={styles.metricPicker}><button type="button" aria-pressed={metric === 'visitors'} onClick={() => setMetric('visitors')}>Visitors</button><button type="button" aria-pressed={metric === 'views'} onClick={() => setMetric('views')}>Page views</button></div></div>
        <div className={styles.chartContainer}>
            <div className={styles.yAxis}>{[4, 3, 2, 1, 0].map(step => <span key={step}>{nf.format(ceiling * step / 4)}</span>)}</div>
            <div className={styles.plot}>
                <svg viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label={`${metric === 'visitors' ? 'Visitors' : 'Page views'} over the last ${days} days: ${total} total`}>
                    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8163c9" stopOpacity=".22" /><stop offset="100%" stopColor="#8163c9" stopOpacity=".015" /></linearGradient></defs>
                    {[0, 1, 2, 3, 4].map(step => <line key={step} x1="0" x2="1000" y1={20 + step * 47.5} y2={20 + step * 47.5} stroke="#e9ebf0" strokeDasharray="4 5" />)}
                    <path d={area} fill={`url(#${gradientId})`} />
                    <path d={line} fill="none" stroke="#8060c5" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                    {hovered !== null && points[hovered] && <line x1={points[hovered].x} x2={points[hovered].x} y1="15" y2="210" stroke="#8060c5" strokeDasharray="3 4" />}
                </svg>
                <div className={styles.chartTargets}>{series.map((point, index) => <button key={point.day} type="button" aria-label={`${formatDay(point.day)}: ${point[metric]} ${metric}`} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} />)}</div>
                {selected && <div className={styles.chartTooltip} style={{ left: `${Math.min(80, Math.max(10, (hovered ?? 0) / Math.max(1, series.length - 1) * 100))}%` }}><span>{formatDay(selected.day)}</span><strong>{selected[metric]} {metric === 'visitors' ? 'visitors' : 'views'}</strong></div>}
                <div className={styles.chartAxis}>{series.filter((_, index) => index % every === 0 || index === series.length - 1).map(point => <span key={point.day}>{formatDay(point.day)}</span>)}</div>
            </div>
        </div>
    </section>
}

function Panel({ panel, breakdowns }: { panel: typeof PANELS[number]; breakdowns: Record<Dimension, Breakdown[]> }) {
    const [active, setActive] = useState(panel.tabs[0].key)
    const rows = breakdowns[active] ?? []
    const peak = Math.max(1, ...rows.map(row => row.visitors))
    const Icon = panel.icon
    return <section className={styles.card}>
        <div className={styles.cardHead}><h2 className={styles.cardTitle}><Icon size={17} aria-hidden />{panel.title}</h2><span className={styles.cardMeta}>Visitors</span></div>
        <div className={styles.tabs} aria-label={panel.title}>{panel.tabs.map(tab => <button key={tab.key} type="button" aria-pressed={tab.key === active} onClick={() => setActive(tab.key)} className={`${styles.tab} ${tab.key === active ? styles.tabOn : ''}`}>{tab.label}</button>)}</div>
        {rows.length === 0 ? <div className={styles.panelEmpty}><BarChart3 size={25} strokeWidth={1.4} aria-hidden /><p>A little quiet here.</p><span>Visitor activity will appear in this breakdown.</span></div> : <div className={styles.rows}>{rows.map((row, index) => <div key={row.label} className={styles.row}><span className={styles.rowRank}>{String(index + 1).padStart(2, '0')}</span><div className={styles.rowContent}><div className={styles.rowText}><span title={row.label}>{row.label === '(none)' ? (active === 'referrer' ? 'Direct / unknown' : 'Unknown') : active === 'country' && /^[A-Z]{2}$/.test(row.label) ? regions.of(row.label) : row.label}</span><strong>{nf.format(row.visitors)}</strong></div><div className={styles.rowTrack}><span style={{ width: `${row.visitors / peak * 100}%` }} /></div></div></div>)}</div>}
    </section>
}
