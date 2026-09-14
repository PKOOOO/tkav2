import { useEffect, useRef, useState } from 'react'

/**
 * A dot that trails the pointer, ported from the sibling Flexio project.
 *
 * There, the dot's visual is a real exported Framer component (`Cursor`),
 * because that Framer project defines one. This project does not -- there is no
 * cursor component in Brightpath (copy) -- so the dot is drawn here instead.
 * That keeps it in the same category as `useSmoothScroll.ts`: a site-level
 * behaviour the component-only export cannot provide.
 *
 * Framer's custom cursor is a *site-level* feature, not part of any component.
 * The runtime ships inside unframer (`CustomCursorHost` / `useCustomCursors`),
 * but a cursor only activates once something calls `useCustomCursors(...)`, and
 * that registration comes from Framer's page renderer, which a component-only
 * export never emits.
 *
 * It deliberately does NOT hide the native pointer. Framer only swaps the real
 * cursor out when the cursor has no placement/alignment set, so this is an
 * additive decoration that trails alongside the real pointer -- both visible.
 */

/** Per-frame catch-up factor. Lower = longer, softer trail behind the pointer. */
const SMOOTHING = 0.18

/** Matches `theme.orange` in src/cms.ts -- the project's accent colour. */
const DOT_COLOR = 'rgb(232, 114, 44)'
const DOT_SIZE = 16

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null)
    const [enabled, setEnabled] = useState(false)

    // Framer only shows a custom cursor on hover-capable pointers -- match that,
    // otherwise touch users get a dot stuck wherever they last tapped.
    useEffect(() => {
        const noHover = window.matchMedia('(any-hover: none)')
        const sync = () => setEnabled(!noHover.matches)
        sync()
        noHover.addEventListener('change', sync)
        return () => noHover.removeEventListener('change', sync)
    }, [])

    useEffect(() => {
        const dot = dotRef.current
        if (!enabled || !dot) return

        // Under reduced motion, track exactly rather than trailing.
        const smoothing = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : SMOOTHING

        let targetX = 0
        let targetY = 0
        let x = 0
        let y = 0
        let seen = false

        const onMove = (event: PointerEvent) => {
            targetX = event.clientX
            targetY = event.clientY
            if (!seen) {
                // Start at the pointer rather than flying in from the corner.
                x = targetX
                y = targetY
                seen = true
                dot.style.opacity = '1'
            }
        }
        const hide = () => {
            dot.style.opacity = '0'
        }
        const show = () => {
            if (seen) dot.style.opacity = '1'
        }

        let frame = requestAnimationFrame(function tick() {
            x += (targetX - x) * smoothing
            y += (targetY - y) * smoothing
            dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
            frame = requestAnimationFrame(tick)
        })

        window.addEventListener('pointermove', onMove, { passive: true })
        document.addEventListener('mouseleave', hide)
        document.addEventListener('mouseenter', show)
        window.addEventListener('blur', hide)
        window.addEventListener('focus', show)

        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('pointermove', onMove)
            document.removeEventListener('mouseleave', hide)
            document.removeEventListener('mouseenter', show)
            window.removeEventListener('blur', hide)
            window.removeEventListener('focus', show)
        }
    }, [enabled])

    if (!enabled) return null

    return (
        <div
            ref={dotRef}
            aria-hidden='true'
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: '50%',
                backgroundColor: DOT_COLOR,
                zIndex: 9999,
                pointerEvents: 'none',
                opacity: 0,
                transition: 'opacity 200ms ease',
                willChange: 'transform',
            }}
        />
    )
}
