import type { Metadata } from 'next'
import Program from '@/components/routes/Program'

export const metadata: Metadata = {
    title: 'Programs — Tech Kidz Africa',
    description: 'Explore animation and gamification, robotics and tinkering, digital literacy, software engineering, 3D design and printing, online safety, computer networking, and AI and machine learning.',
}

export default function Page() {
    return <Program />
}
