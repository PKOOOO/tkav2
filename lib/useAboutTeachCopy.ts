import { useLayoutEffect } from 'react'

const STEPS = [
    {
        title: 'Start with curiosity',
        description: 'Learners bring an idea or question. We turn it into a coding, robotics or design project they are excited to build.',
    },
    {
        title: 'Build alongside mentors',
        description: 'Mentors guide learners as they make games, apps and robots. When something breaks, they debug it and try again.',
    },
    {
        title: 'Test, improve, share',
        description: 'Learners test and refine their creations, then show how a project can solve a real problem in their community.',
    },
] as const

/** Refresh the generated About cards without changing their Framer layout. */
export function useAboutTeachCopy() {
    useLayoutEffect(() => {
        const root = document.querySelector('.unframer-page[data-route="/about"]')
        if (!root) return

        const update = () => {
            const section = root.querySelector('section[data-framer-name="Teach"]')
            if (!section) return

            const heading = section.querySelectorAll<HTMLHeadingElement>('h2')
            if (heading.length === 3 && heading[2].textContent !== 'build') {
                heading[2].textContent = 'build'
            }

            const cards = section.querySelectorAll<HTMLHeadingElement>('h3')
            if (cards.length !== STEPS.length) return

            cards.forEach((title, index) => {
                const { title: newTitle, description: newDescription } = STEPS[index]
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
