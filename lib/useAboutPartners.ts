import { useLayoutEffect } from 'react'

/**
 * Logos live in `public/decor/` rather than `public/brand/`, same as the other
 * processed artwork, and the sources beside them are not servable: 5MB for the
 * nine. See the note in app/globals.css for how each was converted.
 *
 * `rasp` is the one that stays SVG -- it is genuine vector, where every other
 * source is an SVG wrapping a PNG.
 */
const PARTNERS = [
    { src: '/decor/partner-code.webp', name: 'Code Innovators Academy' },
    { src: '/decor/partner-close.webp', name: 'Close the Gap Kenya' },
    { src: '/decor/partner-bulk.webp', name: 'Bulkstream' },
    { src: '/decor/partner-mombasa.webp', name: 'Mombasa County' },
    { src: '/decor/partner-com.webp', name: 'Communications Authority of Kenya' },
    { src: '/decor/partner-ed.webp', name: 'Ministry of Education, Science and Technology' },
    { src: '/decor/partner-rasp.svg', name: 'Raspberry Pi Foundation' },
    { src: '/decor/partner-sw.webp', name: 'Swahilipot Hub' },
    { src: '/decor/partner-4.webp', name: 'Kenya Science and Engineering Fair' },
    { src: '/decor/partner-tum.webp', name: 'Technical University of Mombasa' },
    { src: '/decor/partner-22.webp', name: 'Google DeepMind' },
    { src: '/decor/partner-23.webp', name: 'EdTech East Africa' },
    { src: '/decor/partner-13.webp', name: 'Compassion' },
    { src: '/decor/partner-24.webp', name: 'American Spaces Kenya' },
    { src: '/decor/partner-25.webp', name: 'Founders Factory' },
    { src: '/decor/partner-16.webp', name: 'Kenya Red Cross Society' },
    { src: '/decor/partner-17.webp', name: 'Kenya Coast National Polytechnic' },
    { src: '/decor/partner-18.webp', name: 'Government of Taita Taveta County' },
    { src: '/decor/partner-19.webp', name: 'Elimu Pi Robotics' },
] as const

/**
 * Walk up from a card's title to the card itself -- the element whose siblings
 * are the other cards. Identified by shape rather than by class, since the
 * generated class names are rewritten by `pnpm framer`.
 */
function cardAncestor(title: Element, section: Element): HTMLElement | null {
    let node = title.parentElement
    while (node && node !== section) {
        const parent = node.parentElement
        if (
            parent &&
            parent.children.length === 3 &&
            [...parent.children].every((child) => child.querySelector('h3'))
        ) {
            return node as HTMLElement
        }
        node = parent
    }
    return null
}

/**
 * Turn the second copy of the Teach section into "Our Partners".
 *
 * `components/routes/About.tsx` renders `about-section-3-teach` twice. The
 * first stays "How we build" (see `useAboutTeachCopy`); this rewrites the
 * second one in place, so the partners block is the same Framer layout rather
 * than a hand-built lookalike.
 *
 * Everything here is keyed off the *second* match, and `useAboutTeachCopy`
 * reads with `querySelector` -- the first -- so the two never touch the same
 * nodes.
 *
 * The section ships three step cards and there are nineteen partners, so the last
 * card is cloned sixteen times. That is the one piece of real DOM surgery: the
 * step number, the body copy and the heading are hidden by CSS instead, keyed
 * to the `data-` attributes stamped on here.
 */
export function useAboutPartners() {
    useLayoutEffect(() => {
        const root = document.querySelector('.unframer-page[data-route="/about"]')
        if (!root) return

        // Reveal on scroll. unframer's own appear effect cannot do this: it
        // registers with an IntersectionObserver at mount, and a cloned card
        // was never registered, so it would sit at its start state forever.
        //
        // `threshold: 0` and revealing once mirror Framer's
        // `__framer__threshold={0}` and `__framer__animateOnce`. The styling,
        // including what "hidden" means, is in app/globals.css.
        const pending = new Set<Element>()

        const show = (card: Element) => {
            card.setAttribute('data-shown', '')
            reveal.unobserve(card)
            pending.delete(card)
            if (pending.size === 0) window.removeEventListener('scroll', onScroll)
        }

        // Belt and braces, and cheap: the same test the observer makes, run on
        // scroll until every card is out of the way. The cards are hidden by a
        // stylesheet rule and only this code un-hides them, so an observer that
        // never delivers would mean a permanently blank section -- a worse
        // outcome than no animation at all. Both paths are removed once the
        // last card is shown.
        const onScroll = () => {
            for (const card of [...pending]) {
                const box = card.getBoundingClientRect()
                if (box.top < window.innerHeight && box.bottom > 0) show(card)
            }
        }

        const reveal = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) show(entry.target)
                }
            },
            { threshold: 0 },
        )

        const update = () => {
            const sections = root.querySelectorAll<HTMLElement>('section[data-framer-name="Teach"]')
            if (sections.length < 2) return
            const section = sections[1]
            if (!section.hasAttribute('data-about-partners')) {
                section.setAttribute('data-about-partners', '')
            }

            // Match the step cards' height exactly. It cannot be a constant:
            // the step card sizes to its own body copy, so it is 324px on a
            // desktop row and a different figure at every other width. Measure
            // the real one and publish it for the stylesheet to consume.
            //
            // Guarded because writing the property is itself a mutation, and
            // this runs from a MutationObserver.
            const stepTitle = sections[0].querySelector('h3')
            const stepCard = stepTitle && cardAncestor(stepTitle, sections[0])
            if (stepCard) {
                const height = `${stepCard.offsetHeight}px`
                if (section.style.getPropertyValue('--partner-card-height') !== height) {
                    section.style.setProperty('--partner-card-height', height)
                }
            }

            // "How we teach" -> "Our Partners". The third word is the one the
            // squiggle and sparkle are drawn against, so the name goes there and
            // the middle word is emptied rather than reordered.
            const words = section.querySelectorAll<HTMLHeadingElement>('h2')
            if (words.length === 3) {
                if (words[0].textContent !== 'Our') words[0].textContent = 'Our'
                if (words[1].textContent !== '') words[1].textContent = ''
                if (words[2].textContent !== 'Partners') words[2].textContent = 'Partners'
            }

            // The grid is found once by shape -- the only ancestor whose children
            // are all cards -- then marked, because cloning a fourth card changes
            // the child count that identified it.
            let grid = section.querySelector<HTMLElement>('[data-partner-grid]')
            if (!grid) {
                const title = section.querySelector('h3')
                const card = title && cardAncestor(title, section)
                if (!card?.parentElement) return
                grid = card.parentElement
                grid.setAttribute('data-partner-grid', '')
            }

            while (grid.children.length < PARTNERS.length) {
                grid.appendChild(grid.children[grid.children.length - 1].cloneNode(true))
            }

            // Only now that there are cards to reveal: the stylesheet hides
            // them on the strength of this attribute, so setting it earlier
            // would risk a section that is hidden with nothing to un-hide it.
            if (!section.hasAttribute('data-partner-anim')) {
                section.setAttribute('data-partner-anim', '')
            }

            PARTNERS.forEach((partner, index) => {
                const card = grid.children[index] as HTMLElement | undefined
                if (!card) return
                if (!card.hasAttribute('data-partner-card')) {
                    card.setAttribute('data-partner-card', '')
                }

                // Staggered by position within the row of three, so each row
                // deals itself in left to right as it arrives rather than the
                // tenth card waiting on a delay nine steps long.
                if (!card.hasAttribute('data-partner-observed')) {
                    card.setAttribute('data-partner-observed', '')
                    card.style.setProperty('--partner-delay', `${(index % 3) * 0.15}s`)
                    if (pending.size === 0) {
                        window.addEventListener('scroll', onScroll, { passive: true })
                    }
                    pending.add(card)
                    reveal.observe(card)
                }

                // The card shows the logo and nothing else -- the title block is
                // hidden in CSS. The heading is still rewritten rather than left
                // alone so that the markup never carries a step card's copy
                // ("Start with curiosity") under a partner's logo.
                const title = card.querySelector('h3')
                if (title && title.textContent !== partner.name) {
                    title.textContent = partner.name
                }

                // Into the panel, not the text block: the panel's first child is
                // the "01" badge, so inserting ahead of it puts the logo exactly
                // where the badge sits and the authored 100px gap then separates
                // it from the name, the same as on a step card. The panel is the
                // card's only child -- addressed by position because its
                // `data-framer-name` is the breakpoint's, not a stable one.
                const panel = (card.firstElementChild as HTMLElement | null) ?? card
                let logo = card.querySelector<HTMLImageElement>('img[data-partner-logo]')
                if (!logo) {
                    logo = document.createElement('img')
                    logo.setAttribute('data-partner-logo', '')
                    // Deliberately not `loading="lazy"`. The badge and body copy
                    // are hidden, so before the logo loads its flex parent can be
                    // 0px tall -- the image never intersects the viewport, so a
                    // lazy load never fires, so it never gets an intrinsic size.
                    // The logo assets are kept compact for eager loading.
                    logo.decoding = 'async'
                    panel.insertBefore(logo, panel.firstChild)
                }
                if (!logo.src.endsWith(partner.src)) logo.src = partner.src
                if (logo.alt !== partner.name) logo.alt = partner.name
            })
        }

        update()
        const observer = new MutationObserver(update)
        observer.observe(root, { childList: true, characterData: true, subtree: true })
        // The measured card height is per-breakpoint, and a resize changes it
        // without touching the DOM -- nothing the observer above would see.
        window.addEventListener('resize', update)
        return () => {
            observer.disconnect()
            reveal.disconnect()
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', update)
        }
    }, [])
}
