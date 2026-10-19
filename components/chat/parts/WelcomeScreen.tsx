'use client'

import { Sparkles } from 'lucide-react'

const SUGGESTIONS = [
    'What programmes do you offer?',
    'Anything for the next school holiday?',
    'Which programme suits a 9-year-old?',
]

/** The empty state, ported from the previous site. */
export function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
    return (
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#80569e] to-[#38b6ff] opacity-20 blur-2xl" />
                <div className="relative rounded-full bg-[#eef4fa] p-4">
                    <Sparkles className="size-8 text-[#38b6ff]" aria-hidden />
                </div>
            </div>

            <h3 className="mt-4 text-lg font-medium text-[#002b5b]">How can I help you today?</h3>
            <p className="mt-2 max-w-xs text-sm text-[#41597a]">
                Ask me about our programmes, who teaches them, or what’s coming up in the holidays.
            </p>

            <div className="mt-6 w-full max-w-sm">
                <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => onSuggestionClick(suggestion)}
                            className="rounded-full border border-[#38b6ff]/30 bg-[#38b6ff]/5 px-4 py-2 text-sm text-[#00376f] transition-colors hover:border-[#38b6ff]/50 hover:bg-[#38b6ff]/10"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
