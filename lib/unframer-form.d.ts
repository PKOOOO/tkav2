import type { ComponentType, ChangeEvent } from 'react'
import 'unframer'

// These runtime exports are used by the generated form but omitted from Unframer's types.
declare module 'unframer' {
    export const FormPlainTextInput: ComponentType<{
        inputName: string
        type: 'text' | 'tel' | 'email' | 'textarea'
        required?: boolean
        placeholder?: string
        maxLength?: number
        className?: string
    }>
    export const FormBooleanInput: ComponentType<{
        inputName: string
        type: 'checkbox'
        defaultValue: string
        checked: boolean
        required?: boolean
        onChange: (event: ChangeEvent<HTMLInputElement>) => void
    }>
}
