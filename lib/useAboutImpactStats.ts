import { useLayoutEffect } from 'react'

import { impactStats } from '@/lib/impact-stats'

/** Keep the exported Framer cards and their colors, but share Home's figures. */
export function useAboutImpactStats() {
    useLayoutEffect(() => {
        const update = () => {
            const section = document.querySelector(
                '.unframer-page[data-route="/about"] section[data-framer-name="Counter"] [data-framer-name="Content"]',
            )
            if (!section) return

            const numbers = section.querySelectorAll<HTMLHeadingElement>('h2:not([data-about-impact-highlight])')
            const labels = section.querySelectorAll<HTMLParagraphElement>('p')
            if (numbers.length !== impactStats.length || labels.length !== impactStats.length) return

            impactStats.forEach(({ value, label }, index) => {
                if (numbers[index].textContent !== value) numbers[index].textContent = value
                if (labels[index].textContent !== label) labels[index].textContent = label
                labels[index].dataset.aboutImpactLabel = ''
            })
        }

        update()
        const root = document.querySelector('.unframer-page[data-route="/about"]') ?? document.body
        const observer = new MutationObserver(update)
        observer.observe(root, { childList: true, characterData: true, subtree: true })
        return () => observer.disconnect()
    }, [])
}
