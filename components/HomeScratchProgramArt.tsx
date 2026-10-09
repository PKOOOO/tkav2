'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'

import { Cover } from '@/components/ui/cover'
import styles from './HomeScratchProgramArt.module.css'

function ScratchArtwork() {
    const reducedMotion = useReducedMotion()

    return (
        <div className={styles.artwork} role='img' aria-label='Animated Scratch cat and rocket'>
            <Cover alwaysHovered containerClassName={styles.cover} className={styles.figures}>
                <motion.img
                    src='/brand/cat.svg'
                    alt=''
                    className={styles.figure}
                    style={reducedMotion ? { rotate: 60 } : undefined}
                    animate={reducedMotion ? undefined : {
                        x: [0, 5, 0, -5, 0],
                        y: [0, -8, 0, 8, 0],
                        rotate: [60, 65, 60, 55, 60],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.img
                    src='/brand/rocket.svg'
                    alt=''
                    className={styles.figure}
                    style={reducedMotion ? { rotate: 90 } : undefined}
                    animate={reducedMotion ? undefined : {
                        y: [0, -12, 0],
                        rotate: [90, 95, 90, 85, 90],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
            </Cover>
        </div>
    )
}

/**
 * The Home programme cards come from the generated Framer tree. Place this
 * artwork in the existing Mathematics image slot so its card, link, layout and
 * breakpoints remain owned by Framer. Reattach when Framer replaces a variant.
 */
export default function HomeScratchProgramArt() {
    const [host, setHost] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const overlay = document.createElement('div')
        overlay.className = styles.host

        const place = () => {
            const image = document.querySelector<HTMLImageElement>(
                '.unframer-page[data-route="/"] a[href="/program/mathematics"] img[alt="Program Image"], .unframer-page[data-route="/"] a[href="/program/animation-and-gamification"] img[alt="Program Image"]',
            )
            const slot = image?.parentElement?.parentElement
            if (slot instanceof HTMLElement) {
                if (overlay.parentElement !== slot) {
                    overlay.parentElement?.classList.remove(styles.slot)
                    slot.append(overlay)
                    slot.classList.add(styles.slot)
                    setHost(overlay)
                }
            } else if (overlay.parentElement) {
                overlay.parentElement.classList.remove(styles.slot)
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
            overlay.parentElement?.classList.remove(styles.slot)
            overlay.remove()
        }
    }, [])

    return host ? createPortal(<ScratchArtwork />, host) : null
}
