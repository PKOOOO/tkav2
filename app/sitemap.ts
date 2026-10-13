import type { MetadataRoute } from 'next'

import { blogPosts } from '@/lib/blog-posts'
import { legalPages, programHref, programs } from '@/lib/cms'
import { mentorProfiles, isTemplateMentor } from '@/lib/mentor-profiles'
import { absolute } from '@/lib/site'

/**
 * Every URL here comes from a build-time module -- `cms.json` is a snapshot and
 * the blog, team and course lists are literals -- so this needs no network and
 * cannot fail at request time. That is the one way it differs from the
 * sitemap on the currently deployed site, which queries Sanity.
 *
 * One kind of URL is deliberately absent: **programme alias slugs.**
 * `programRouteSlugs` keeps Framer's original CMS slugs (`mathematics`,
 * `science`, `english`, `coding`) working as aliases for the real course URLs,
 * and `generateStaticParams` builds both, so each course is reachable at two
 * paths. `programHref` resolves to the public one; the aliases stay out and
 * carry a canonical pointing here.
 *
 * A sitemap listing two URLs for one page is a direct instruction to Google to
 * treat them as separate, competing documents.
 *
 * `/programs` was a second entry of this kind until it became a 301 to
 * `/program` in `next.config.ts`; there is no page behind it now.
 */

const STATIC_PATHS = ['/', '/about', '/program', '/mentor', '/blogs', '/pricing', '/contact', '/gallery']

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date()

    const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
        url: absolute(path),
        lastModified,
        changeFrequency: 'weekly',
        priority: path === '/' ? 1 : 0.8,
    }))

    const programRoutes: MetadataRoute.Sitemap = programs.map((program) => ({
        url: absolute(programHref(program.slug)),
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.7,
    }))

    const mentorRoutes: MetadataRoute.Sitemap = mentorProfiles
        .filter((mentor) => !isTemplateMentor(mentor.slug))
        .map((mentor) => ({
            url: absolute(`/mentor/${mentor.slug}`),
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.5,
        }))

    const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
        url: absolute(`/blogs/${post.slug}`),
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.6,
    }))

    const legalRoutes: MetadataRoute.Sitemap = legalPages.map((page) => ({
        url: absolute(`/legal-pages/${page.slug}`),
        lastModified,
        changeFrequency: 'yearly',
        priority: 0.3,
    }))

    return [...staticRoutes, ...programRoutes, ...mentorRoutes, ...blogRoutes, ...legalRoutes]
}
