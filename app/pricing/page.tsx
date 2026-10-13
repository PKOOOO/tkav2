import type { Metadata } from 'next'
import Pricing from '@/components/routes/Pricing'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
    title: 'Pricing',
    description:
        'What it costs to learn at Tech Kidz Africa — session formats, group sizes and schedules for coding, robotics and digital skills programs in Mombasa.',
    path: '/pricing',
})

export default function Page() {
    return <Pricing />
}
