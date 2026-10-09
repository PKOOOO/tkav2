'use client'

import type { ComponentType, CSSProperties } from 'react'
import { ACADEMY_BLOG_RESPONSIVE } from '@/components/academy-blog-framer/breakpoints'
import type { BlogPost } from '@/lib/blog-posts'
import BlogHero from '@/components/academy-blog-framer/program-detail-section-1.jsx'
import BlogBody from '@/components/academy-blog-framer/program-detail-section-2.jsx'
import BootcampRegistrationDialog from '@/components/BootcampRegistrationDialog'
import FestivalCrab from '@/components/FestivalCrab'
import styles from './Blogs.module.css'

const ResponsiveBlogHero = BlogHero.Responsive as ComponentType<{ variants: typeof ACADEMY_BLOG_RESPONSIVE; title: string }>

function ArticleContent({ post }: { post: BlogPost }) {
    return (
        <div className={styles.articleContent}>
            {post.sections.map((section) => (
                <section key={section.heading}>
                    <h2>{section.heading}</h2>
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.points && (
                        <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>
                    )}
                </section>
            ))}
        </div>
    )
}

export default function BlogDetail({ post }: { post: BlogPost }) {
    return (
        <main className={`${styles.page} ${['bootcamp', 'codeinnovators'].includes(post.slug) ? styles.tintedArticle : ''} ${post.slug === 'bootcamp' ? styles.bootcampArticle : ''}`} data-bootcamp-article={post.slug === 'bootcamp' ? '' : undefined} data-festival-article={post.slug === 'codeinnovators' ? '' : undefined} style={{ '--blog-cover': 'url("' + (post.secondaryImage ?? post.image) + '")' } as CSSProperties}>
            <ResponsiveBlogHero variants={ACADEMY_BLOG_RESPONSIVE} title={post.title} />
            <BlogBody.Responsive
                variants={ACADEMY_BLOG_RESPONSIVE}
                image={{ src: post.detailImage ?? post.image, alt: post.title }}
                content={<ArticleContent post={post} />}
                startDate={post.topic}
                minAge={post.minAge ?? 0}
                maxAge={post.maxAge ?? 0}
                programDuration={post.readMinutes + ' min'}
                learningStyle="Tech Kidz Africa"
            />
            {post.slug === 'bootcamp' && <BootcampRegistrationDialog />}
            {post.slug === 'codeinnovators' && <FestivalCrab />}
        </main>
    )
}
