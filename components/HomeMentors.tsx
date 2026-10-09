'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { MentorDisplayCard } from '@/components/TeamGrid'
import { CARD_TOKENS, team } from '@/lib/team'
import styles from './HomeMentors.module.css'

const selectedSlugs = [
    'peter-lagat',
    'clemence-kibet',
    'diana-wamboi',
    'brian-bii',
] as const

const rest = team.filter((member) => !member.featured)
const mentors = selectedSlugs.flatMap((slug) => {
    const index = rest.findIndex((member) => member.slug === slug)
    return index < 0 ? [] : [{ member: rest[index], color: CARD_TOKENS[index % CARD_TOKENS.length] }]
})

/** Replace only the four CMS-driven cards, keeping Framer's heading and CTA. */
export default function HomeMentors({ route = '/' }: { route?: '/' | '/about' }) {
    const [host, setHost] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const overlay = document.createElement('div')
        overlay.className = styles.host

        const place = () => {
            const content = document.querySelector<HTMLElement>(
                `.unframer-page[data-route="${route}"] section[data-framer-name="Team"] > [data-framer-name="Container"] > [data-framer-name="Content"]`,
            )
            const heading = content?.querySelector<HTMLElement>(':scope > [data-framer-name="Heading"]')
            const grid = heading?.nextElementSibling

            if (grid instanceof HTMLElement && grid !== content?.lastElementChild) {
                if (overlay.parentElement !== grid) {
                    overlay.parentElement?.classList.remove(styles.enhanced)
                    grid.append(overlay)
                    grid.classList.add(styles.enhanced)
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
    }, [route])

    return host ? createPortal(
        <>
            {mentors.map(({ member, color }) => (
                <MentorDisplayCard key={member.slug} member={member} color={color} />
            ))}
        </>,
        host,
    ) : null
}
