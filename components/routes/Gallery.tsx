'use client'

import Image from 'next/image'
import { motion } from 'unframer'
import { ACADEMY_BLOG_RESPONSIVE } from '@/components/academy-blog-framer/breakpoints'
import GalleryPhotos from '@/components/academy-blog-framer/gallery-section-2.jsx'
import LetsConnect from '@/components/academy-blog-framer/cta.jsx'
import styles from './Gallery.module.css'

export default function Gallery() {
    return (
        <main className={styles.page}>
            <GalleryPhotos.Responsive variants={ACADEMY_BLOG_RESPONSIVE} />
            <motion.figure
                className={styles.lastPhoto}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
                <Image
                    src="/brand/i.jpg"
                    alt="A Tech Kidz Africa learner working at a laptop"
                    width={1080}
                    height={1080}
                    sizes="(max-width: 767px) calc(100vw - 40px), 580px"
                />
            </motion.figure>
            <LetsConnect.Responsive variants={ACADEMY_BLOG_RESPONSIVE} />
        </main>
    )
}
