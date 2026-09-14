import { useLayoutEffect } from 'react'

/**
 * Tightens the vertical rhythm of every exported Framer section.
 *
 * The template authors each section with generous vertical padding -- 150px top
 * and bottom at Desktop, 100px at Tablet/Phone -- which is faithful to the
 * published reference but leaves each section's content starting a long way
 * down. This scales that padding back.
 *
 * It is done here rather than in `index.css` because the padding is baked into
 * per-component generated classes and the real values vary: `0/0` (About Team),
 * `0/150` (Home Step), `50/150` (Mentor list), `146/0` (heroes), `150/180`
 * (CTAs), `200/200` (Home CTA). A blanket CSS rule would flatten all of those to
 * one number and pad the sections that are deliberately flush. Scaling each
 * section's own value keeps zeros at zero and keeps asymmetric padding
 * asymmetric, at every breakpoint, without an exception list that would rot on
 * the next `npm run framer`.
 */
const SCALE = 2 / 3

function apply() {
    const sections = document.querySelectorAll<HTMLElement>('.unframer-page section')
    for (const section of sections) {
        // Clear our own values first: the inline style would otherwise mask the
        // class value and we would re-scale an already-scaled number, shrinking
        // the padding a little more on every pass and every breakpoint change.
        section.style.paddingTop = ''
        section.style.paddingBottom = ''

        const styles = getComputedStyle(section)
        const top = parseFloat(styles.paddingTop)
        const bottom = parseFloat(styles.paddingBottom)
        if (!Number.isFinite(top) || !Number.isFinite(bottom)) continue
        if (top === 0 && bottom === 0) continue

        if (top > 0) section.style.paddingTop = `${Math.round(top * SCALE)}px`
        if (bottom > 0) section.style.paddingBottom = `${Math.round(bottom * SCALE)}px`
    }
}

export function useCompactSections(resetKey?: string) {
    useLayoutEffect(() => {
        let frame = 0
        const schedule = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(apply)
        }

        schedule()

        // Sections mount after their breakpoint is measured, so a single pass on
        // navigation misses them; watch for them arriving instead.
        const root = document.querySelector('.unframer-page')
        const observer = root ? new MutationObserver(schedule) : null
        observer?.observe(root!, { childList: true, subtree: true })

        // Framer's padding changes per breakpoint, so re-read it on resize.
        window.addEventListener('resize', schedule)

        return () => {
            cancelAnimationFrame(frame)
            observer?.disconnect()
            window.removeEventListener('resize', schedule)
        }
    }, [resetKey])
}
