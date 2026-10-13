'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import styles from './BlogsNavLink.module.css'

/**
 * The exported navigation has no link-list prop. Add the React-owned route
 * links to its existing Center slot, leaving the generated navigation untouched.
 * The observer handles mobile open/close remounts.
 */
export default function BlogsNavLink() {
    const [slot, setSlot] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const findSlot = () => {
            const next = document.querySelector<HTMLElement>('.unframer-page > nav [data-framer-name="Center"]')
            setSlot((current) => current === next ? current : next)
        }
        findSlot()
        const observer = new MutationObserver(findSlot)
        observer.observe(document.querySelector('.unframer-page') ?? document.body, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    if (!slot) return null
    return createPortal(
        <>
            <p className={styles.item}>
                <Link href="/gallery" aria-current={location.pathname === '/gallery' ? 'page' : undefined}>
                    Gallery
                </Link>
            </p>
            <p className={styles.item}>
                <Link href="/blogs" aria-current={location.pathname.startsWith('/blogs') ? 'page' : undefined}>
                    Blogs
                </Link>
            </p>
        </>,
        slot,
    )
}
