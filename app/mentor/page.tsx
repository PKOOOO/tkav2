import type { Metadata } from 'next'
import Mentor from '@/components/routes/Mentor'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
    title: 'Our Team & Mentors',
    description:
        'Meet the trainers and facilitators at Tech Kidz Africa — robotics leads, software engineers and learning facilitators guiding young people in Mombasa.',
    path: '/mentor',
})

export default function Page() {
    return <Mentor />
}
