import { cookies } from 'next/headers'

/**
 * Session handling for `/admin`.
 *
 * ## What went wrong last time
 *
 * The site this replaces gated its admin dashboard in a `"use client"` layout
 * that checked a Sanity session. That hid the *interface*. The routes behind
 * it -- `/api/admin/analytics`, `/api/admin/insights` -- were plain
 * `export async function GET()` with no check at all, so the data, including
 * visitor chat transcripts, was readable by anyone who knew the URL. It still
 * is on that deployment.
 *
 * So the rule here: **the only thing that grants access is `requireAdmin()`,
 * called on the server, inside the handler or page that serves the data.** A
 * layout is decoration. Middleware is a convenience. Neither is the boundary.
 *
 * ## Why there is no session table and no extra secret
 *
 * One operator, so a shared password is proportionate. The cookie is
 * `<expiry>.<hmac>`: self-contained, so there is nothing to store and nothing
 * to clean up, and unforgeable without the key.
 *
 * The signing key is derived from `ADMIN_PASSWORD` rather than being its own
 * env var -- one less secret to copy into Vercel, and it gives a useful
 * property for free: changing the password invalidates every session already
 * issued, because the key that signed them no longer exists.
 */

const COOKIE = 'tka_admin'
const SESSION_HOURS = 12
const KEY_LABEL = 'tka-admin-session-v1'

const encoder = new TextEncoder()

function password(): string {
    const value = process.env.ADMIN_PASSWORD
    if (!value) throw new Error('ADMIN_PASSWORD is not set')
    return value
}

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD)

async function hmac(keyMaterial: string, message: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(keyMaterial),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

/** Derived once per call; cheap, and avoids holding key material in a module. */
const signingKey = () => hmac(password(), KEY_LABEL)

/**
 * Constant-time-enough comparison: both sides are compared as fixed-length
 * hex digests of the same size, so the loop below always runs the same number
 * of iterations and accumulates rather than returning early. A plain `===` on
 * the raw password would leak its length and a prefix through timing.
 */
function sameDigest(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return diff === 0
}

export async function checkPassword(candidate: unknown): Promise<boolean> {
    if (typeof candidate !== 'string' || !candidate) return false
    // Hash both sides before comparing so the comparison is over equal-length
    // digests regardless of what was submitted.
    const [given, expected] = await Promise.all([
        hmac(KEY_LABEL, candidate),
        hmac(KEY_LABEL, password()),
    ])
    return sameDigest(given, expected)
}

export async function issueSession(): Promise<void> {
    const expiry = Date.now() + SESSION_HOURS * 60 * 60 * 1000
    const signature = await hmac(await signingKey(), String(expiry))
    const store = await cookies()
    store.set(COOKIE, `${expiry}.${signature}`, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_HOURS * 60 * 60,
    })
}

export async function clearSession(): Promise<void> {
    const store = await cookies()
    store.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

/** True when the request carries a valid, unexpired admin cookie. */
export async function isAdmin(): Promise<boolean> {
    if (!adminConfigured()) return false

    const store = await cookies()
    const raw = store.get(COOKIE)?.value
    if (!raw) return false

    const separator = raw.lastIndexOf('.')
    if (separator <= 0) return false

    const expiry = Number(raw.slice(0, separator))
    const signature = raw.slice(separator + 1)
    if (!Number.isFinite(expiry)) return false

    // Verify before trusting the expiry: the timestamp is inside the signed
    // payload, so an unsigned cookie could otherwise claim any expiry it liked.
    const expected = await hmac(await signingKey(), String(expiry))
    if (!sameDigest(signature, expected)) return false

    return expiry > Date.now()
}

/**
 * Guard for admin route handlers. Returns a 401 `Response` to return directly,
 * or `null` when the caller may proceed.
 *
 *     const denied = await requireAdmin()
 *     if (denied) return denied
 */
export async function requireAdmin(): Promise<Response | null> {
    if (await isAdmin()) return null
    return Response.json({ error: 'unauthorized' }, { status: 401 })
}
