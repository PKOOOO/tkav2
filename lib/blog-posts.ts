export type BlogSection = {
    heading: string
    paragraphs: string[]
    points?: string[]
}

export type BlogPost = {
    slug: string
    title: string
    image: string
    detailImage?: string
    secondaryImage?: string
    summary: string
    minAge?: number
    maxAge?: number
    readMinutes: number
    topic: string
    sections: BlogSection[]
}

// The first entry is the dated 2026 bootcamp announcement. Other posts carry
// no implied publication date or author unless the article says otherwise.
export const blogPosts: BlogPost[] = [
    {
        slug: 'bootcamp',
        title: 'November Holiday Tech Bootcamp',
        image: '/brand/november.jpg',
        detailImage: '/brand/main-photo.jpg',
        secondaryImage: '/brand/small.jpg',
        summary: 'Enrollment is ongoing for the AI & Robotics Edition, 2–27 November 2026, for ages 4–18.',
        minAge: 4, maxAge: 18, readMinutes: 3, topic: 'AI & Robotics Edition',
        sections: [
            { heading: 'AI & Robotics Edition', paragraphs: ['The November Holiday Tech Bootcamp runs from 2 to 27 November 2026 for learners aged 4–18. Enrollment is ongoing.'] },
            { heading: 'What learners will explore', paragraphs: ['The bootcamp brings together creative coding, intelligent technology, design and hands-on making. Topics include:'], points: ['AI and machine learning', 'Animation and gamification', '3D design', 'Mobile and web development', 'Robotics and more'] },
            { heading: 'Join the November bootcamp', paragraphs: ['Get in touch with Tech Kidz Africa to ask about enrollment and find the right place for your learner.'] },
        ],
    },
    {
        slug: 'codeinnovators',
        title: 'Code Innovators Festival',
        image: '/brand/main.jpg',
        // Cropped to the slot's own 1.503 and resized from public/brand/robo.jpg
        // (4764x3875, 6.1MB) by hand -- the slot is `object-fit: cover`, so an
        // uncropped portrait source loses about 40% of its height to the crop.
        detailImage: '/hero/blog-codeinnovators.jpg',
        secondaryImage: '/brand/stud.jpg',
        summary: 'A celebration of coding, robotics and hands-on STEM projects by young innovators in Kenya.',
        readMinutes: 3, topic: 'Digital Literacy & Coding',
        sections: [
            { heading: 'Coding with a purpose', paragraphs: ['The Code Innovators Festival brings together young people exploring digital literacy, coding and robotics in Kenya. Co-organized by Code Innovators Academy alongside partners such as Tech Kidz Africa, it gives learners a place to share practical projects and ideas.'], points: ['Coding and digital literacy', 'Robotics and hands-on STEM', 'Mentorship and student project showcases'] },
            { heading: 'Code Innovators Festival', paragraphs: ['Alongside partners such as Tech Kidz Africa, the academy helps bring young creators together at the annual Code Innovators Festival. The 2026 edition took place at Khadija Comprehensive School in Mombasa under the theme “Innovate for Africa: Coding the Future with Purpose”. Learners shared ideas, built projects and met people working in technology education.'] },
            { heading: 'Growing the next generation of builders', paragraphs: ['Coding bootcamps, mentorship and project showcases give learners room to experiment and solve problems that matter to their communities. The initiative connects with education and technology stakeholders, including the Ministry of Education, Oracle Academy, the Communications Authority of Kenya and the Raspberry Pi Foundation, to support digital inclusion.'] },
        ],
    },
    {
        slug: 'how-a-web-project-becomes-a-mobile-app',
        title: 'How a Web Project Becomes a Mobile App',
        image: '/brand/se.jpg',
        summary: 'Follow a project from browser fundamentals through frameworks, APIs, React Native and deployment.',
        minAge: 11, maxAge: 18, readMinutes: 6, topic: 'Software Engineering',
        sections: [
            { heading: 'Make the first version work on the web', paragraphs: ['A small website is a good place to learn structure, styling and interaction. HTML, CSS and JavaScript make the result visible, while a framework such as React helps organise a larger interface into reusable pieces.'] },
            { heading: 'Give it a server', paragraphs: ['A Node.js API can store project data and let several users share the same experience. Learners discover why validation, error messages and clear routes matter when a browser needs to talk to a service.'] },
            { heading: 'Expand to mobile and deployment', paragraphs: ['React Native can reuse familiar component thinking for phone interfaces. Running the service then introduces practical DevOps ideas: containers, virtual machines, networking and a reliable deployment process.'], points: ['Build one complete user journey before adding more screens.', 'Test the API separately from the interface.', 'Document how to run and deploy the project.'] },
        ],
    },
    {
        slug: 'design-a-3d-object-then-print-it',
        title: 'Design a 3D Object, Then Print It',
        image: '/brand/3d.jpg',
        summary: 'Turn a sketched idea into a model that can be tested, refined and made physical.',
        minAge: 8, maxAge: 18, readMinutes: 4, topic: '3D Design & Printing',
        sections: [
            { heading: 'Start with a purpose', paragraphs: ['A good first model solves a small problem: a stand, a holder or a part for another project. Measuring the space it must fit helps learners think beyond what looks good on a screen.'] },
            { heading: 'Model, inspect, revise', paragraphs: ['In a 3D design tool, learners combine shapes, check dimensions and examine the object from every side. Before printing, they can ask whether walls are strong enough and whether moving parts have room to work.'], points: ['Sketch the object and note its key measurements.', 'Make a simple prototype before adding decoration.', 'Use the first print to find what needs changing.'] },
            { heading: 'Connect design to other tracks', paragraphs: ['A printed part can become a robot mount, a game prop or a classroom invention. The important habit is iteration: design, make, test and improve.'] },
        ],
    },
    {
        slug: 'online-safety-for-young-builders',
        title: 'Online Safety for Young Builders',
        image: '/brand/online.jpg',
        summary: 'Useful habits for protecting accounts, checking information and collaborating safely online.',
        minAge: 8, maxAge: 18, readMinutes: 5, topic: 'Online Safety',
        sections: [
            { heading: 'Protect the basics', paragraphs: ['Young makers use accounts to save code, share designs and work with others. Unique passwords, a trusted password manager and two-factor authentication where available make those projects harder to lose.'] },
            { heading: 'Pause before sharing', paragraphs: ['Screenshots, project descriptions and public profiles can reveal more than expected. Check names, locations, contact details and permissions before publishing a project or accepting an invitation.'], points: ['Ask a trusted adult before sharing personal information.', 'Check the destination of a link before opening it.', 'Report uncomfortable messages instead of replying to them.'] },
            { heading: 'Think critically', paragraphs: ['A convincing message or image is not automatically trustworthy. Comparing sources, asking who made a claim and looking for independent evidence are digital skills as valuable as learning to code.'] },
        ],
    },
    {
        slug: 'making-sense-of-ai-and-machine-learning',
        title: 'Making Sense of AI and Machine Learning',
        image: '/brand/ai.jpg',
        summary: 'Explore patterns, training data and responsible experimentation through approachable projects.',
        minAge: 11, maxAge: 18, readMinutes: 6, topic: 'AI & Machine Learning',
        sections: [
            { heading: 'Start with the pattern', paragraphs: ['A simple classifier can sort examples into groups. Learners can collect a small set of observations, decide which features matter and compare a model’s predictions with the real answer.'] },
            { heading: 'See the limits', paragraphs: ['The quality of a model depends on the examples used to train and test it. Missing or unbalanced data can lead to unreliable results, so a good project asks not only “does it work?” but “when does it fail?”'], points: ['Keep training and test examples separate.', 'Check errors, not just successful predictions.', 'Do not put private information into a public tool or dataset.'] },
            { heading: 'Use AI as a tool, not a shortcut', paragraphs: ['AI can help brainstorm or examine a draft, but learners still need to verify outputs and explain their own decisions. That makes the technology part of a thoughtful building process.'] },
        ],
    },
]

export function findBlogPost(slug: string) {
    return blogPosts.find((post) => post.slug === slug)
}
