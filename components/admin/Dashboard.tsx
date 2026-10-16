'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { Breakdown, Dimension, Snapshot } from '@/lib/analytics-queries'
import styles from './admin.module.css'

const WINDOWS = [
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days' },
    { days: 90, label: '90 days' },
]

/** Each card is a group of dimensions the reader switches between. */
const PANELS: { title: string; tabs: { key: Dimension; label: string }[] }[] = [
    {
        title: 'Content',
        tabs: [
            { key: 'path', label: 'Pages' },
            { key: 'route', label: 'Routes' },
            { key: 'hostname', label: 'Hostnames' },
        ],
    },
    {
        title: 'Acquisition',
        tabs: [
            { key: 'referrer', label: 'Referrers' },
            { key: 'utm_source', label: 'UTM Source' },
            { key: 'utm_medium', label: 'UTM Medium' },
            { key: 'utm_campaign', label: 'UTM Campaign' },
        ],
    },
    { title: 'Countries', tabs: [{ key: 'country', label: 'Countries' }] },
    {
        title: 'Technology',
        tabs: [
            { key: 'device', label: 'Devices' },
            { key: 'browser', label: 'Browsers' },
            { key: 'os', label: 'Operating Systems' },
        ],
    },
]

const nf = new Intl.NumberFormat('en-KE')

export default function Dashboard({ initial }: { initial: Snapshot }) {
    const router = useRouter()
    const [data, setData] = useState(initial)
    const [days, setDays] = useState(initial.days)
    const [busy, setBusy] = useState(false)

    const load = useCallback(async (next: number) => {
        setBusy(true)
        try {
            const response = await fetch(`/api/admin/stats?days=${next}`)
            if (response.status === 401) {
                // The session expired while the page was open. Re-rendering the
                // server component swaps in the sign-in form rather than
                // leaving stale numbers on screen.
                router.refresh()
                return
            }
            if (response.ok) {
                setData(await response.json())
                setDays(next)
            }
        } finally {
            setBusy(false)
        }
    }, [router])

    async function signOut() {
        await fetch('/api/admin/login', { method: 'DELETE' })
        router.refresh()
    }

    const { totals, series, breakdowns, insight } = data

    return (
        <div className={styles.shell}>
            <div className={styles.inner}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Analytics</h1>
                        <p className={styles.subtitle}>
                            techkidzafrica.co.ke · last {days} days
                            {busy ? ' · updating…' : ''}
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.windows}>
                            {WINDOWS.map((option) => (
                                <button
                                    key={option.days}
                                    type="button"
                                    onClick={() => load(option.days)}
                                    className={`${styles.window} ${
                                        option.days === days ? styles.windowOn : ''
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <button type="button" className={styles.signOut} onClick={signOut}>
                            Sign out
                        </button>
                    </div>
                </header>

                <div className={styles.tiles}>
                    <Tile
                        label="Visitors"
                        value={nf.format(totals.visitors)}
                        hint="Distinct people per day, counted without cookies"
                    />
                    <Tile label="Page Views" value={nf.format(totals.views)} hint="Every page opened" />
                    <Tile
                        label="Bounce Rate"
                        value={`${totals.bounceRate}%`}
                        hint={
                            totals.visitors === 0
                                ? 'No visits recorded in this window'
                                : 'Visitors who viewed only one page'
                        }
                    />
                </div>

                <section className={`${styles.card} ${styles.insight}`}>
                    <div className={styles.cardHead}>
                        <span className={styles.insightBadge}>
                            <span className={styles.insightDot} />
                            What this means
                        </span>
                        {insight && <span className={styles.cardMeta}>written {insight.day}</span>}
                    </div>
                    {insight ? (
                        <p className={styles.insightBody}>{insight.body}</p>
                    ) : (
                        <p className={styles.empty}>
                            No summary yet — one is written each night once there is traffic to
                            describe.
                        </p>
                    )}
                </section>

                <Chart series={series} />

                <div className={styles.grid}>
                    {PANELS.map((panel) => (
                        <Panel key={panel.title} panel={panel} breakdowns={breakdowns} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <div className={styles.tile}>
            <p className={styles.tileLabel}>{label}</p>
            <p className={styles.tileValue}>{value}</p>
            <p className={styles.tileHint}>{hint}</p>
        </div>
    )
}

function Chart({ series }: { series: Snapshot['series'] }) {
    // Scale to views, which is always >= visitors, so both bars share one axis.
    const peak = Math.max(1, ...series.map((point) => point.views))
    // A long window would render 90 unreadable date labels, so thin them out.
    const every = series.length > 40 ? 10 : series.length > 14 ? 5 : 1

    return (
        <section className={styles.card}>
            <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>Daily traffic</h2>
                <div className={styles.legend}>
                    <span className={styles.legendItem}>
                        <span className={styles.swatch} style={{ background: '#1c5796' }} />
                        Visitors
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.swatch} style={{ background: '#dfeaf6' }} />
                        Views
                    </span>
                </div>
            </div>

            <div className={styles.chart}>
                {series.map((point) => (
                    <div
                        key={point.day}
                        className={styles.bar}
                        title={`${point.day}: ${point.visitors} visitors, ${point.views} views`}
                    >
                        <div
                            className={styles.barViews}
                            style={{ height: `${(point.views / peak) * 100}%` }}
                        />
                        <div
                            className={styles.barVisitors}
                            style={{ height: `${(point.visitors / peak) * 100}%` }}
                        />
                    </div>
                ))}
            </div>

            <div className={styles.chartAxis}>
                {series.map((point, index) => (
                    <span key={point.day} className={styles.chartTick}>
                        {index % every === 0 ? point.day.slice(5) : ''}
                    </span>
                ))}
            </div>
        </section>
    )
}

function Panel({
    panel,
    breakdowns,
}: {
    panel: { title: string; tabs: { key: Dimension; label: string }[] }
    breakdowns: Record<Dimension, Breakdown[]>
}) {
    const [active, setActive] = useState(panel.tabs[0].key)
    const rows = breakdowns[active] ?? []
    const peak = Math.max(1, ...rows.map((row) => row.visitors))

    return (
        <section className={styles.card}>
            <div className={styles.cardHead}>
                {panel.tabs.length > 1 ? (
                    <div className={styles.tabs}>
                        {panel.tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActive(tab.key)}
                                className={`${styles.tab} ${
                                    tab.key === active ? styles.tabOn : ''
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <h2 className={styles.cardTitle}>{panel.title}</h2>
                )}
                <span className={styles.cardMeta}>Visitors</span>
            </div>

            {rows.length === 0 ? (
                <p className={styles.empty}>No data found for the selected period.</p>
            ) : (
                <div className={styles.rows}>
                    {rows.map((row) => (
                        <div key={row.label} className={styles.row}>
                            <span
                                className={styles.rowFill}
                                style={{ width: `${(row.visitors / peak) * 100}%` }}
                            />
                            <span className={styles.rowLabel} title={row.label}>
                                {row.label}
                            </span>
                            <span className={styles.rowValue}>
                                {nf.format(row.visitors)}
                                <span>{nf.format(row.views)} views</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
