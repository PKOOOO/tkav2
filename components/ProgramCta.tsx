'use client'

import { useEffect } from 'react'
import { RESPONSIVE } from '@/components/breakpoints'
import Cta from '@/framer/cta-program.jsx'

const ctaWords: Record<string, string> = {
    mathematics: 'creative ideas',
    science: 'tinkering',
    coding: 'coding',
    english: 'digital skills',
    '3d-design-and-printing': '3D design',
    'online-safety-and-cybersecurity': 'online safety',
    'computer-networking-and-hardware': 'networking',
    'ai-and-machine-learning': 'AI',
}

export default function ProgramCta({ slug }: { slug: string }) {
    const word = ctaWords[slug] ?? 'learning'
    useEffect(() => {
        const changed = new Map<Text, string>()
        const apply = () => {
            for (const node of changed.keys()) {
                if (!node.isConnected) changed.delete(node)
            }
            document.querySelectorAll('.program-detail-cta h2').forEach((heading) => {
                heading.childNodes.forEach((node) => {
                    if (node instanceof Text && node.data.trim() === 'learning') {
                        changed.set(node, node.data)
                        node.data = node.data.replace('learning', word)
                    }
                })
            })
        }
        apply()
        const observer = new MutationObserver(apply)
        observer.observe(document.querySelector('.unframer-page') ?? document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        })
        return () => {
            observer.disconnect()
            for (const [node, original] of changed) {
                if (node.data.trim() === word) node.data = original
            }
        }
    }, [word])

    return <Cta.Responsive variants={RESPONSIVE} className='program-detail-cta' />
}
