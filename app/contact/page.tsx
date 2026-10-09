import type { Metadata } from 'next'
import Contact from '@/components/routes/Contact'

export const metadata: Metadata = {
    title: 'Contact — Tech Kidz Africa',
    description: 'Get in touch with Tech Kidz Africa about programs and sessions.',
}

export default function Page() {
    return <Contact />
}
