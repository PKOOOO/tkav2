import type { UnframerBreakpoint } from 'unframer'

// Academy's desktop sections are designed to work down to 960px. Use that
// authored layout there; TKA's own Framer sections switch at 1200px.
export const ACADEMY_BLOG_RESPONSIVE: Record<UnframerBreakpoint, string> = {
    base: 'Phone',
    sm: 'Phone',
    md: 'Tablet',
    lg: 'Desktop',
    xl: 'Desktop',
    '2xl': 'Desktop',
}
