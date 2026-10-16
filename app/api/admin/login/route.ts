import { adminConfigured, checkPassword, clearSession, issueSession } from '@/lib/admin-auth'

/**
 * Exchange the admin password for a signed session cookie.
 *
 * The 400ms floor on a failure is deliberate. The password is the only thing
 * standing in front of the dashboard, and without a delay this endpoint will
 * answer as fast as the network allows -- enough to try a very large number of
 * guesses. It is not a substitute for a strong password, it just makes online
 * guessing unattractive, and it is applied to failures only so a correct login
 * stays immediate.
 *
 * The response never distinguishes "no password configured" from "wrong
 * password" in its body; both are a flat 401.
 */
export async function POST(request: Request) {
    if (!adminConfigured()) {
        return Response.json({ error: 'unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'unauthorized' }, { status: 401 })
    }

    const ok = await checkPassword((body as { password?: unknown })?.password)

    if (!ok) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        return Response.json({ error: 'unauthorized' }, { status: 401 })
    }

    await issueSession()
    return Response.json({ ok: true })
}

/** Sign out. */
export async function DELETE() {
    await clearSession()
    return Response.json({ ok: true })
}
