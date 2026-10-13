import type { Metadata } from 'next'
import About from '@/components/routes/About'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
    title: 'About Us',
    description:
        'How Tech Kidz Africa began, what we teach, and the team behind it — a technology academy in Nyali, Mombasa turning young people’s curiosity into working robots, apps and websites.',
    path: '/about',
})

export default function Page() {
    return <About />
}
