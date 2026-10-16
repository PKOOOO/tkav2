import type { Metadata } from 'next'

import './globals.css'
import '@/framer/styles.css'
import 'lenis/dist/lenis.css'

import { Analytics } from '@vercel/analytics/next'

import PageViewBeacon from '@/components/PageViewBeacon'
import Shell from '@/components/Shell'
import StructuredData from '@/components/StructuredData'
import NextTopLoader from 'nextjs-toploader'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

/**
 * `metadataBase` is what lets every page below write `alternates.canonical` and
 * `openGraph.url` as a path instead of repeating the origin, and it is what
 * resolves `opengraph-image` to an absolute URL -- relative OG images are
 * ignored by every scraper.
 */
export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: `${SITE_NAME} | Coding, Robotics & Digital Skills for Kids in Mombasa`,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
        'Tech Kidz Africa',
        'coding for kids Mombasa',
        'robotics for children Kenya',
        'STEM education Kenya',
        'technology academy Mombasa',
        'kids coding classes Nyali',
        'digital literacy for children',
        '3D design and printing for kids',
        'AI and machine learning for youth',
        'holiday coding bootcamp Mombasa',
    ],
    alternates: { canonical: '/' },
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        locale: 'en_KE',
        url: SITE_URL,
        title: `${SITE_NAME} | Coding, Robotics & Digital Skills for Kids in Mombasa`,
        description: SITE_DESCRIPTION,
    },
    twitter: {
        card: 'summary_large_image',
        site: '@techkidzafrica',
        creator: '@techkidzafrica',
    },
    icons: {
        icon: [
            { url: '/fav/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/fav/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: [{ url: '/fav/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/fav/site.webmanifest',
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang='en' className={cn("font-sans", geist.variable)}>
            <head>
                <StructuredData />
            </head>
            <body>
                <NextTopLoader color="#6a1383" height={3} showSpinner={false} shadow={false} />
                <Shell>{children}</Shell>
                {/*
                 * Two counters on purpose, and they are not redundant.
                 *
                 * `Analytics` is Vercel's, enabled on the project; it needs no
                 * database and its dashboard is already behind the Vercel
                 * login. `PageViewBeacon` fills our own Neon tables, which is
                 * what /admin and the AI summary read.
                 *
                 * Keeping both means each is a check on the other. A beacon
                 * that silently stops firing -- or double-counts a
                 * client-side navigation -- is close to undetectable from one
                 * set of numbers alone, and this site navigates entirely
                 * client-side, which is exactly where that goes wrong.
                 *
                 * Both sit outside <Shell>, which gates the whole Framer tree
                 * on mount; inside it they would not run until that gate
                 * opened, and would miss a visitor who left quickly.
                 */}
                <Analytics />
                <PageViewBeacon />
            </body>
        </html>
    )
}
