'use client'

import { useLayoutEffect, useRef } from 'react'

import AcademyAboutSection from '@/components/academy-blog-framer/about-section-2.jsx'

import styles from './AboutMissionVision.module.css'

const cards = [
    {
        title: 'Mission',
        description: 'Tech kidz Africa exists to improve young generation creativity and innovation in technology and enhance modern skill-sets through robotics, coding and artificial intelligence.',
    },
    {
        title: 'Vision',
        description: 'Empowering Future Innovators.',
    },
] as const

/** Reuse the academy's Framer cards and motion, with Tech Kidz Africa copy. */
export default function AboutMissionVision() {
    const rootRef = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return

        const syncCopy = () => {
            for (const { title, description } of cards) {
                const heading = root.querySelector<HTMLElement>(`[data-framer-name="${title}"] h2`)
                const paragraph = heading?.closest(`[data-framer-name="${title}"]`)
                    ?.nextElementSibling?.querySelector<HTMLElement>('p')

                if (heading && heading.textContent !== title) heading.textContent = title
                if (paragraph && paragraph.textContent !== description) paragraph.textContent = description
            }
        }

        syncCopy()
        const observer = new MutationObserver(syncCopy)
        observer.observe(root, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    return (
        <div className={styles.section} ref={rootRef} data-about-mission-vision="">
            <AcademyAboutSection.Responsive />
        </div>
    )
}
