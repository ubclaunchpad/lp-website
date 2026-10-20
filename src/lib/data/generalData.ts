import { Faq } from "@/components/general/faqSection";
import { NavBarItem } from "@/components/layouts/navbar";
import { Stat } from "@/components/general/statistics";
import { Project } from "@/components/general/projectSection";
import lunarisImage from "../../../public/images/projects/covers/lunaris.webp";
import threadsenseImage from "../../../public/images/projects/covers/threadsense.webp";
import neuronImage from "../../../public/images/projects/covers/neuron.webp";
import i18nilizeImage from "../../../public/images/projects/covers/i18nilize.webp";
import flowleafletsImage from "../../../public/images/projects/covers/flowleaflets.webp";
import forumaiImage from "../../../public/images/projects/covers/forumai.webp";

export const faqs: Faq[] = [
  {
    question: "How can I join the club?",
    answer:
      "Recruitment applications are open twice during the school year: the first during late August to mid-September, the second during mid-December until mid-January.",
  },
  {
    question: "What kind of roles does Launch Pad recruit for?",
    answer:
      "For project teams, we recruit developers and designers. For club operations, we recruit sponsorship coordinators, marketing coordinators, and engagement coordinators.",
  },
  {
    question: "What is the time commitment per week?",
    answer:
      "The time commitment varies a bit between different roles, but overall, expect to spend around 6 hours each week working on projects at Launch Pad!",
  },
  {
    question: "Can students from other majors (non-CS/engineering) join?",
    answer: "Most definitely! Launch Pad is open to all current UBC students.",
  },
  {
    question: "What roles are there in a team? How big will each team be?",
    answer:
      "Each project team has developers, designers, and one/two tech lead(s). Team sizes vary but are normally around 5-12 people. Designers conduct user research and implement best UX practices, while designing intuitive UI interfaces. Developers engage in system design and play a part in everything code-related, including front-end, back-end, databases, etc. Tech leads oversee and lead the project, handling project management while also providing mentorship to the rest of the team.",
  },
  {
    question: "Can I apply if I’ve already graduated?",
    answer:
      "Unfortunately, no. Launch Pad project teams are restricted to current UBC students (currently enrolled in a program). If you’re interested in being involved with Launch Pad after graduation, consider joining the mentorship or contacting the current admin team to see what can be done!",
  },
  {
    question:
      "I want to be a Tech Lead/Design Lead/Operations Lead but I’ve never been a part of Launch Pad. How can I apply?",
    answer:
      "We require our leads to have been with us for at least one semester. We believe this is crucial to guaranteeing that the individual knows the ins and outs of our club and for us to better select our future leads.",
  },
  {
    question: "What can I get out of being a Launch Pad member?",
    answer:
      "Work transferrable skills, projects to talk about in your resume and interviews, lasting friendships, and a fantastic alumni network - just to name a few!",
  },
  {
    question: "Do I have to reapply every year?",
    answer:
      "You will always be a member once you have joined, but to join a project you will have to apply again. Starting in 2024, being a previous member does not guarantee your placement on a team - however, you will be given priority in the recruitment process. This is to guarantee the overall quality of the teams.",
  },
];

export const navItems: NavBarItem[] = [
  {
    name: "About",
    url: "#about",
  },
  {
    name: "Projects",
    url: "#projects",
  },
  {
    name: "Be a Partner",
    url: "#partner",
  },
  // {
  //     name: "Our Team",
  //     url: "#team",
  // },
  {
    name: "FAQ",
    url: "#faq",
  },
  {
    name: "Contact",
    url: "#contact",
  },
];

export const footerLinks = [
  {
    section: "Quick Links",
    links: [
      {
        name: "Discord",
        url: "https://discord.gg/M74UgEZS8M",
      },
      {
        name: "Medium",
        url: "https://medium.com/ubc-launch-pad-software-engineering-blog",
      },
      {
        name: "Docs",
        url: "https://launchpadubc.notion.site/65c5e68a3b1b4d84bcb972f29db80b06?v=a59aebaa79c8408488ccf492b0e1991d&pvs=4",
      },
    ],
  },
  {
    section: "Contact Us",
    links: [
      {
        name: "General Inquiries",
        url: "mailto:strategy@ubclaunchpad.com",
      },
      {
        name: "Sponsorship Inquiries",
        url: "mailto:strategy@ubclaunchpad.com",
      },
    ],
  },
];

export const bottomFooterLinks = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/ubclaunchpad",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/ubclaunchpad",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/10054664",
  },
];

export const statsData: Stat[] = [
  { value: "500+", label: "Members" },
  { value: "50+", label: "Projects" },
  { value: "7+", label: "Majors" },
];

export const projects: Project[] = [
  {
    title: "Lunaris",
    description:
      "Lunaris is a cloud gaming service that runs games on AWS and streams them straight to the browser, aiming to make PC gaming more affordable and accessible through transparent pricing.",
    image: lunarisImage,
    alt: "Screenshot of the Lunaris game library",
    url: "https://launchpadubc.notion.site/Cloud-Gaming-Platform-2671e489d9208054aa09ecbc9b0c53d9",
  },
  {
    title: "ThreadSense",
    description:
      "ThreadSense is a browser plugin that makes Piazza easier to navigate, search and post on, using LLMs to augment answers, RAG-powered search over past posts and summaries of questions that have already been asked.",
    image: threadsenseImage,
    alt: "Screenshot of the ThreadSense plugin running on Piazza",
    url: "https://launchpadubc.notion.site/Piazza-AI-Plugin-2671e489d92080248ca5f59d60849282",
  },
  {
    title: "Neuron",
    description:
      "A volunteer management system for the BC Brain Wellness Program, with class scheduling, volunteer hour logging and automated shift matching. Built and deployed in 2024-25, then extended in 2025-26 to improve the admin and volunteer flows.",
    image: neuronImage,
    alt: "Screenshot of the Neuron volunteer management system",
    url: "https://launchpadubc.notion.site/Neuron-83d2c2b45c9848a7a4b66f2329373431",
  },
  {
    title: "i18nilize",
    description:
      "Small but mighty dev project empowering developers to seamlessly integrate internationalization and localization into microservice architectures. Featuring a central API for managing persistent data, it enables software to adapt effortlessly to multiple languages and cultural norms, making global development more accessible.",
    image: i18nilizeImage,
    alt: "Screenshot of the i18nilize project",
    url: "https://launchpadubc.notion.site/i18nilize-1d91e489d92080ea8703eb6668589c64",
  },
  {
    title: "Flowleaflets",
    description:
      "An application implementing LLM-powered transcription for handwritten notes in clinical logbooks for digital record keeping, developed in partnership with Flowleaflets, a non-profit",
    image: flowleafletsImage,
    alt: "Screenshot of the Flowleaflets clinical logging app",
    url: "https://launchpadubc.notion.site/Clinical-Logging-Software-1d91e489d92080778e8dc1569298d1be",
  },
  {
    title: "ForumAI",
    description:
      "ForumAI combines AI capabilities with structured academic forums, enabling students and faculty to collaborate in a controlled environment where AI assists learning while maintaining academic integrity.",
    image: forumaiImage,
    alt: "Screenshot of the ForumAI project",
    url: "https://launchpadubc.notion.site/Forum-32f0c1184540442589417ff156a4f331",
  },
];
