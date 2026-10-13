import type { Metadata } from 'next'
import Program from '@/components/routes/Program'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
    title: 'Programs',
    description:
        'Explore animation and gamification, robotics and tinkering, digital literacy, software engineering, 3D design and printing, online safety, computer networking, and AI and machine learning.',
    path: '/program',
})

export default function Page() {
    return <Program />
}
