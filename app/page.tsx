import type { Metadata } from 'next'
import Home from '@/components/routes/Home'
import { pageMetadata } from '@/lib/seo'
import { SITE_NAME } from '@/lib/site'

const TITLE = 'Coding, Robotics & Digital Skills for Kids in Mombasa'

/**
 * `title.absolute` opts the home page out of the root layout's
 * `%s | Tech Kidz Africa` template, which would otherwise render the site name
 * twice -- the default title already carries it.
 */
export const metadata: Metadata = {
    ...pageMetadata({
        title: TITLE,
        description:
            'Tech Kidz Africa teaches children and youth aged 4–19 coding, robotics, 3D design, digital literacy and AI through hands-on projects in Nyali, Mombasa.',
        path: '/',
    }),
    title: { absolute: `${SITE_NAME} | ${TITLE}` },
}

export default function Page() {
    return <Home />
}
