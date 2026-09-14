import type { ReactNode } from 'react'
import { theme } from '@/lib/cms'

/**
 * Fallback for a slug that is not in the CMS. Detail pages otherwise render the
 * real Framer components, so this is the only hand-built view left.
 */
export function NotFoundNotice({ what, backHref }: { what: string; backHref: string }) {
    return (
        <section style={{ width: '100%' }}>
            <div style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(48px, 7vw, 110px) 24px' }}>
                <h1
                    style={{
                        fontFamily: theme.display,
                        fontSize: 'clamp(30px, 5vw, 48px)',
                        color: theme.forest,
                        margin: 0,
                    }}
                >
                    {what} not found
                </h1>
                <p style={{ fontFamily: theme.body, color: theme.slate, marginTop: 14 }}>
                    That entry does not exist in the CMS.
                </p>
                <div style={{ marginTop: 26 }}>
                    <BackLink href={backHref}>Go back</BackLink>
                </div>
            </div>
        </section>
    )
}

function BackLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a
            href={href}
            style={{
                fontFamily: theme.body,
                fontSize: 15,
                color: theme.slate,
                textDecoration: 'none',
                borderBottom: `1px solid ${theme.slate}`,
                paddingBottom: 2,
            }}
        >
            {children}
        </a>
    )
}
