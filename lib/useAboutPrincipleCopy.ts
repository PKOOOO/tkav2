import { useLayoutEffect } from 'react'

const PRINCIPLES = [
    {
        title: 'Hands-on from day one',
        description: 'Learners code, tinker and test real projects—not just watch a screen or copy instructions.',
    },
    {
        title: 'Grow with each project',
        description: 'From Scratch and ZMRobo kits to Arduino, web apps and AI, each project opens the door to a new skill.',
    },
    {
        title: 'Learn with makers',
        description: 'Our mentors build alongside learners, helping them debug ideas, ask questions and keep experimenting.',
    },
    {
        title: 'Show what you made',
        description: 'Learners share working games, robots and apps, and show how technology can help their communities.',
    },
] as const

/** Keep the Framer principle cards while giving them Tech Kidz Africa copy. */
export function useAboutPrincipleCopy() {
    useLayoutEffect(() => {
        const root = document.querySelector('.unframer-page[data-route="/about"]')
        if (!root) return

        const update = () => {
            const section = root.querySelector('section[data-framer-name="Principle"]')
            if (!section) return

            const heading = section.querySelectorAll<HTMLHeadingElement>('h2')
            const headingWords = ['Ideas', 'come', 'to life']
            if (heading.length === headingWords.length) {
                heading.forEach((word, index) => {
                    if (word.textContent !== headingWords[index]) {
                        word.textContent = headingWords[index]
                    }
                })
            }

            const cards = section.querySelectorAll<HTMLHeadingElement>('h3')
            if (cards.length !== PRINCIPLES.length) return

            cards.forEach((title, index) => {
                const { title: newTitle, description: newDescription } = PRINCIPLES[index]
                const paragraph = title.closest('[data-framer-name="Content"]')?.querySelector('p')
                if (title.textContent !== newTitle) title.textContent = newTitle
                if (paragraph && paragraph.textContent !== newDescription) {
                    paragraph.textContent = newDescription
                }
            })
        }

        update()
        const observer = new MutationObserver(update)
        observer.observe(root, { childList: true, characterData: true, subtree: true })
        return () => observer.disconnect()
    }, [])
}
