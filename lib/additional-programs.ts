import type { ProgramOverride } from './cms-overrides'

type Course = {
    slug: string
    title: string
    image: string
    info: string
    description: string
    tracks: [string, string, string, string, string][]
    faqs: [string, string][]
    mentor: NonNullable<Exclude<ProgramOverride['mentor'], string>>
}

const courses: Course[] = [
    {
        slug: '3d-design-and-printing',
        title: '3D Design and Printing',
        image: '3d.jpg',
        info: 'Turn an idea into a digital model, then a physical object. Explore shapes, measurements, CAD tools and the process of preparing a design for 3D printing.',
        description: 'Design useful objects, prototype them and improve them after testing. Learners connect creativity with accurate measurements, learning how a model on screen becomes something they can hold.',
        tracks: [
            ['Design foundations', 'Shapes, dimensions and scale', 'Sketching a useful object', 'Combining and subtracting shapes', 'Navigating a 3D workspace'],
            ['Digital modelling', 'Build models in Tinkercad', 'Alignment and grouping', 'Holes, joints and clearances', 'Exporting a printable model'],
            ['Printing workflow', 'Slicing a model', 'Layers, infill and supports', 'Material and print orientation', 'Safe printer operation'],
            ['Prototype & improve', 'Design a project enclosure', 'Measure and test the fit', 'Refine and reprint a design', 'Present the finished prototype'],
        ],
        faqs: [
            ['Do I need design experience?', 'No. We begin with simple shapes and guided models, then build towards a design of your own. More experienced learners can take on more detailed projects.'],
            ['Do I need my own 3D printer?', 'You can learn modelling on a computer without a printer. Speak with our team about printer access and materials before booking the printing part of the course.'],
            ['What will I make?', 'Projects can include keyrings, useful desk objects, small mechanisms or an enclosure for an electronics project. Your mentor helps choose a design that fits your level.'],
            ['How do you teach printer safety?', 'Learners practise safe handling, understand hot and moving parts, and prepare prints with mentor guidance. Printer use is supervised.'],
        ],
        mentor: {
            slug: 'najla-yusuf', name: 'Najla Yusuf', image: '/team/najla-yusuf.webp', role: 'Python & 3D Design Mentor',
            description: 'Najla helps learners move from an idea to a measured digital model, guiding them through creative modelling, prototyping and explaining their design decisions.',
            expertise: ['3D modelling', 'Tinkercad', 'Prototyping', '3D printing'],
        },
    },
    {
        slug: 'online-safety-and-cybersecurity',
        title: 'Online Safety and Cybersecurity',
        image: 'online.jpg',
        info: 'Build confident digital habits: protect accounts, recognise scams, manage privacy and understand how cybersecurity keeps people and devices safe.',
        description: 'Work through realistic online situations and safe practice activities. Learners learn to pause, check and respond, developing the judgment to protect their information and ask for help when something feels wrong.',
        tracks: [
            ['Digital wellbeing', 'Personal information and privacy', 'Digital footprints', 'Respectful online communication', 'Reporting and asking for help'],
            ['Account protection', 'Strong passwords and passphrases', 'Password managers', 'Multi-factor authentication', 'Updates and device locks'],
            ['Spot the threat', 'Phishing messages and fake links', 'Scams and impersonation', 'Safe downloads and permissions', 'Checking sources and websites'],
            ['Cybersecurity practice', 'How devices and networks connect', 'Backups and account recovery', 'Responding to a suspicious message', 'Create an online safety guide'],
        ],
        faqs: [
            ['Is this suitable for beginners?', 'Yes. We start with everyday account, device and privacy habits. Activities are adapted to the learner’s age and experience.'],
            ['Will learners practise hacking real accounts?', 'No. Technical exercises use supervised practice environments and fictional examples. Learners are taught permission, responsible behaviour and how to report concerns.'],
            ['Can families use what is taught?', 'Yes. Learners can build an account safety checklist and discuss privacy settings, reporting and recovery steps with their families.'],
            ['What happens if a learner encounters a real problem?', 'We encourage them to involve a trusted adult, preserve useful information and use the service’s reporting and recovery tools. The course develops practical awareness; it is not an incident response service.'],
        ],
        mentor: {
            slug: 'pius-khainja', name: 'Pius Khainja', image: '/team/pius-khainja.webp', role: 'ACTO & Lead Software Engineer',
            description: 'Pius connects account safety and privacy with practical knowledge of software, servers and networks, helping learners understand the reasons behind safer digital habits.',
            expertise: ['Online privacy', 'Account safety', 'Threat awareness', 'Safe practice labs'],
        },
    },
    {
        slug: 'computer-networking-and-hardware',
        title: 'Computer Networking and Hardware Concepts',
        image: 'net.jpg',
        info: 'Discover what is inside a computer and how devices communicate. Explore components, operating systems, local networks and practical troubleshooting.',
        description: 'Follow the journey from a computer’s physical parts to the network it joins. Learners identify components, set up simple connections and use a step-by-step process to diagnose common hardware and connectivity problems.',
        tracks: [
            ['Inside a computer', 'CPU, RAM and storage', 'Motherboards and power supplies', 'Ports, cables and peripherals', 'Safe handling of components'],
            ['Systems & maintenance', 'Operating system basics', 'Files, drivers and updates', 'Storage and backups', 'Diagnosing common PC problems'],
            ['Networking foundations', 'Routers, switches and access points', 'Ethernet and Wi-Fi', 'IP addresses, DNS and DHCP', 'Build a simple local network'],
            ['Connect & troubleshoot', 'Test connectivity with basic tools', 'Find a cable or Wi-Fi fault', 'Document a network layout', 'Plan and demonstrate a working setup'],
        ],
        faqs: [
            ['Do I need a technical background?', 'No. We begin by identifying familiar devices and their parts, then connect those ideas to operating systems and networks.'],
            ['Will learners open computers?', 'Where suitable equipment is available, learners identify and handle components under supervision. Powered equipment and hazardous repairs are kept outside beginner activities.'],
            ['What equipment do I need?', 'A laptop or desktop is useful for software activities. Our team will explain any additional components, cables or networking equipment needed for your session format.'],
            ['How does this connect to coding and robotics?', 'Networked applications and robots depend on computers, connections and reliable setup. These foundations help learners understand deployment, connected devices and troubleshooting.'],
        ],
        mentor: {
            slug: 'peter-lagat', name: 'Peter Lagat', image: '/team/peter-lagat.webp', role: 'CTO and Robotics Lead',
            description: 'Peter brings computer repair, networking and connected robotics into practical sessions, helping learners understand how hardware and software work together.',
            expertise: ['Computer hardware', 'Networking', 'Troubleshooting', 'Connected devices'],
        },
    },
    {
        slug: 'ai-and-machine-learning',
        title: 'AI and Machine Learning',
        image: 'ai.jpg',
        info: 'Explore how computers learn patterns from data. Build small AI projects, test their predictions and learn to question the results responsibly.',
        description: 'Start with approachable visual experiments, then progress to data and Python as confidence grows. Learners train and test simple models, explain where they fail and build a project that uses AI for a clear purpose.',
        tracks: [
            ['AI foundations', 'Patterns, rules and predictions', 'Examples of AI in everyday life', 'Training data and labels', 'Explore a visual model builder'],
            ['Train a model', 'Collect and organise examples', 'Image and sound classification', 'Training and testing data', 'Check predictions on new examples'],
            ['Data & Python', 'Python foundations for data', 'Clean and explore a small dataset', 'Classification and prediction', 'Compare results and mistakes'],
            ['Responsible AI projects', 'Bias, privacy and consent', 'Limits of generated answers', 'Connect a model to an app', 'Present a project and its limitations'],
        ],
        faqs: [
            ['Do I need Python before joining?', 'No. Beginners start with visual activities and model builders. Python is introduced when learners are ready to work with data and code.'],
            ['Is this only about using chatbots?', 'No. The course focuses on data, patterns, training and evaluation. Learners also explore how to check generated outputs and choose when an AI tool is useful.'],
            ['What kind of project can I build?', 'Examples include a simple image classifier, a sound recognition activity or a small prediction project. The project is chosen around your interests and experience.'],
            ['How are privacy and responsible use covered?', 'Activities use appropriate practice data. Learners discuss consent, bias, mistakes and why a model’s output needs checking before it is used to make decisions.'],
        ],
        mentor: {
            slug: 'pius-khainja', name: 'Pius Khainja', image: '/team/pius-khainja.webp', role: 'ACTO & Lead Software Engineer',
            description: 'Pius guides learners from AI experiments to working software projects, helping them test results, explain limitations and connect a model to an application.',
            expertise: ['AI foundations', 'Python & data', 'Model evaluation', 'Practical projects'],
        },
    },
]

export const ADDITIONAL_PROGRAM_SLUGS = courses.map(({ slug }) => slug)

export const ADDITIONAL_PROGRAM_OVERRIDES: Record<string, ProgramOverride> = Object.fromEntries(
    courses.map((course) => [course.slug, {
        fields: {
            Title: course.title,
            Info: course.info,
            Description: course.description,
            Thumbnail: `/brand/${course.image}`,
            Image: `/brand/${course.image}`,
            'Level Tag': 'Beginner to advanced',
            'Label 01': 'Project tracks', 'Value 01': '04',
            'Label 02': 'Session schedule', 'Value 02': 'Flexible',
            'Label 03': 'Learning pace', 'Value 03': 'Guided',
        },
        embeds: {
            ...Object.fromEntries(course.tracks.map(([subject, ...items], index) => [
                `Syllabus Part 0${index + 1}`,
                [{ topic: ['Foundations', 'Core', 'Advanced', 'Mastery'][index], subject,
                    ...Object.fromEntries(items.map((item, i) => [`listItem0${i + 1}`, item])), listItem05: '' }],
            ])),
            'Session Type 01': [{ title: 'Individual', description: 'Work with a mentor on projects matched to your experience, with time to ask questions, practise and refine your work.' }],
            'Session Type 02': [{ title: 'Small group', description: 'Build alongside other learners, share ideas and solve practical challenges with guidance from a mentor.' }],
            'Session Type 03': [{ title: 'Project workshops', description: 'Focused sessions for a school, club or team. Contact us to plan the topic, equipment and schedule for your group.' }],
            FAQs: [{
                ...Object.fromEntries(course.faqs.flatMap(([question, answer], index) => [
                    [`_0${index + 1}Question`, question], [`_0${index + 1}Answer`, answer],
                ])),
                _05Question: 'How do I choose a schedule?',
                _05Answer: 'Contact our team to discuss your level, preferred session format and availability. We will help plan a suitable starting point and schedule.',
            }],
        },
        mentor: course.mentor,
    }]),
)
