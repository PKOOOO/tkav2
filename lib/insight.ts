import Anthropic from '@anthropic-ai/sdk'

import { breakdown, dailySeries, totals } from './analytics-queries'
import { db } from './db'

/**
 * The daily plain-English read on the numbers, written by Claude and cached.
 *
 * ## Why this reads aggregates, never rows
 *
 * The prompt is built from `analytics-queries` output -- a few dozen
 * pre-aggregated figures -- not from `page_view`. That is deliberate on three
 * counts: it is a handful of tokens instead of thousands, it is fast, and no
 * visitor-level data (session hashes, referrer hosts, countries tied to a
 * single view) is ever sent to a model.
 *
 * ## Why it is cached in `insight_daily`
 *
 * `/admin` reads the stored text and never calls the API. Generating on page
 * load would mean paying for a model call on every refresh to re-summarise
 * numbers that have not changed -- the dashboard is read far more often than
 * the data changes.
 */

/**
 * `claude-opus-4-8` is the current default model. The site this replaces used
 * Haiku for the same job, which is cheaper and would be perfectly adequate
 * here -- but choosing a less capable model to save money is the operator's
 * call to make deliberately, not something to inherit by accident. Switch to
 * `claude-haiku-4-5` if the cost of one call a day ever matters.
 */
const MODEL = 'claude-opus-4-8'

/**
 * Short on purpose: the output is a few sentences rendered in a card. This is
 * the "deliberately short output" case, not a lowballed limit -- there is no
 * truncation risk because the prompt asks for far less than this.
 */
const MAX_TOKENS = 1024

const SYSTEM = `You write a short daily analytics note for the team at Tech Kidz Africa, a technology academy in Mombasa, Kenya that teaches children coding, robotics, 3D design and AI.

You are given aggregate web analytics for their site. Write 2-4 short sentences for a non-technical reader: what changed, what stands out, and at most one concrete suggestion.

Rules:
- Only state what the numbers support. Do not invent causes you cannot see.
- At this traffic volume, day-to-day swings are usually noise. Say so rather than reading a trend into a handful of visits.
- Call a small sample small. Never present a percentage from single-digit counts as meaningful.
- No headings, no bullet points, no markdown, no preamble. Just the sentences.`

export const canGenerateInsight = () => Boolean(process.env.ANTHROPIC_API_KEY)

/** Compact the aggregates into the few lines the model actually needs. */
async function buildPrompt(days: number): Promise<string> {
    const [overall, series, pages, referrers, countries, devices] = await Promise.all([
        totals(days),
        dailySeries(days),
        breakdown('path', days, 6),
        breakdown('referrer', days, 5),
        breakdown('country', days, 5),
        breakdown('device', days, 4),
    ])

    const list = (rows: { label: string; views: number; visitors: number }[]) =>
        rows.length
            ? rows.map((r) => `${r.label} (${r.visitors} visitors, ${r.views} views)`).join('; ')
            : 'none recorded'

    return [
        `Window: last ${days} days.`,
        `Totals: ${overall.visitors} visitors, ${overall.views} page views, ${overall.bounceRate}% of visitors viewed only one page.`,
        `Daily visitors, oldest to newest: ${series.map((d) => d.visitors).join(', ')}.`,
        `Top pages: ${list(pages)}.`,
        `Referrers: ${list(referrers)}.`,
        `Countries: ${list(countries)}.`,
        `Devices: ${list(devices)}.`,
    ].join('\n')
}

export type InsightResult =
    | { ok: true; day: string; body: string; model: string; cached: boolean }
    | { ok: false; reason: string }

/**
 * Generate today's note and store it. Returns the existing row untouched unless
 * `force` is set, so a cron that retries does not pay for a second call.
 */
export async function generateInsight(day: string, days = 7, force = false): Promise<InsightResult> {
    if (!canGenerateInsight()) return { ok: false, reason: 'ANTHROPIC_API_KEY is not set' }

    const sql = db()

    if (!force) {
        const existing = await sql`
            select body, model from insight_daily where day = ${day}::date
        `
        if (existing.length) {
            return {
                ok: true,
                day,
                body: String(existing[0].body),
                model: String(existing[0].model ?? MODEL),
                cached: true,
            }
        }
    }

    const prompt = await buildPrompt(days)

    // Resolves ANTHROPIC_API_KEY from the environment; never hard-code a key.
    const client = new Anthropic()

    let message: Anthropic.Message
    try {
        message = await client.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: SYSTEM,
            messages: [{ role: 'user', content: prompt }],
        })
    } catch (error) {
        // Most specific first. `APIConnectionError` is checked before
        // `APIError` because in this SDK it is a subclass of it -- the other
        // order would swallow connection failures into the generic branch.
        if (error instanceof Anthropic.RateLimitError) return { ok: false, reason: 'rate limited' }
        if (error instanceof Anthropic.AuthenticationError) {
            return { ok: false, reason: 'ANTHROPIC_API_KEY rejected' }
        }
        if (error instanceof Anthropic.APIConnectionError) {
            return { ok: false, reason: 'could not reach the API' }
        }
        if (error instanceof Anthropic.APIError) {
            return { ok: false, reason: `api error ${error.status}` }
        }
        throw error
    }

    // A refusal returns HTTP 200 with an empty or partial `content`, so
    // `stop_reason` has to be checked before reading any block.
    if (message.stop_reason === 'refusal') {
        return { ok: false, reason: 'model declined to answer' }
    }

    // `content` is a discriminated union; narrow on `type` rather than
    // indexing `content[0].text`, which is not guaranteed to be a text block.
    const body = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text.trim())
        .join('\n\n')
        .trim()

    if (!body) return { ok: false, reason: 'empty response' }

    await sql`
        insert into insight_daily (day, body, model)
        values (${day}::date, ${body}, ${MODEL})
        on conflict (day) do update set body = excluded.body, model = excluded.model
    `

    return { ok: true, day, body, model: MODEL, cached: false }
}
