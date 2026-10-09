'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'

import { SquigglyText } from '@/components/ui/squiggly-text'
import styles from './HomeHeroSquigglyText.module.css'

type Placement = { heading: HTMLElement; host: HTMLElement; word: string }
const WORDS = new Set(['Empowering', 'Innovators'])

/** Keep Framer's headings and layout; reattach when a breakpoint replaces them. */
export default function HomeHeroSquigglyText() {
    const [placements, setPlacements] = useState<Placement[]>([])
    const reducedMotion = useReducedMotion()

    useEffect(() => {
        const attached = new Map<HTMLElement, Placement>()
        const place = () => {
            let changed = false
            for (const [heading, placement] of attached) {
                if (!heading.isConnected) {
                    heading.classList.remove(styles.heading)
                    placement.host.remove()
                    attached.delete(heading)
                    changed = true
                }
            }
            document.querySelectorAll<HTMLElement>('.unframer-page[data-route="/"] h1').forEach((heading) => {
                // Ignore the portal's decorative duplicate when finding the original word.
                const word = Array.from(heading.childNodes)
                    .filter((node) => node.nodeType === Node.TEXT_NODE)
                    .map((node) => node.textContent).join('').trim()
                if (!WORDS.has(word)) return
                let placement = attached.get(heading)
                if (!placement) {
                    const host = document.createElement('span')
                    host.className = styles.host
                    host.setAttribute('aria-hidden', 'true')
                    host.dataset.heroSquiggly = word
                    host.style.color = getComputedStyle(heading).color
                    placement = { heading, host, word }
                    attached.set(heading, placement)
                    changed = true
                }
                heading.classList.add(styles.heading)
                if (placement.host.parentElement !== heading) heading.append(placement.host)
            })
            if (changed) setPlacements(Array.from(attached.values()))
        }

        place()
        const observer = new MutationObserver(place)
        observer.observe(document.querySelector('.unframer-page') ?? document.body, {
            childList: true,
            subtree: true,
        })
        return () => {
            observer.disconnect()
            for (const { heading, host } of attached.values()) {
                host.remove()
                heading.classList.remove(styles.heading)
            }
        }
    }, [])

    return placements.map(({ host, word }) => createPortal(
        <SquigglyText className={styles.effect} style={reducedMotion ? { filter: 'none' } : undefined}>
            {word}
        </SquigglyText>,
        host,
        word,
    ))
}
