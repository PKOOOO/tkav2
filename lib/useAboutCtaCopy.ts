import { useLayoutEffect } from 'react'

const HEADING_WORDS = ['Make', 'your', 'ideas', '', 'real.']

/** Keep the Framer CTA layout while replacing its generic tutoring copy. */
export function useAboutCtaCopy() {
    useLayoutEffect(() => {
        const root = document.querySelector('.unframer-page[data-route="/about"]')
        if (!root) return

        const update = () => {
            root.querySelectorAll<HTMLElement>('section').forEach((section) => {
                const heading = section.querySelector<HTMLElement>('[data-framer-name="Heading"]')
                const words = [...(heading?.querySelectorAll<HTMLHeadingElement>('h2') ?? [])]
                if (words.length !== HEADING_WORDS.length) return
                if (!section.querySelector('img[src*="yJN4KT0Zi7MeLjgjwXSbtNMRtJA"]')) return

                words.forEach((word, index) => {
                    if (word.textContent !== HEADING_WORDS[index]) word.textContent = HEADING_WORDS[index]
                    const wrapper = word.parentElement
                    if (!HEADING_WORDS[index] && wrapper && wrapper.style.display !== 'none') {
                        wrapper.style.display = 'none'
                    }
                })
                const description = section.querySelector<HTMLParagraphElement>('[data-framer-name="Bottom"] p')
                if (description?.textContent) description.textContent = ''
            })
        }

        update()
        const observer = new MutationObserver(update)
        observer.observe(root, { childList: true, characterData: true, subtree: true })
        return () => observer.disconnect()
    }, [])
}
