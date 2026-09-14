import type { Metadata } from 'next'
import About from '@/components/routes/About'

export const metadata: Metadata = {
    title: 'About — BrightPath',
    description: 'How BrightPath teaches, and who teaches it.',
}

export default function Page() {
    return <About />
}
