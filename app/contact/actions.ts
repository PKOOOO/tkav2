'use server'

import { registrationFields } from '@/lib/registration-fields'

export type RegistrationState = { ok: boolean } | null

export async function registerBootcamp(_previous: RegistrationState, data: FormData): Promise<{ ok: boolean }> {
    if (data.get('website')) return { ok: true }

    const body = new URLSearchParams()
    for (const field of registrationFields) {
        const raw = data.getAll(field.name)
        if (raw.some((value) => typeof value !== 'string')) return { ok: false }
        const values = (raw as string[]).map((value) => value.trim()).filter(Boolean)
        if (field.required && !values.length) return { ok: false }
        if (field.type !== 'checkbox' && values.length > 1) return { ok: false }
        if (field.type === 'email' && values.some((value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) return { ok: false }

        for (const value of values) {
            if (field.options && !field.options.includes(value)) {
                const other = data.get(`${field.name}Other`)
                if (!field.other || value !== '__other_option__' || typeof other !== 'string' || !other.trim()) return { ok: false }
                body.append(`entry.${field.entry}.other_option_response`, other.trim())
            }
            body.append(`entry.${field.entry}`, value)
        }
        if (!values.length) body.append(`entry.${field.entry}`, 'NA')
    }
    body.append('pageHistory', '0,1,2')

    const url = process.env.GOOGLE_FORM_URL
    if (!url) return { ok: false }
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
            cache: 'no-store',
            signal: AbortSignal.timeout(15000),
        })
        const html = await response.text()
        // This form has a custom confirmation; its receipt includes "Submit another response".
        // A 200 alone can also contain a validation error or a closed-form page.
        return { ok: response.ok && /Your response has been recorded\.|Submit another response/i.test(html) }
    } catch (error) {
        console.error('Bootcamp submission failed:', error instanceof Error ? error.message : 'Unknown error')
        return { ok: false }
    }
}
