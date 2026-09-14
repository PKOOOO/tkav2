import type { Metadata } from 'next'
import Home from '@/components/routes/Home'

export const metadata: Metadata = {
    title: 'BrightPath',
    description: 'Small-group tutoring, in-center and online.',
}

export default function Page() {
    return <Home />
}
