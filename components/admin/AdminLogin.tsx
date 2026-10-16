'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import styles from './admin.module.css'

/**
 * Password form for `/admin`.
 *
 * This component is **not** the access control -- it is the sign-in form. The
 * page only renders it when `isAdmin()` has already returned false on the
 * server, and every admin API route re-checks the session itself. That
 * separation is the whole point: the previous site's dashboard was gated by a
 * client component exactly like this one while its API routes stayed open.
 */
export default function AdminLogin({
    configured,
    notice,
}: {
    configured: boolean
    notice?: string
}) {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    async function submit(event: React.FormEvent) {
        event.preventDefault()
        setBusy(true)
        setError(null)

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })

            if (response.ok) {
                setPassword('')
                // The cookie is set by the response; re-render the server
                // component so it re-runs `isAdmin()` and swaps in the
                // dashboard. `refresh()` rather than a full reload keeps it
                // on the same history entry.
                router.refresh()
                return
            }

            setError('That password was not accepted.')
        } catch {
            setError('Could not reach the server. Check your connection.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className={styles.loginShell}>
            <div className={styles.loginCard}>
                <h1 className={styles.loginTitle}>Analytics</h1>
                <p className={styles.loginHint}>
                    {notice ??
                        (configured
                            ? 'Enter the admin password to view site analytics.'
                            : 'No admin password is configured on this deployment, so this dashboard cannot be opened.')}
                </p>

                {error && (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                {configured && !notice && (
                    <form onSubmit={submit}>
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Password</span>
                            <input
                                className={styles.input}
                                type="password"
                                name="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                autoFocus
                                required
                            />
                        </label>
                        <button className={styles.submit} type="submit" disabled={busy || !password}>
                            {busy ? 'Checking…' : 'Sign in'}
                        </button>
                    </form>
                )}

                <a className={styles.backLink} href="/">
                    ← Back to the site
                </a>
            </div>
        </div>
    )
}
