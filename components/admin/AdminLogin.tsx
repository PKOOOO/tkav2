'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'

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
    const [visible, setVisible] = useState(false)

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
        <main className={styles.loginShell}>
            <section className={styles.loginStory}>
                <Link href="/" className={styles.brand}><Image src="/brand/logo-footer.png" alt="Tech Kidz Africa" width={224} height={56} priority className={styles.websiteLogo} /></Link>
                <div className={styles.loginStoryContent}>
                    <span className={styles.loginEyebrow}>BIG IDEAS. MEANINGFUL CONNECTIONS.</span>
                    <h2>A little insight.<br />A world of<br /><span>possibility.</span></h2>
                    <p>Get closer to your audience. Explore the visits, conversations, and questions behind your website.</p>
                    <div className={styles.loginArtwork} aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
                </div>
                <p className={styles.loginStoryFooter}>Building the next generation of creators.</p>
            </section>
            <section className={styles.loginPanel}>
                <Link className={styles.loginBack} href="/"><ArrowLeft size={15} aria-hidden />Back to website</Link>
                <div className={styles.loginCard}>
                    <span className={styles.loginLock}><LockKeyhole size={23} strokeWidth={1.6} aria-hidden /></span>
                    <p className={styles.eyebrow}>YOUR ADMIN WORKSPACE</p>
                    <h1 className={styles.loginTitle}>Welcome back.</h1>
                    <p className={styles.loginHint}>{notice ?? (configured ? 'Sign in to see how your community is growing.' : 'The admin workspace is not configured yet.')}</p>
                    {error && <p className={styles.error} role="alert">{error}</p>}
                    {configured && !notice && <form onSubmit={submit}>
                        <label className={styles.field} htmlFor="admin-password">Admin password</label>
                        <div className={styles.passwordField}><LockKeyhole size={16} aria-hidden /><input id="admin-password" type={visible ? 'text' : 'password'} name="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required /><button type="button" onClick={() => setVisible(current => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}</button></div>
                        <button className={styles.submit} type="submit" disabled={busy || !password}>{busy ? 'Signing you in…' : 'Enter workspace'}<ArrowRight size={17} aria-hidden /></button>
                    </form>}
                    <p className={styles.loginSecure}><ShieldCheck size={15} aria-hidden />A private space for the Tech Kidz Africa team.</p>
                </div>
                <p className={styles.loginPanelFooter}>Tech Kidz Africa <span>·</span> Made for curious minds.</p>
            </section>
        </main>
    )
}
