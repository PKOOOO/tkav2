export type MentorContent = {
    subject: string
    role: string
    description: string
    skills: [string, string, string, string, string]
    sessions: [string, string][]
}

const roboticsFacilitator: MentorContent = {
    subject: 'Robotics & Creative Coding',
    role: 'Learning Facilitator',
    description: 'guides learners through hands-on robotics and web projects, using Arduino, Raspberry Pi Pico and ESP32 alongside Scratch and PictoBlox. Learners explore coding, sensors and control systems, then turn their ideas into working projects.',
    skills: ['Arduino projects', 'Raspberry Pi Pico & ESP32', 'Web development', 'Scratch', 'PictoBlox'],
    sessions: [
        ['Explore the project', 'Start with an idea for a robot, interactive story or web project. Identify the inputs, outputs and coding concepts needed to bring it to life.'],
        ['Build and program', 'Develop the project step by step using Scratch, PictoBlox or a microcontroller. Connect components, test small pieces of code and learn what each part does.'],
        ['Test and explain', 'Try the project, troubleshoot unexpected behaviour and make improvements. Finish by explaining how it works and choosing the next feature to explore.'],
    ],
}

export const MENTOR_CONTENT: Record<string, MentorContent> = {
    'najla-yusuf': {
        subject: 'Python & 3D Design', role: 'Python & 3D Design Mentor',
        description: 'helps learners turn ideas into Python programs and three-dimensional designs. Sessions connect programming fundamentals with creative design, encouraging learners to experiment, solve problems and explain their work.',
        skills: ['Python', 'Programming fundamentals', '3D design', 'Creative modelling', 'Project-based learning'],
        sessions: [
            ['Choose an idea', 'Discuss a small Python program or 3D model the learner wants to create, and break the idea into manageable steps.'],
            ['Code or model', 'Work through Python logic or a 3D design workflow, testing ideas and refining the result as the learner builds.'],
            ['Review and improve', 'Run the program or inspect the model, discuss design decisions and identify one useful improvement for the next session.'],
        ],
    },
    'clemence-kibet': {
        subject: 'Robotics & Digital Literacy', role: 'learning facilitator',
        description: 'introduces learners to Arduino robotics, Scratch and PictoBlox, connecting creative coding with embedded robotics. Alongside building and programming projects, learners develop digital literacy and confidence using everyday computer tools.',
        skills: ['Arduino robotics', 'Scratch', 'Marketing', 'Embedded robotics', 'Digital literacy'],
        sessions: [
            ['Discover how it works', 'Explore a robot or interactive project and identify its inputs, outputs and instructions. Practise the computer skills needed for the activity.'],
            ['Create and connect', 'Build an animation or program a robotics project with Scratch, PictoBlox or Arduino, connecting code to visible actions.'],
            ['Debug and share', 'Test the project, fix problems and demonstrate what it does. Reinforce safe, confident use of digital tools while saving and presenting the work.'],
        ],
    },
    'peter-lagat': {
        subject: 'Robotics & Technical Skills', role: 'Senior Robotics Mentor',
        description: 'guides learners through robotics projects using Arduino, Raspberry Pi Pico and ESP32, including connecting projects to web interfaces. His areas of guidance also include CCTV installation and computer repair, linking coding and electronics to practical technical work.',
        skills: ['Arduino robotics', 'Raspberry Pi Pico & ESP32', 'Web-connected projects', 'CCTV installation', 'Computer repair'],
        sessions: [
            ['Plan the system', 'Define what a robot or technical project should do. Identify the controller, components and connections, and discuss safe working practices.'],
            ['Build and troubleshoot', 'Assemble and program a microcontroller project, connect a web interface where appropriate, or work through a supervised installation or repair task.'],
            ['Test the whole solution', 'Check the system against its intended behaviour, diagnose faults and document the setup so the learner can explain and maintain it.'],
        ],
    },
    'pius-khainja': {
        subject: 'Software Engineering & DevOps', role: 'Senior Software Engineer',
        description: 'mentors learners in web development, React Native mobile apps and practical DevOps. Projects cover server deployment, Docker containers, virtual machines and networking, with opportunities to connect software to robotics systems.',
        skills: ['Web development', 'React Native mobile apps', 'Server deployment & Docker', 'Virtual machines & networking', 'Robotics projects'],
        sessions: [
            ['Design the solution', 'Choose a web, mobile or robotics-connected application. Map its features, data flow and deployment needs before starting implementation.'],
            ['Build and integrate', 'Develop a working feature, connect application components and practise relevant infrastructure skills such as containers, virtual machines or networking.'],
            ['Deploy and review', 'Test the result, review the code and deploy in a suitable development environment. Discuss troubleshooting, maintainability and the next iteration.'],
        ],
    },
    'avril-diamond': {
        subject: 'Web Development & DevOps', role: 'JSE & Learning Facilitator',
        description: 'supports learners building web and robotics projects while introducing practical DevOps skills. Her areas of guidance include server deployment, Docker containers, virtual machines and networking, helping learners connect their code to the systems that run it.',
        skills: ['Web development', 'Server deployment', 'Docker containers', 'Virtual machines & networking', 'Robotics projects'],
        sessions: [
            ['Set a clear goal', 'Choose a small web or robotics feature and prepare the development environment. Identify the tools and concepts the learner needs.'],
            ['Build with guidance', 'Implement the feature in small steps, test it and explore how servers, containers or networking support the project.'],
            ['Run and reflect', 'Run the project in a suitable environment, troubleshoot issues and record what the learner can improve or build next.'],
        ],
    },
    'diana-wamboi': {
        subject: 'Social Media & Project Storytelling', role: 'Social Media Manager',
        description: 'helps learners communicate the story behind their projects through content creation, social media and marketing. She guides students in documenting their progress, presenting their ideas clearly and sharing project milestones responsibly.',
        skills: ['Social media', 'Content creation', 'Digital marketing', 'Project documentation', 'Student storytelling'],
        sessions: [
            ['Find the story', 'Identify the project goal, audience and message. Decide which parts of the learning journey are useful to document.'],
            ['Create the content', 'Develop a caption, visual or short project update that explains the work clearly. Practise thoughtful marketing and responsible sharing.'],
            ['Review and present', 'Refine the content, check accuracy and permissions, and prepare a project presentation or documentation plan without publishing automatically.'],
        ],
    },
    'justin-njuguna': {
        subject: 'Creative Media & Technology', role: 'Comms & Graphics',
        description: 'guides learners in photography, graphic design, web development and networking. Sessions combine creative communication with practical technology skills, helping learners capture, design and present their projects effectively.',
        skills: ['Photography', 'Graphic design', 'Web development', 'Networking', 'Visual project presentation'],
        sessions: [
            ['Plan the outcome', 'Choose a photo story, graphic, web page or networking activity. Clarify the audience, purpose and technical requirements.'],
            ['Create and connect', 'Practise composition and design, build a web page or explore network connections through a guided practical activity.'],
            ['Refine and explain', 'Review the result for clarity and functionality, make improvements and explain the creative or technical decisions behind it.'],
        ],
    },
    'brian-bii': {
        subject: 'Strategy, Marketing & Partnerships', role: 'Code Innovators Lead',
        description: 'leads Code Innovators Africa and supports strategic marketing and partnerships. He helps learners connect innovative ideas to an audience, communicate their value and think through the collaborations that can support their projects.',
        skills: ['Strategic marketing', 'Partnerships', 'Code Innovators Africa', 'Project positioning', 'Pitch development'],
        sessions: [
            ['Understand the opportunity', 'Explore the problem a project addresses, who it serves and what makes the idea useful. Identify a clear audience and goal.'],
            ['Shape the strategy', 'Develop a marketing message and consider relevant partnerships. Connect the project idea to practical ways of reaching and supporting its audience.'],
            ['Present the next steps', 'Refine a short project pitch, gather feedback and outline a realistic plan for further development or collaboration.'],
        ],
    },
    'mimah-charo': roboticsFacilitator,
    'hussein-mohammed': roboticsFacilitator,
    'mohammed': roboticsFacilitator,
    'monica-akinyi': roboticsFacilitator,
}
