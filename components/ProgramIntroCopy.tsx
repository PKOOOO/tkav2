'use client'

import { useEffect } from 'react'

const original = 'We rebuild confidence first, then speed. From number sense to calculus, every learner gets a plan built around their actual gaps not a generic worksheet pile.'
const updated = 'From a first Scratch animation to robotics, 3D printing, cybersecurity, networking and AI, learners build practical projects with guidance at every step.'

export default function ProgramIntroCopy() {
    useEffect(() => {
        const apply = () => {
            for (const paragraph of document.querySelectorAll('.local-program-listing p')) {
                if (paragraph.textContent === original) paragraph.textContent = updated
            }
        }
        apply()
        const observer = new MutationObserver(apply)
        observer.observe(document.body, { childList: true, subtree: true, characterData: true })
        return () => observer.disconnect()
    }, [])
    return null
}
