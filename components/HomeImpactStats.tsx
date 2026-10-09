'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { impactStats } from '@/lib/impact-stats'

import styles from './HomeImpactStats.module.css'

/** Keep the Framer card and photograph, but own the four homepage-only figures. */
export default function HomeImpactStats() {
    const [host, setHost] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const overlay = document.createElement('div')
        overlay.className = styles.host

        const place = () => {
            const card = document.querySelector<HTMLElement>(
                '.unframer-page[data-route="/"] .framer-1obmj34:has(.framer-ruuh8s-container)',
            )

            if (card) {
                if (overlay.parentElement !== card) {
                    overlay.parentElement?.classList.remove(styles.enhanced)
                    card.insertBefore(overlay, card.querySelector('.framer-198jala'))
                    card.classList.add(styles.enhanced)
                    setHost(overlay)
                }
            } else if (overlay.parentElement) {
                overlay.parentElement.classList.remove(styles.enhanced)
                overlay.remove()
                setHost(null)
            }
        }

        place()
        const observer = new MutationObserver(place)
        observer.observe(document.querySelector('.unframer-page') ?? document.body, {
            childList: true,
            subtree: true,
        })

        return () => {
            observer.disconnect()
            overlay.parentElement?.classList.remove(styles.enhanced)
            overlay.remove()
        }
    }, [])

    return host ? createPortal(
        <div className={styles.list} aria-label='Our impact'>
            {impactStats.map(({ value, label }) => (
                <div className={styles.row} key={label}>
                    <strong className={styles.value}>{value}</strong>
                    <span className={styles.label}>{label}</span>
                </div>
            ))}
        </div>,
        host,
    ) : null
}
