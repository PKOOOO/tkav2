'use client'

import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { PointerHighlight } from '@/components/ui/pointer-highlight'
import { impactStats } from '@/lib/impact-stats'

import styles from './AboutImpactHighlights.module.css'

type Target = {
    host: HTMLDivElement
    index: number
    headingClassName: string
    preset: string | null
    color: string
}

const accents = [
    { rectangle: 'border-[#38b6ff] bg-white/20', pointer: 'text-[#00569e]' },
    { rectangle: 'border-[#00569e] bg-white/20', pointer: 'text-[#00569e]' },
    { rectangle: 'border-[#8b3ba8] bg-white/20', pointer: 'text-[#8b3ba8]' },
    { rectangle: 'border-[#2e8f8c] bg-white/20', pointer: 'text-[#2e8f8c]' },
] as const

/** Add Aceternity's number-only highlight inside the existing Framer cards. */
export default function AboutImpactHighlights() {
    const [targets, setTargets] = useState<Target[]>([])

    useLayoutEffect(() => {
        const root = document.querySelector('.unframer-page[data-route="/about"]') ?? document.body

        const sync = () => {
            const content = root.querySelector('section[data-framer-name="Counter"] [data-framer-name="Content"]')
            if (!content) return

            const headings = [...content.querySelectorAll<HTMLHeadingElement>('h2:not([data-about-impact-highlight])')]
            if (headings.length !== impactStats.length) return

            const next = headings.map((heading, index) => {
                const wrapper = heading.parentElement
                if (!wrapper) return null

                let host = wrapper.querySelector<HTMLDivElement>(':scope > [data-about-impact-host]')
                if (!host) {
                    host = document.createElement('div')
                    host.className = styles.host
                    host.setAttribute('data-about-impact-host', '')
                    wrapper.insertBefore(host, heading)
                }

                return {
                    host,
                    index,
                    headingClassName: heading.className,
                    preset: heading.getAttribute('data-styles-preset'),
                    color: getComputedStyle(heading).color,
                }
            })

            if (next.some((target) => !target)) return
            const complete = next as Target[]
            setTargets((current) =>
                current.length === complete.length && current.every((target, index) => target.host === complete[index].host)
                    ? current
                    : complete,
            )
        }

        sync()
        const observer = new MutationObserver(sync)
        observer.observe(root, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    return targets.map(({ host, index, headingClassName, preset, color }) => createPortal(
        <PointerHighlight
            key={index}
            containerClassName="inline-block"
            rectangleClassName={accents[index].rectangle}
            pointerClassName={`${accents[index].pointer} h-3 w-3`}
        >
            <h2
                className={`${headingClassName} ${styles.number}`}
                data-about-impact-highlight=""
                data-styles-preset={preset ?? undefined}
                style={{ color }}
            >
                {impactStats[index].value}
            </h2>
        </PointerHighlight>,
        host,
        index,
    ))
}
