'use client'

import { createPortal } from 'react-dom'
import { useLayoutEffect, useState } from 'react'
import { ADDITIONAL_PROGRAM_SLUGS } from '@/lib/additional-programs'
import { PROGRAM_OVERRIDES } from '@/lib/cms-overrides'

import styles from './ContactDetails.module.css'

const EMAIL = 'info@techkidzafrica.co.ke'
const ADDRESS = 'Bustani Close, Off Links Road, Nyali'
/**
 * Only the contact card's own lines live here now.
 *
 * The five FAQ answers used to be in this map as well, which meant they were
 * corrected on `/contact` and nowhere else -- this hook is scoped to that
 * route, and the same FAQ also renders on `/pricing` and on Home, where it
 * kept the template's copy. They are now rewritten at source for all three
 * instances by `scripts/patch-text-overrides.mjs`, so repeating them here
 * would be a second, route-limited copy of text that already has an owner.
 *
 * The footer's email, hours and address went the same way. What is left is
 * the contact hero's card, which is still generated with the placeholders.
 */
const COPY: Record<string, string> = {
    'Mon–Sat, 9:00–19:00': 'Mon–Sat, 8:00 AM–5:00 PM',
    'Open Mon–Sat, 9:00–19:00': 'Open Mon–Sat, 8:00 AM–5:00 PM',
    'In-center and live online': ADDRESS,
    'In-center and online, worldwide': ADDRESS,
}

const PROGRAM_CHOICES = [
    'mathematics', 'science', 'english', 'coding', ...ADDITIONAL_PROGRAM_SLUGS,
].map((slug) => {
    const title = PROGRAM_OVERRIDES[slug]?.fields?.Title
    if (typeof title !== 'string') throw new Error('Missing program title for ' + slug)
    return { slug, title }
})

/** Keep Framer's contact card and form submission, while supplying current local data. */
export default function ContactDetails() {
    const [programList, setProgramList] = useState<HTMLElement | null>(null)

    useLayoutEffect(() => {
        const root = document.querySelector<HTMLElement>('.unframer-page[data-route="/contact"]')
        if (!root) return

        const sync = () => {
            const list = root.querySelector<HTMLElement>('form [data-framer-name="Program Type"] [data-framer-name="List"]')
            setProgramList((current) => current === list ? current : list)

            root.querySelectorAll<HTMLAnchorElement>('a[href="mailto:hello@yourbrand.com"]').forEach((link) => {
                link.href = 'mailto:' + EMAIL
                link.textContent = EMAIL
            })
            root.querySelectorAll<HTMLInputElement>('input[placeholder="hello@yourbrand.com"]').forEach((input) => {
                input.placeholder = EMAIL
            })

            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
            while (walker.nextNode()) {
                const node = walker.currentNode
                const replacement = COPY[node.textContent?.trim() ?? '']
                if (replacement && node.textContent !== replacement) node.textContent = replacement
            }
        }

        sync()
        const observer = new MutationObserver(sync)
        observer.observe(root, { childList: true, characterData: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    return programList && createPortal(
        <fieldset className={styles.choices} data-contact-program-choices>
            <legend className={styles.srOnly}>Choose a program</legend>
            {PROGRAM_CHOICES.map((program) => (
                <label className={styles.option} key={program.slug}>
                    <input type="radio" name="Project Type" value={program.title} required />
                    <span>{program.title}</span>
                </label>
            ))}
            <label className={styles.option}>
                <input type="radio" name="Project Type" value="Not sure yet" required />
                <span>Not sure yet</span>
            </label>
        </fieldset>,
        programList,
    )
}
