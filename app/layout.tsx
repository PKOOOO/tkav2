import type { Metadata } from 'next'

import './globals.css'
import '@/framer/styles.css'
import 'lenis/dist/lenis.css'

import Shell from '@/components/Shell'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
    title: 'BrightPath',
    description: 'Small-group tutoring, in-center and online.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang='en' className={cn("font-sans", geist.variable)}>
            <body>
                <Shell>{children}</Shell>
            </body>
        </html>
    )
}
