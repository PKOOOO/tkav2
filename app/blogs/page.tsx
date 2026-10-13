import type { Metadata } from 'next'
import Blogs from '@/components/routes/Blogs'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
    title: 'Blog',
    description:
        'Ideas and practical guides for young makers learning coding, robotics, design and digital skills — from the team at Tech Kidz Africa.',
    path: '/blogs',
})

export default function Page() {
    return <Blogs />
}
