import type { Metadata } from 'next'
import Gallery from '@/components/routes/Gallery'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
    title: 'Gallery',
    description:
        'See young makers at Tech Kidz Africa exploring coding, robotics, digital learning and creative technology in Mombasa.',
    path: '/gallery',
})

export default function Page() {
    return <Gallery />
}
