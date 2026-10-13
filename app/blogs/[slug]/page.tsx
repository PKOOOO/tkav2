import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogDetail from '@/components/routes/BlogDetail'
import { blogPosts, findBlogPost } from '@/lib/blog-posts'
import { pageMetadata } from '@/lib/seo'

export function generateStaticParams() {
    return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps<'/blogs/[slug]'>): Promise<Metadata> {
    const { slug } = await params
    const post = findBlogPost(slug)

    if (!post) {
        return { title: 'Article not found', robots: { index: false, follow: true } }
    }

    const metadata = pageMetadata({
        title: post.title,
        description: post.summary,
        path: `/blogs/${slug}`,
    })

    // Posts carry their own artwork, which makes a far better share card than
    // the site-wide one. `metadataBase` in the root layout resolves the path.
    const image = post.detailImage ?? post.image

    return {
        ...metadata,
        openGraph: { ...metadata.openGraph, type: 'article', images: [{ url: image }] },
        twitter: { ...metadata.twitter, images: [image] },
    }
}

export default async function Page({ params }: PageProps<'/blogs/[slug]'>) {
    const { slug } = await params
    const post = findBlogPost(slug)
    if (!post) notFound()
    return <BlogDetail post={post} />
}
