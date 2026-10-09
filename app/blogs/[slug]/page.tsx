import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogDetail from '@/components/routes/BlogDetail'
import { blogPosts, findBlogPost } from '@/lib/blog-posts'

export function generateStaticParams() {
    return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps<'/blogs/[slug]'>): Promise<Metadata> {
    const { slug } = await params
    const post = findBlogPost(slug)
    return {
        title: post ? post.title + ' — Tech Kidz Africa' : 'Article not found — Tech Kidz Africa',
        description: post?.summary,
    }
}

export default async function Page({ params }: PageProps<'/blogs/[slug]'>) {
    const { slug } = await params
    const post = findBlogPost(slug)
    if (!post) notFound()
    return <BlogDetail post={post} />
}
