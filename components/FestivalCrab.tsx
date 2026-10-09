'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import styles from './routes/Blogs.module.css'

/**
 * The festival mascot, sitting at the foot of the article just above the site
 * footer -- the same place and the same size the crab occupies in the CTA band
 * on /program.
 *
 * It is a plain `/decor/crab.png` because `lib/useVideoDecor.ts` already
 * carries a rule matching that path on this route: the hook finds the still,
 * mounts `crab.webm` beside it and hides the still once playback starts. So the
 * motion comes for free, and every failure path still leaves this PNG on screen.
 *
 * Mounted into the article's last section rather than rendered inline, because
 * the article body is Framer's generated tree and takes no children of ours.
 */
export default function FestivalCrab() {
    const [mount, setMount] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const article = document.querySelector<HTMLElement>('main[data-festival-article]')
        if (!article) return

        const findMount = () => {
            const last = article.lastElementChild as HTMLElement | null
            setMount((current) => current === last ? current : last)
        }

        findMount()
        const observer = new MutationObserver(findMount)
        observer.observe(article, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    return mount && createPortal(
        <div className={styles.footerCrab} aria-hidden="true">
            <Image src="/decor/crab.png" alt="" width={220} height={166} unoptimized />
        </div>,
        mount,
    )
}
