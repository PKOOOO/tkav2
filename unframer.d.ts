declare module '*.jsx' {
    // The generated Framer modules are untyped by design.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component: any
    export default Component
    /**
     * Added by scripts/bind-cms.mjs. Assigns CMS values (keyed by Framer field
     * id) into the component's stubbed module-level bindings. Call immediately
     * before rendering the component.
     */
    export function __bindCmsFields(values: Record<string, unknown>): void
    export const __cmsFieldIds: string[]
}

declare module '*.css'
