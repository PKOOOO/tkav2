import type { Metadata } from 'next'
import Mentor from '@/components/routes/Mentor'

export const metadata: Metadata = {
    title: 'Mentors — BrightPath',
    description: 'Vetted twice: subject exam plus a live teaching audition.',
}

export default function Page() {
    return <Mentor />
}
