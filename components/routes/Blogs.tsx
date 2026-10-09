'use client'

import { ACADEMY_BLOG_RESPONSIVE } from '@/components/academy-blog-framer/breakpoints'
import BlogCards from '@/components/academy-blog-framer/programs-section-2.jsx'
import styles from './Blogs.module.css'

export default function Blogs() {
    return (
        <main className={styles.page}>
            <BlogCards.Responsive variants={ACADEMY_BLOG_RESPONSIVE} />
        </main>
    )
}
