'use client'

import { CheckCircle2, Loader2, Search } from 'lucide-react'

/** Visitor-facing names for the tools; the raw names are internal. */
const LABELS: Record<string, string> = {
    list_programmes: 'Checking the programmes',
    get_programme: 'Reading the programme',
    list_mentors: 'Looking up the team',
    get_mentor: 'Reading the mentor profile',
    search_articles: 'Searching the articles',
    get_article: 'Reading the article',
    get_practical_info: 'Finding the details',
}

export const toolLabel = (name: string) => LABELS[name] ?? 'Looking that up'

/**
 * The inline "looking something up" chip, ported from the previous site.
 *
 * It turns a dead pause into visible progress, which matters here because a
 * tool loop can run two or three lookups before the first word of the answer
 * arrives.
 */
export function ToolCallUI({ name, complete }: { name: string; complete: boolean }) {
    const label = toolLabel(name)

    return (
        <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#d6ecff]">
                <Search className="size-4 text-[#1c5796]" aria-hidden />
            </div>
            <div
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm ${
                    complete
                        ? 'border-[#c6dcf0] bg-[#eef4fa]'
                        : 'border-[#9fd4ff] bg-[#d6ecff]'
                }`}
            >
                {complete ? (
                    <CheckCircle2 className="size-4 shrink-0 text-[#1c5796]" aria-hidden />
                ) : (
                    <Loader2 className="size-4 shrink-0 animate-spin text-[#1c5796]" aria-hidden />
                )}
                <span className={complete ? 'text-[#41597a]' : 'font-medium text-[#00376f]'}>
                    {complete ? `${label} — done` : `${label}…`}
                </span>
            </div>
        </div>
    )
}
