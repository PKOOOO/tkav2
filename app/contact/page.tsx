import type { Metadata } from 'next'
import Contact from '@/components/routes/Contact'

export const metadata: Metadata = {
    title: 'Contact — BrightPath',
    description: 'Book a free intro session.',
}

export default function Page() {
    return <Contact />
}
