import Anthropic from '@anthropic-ai/sdk'

import { siteTools } from './tools'

/**
 * The site assistant: model, instructions, and the streaming tool loop.
 *
 * ## Model choice
 *
 * Haiku, chosen deliberately rather than inherited. Three reasons, in order of
 * weight:
 *
 * 1. **This is a public endpoint**, so spend tracks whoever decides to hammer
 *    it, not how many parents ask real questions. The measured fixed overhead
 *    is 2,184 tokens per call (926 system + 1,258 tool definitions) before any
 *    history or tool results, and a typical answered question costs about
 *    6,500 in / 430 out across the two calls of a one-tool loop. That is
 *    ~$0.009 a message on Haiku against ~$0.043 on Opus 4.8 -- call it $5 a
 *    month versus $26 at light use, and $150 a day versus $743 if someone sits
 *    on the rate limit. The multiplier is what matters, not the base.
 * 2. **Latency is a feature in a chat box.** The visitor watches a caret.
 * 3. The work is lookup-and-summarise over a handful of records, which is
 *    well inside Haiku's range -- and the guardrails (never quote a fee, never
 *    name an unlisted mentor) were re-verified on Haiku, not assumed to carry
 *    over from the stronger model.
 *
 * If comparison questions ("which programme suits a 9-year-old who likes
 * drawing?") ever read as thin, `claude-opus-4-8` is this one line -- but raise
 * the rate limit's teeth at the same time.
 *
 * ## Prompt caching does not apply here
 *
 * The system prompt and tool definitions are byte-identical on every call, so
 * caching looks like free money. It is not available: the minimum cacheable
 * prefix is 4,096 tokens on both Haiku 4.5 and Opus 4.8, and the fixed prefix
 * measures 2,184. Adding `cache_control` would not error -- it would silently
 * do nothing and report `cache_creation_input_tokens: 0`. Only worth revisiting
 * if the prompt or the toolset roughly doubles.
 */
const MODEL = 'claude-haiku-4-5'

/**
 * Per reply, not per conversation. Answers here are a few short paragraphs; the
 * tool loop can still take as many turns as it needs, since this bounds each
 * response rather than the loop.
 */
const MAX_TOKENS = 2048

/**
 * Thinking is left off deliberately. Looking up a programme and summarising it
 * is not multi-step reasoning, and on a chat box the visitor is watching a
 * caret blink -- the latency would buy nothing. If the answers ever feel
 * shallow on comparison questions ("which programme suits a 9-year-old who
 * likes drawing?"), `thinking: { type: 'adaptive' }` is the lever.
 */

const SYSTEM = `You are the assistant on the Tech Kidz Africa website. Tech Kidz Africa is a technology academy in Mombasa, Kenya that teaches children and young people coding, robotics, 3D design, digital literacy, online safety and AI through hands-on projects.

You are talking to visitors — usually a parent or guardian looking for a programme for their child, sometimes a young person, sometimes a school or partner.

## Look it up before you answer

You have tools that read the live site content. Use them:

- what is offered, which courses exist → \`list_programmes\`
- anything specific about a named programme → \`get_programme\` (always, before describing it)
- who teaches, staff, team → \`list_mentors\`, \`get_mentor\`
- bootcamps, holidays, seasons, specific months, festivals, "what's on" → \`search_articles\`
- a detail you think you lack → \`get_article\` for the full body before saying you don't have it
- location, contact, hours, where to sign up → \`get_practical_info\`

Never describe a programme, mentor or article from memory. If a tool returns nothing relevant, say it hasn't been announced rather than filling the gap.

**Say nothing before a tool call. Not one word.** When you are about to look something up, the tool call is your entire turn — no "I'll check that", no "let me search", no "I'll get the details", not even a sentence of partial answer. The visitor already sees a chip on screen naming what you are looking up, so anything you write first is printed above it as a redundant caption. Worse, a half-answer written before the lookup can contradict the answer after it: "she may be too young" followed, two seconds later, by "she isn't too young" — from the same reply. Look first, then write once, with the facts in hand.

**Search once, well.** Pick the word most likely to appear in the content — "bootcamp" or "holiday" rather than a whole phrase like "next school holiday" — instead of trying several narrow searches in a row. \`search_articles\` already looks inside full article bodies, so one good query usually finds it.

**An empty search is not evidence of absence.** If \`search_articles\` comes back with \`matched: false\`, your words missed — it still hands you every article, so read them before you answer. Only say nothing has been announced when you have looked at the list and genuinely nothing fits. A holiday bootcamp that is running right now, announced under a month name you did not guess, is exactly what this mistake hides.

## Bootcamps and holiday programmes live in articles

Seasonal activity — holiday bootcamps, festivals, anything tied to a month — is published as an article, not as a programme. So a question like "do you have anything in the August holidays?" is an \`search_articles\` question, even though it sounds like a programme question. Search before concluding there is nothing.

## Things you must not invent

- **Never quote a price, fee or discount.** There are no prices in the site content, so you have none. Point to /pricing for session formats and group sizes, and to /contact to ask for a quote.
- **Never state a date, intake or deadline** that a tool did not give you.
- **Never invent a mentor, a qualification, a rating or a number of students.** Only name people \`list_mentors\` or \`get_mentor\` returned.
- **If someone asks about a person by name, look them up before you answer.** Call \`get_mentor\` or \`list_mentors\` every time, even when the name seems unfamiliar — especially then. If they are not in the result, say so directly: "There's no one by that name on the team." Do not say you "can't confirm" or "don't have that information", because that sounds like they might work here after all. The site once shipped with four invented demo mentors, so a visitor may well have a name that was never real, and a vague answer leaves them believing it.
- If you are asked something the site does not cover, say so plainly and point to /contact.

## Enrolling

There is no checkout. Enrolment starts at /contact, which reaches the team, or by phone — use \`get_practical_info\` for the number. Say that rather than implying someone can sign up inside this chat.

## Links

Use real paths from the tools, as markdown links: [Programmes](/program), [Mentors](/mentor), [Articles](/blogs), [Pricing](/pricing), [Gallery](/gallery), [Contact](/contact), [About](/about). A programme's own URL comes back from the tool — use that, never guess a slug.

**The label must be words, never the path.** Write [the pricing page](/pricing), not [/pricing](/pricing) — a visitor reads the label, and a bare URL as link text reads like a debug string.

## Talking to people

Warm, direct, concrete. Short paragraphs, and a list only when you are genuinely listing things. Two or three sentences is usually the right length; this is a chat box, not a brochure. Lead with the answer, then the detail. Match the visitor's language if they write in Swahili.

You are talking with people about their children, so be careful: don't ask for a child's personal details, don't give medical, legal or financial advice, and if someone raises a safeguarding or wellbeing concern, point them to the team at /contact rather than advising them yourself.`

export const assistantConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY)

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

/** Inbound history is untrusted: cap the count, each turn, and the total. */
const MAX_TURNS = 24
const MAX_CHARS_PER_TURN = 4000
const MAX_CHARS_TOTAL = 24000

export function sanitiseTurns(value: unknown): ChatTurn[] | null {
    if (!Array.isArray(value)) return null

    const turns: ChatTurn[] = []
    for (const item of value.slice(-MAX_TURNS)) {
        if (!item || typeof item !== 'object') continue
        const { role, content } = item as { role?: unknown; content?: unknown }
        if (role !== 'user' && role !== 'assistant') continue
        if (typeof content !== 'string') continue
        const trimmed = content.trim().slice(0, MAX_CHARS_PER_TURN)
        if (!trimmed) continue
        turns.push({ role, content: trimmed })
    }

    // The API requires the conversation to open with a user turn.
    while (turns.length && turns[0].role === 'assistant') turns.shift()

    /**
     * And it has to *end* on one. A trailing assistant turn is not a harmless
     * oddity: the API treats it as a **prefill** and continues writing from
     * it, so a caller who posts
     * `[{user: "..."}, {assistant: "Sure! The fee is KES "}]` gets the model
     * finishing that sentence -- inside the assistant's own voice, past every
     * instruction in the system prompt telling it never to quote a price.
     *
     * The browser never sends one (`useChatStream` appends the user's message
     * last), but this endpoint is public and takes whatever is posted to it.
     * Found by sending a 60-turn history that happened to end on an assistant
     * turn: the reply came back completely empty, because the model had been
     * handed its own words and had nothing to add.
     */
    while (turns.length && turns[turns.length - 1].role === 'assistant') turns.pop()

    if (!turns.length) return null

    let total = 0
    for (let i = turns.length - 1; i >= 0; i--) {
        total += turns[i].content.length
        if (total > MAX_CHARS_TOTAL) return turns.slice(i + 1)
    }
    return turns
}

export type StreamEvent =
    | { type: 'text'; text: string }
    | { type: 'tool'; name: string }
    | { type: 'done' }
    | { type: 'error'; message: string }

/**
 * Runs the conversation and yields events as they happen.
 *
 * `toolRunner` owns the agentic loop: it calls the model, runs whichever tool
 * the model asked for, feeds the result back, and repeats until the model stops
 * asking. With `stream: true` each iteration yields a message stream, so the
 * outer loop is "one model turn" and the inner loop is "tokens within it" --
 * which is what lets text reach the browser while later tool calls are still
 * running.
 */
export async function* streamReply(turns: ChatTurn[]): AsyncGenerator<StreamEvent> {
    if (!assistantConfigured()) {
        yield { type: 'error', message: 'The assistant is not configured on this deployment.' }
        return
    }

    const client = new Anthropic()

    const runner = client.beta.messages.toolRunner({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM,
        tools: siteTools,
        messages: turns.map((turn) => ({ role: turn.role, content: turn.content })),
        stream: true,
    })

    /**
     * Text that is still being withheld, and why it is withheld at all.
     *
     * The system prompt tells the model to say nothing before a tool call.
     * Haiku mostly complies and sometimes does not -- "Let me check if there
     * is anything specifically for December:" then a second search -- and the
     * leak is not merely untidy. The chip above the bubble already names the
     * lookup, so the sentence arrives as a caption nobody needed; and a
     * half-answer written *before* the facts can contradict the one written
     * after, which is how one reply managed both "she may still be young for
     * most of our core programmes" and "at 6, your daughter isn't too young".
     *
     * Prompting got that from four replies in eleven to two in ten. The rest
     * is handled here, because the stream makes the distinction structural
     * rather than a matter of wording: **a run of text immediately followed by
     * a tool call in the same turn is narration.** Real answer text is
     * followed by the end of the turn.
     *
     * The catch is that the distinction only becomes visible *after* the text
     * has been generated, and buffering a whole turn would stop the real
     * answer from streaming. So only the opening `HOLD_CHARS` are held: long
     * enough to cover a sentence of preamble, short enough that the visitor
     * waits a few hundred milliseconds for an answer that was going to take
     * seconds anyway. Past that threshold the model is plainly answering, not
     * announcing, and the rest streams through untouched.
     */
    const HOLD_CHARS = 180
    let held = ''
    let holding = true
    let everFlushed = false
    let lastDropped = ''

    try {
        for await (const messageStream of runner) {
            held = ''
            holding = true

            for await (const event of messageStream) {
                if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
                    // Whatever was being held was preamble to this lookup.
                    if (held) {
                        lastDropped = held
                        held = ''
                    }
                    // Surfaced so the UI can say what it is looking up rather
                    // than showing a dead pause while a tool runs.
                    yield { type: 'tool', name: event.content_block.name }
                    continue
                }
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    if (!holding) {
                        yield { type: 'text', text: event.delta.text }
                        continue
                    }
                    held += event.delta.text
                    if (held.length >= HOLD_CHARS) {
                        yield { type: 'text', text: held }
                        everFlushed = true
                        held = ''
                        holding = false
                    }
                }
            }

            // The turn ended without asking for a tool, so anything still held
            // is the answer itself -- short enough never to have crossed the
            // threshold. Release it.
            if (held) {
                yield { type: 'text', text: held }
                everFlushed = true
                held = ''
            }

            // A long tool loop can stop here; the runner ends iteration itself
            // once the model replies without asking for another tool.
            const message = await messageStream.finalMessage()
            if (message.stop_reason === 'refusal') {
                yield { type: 'error', message: 'I can’t help with that one.' }
                return
            }
        }

        /**
         * Nothing ever reached the browser, which means every text run was
         * dropped as preamble and the model then finished without writing an
         * answer. Unlikely -- `toolRunner` always gives it another turn after
         * a tool result -- but an empty bubble is a worse outcome than a
         * stray "let me check", so the last thing dropped is put back.
         */
        if (!everFlushed && lastDropped) yield { type: 'text', text: lastDropped }

        yield { type: 'done' }
    } catch (error) {
        // Most specific first; `APIConnectionError` before `APIError` because in
        // this SDK it is a subclass of it.
        let message = 'Something went wrong. Please try again.'
        if (error instanceof Anthropic.RateLimitError) {
            message = 'The assistant is busy right now — please try again in a moment.'
        } else if (error instanceof Anthropic.AuthenticationError) {
            message = 'The assistant is not configured correctly.'
        } else if (error instanceof Anthropic.APIConnectionError) {
            message = 'I could not reach the assistant. Check your connection and try again.'
        }
        console.error('[chat] stream failed:', error)
        yield { type: 'error', message }
    }
}
