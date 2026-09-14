import type { Metadata } from 'next'
import Pricing from '@/components/routes/Pricing'

export const metadata: Metadata = {
    title: 'Pricing — BrightPath',
    description: 'No lock-in, ever.',
}

export default function Page() {
    return <Pricing />
}
