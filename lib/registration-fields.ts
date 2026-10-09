// Verified against the Google Form's FB_PUBLIC_LOAD_DATA_ on 2026-10-06.
export type RegistrationField = {
    name: string
    entry: string
    title: string
    type: 'text' | 'tel' | 'email' | 'textarea' | 'select' | 'checkbox'
    required: boolean
    options?: string[]
    other?: boolean
}

export const registrationFields: RegistrationField[] = [
    { name: 'childName', entry: '717986979', title: 'Name of Child', type: 'text', required: true },
    { name: 'parentName', entry: '1259142731', title: 'Name of Parent/ Guardian', type: 'text', required: true },
    { name: 'phone', entry: '1744173299', title: 'Parent/ Guardian Phone Number', type: 'tel', required: true },
    { name: 'email', entry: '318237775', title: 'Parent/ Guardian Email Address', type: 'email', required: true },
    { name: 'secondaryPhone', entry: '844474941', title: 'Secondary Contact Phone Number', type: 'tel', required: true },
    { name: 'location', entry: '683206734', title: 'Location', type: 'select', required: true, options: ['Mombasa', 'Nairobi'] },
    { name: 'attendance', entry: '1862712428', title: 'How would you prefer your child to attend the sessions?', type: 'select', required: true, options: ['Virtual/ Online', 'In-person (Hub)'] },
    { name: 'ages', entry: '851629800', title: 'Age (Tick depending on number of children you are planning to enroll)', type: 'checkbox', required: true, options: [...Array.from({ length: 15 }, (_, i) => `${i + 4} Years`), 'Above 18'] },
    { name: 'source', entry: '1771222858', title: 'How did you hear about the Tech Kidz Africa November Bootcamp?', type: 'select', required: true, options: ['Radio', 'Television', 'Social Media Platforms e.g. WhatsApp, Instagram, Facebook, LinkedIn, X etc.', 'Friend Referral', 'Tech Kidz Africa Website'], other: true },
    { name: 'experience', entry: '800672438', title: 'Does your child have any prior experience in the chosen program(s)?', type: 'select', required: true, options: ['Yes', 'No', 'Maybe'], other: true },
    { name: 'learningNeeds', entry: '993926174', title: 'Does your child have any learning needs or accessibility requirements we should be aware of?', type: 'textarea', required: false },
    { name: 'notes', entry: '80410398', title: "Is there anything else you'd like to tell us about your child's interest in this program?", type: 'textarea', required: false },
]
