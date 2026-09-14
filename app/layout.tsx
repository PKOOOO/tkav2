import type { Metadata } from 'next'

import './globals.css'
import '@/framer/styles.css'
import 'lenis/dist/lenis.css'

import Shell from '@/components/Shell'

export const metadata: Metadata = {
    title: 'BrightPath',
    description: 'Small-group tutoring, in-center and online.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang='en'>
            <body>
                <Shell>{children}</Shell>
            </body>
        </html>
    )
}
