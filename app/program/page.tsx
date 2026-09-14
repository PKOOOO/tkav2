import type { Metadata } from 'next'
import Program from '@/components/routes/Program'

export const metadata: Metadata = {
    title: 'Programs — BrightPath',
    description: 'Mathematics, science, English and coding.',
}

export default function Page() {
    return <Program />
}
