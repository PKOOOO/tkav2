'use client'

import { useEffect } from 'react'

import { findProgram, programHref } from '@/lib/cms'

const homeDescriptions: Record<string, string> = {
    mathematics: 'Animate stories and make games with Scratch, Blender, browser code and Unity.',
    science: 'Build and tinker with robots, sensors, kits and microcontrollers.',
    english: 'Use computers confidently: create, research, collaborate and stay safe online.',
    coding: 'Build web and mobile apps with React, Node and practical deployment tools.',
}

/** Update Framer's four Home cards from the same data as the program pages. */
export default function HomeProgramCards() {
    useEffect(() => {
        const sync = () => {
            const home = document.querySelector('.unframer-page[data-route="/"]')
            if (!home) return

            for (const link of home.querySelectorAll<HTMLAnchorElement>('a[href="/program"]')) {
                link.setAttribute('href', '/programs')
            }

            for (const card of home.querySelectorAll<HTMLAnchorElement>('a[href^="/program/"]')) {
                const program = findProgram(card.getAttribute('href')?.split('/').pop())
                if (!program || !(program.slug in homeDescriptions)) continue

                const heading = card.querySelector('h2')
                const description = card.querySelector('p')
                const href = programHref(program.slug)
                if (heading && heading.textContent !== program.Title) heading.textContent = program.Title
                if (description && description.textContent !== homeDescriptions[program.slug]) {
                    description.textContent = homeDescriptions[program.slug]
                }
                if (card.getAttribute('href') !== href) card.setAttribute('href', href)
            }
        }

        sync()
        const observer = new MutationObserver(sync)
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['href'],
        })
        return () => observer.disconnect()
    }, [])

    return null
}
