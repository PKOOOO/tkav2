import type { Metadata } from 'next'
import Contact from '@/components/routes/Contact'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
    title: 'Contact & Enrolment',
    description:
        'Talk to Tech Kidz Africa about programs, sessions and enrolment. Bustani Close, Off Links Road, Nyali, Mombasa — open Mon–Sat, 8:00 AM–5:00 PM.',
    path: '/contact',
})

export default function Page() {
    return <Contact />
}
