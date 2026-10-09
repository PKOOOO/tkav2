'use client'

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { FormBooleanInput } from 'unframer'
import { Input } from '@/components/ui/input'
import { registerBootcamp, type RegistrationState } from '@/app/contact/actions'
import { registrationFields, type RegistrationField } from '@/lib/registration-fields'
import styles from './ContactRegistrationForm.module.css'

export default function ContactRegistrationForm() {
    const form = useRef<HTMLFormElement>(null)
    const focusNext = useRef(false)
    const reducedMotion = useReducedMotion()
    const [step, setStep] = useState(0)
    const [direction, setDirection] = useState(1)
    const [summary, setSummary] = useState<FormData | null>(null)
    const [completed, setCompleted] = useState(false)
    const [editing, setEditing] = useState(false)
    const [version, setVersion] = useState(0)
    const reviewing = step === registrationFields.length
    const total = registrationFields.length + 1
    const [state, action, pending] = useActionState(async (previous: RegistrationState, data: FormData) => {
        const result = await registerBootcamp(previous, data)
        if (result.ok) {
            setVersion((value) => value + 1)
            setCompleted(true)
        }
        return result
    }, null)

    useEffect(() => {
        if (!focusNext.current) return
        focusNext.current = false
        const frame = requestAnimationFrame(() => {
            const panel = form.current?.querySelector<HTMLElement>(`[data-step="${step}"]`)
            panel?.querySelector<HTMLElement>('input, select, textarea, h3')?.focus({ preventScroll: true })
            panel?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' })
        })
        return () => cancelAnimationFrame(frame)
    }, [step, reducedMotion])

    function go(next: number) {
        setDirection(next > step ? 1 : -1)
        focusNext.current = true
        setStep(next)
    }

    function validate(index: number) {
        const inputs = form.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-step="${index}"] input, [data-step="${index}"] select, [data-step="${index}"] textarea`)
        for (const input of inputs ?? []) {
            input.setCustomValidity(input.required && input.type !== 'checkbox' && !input.value.trim() ? 'Please complete this field.' : input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value) ? 'Please enter a valid email address.' : '')
            if (!input.checkValidity()) {
                if (index === step) input.reportValidity()
                else go(index)
                return false
            }
        }
        return true
    }

    function next() {
        if (!validate(step)) return
        if (form.current) setSummary(new FormData(form.current))
        go(editing ? registrationFields.length : step + 1)
        setEditing(false)
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        if (!reviewing) {
            event.preventDefault()
            next()
        } else if (registrationFields.some((_, index) => !validate(index))) {
            event.preventDefault()
        }
    }

    return (
        <form key={version} ref={form} action={action} noValidate onSubmit={submit} onReset={(event) => event.preventDefault()}
            onKeyDown={(event) => {
                if (!reviewing && event.key === 'Enter' && event.target instanceof HTMLInputElement && event.target.type !== 'checkbox') {
                    event.preventDefault()
                    next()
                }
            }} className={styles.form}>
            <div className={styles.honeypot} aria-hidden='true'>
                <label>Website<input name='website' tabIndex={-1} autoComplete='off' /></label>
            </div>
            {completed ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : .22 }} className={styles.success} role='status'>
                    <span className={styles.successIcon} aria-hidden='true'>✓</span>
                    <h3>You’re registered!</h3>
                    <p>Thank you! Your bootcamp registration has been received.</p>
                    <button type='button' className={styles.button} onClick={() => { setCompleted(false); setSummary(null); go(0) }}>Register another child</button>
                </motion.div>
            ) : (
                <>
                    <div className={styles.progressHeader} aria-live='polite'>
                        <span>Step {step + 1} of {total}</span>
                    </div>
                    <div className={styles.progress} role='progressbar' aria-label='Registration progress' aria-valuemin={0} aria-valuemax={total} aria-valuenow={step + 1}>
                        <motion.div animate={{ scaleX: (step + 1) / total }} transition={{ duration: reducedMotion ? 0 : .3 }} />
                    </div>
                    <fieldset disabled={pending} className={styles.questions}>
                        <legend className={styles.srOnly}>November Holiday Bootcamp registration</legend>
                        {registrationFields.map((field, index) => (
                            <div key={field.name} hidden={index !== step} data-step={index} className={styles.step}>
                                <motion.div initial={false} animate={{ opacity: index === step ? 1 : 0, x: index === step || reducedMotion ? 0 : direction * 18 }} transition={{ duration: reducedMotion ? 0 : .22 }}>
                                    <Field field={field} />
                                </motion.div>
                            </div>
                        ))}
                        {reviewing && (
                            <motion.div data-step={step} initial={{ opacity: 0, x: reducedMotion ? 0 : 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .22 }} className={styles.step}>
                                <h3 tabIndex={-1} className={styles.reviewTitle}>Everything look right?</h3>
                                <p className={styles.reviewHint}>Check your details before sending.</p>
                                <dl className={styles.review}>
                                    {registrationFields.map((field, index) => (
                                        <div key={field.name}>
                                            <dt>{field.title}</dt>
                                            <dd>{summary?.getAll(field.name).map((value) => value === '__other_option__' ? summary.get(`${field.name}Other`) : value).filter(Boolean).join(', ') || 'Not provided'}</dd>
                                            <button type='button' className={styles.edit} aria-label={`Edit ${field.title}`} onClick={() => { setEditing(true); go(index) }}>Edit</button>
                                        </div>
                                    ))}
                                </dl>
                            </motion.div>
                        )}
                    </fieldset>
                    <div className={styles.navigation}>
                        {step > 0 && <button type='button' className={styles.back} disabled={pending} onClick={() => go(step - 1)}>← Back</button>}
                        {reviewing ? (
                            <button key='submit' type='submit' className={styles.button} disabled={pending}>{pending ? 'Sending...' : 'Register for the bootcamp'}</button>
                        ) : (
                            <button key='next' type='button' className={styles.button} onClick={next}>{editing ? 'Save changes' : step === registrationFields.length - 1 ? 'Review registration' : 'Continue →'}</button>
                        )}
                    </div>
                    <p role={state?.ok === false ? 'alert' : 'status'} aria-live='polite' className={styles.message}>
                        {state?.ok === false ? 'We couldn’t submit your registration. Please try again. Your answers are saved here.' : reviewing ? 'Your registration will be sent when you submit.' : registrationFields[step].required ? '' : 'Optional — you can skip this step'}
                    </p>
                </>
            )}
        </form>
    )
}

function Field({ field }: { field: RegistrationField }) {
    const [choice, setChoice] = useState('')
    const [ages, setAges] = useState<string[]>([])
    const title = `${field.title}${field.required ? ' *' : ''}`

    if (field.type === 'checkbox') return (
        <fieldset className={`${styles.field} ${styles.wide}`}>
            <legend>{title}</legend>
            <div className={styles.options}>
                {field.options?.map((option, index) => (
                    <label key={option} className={styles.option}>
                        <FormBooleanInput inputName={field.name} type='checkbox' defaultValue={option}
                            checked={ages.includes(option)} required={index === 0 && !ages.length}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAges((values) => event.target.checked ? [...values, option] : values.filter((value) => value !== option))} />
                        <span>{option}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    )

    return (
        <div className={`${styles.field} ${field.options || field.type === 'textarea' ? styles.wide : ''}`}>
            <label className={styles.field}>
                <span>{title}</span>
                {field.type === 'select' ? (
                    <select name={field.name} required={field.required} value={choice} onChange={(event) => setChoice(event.target.value)} className={styles.select}>
                        <option value=''>Select an option</option>
                        {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                        {field.other && <option value='__other_option__'>Other</option>}
                    </select>
                ) : field.type === 'textarea' ? (
                    <textarea name={field.name} required={field.required} placeholder='Optional'
                        maxLength={4000} className={styles.textarea} />
                ) : (
                    <Input name={field.name} type={field.type} required={field.required}
                        placeholder={field.required ? field.title : 'Optional'} maxLength={4000}
                        className={styles.input} />
                )}
            </label>
            {choice === '__other_option__' && (
                <label className={styles.field}>
                    <span>Please specify</span>
                    <Input name={`${field.name}Other`} type='text' required className={styles.input} maxLength={4000} />
                </label>
            )}
        </div>
    )
}
