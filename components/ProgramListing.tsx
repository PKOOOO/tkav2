'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { Box, BrainCircuit, CodeXml, Globe, Network, ShieldCheck, Bot, Blocks } from 'lucide-react'
import { programHref, programs } from '@/lib/cms'
import { CARD_TOKENS } from '@/lib/team'
import styles from './ProgramListing.module.css'

const icons = [Blocks, Bot, Globe, CodeXml, Box, ShieldCheck, Network, BrainCircuit]
const existingImages: Record<string, string> = {
    mathematics: '/hero/program-mathematics.jpg',
    science: '/hero/program-science.jpg',
    coding: '/hero/program-coding.jpg',
}

/** Feed local courses into the existing Framer hero's card area. */
export default function ProgramListing() {
    const [host, setHost] = useState<HTMLDivElement | null>(null)

    useEffect(() => {
        const container = document.createElement('div')
        container.className = styles.host
        const place = () => {
            const slot = document.querySelector<HTMLElement>('.local-program-listing [data-framer-name="Bottom"]')
            if (!slot) return
            if (container.parentElement === slot) return
            container.parentElement?.classList.remove(styles.slot)
            slot.append(container)
            slot.classList.add(styles.slot)
            setHost(container)
        }
        place()
        const observer = new MutationObserver(place)
        observer.observe(document.body, { childList: true, subtree: true })
        return () => {
            observer.disconnect()
            container.parentElement?.classList.remove(styles.slot)
            container.remove()
        }
    }, [])

    if (!host) return null
    return createPortal(
        <div className={styles.grid} aria-label="All programs">
            {programs.map((program, index) => {
                const Icon = icons[index % icons.length]
                const image = existingImages[program.slug] ??
                    (typeof program.Thumbnail === 'string' ? program.Thumbnail : program.Thumbnail?.url)
                return (
                    <Link key={program.slug} href={programHref(program.slug)} className={styles.card}
                        style={{ background: CARD_TOKENS[index % CARD_TOKENS.length] }}>
                        <span className={styles.icon}><Icon size={24} aria-hidden="true" /></span>
                        <div>
                            <h2 className={styles.title}>{program.Title}</h2>
                            <p className={styles.info}>{program.Info}</p>
                        </div>
                        {image && <div className={styles.image}>
                            <Image src={image} alt={program.Title} fill unoptimized={!image.startsWith('/')}
                                sizes="(max-width: 767px) calc(100vw - 80px), (max-width: 1460px) calc((100vw - 130px) / 2), 645px" />
                        </div>}
                    </Link>
                )
            })}
        </div>, host,
    )
}
