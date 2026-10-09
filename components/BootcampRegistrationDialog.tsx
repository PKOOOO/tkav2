'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import ContactRegistrationForm from '@/components/ContactRegistrationForm'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import styles from './BootcampRegistrationDialog.module.css'

export default function BootcampRegistrationDialog() {
    const [buttonMount, setButtonMount] = useState<HTMLElement | null>(null)
    const [photoMount, setPhotoMount] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const article = document.querySelector<HTMLElement>('main[data-bootcamp-article]')
        if (!article) return

        const findMounts = () => {
            const button = article.querySelector<HTMLAnchorElement>('a[aria-label="Try a free session"]')?.parentElement ?? null
            // Mount beside the rounded photo, not inside its overflow-clipped box,
            // so the mascot can straddle the top-right edge on phones.
            const photo = article.querySelector<HTMLImageElement>('img[src="/brand/main-photo.jpg"]')?.parentElement?.parentElement?.parentElement ?? null
            setButtonMount((current) => current === button ? current : button)
            setPhotoMount((current) => current === photo ? current : photo)
        }
        findMounts()
        const observer = new MutationObserver(findMounts)
        observer.observe(article, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    return (
        <Dialog>
            {photoMount && createPortal(
                <div className={styles.mobileLadybug} aria-hidden="true">
                    {/* The shared video-decor hook replaces this still only after playback starts. */}
                    <Image src="/decor/ladybug.png" alt="" width={366} height={328} unoptimized />
                </div>,
                photoMount,
            )}
            {buttonMount && createPortal(
                <DialogTrigger className={styles.trigger}>Register your child</DialogTrigger>,
                buttonMount,
            )}
            <DialogContent className={styles.content}>
                <DialogHeader className={styles.header}>
                    <DialogTitle className={styles.title}>Register your child</DialogTitle>
                    <DialogDescription className={styles.description}>November Holiday Tech Bootcamp · AI & Robotics Edition</DialogDescription>
                </DialogHeader>
                <ContactRegistrationForm />
            </DialogContent>
        </Dialog>
    )
}
