import { blogPosts } from '@/lib/blog-posts'

// The property IDs are the Academy export's existing collection schema.
// Feeding that schema preserves its original Framer card layouts and animation.
const cardColours = [
    ['#d6ecff', '#38b6ff'],
    ['#c6dcf0', '#00569e'],
] as const

export const programCards = blogPosts.slice(0, 2).map((post, index) => ({
    id: post.slug,
    RTPu7GAr9: post.slug,
    mRE9CRODz: post.title,
    KaRriPtUM: { src: post.image, alt: post.title },
    Z2I6ooBcF: post.minAge ?? 0,
    Re5eEfQmS: post.maxAge ?? 0,
    fLIf4CzeC: post.summary,
    LZarEYkyu: cardColours[index][0],
    DRgZq2HFm: cardColours[index][1],
}))
