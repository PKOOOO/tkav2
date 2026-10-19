'use client'

import { Bot, User } from 'lucide-react'

import { MessageContent } from './MessageContent'

/** One message. Ported from the previous site, recoloured to the site palette. */
export function MessageBubble({
    role,
    content,
    closeChat,
}: {
    role: string
    content: string
    closeChat: () => void
}) {
    const isUser = role === 'user'

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    isUser ? 'bg-[#002b5b]' : 'bg-[#e6d6f0]'
                }`}
            >
                {isUser ? (
                    <User className="size-4 text-white" aria-hidden />
                ) : (
                    <Bot className="size-4 text-[#6a1383]" aria-hidden />
                )}
            </div>

            <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser ? 'bg-[#002b5b] text-white' : 'bg-[#eef4fa] text-[#00376f]'
                }`}
            >
                <MessageContent content={content} closeChat={closeChat} isUser={isUser} />
            </div>
        </div>
    )
}
