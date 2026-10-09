import type { Metadata } from 'next'
import Blogs from '@/components/routes/Blogs'

export const metadata: Metadata = {
    title: 'Blogs — Tech Kidz Africa',
    description: 'Ideas and practical guides for young makers learning coding, robotics, design and digital skills.',
}

export default function Page() {
    return <Blogs />
}
