#!/usr/bin/env node
/**
 * Create (or update) the analytics schema in Neon. Idempotent -- safe to re-run.
 *
 *     node scripts/db-setup.mjs            # show what exists / would be created
 *     node scripts/db-setup.mjs --write    # apply
 *
 * ## Why three tables and not one
 *
 * The site this replaces wrote one CMS document per page view and then built
 * its dashboard with `*[_type == "pageView" && timestamp >= $start] { path }`
 * -- fetching every row in the window and counting them in JavaScript. That
 * cost grows with traffic until the dashboard times out, and it is the single
 * thing worth not repeating.
 *
 * So raw rows are a short-lived buffer, and the dashboard only ever reads
 * pre-aggregated rows:
 *
 *   page_view         raw, one row per view, pruned after RETENTION_DAYS
 *   page_view_daily   per day x path x device, kept forever
 *   visit_daily       per day only, kept forever
 *
 * `visit_daily` looks redundant next to `page_view_daily` but is not, and the
 * reason is a trap worth stating: **unique-session counts do not sum.** One
 * visitor who reads three pages contributes to three `page_view_daily` rows,
 * so adding that column up reports three visitors. `visit_daily.sessions` is
 * a single `count(distinct ...)` over the whole day, so it is the only correct
 * source for "how many people came". Views do sum, and may be taken from
 * either table.
 *
 * ## What is deliberately not stored
 *
 * No IP address and no raw user-agent string -- the old schema kept the full
 * UA on every row, which is a fingerprinting surface for no analytical gain.
 * What lands here is a coarse `device`, and `session_hash`: a digest of
 * IP + UA + ANALYTICS_SALT + the current date. Because the date is part of the
 * input, the same visitor hashes differently tomorrow. That makes the hash
 * useless for tracking anyone across days -- which is the point, and is also
 * why `sessions` means "distinct visitors that day" rather than anything
 * longer-lived. No cookie is set, so no consent banner is required.
 */

import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const RETENTION_DAYS = 90

const STATEMENTS = [
    [
        'page_view',
        `create table if not exists page_view (
            id            bigserial primary key,
            path          text        not null,
            referrer_host text,
            device        text        not null,
            country       text,
            session_hash  text        not null,
            ts            timestamptz not null default now()
        )`,
    ],
    // The rollup reads a day's worth of rows by time, and the pruner deletes by
    // time; both are covered by this one index.
    ['page_view.ts index', 'create index if not exists page_view_ts_idx on page_view (ts)'],
    /**
     * Added after the first version shipped, which is why these are `alter`
     * rather than part of the `create` above -- `add column if not exists`
     * leaves rows already collected in place, with NULL for the new
     * dimensions. The dashboard therefore has to treat NULL as "unknown"
     * rather than assume every row has every field; `(none)` in the UI is a
     * real category, not a bug.
     *
     * `route` is the Next pattern (`/program/[slug]`) next to `path`, the
     * literal URL (`/program/robotics-and-tinkering`). Both are wanted: paths
     * tell you which course is read, routes tell you whether course pages as a
     * group matter.
     */
    [
        'page_view new dimensions',
        `alter table page_view
            add column if not exists hostname     text,
            add column if not exists route        text,
            add column if not exists browser      text,
            add column if not exists os           text,
            add column if not exists utm_source   text,
            add column if not exists utm_medium   text,
            add column if not exists utm_campaign text`,
    ],
    [
        'page_view_daily',
        `create table if not exists page_view_daily (
            day      date    not null,
            path     text    not null,
            device   text    not null,
            views    integer not null,
            sessions integer not null,
            primary key (day, path, device)
        )`,
    ],
    [
        'visit_daily',
        `create table if not exists visit_daily (
            day      date    primary key,
            views    integer not null,
            sessions integer not null
        )`,
    ],
    // One cached insight per day, so the dashboard never pays for a model call
    // on refresh. Body is written by the cron route, read by /admin.
    [
        'insight_daily',
        `create table if not exists insight_daily (
            day        date primary key,
            body       text        not null,
            model      text,
            created_at timestamptz not null default now()
        )`,
    ],
    [
        'chat_message',
        `create table if not exists chat_message (
            id         bigserial primary key,
            session_id uuid        not null,
            role       text        not null check (role in ('user', 'assistant')),
            content    text        not null,
            created_at timestamptz not null default now()
        )`,
    ],
    [
        'chat_message.session index',
        'create index if not exists chat_message_session_idx on chat_message (session_id, id)',
    ],
    [
        'chat_message.recent index',
        'create index if not exists chat_message_recent_idx on chat_message (created_at desc)',
    ],

]

function loadEnv() {
    for (const file of ['.env.local', '.env']) {
        try {
            for (const line of readFileSync(file, 'utf8').split('\n')) {
                if (!line.includes('=') || line.trim().startsWith('#')) continue
                const key = line.slice(0, line.indexOf('=')).trim()
                const value = line
                    .slice(line.indexOf('=') + 1)
                    .trim()
                    .replace(/^["']|["']$/g, '')
                if (!(key in process.env)) process.env[key] = value
            }
        } catch {
            /* file need not exist */
        }
    }
}

async function main() {
    loadEnv()
    const write = process.argv.includes('--write')
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set (expected in .env.local)')

    const sql = neon(url)

    const before = await sql`
        select table_name from information_schema.tables
        where table_schema = 'public' order by table_name`
    const existing = new Set(before.map((r) => r.table_name))
    console.log(`tables already present: ${[...existing].join(', ') || '(none)'}\n`)

    for (const [label, statement] of STATEMENTS) {
        const name = label.split('.')[0].split(' ')[0]
        const verb = existing.has(name) ? 'exists' : 'CREATE'
        if (write) {
            await sql.query(statement)
            console.log(`  applied  ${label}`)
        } else {
            console.log(`  ${verb.padEnd(7)} ${label}`)
        }
    }

    if (!write) {
        console.log('\ndry run -- nothing applied. re-run with --write.')
        return
    }

    const after = await sql`
        select table_name from information_schema.tables
        where table_schema = 'public' order by table_name`
    console.log(`\ntables now: ${after.map((r) => r.table_name).join(', ')}`)
    console.log(`raw retention: ${RETENTION_DAYS} days (enforced by the rollup cron)`)
}

main().catch((error) => {
    console.error(error.message)
    process.exit(1)
})
