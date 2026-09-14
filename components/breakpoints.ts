import type { UnframerBreakpoint } from 'unframer'

/**
 * Framer breakpoints (Desktop >= 1200, Tablet >= 810, Phone below) mapped onto
 * unframer's fixed breakpoint keys: base 0, sm 320, md 768, lg 960, xl 1200, 2xl 1536.
 *
 * `.Responsive` ships with `defaultResponsiveVariants = {}` -- empty -- so
 * without an explicit map nothing switches. It spreads `{...rest}` after its own
 * defaults, so the map passed as a prop wins.
 */
export const RESPONSIVE: Record<UnframerBreakpoint, string> = {
    base: 'Phone',
    sm: 'Phone',
    md: 'Tablet',
    lg: 'Tablet',
    xl: 'Desktop',
    '2xl': 'Desktop',
}

/** Navigation ships open/close variants per breakpoint; use the closed state as the default. */
export const NAV_RESPONSIVE: Record<UnframerBreakpoint, string> = {
    base: 'Phone - Close',
    sm: 'Phone - Close',
    md: 'Tablet - Close',
    lg: 'Tablet - Close',
    xl: 'Desktop',
    '2xl': 'Desktop',
}
