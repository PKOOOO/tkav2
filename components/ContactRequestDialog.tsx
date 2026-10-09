'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ADDITIONAL_PROGRAM_SLUGS } from '@/lib/additional-programs'
import { PROGRAM_OVERRIDES } from '@/lib/cms-overrides'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import styles from './ContactRequestDialog.module.css'

const FORM_ID = 'contact-request-framer-form'
const PROGRAMS = ['mathematics', 'science', 'english', 'coding', ...ADDITIONAL_PROGRAM_SLUGS]
    .map((slug) => PROGRAM_OVERRIDES[slug]?.fields?.Title)
    .filter((title): title is string => typeof title === 'string')
    .concat('Not sure yet')
const FIELD_NAMES = new Set(['Full Name', 'Email Address', 'Project Type', 'Message'])
const TOTAL_STEPS = 5

type Status = 'idle' | 'sending' | 'success' | 'error'

/** Keep Framer's submission handler, but let the shadcn dialog own the visible fields. */
export default function ContactRequestDialog() {
    const [content, setContent] = useState<HTMLElement | null>(null)
    const [sourceForm, setSourceForm] = useState<HTMLFormElement | null>(null)

    useLayoutEffect(() => {
        const root = document.querySelector<HTMLElement>('.unframer-page[data-route="/contact"]')
        if (!root) return

        const sync = () => {
            const form = root.querySelector<HTMLFormElement>('[data-framer-name="Right"] form')
            const mount = form?.parentElement ?? null
            setSourceForm((current) => current === form ? current : form)
            setContent((current) => current === mount ? current : mount)
        }
        sync()
        const observer = new MutationObserver(sync)
        observer.observe(root, { childList: true, subtree: true })
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!sourceForm) return
        const form = document.querySelector<HTMLFormElement>('.unframer-page[data-route="/contact"] [data-framer-name="Right"] form')
        if (!form) return
        const previousId = form.id
        const previousNoValidate = form.noValidate
        const previous = new Map<HTMLInputElement | HTMLTextAreaElement, { disabled: boolean; required: boolean }>()
        form.id = FORM_ID
        form.noValidate = true

        const disableOriginalFields = () => {
            form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((field) => {
                if (!FIELD_NAMES.has(field.name)) return
                if (!previous.has(field)) previous.set(field, { disabled: field.disabled, required: field.required })
                field.disabled = true
                field.required = false
            })
        }
        disableOriginalFields()
        const observer = new MutationObserver(disableOriginalFields)
        observer.observe(form, { childList: true, subtree: true })
        return () => {
            observer.disconnect()
            previous.forEach((value, field) => {
                field.disabled = value.disabled
                field.required = value.required
            })
            form.id = previousId
            form.noValidate = previousNoValidate
        }
    }, [sourceForm])

    return content && sourceForm && createPortal(
        <RequestDialog sourceForm={sourceForm} />,
        content,
    )
}

function RequestDialog({ sourceForm }: { sourceForm: HTMLFormElement }) {
    const [step, setStep] = useState(0)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [program, setProgram] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [status, setStatus] = useState<Status>('idle')
    const [open, setOpen] = useState(false)
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const firstField = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const sync = () => {
            const buttonText = sourceForm.querySelector('button[type="submit"]')?.textContent?.trim()
            if (buttonText?.includes('Message sent. Thank you!')) setStatus('success')
            else if (buttonText?.includes('Something went wrong')) setStatus('error')
        }
        const observer = new MutationObserver(sync)
        observer.observe(sourceForm, { childList: true, characterData: true, subtree: true })
        return () => observer.disconnect()
    }, [sourceForm])

    useEffect(() => {
        if (status !== 'sending') {
            if (timeout.current) clearTimeout(timeout.current)
            timeout.current = null
            return
        }
        timeout.current = setTimeout(() => setStatus('error'), 30000)
        return () => {
            if (timeout.current) clearTimeout(timeout.current)
            timeout.current = null
        }
    }, [status])

    useEffect(() => {
        if (!open || status === 'success') return
        const frame = requestAnimationFrame(() => firstField.current?.focus({ preventScroll: true }))
        return () => cancelAnimationFrame(frame)
    }, [open, step, status])

    function validate(index: number) {
        if (index === 0 && name.trim().length < 2) return 'Please enter your full name.'
        if (index === 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address.'
        if (index === 2 && !program) return 'Please choose a program.'
        return ''
    }

    function go(next: number) {
        setError('')
        setStep(next)
    }

    function next() {
        const problem = validate(step)
        if (problem) {
            setError(problem)
            return
        }
        go(step + 1)
    }

    function submit() {
        const firstInvalid = [0, 1, 2].find((index) => validate(index))
        if (firstInvalid !== undefined) {
            go(firstInvalid)
            setError(validate(firstInvalid))
            return
        }
        setError('')
        setStatus('sending')
        window.setTimeout(() => sourceForm.requestSubmit(), 250)
    }
    const fallbackHref = 'mailto:info@techkidzafrica.co.ke?subject=' + encodeURIComponent('Free session request')
        + '&body=' + encodeURIComponent('Name: ' + name.trim() + '\nEmail: ' + email.trim() + '\nProgram: ' + program + '\nAbout the learner: ' + (message.trim() || 'Not provided'))


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div className={styles.triggerWrap} data-contact-dialog-trigger>
                <p>Tell us about the learner and we’ll help find the right program and a free first session.</p>
                <DialogTrigger className={styles.trigger}>Start your request →</DialogTrigger>
            </div>
            <DialogContent className={styles.content}>
                <DialogHeader className={styles.header}>
                    <DialogTitle className={styles.title}>Book the free session</DialogTitle>
                </DialogHeader>
                {status === 'success' ? (
                    <div className={styles.success} role="status">
                        <span className={styles.successIcon} aria-hidden="true">✓</span>
                        <h3>Request sent!</h3>
                        <p>Thank you. We’ll get back to you about a free first session.</p>
                    </div>
                ) : (
                    <div className={styles.form}>
                        {/* The bar carries the progress visually; this stays for
                            screen readers, which get nothing from the bar alone. */}
                        <div className={styles.srOnly} aria-live="polite">Step {step + 1} of {TOTAL_STEPS}</div>
                        <div className={styles.progress} role="progressbar" aria-label="Contact request progress" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step + 1}>
                            <span style={{ width: ((step + 1) / TOTAL_STEPS * 100) + '%' }} />
                        </div>
                        <div className={styles.step} hidden={step !== 0}>
                            <label htmlFor="contact-request-name">Your name *</label>
                            <Input id="contact-request-name" ref={step === 0 ? firstField : undefined} form={FORM_ID} name="Full Name" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); next() } }} autoComplete="name" placeholder="Enter your full name" className={styles.input} maxLength={200} />
                        </div>
                        <div className={styles.step} hidden={step !== 1}>
                            <label htmlFor="contact-request-email">Email address *</label>
                            <Input id="contact-request-email" ref={step === 1 ? firstField : undefined} form={FORM_ID} name="Email Address" type="email" autoCapitalize="none" defaultValue={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); next() } }} autoComplete="email" placeholder="you@example.com" className={styles.input} maxLength={320} />
                        </div>
                        <fieldset className={styles.step} hidden={step !== 2}>
                            <legend>Which program interests you? *</legend>
                            <div className={styles.options}>
                                {PROGRAMS.map((choice) => (
                                    <label className={styles.option} key={choice}>
                                        <Input form={FORM_ID} type="radio" name="Project Type" value={choice} checked={program === choice} onChange={() => setProgram(choice)} />
                                        <span>{choice}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <div className={styles.step} hidden={step !== 3}>
                            <label htmlFor="contact-request-message">Tell us about the learner <small>(optional)</small></label>
                            <Textarea id="contact-request-message" form={FORM_ID} name="Message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Their age, interests, experience, or anything you'd like us to know" className={styles.textarea} maxLength={4000} />
                        </div>
                        {step === 4 && (
                            <div className={styles.review}>
                                <h3>Everything look right?</h3>
                                <dl>
                                    <div><dt>Name</dt><dd>{name.trim()}</dd><button type="button" onClick={() => go(0)}>Edit</button></div>
                                    <div><dt>Email</dt><dd>{email.trim()}</dd><button type="button" onClick={() => go(1)}>Edit</button></div>
                                    <div><dt>Program</dt><dd>{program}</dd><button type="button" onClick={() => go(2)}>Edit</button></div>
                                    <div><dt>About the learner</dt><dd>{message.trim() || 'Not provided'}</dd><button type="button" onClick={() => go(3)}>Edit</button></div>
                                </dl>
                            </div>
                        )}
                        <p className={styles.message} role={error || status === 'error' ? 'alert' : 'status'}>
                            {error || (status === 'error' ? 'We couldn’t send your request. You can email the same details instead.' : '')}
                        </p>
                        <div className={styles.navigation}>
                            {step > 0 && <button type="button" className={styles.back} disabled={status === 'sending'} onClick={() => go(step - 1)}>← Back</button>}
                            {step === 4
                                ? status === 'error'
                                    ? <a className={styles.primary} href={fallbackHref}>Email your request</a>
                                    : <button type="button" className={styles.primary} disabled={status === 'sending'} onClick={submit}>{status === 'sending' ? 'Sending…' : 'Send request'}</button>
                                : <button type="button" className={styles.primary} onClick={next}>{step === 3 ? 'Review request' : 'Continue →'}</button>}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
