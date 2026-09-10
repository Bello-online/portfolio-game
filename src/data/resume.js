// =====================================================================
//  RESUME DATA — the only file you need to edit to change what the game
//  says. Every planet on the campaign map is one entry in `planets`, and
//  every objective (terminal) on a planet is one entry in `objectives`.
//
//  Block shapes supported inside an objective's `blocks`:
//    { h: 'Heading', sub: 'Subtitle', meta: '2022 – now', p: 'Paragraph',
//      bullets: ['...'], tags: ['React', 'Three.js'], links: [{ label, href }] }
//  Every field is optional — use whichever ones fit.
//
//  `biome` picks the planet's look: ice · ash · dust · crystal · jungle · moon
//  `code` (optional) is the arrow sequence for the terminal, e.g. 'UDRL'.
//  If omitted, one is generated deterministically.
// =====================================================================

const GITHUB = 'https://github.com/Bello-online';
const LINKEDIN = 'https://linkedin.com/in/bello-olaseni-17002a251';
const EMAIL = 'olasenibello38@gmail.com';

export const profile = {
  name: 'Olaseni Bello',
  title: 'Full-Stack Software Developer',
  tagline: 'I take ambiguous problems from idea to production.',
  callsign: 'OB-01',
  location: 'Greater Toronto Area, Ontario',
  // Armour colours (hex)
  armor: 0x3a3d45,
  armorDark: 0x1e2026,
  accent: 0xffd400,
  visor: 0xffe680,
  skin: 0x8d5524,
};

export const campaign = {
  title: 'PORTFOLIO CAMPAIGN',
  vessel: 'Deployment vessel · CI-01 "Continuous Integration"',
  brief:
    'Six planets, each holding one chapter of my résumé. Deploy to a planet, reach its intel terminals, enter the access codes and read the intel. Extract to liberate the planet and return to the map.',
};

export const planets = [
  {
    id: 'about',
    name: 'Origin',
    designation: 'ABOUT ME',
    sector: 'Candidate sector · Planet 1 of 6',
    biome: 'ice',
    brief: 'Personnel profile and background. Two intel terminals.',
    objectives: [
      {
        label: 'Personnel profile',
        blocks: [
          {
            h: 'Who I am',
            p: 'I’m Olaseni Bello, a full-stack software developer based in the Greater Toronto Area. I currently work at Bell Canada, where I design, build and maintain production web applications that serve internal teams and customer-facing platforms across the organization. Outside of work I keep a shipping-focused portfolio that spans fintech, marketplaces, security tooling and small-business web.',
          },
          {
            h: 'How I build',
            p: 'I work end to end. On the front end that means React and TypeScript with reusable component libraries and design tokens; on the back end it means Node.js and .NET/C# services, REST API design, and data layers on PostgreSQL (Supabase), SQL Server and MongoDB. I integrate the services real products need — Stripe payments, Twilio SMS, Google Maps — and I ship with automated tests, CI/CD pipelines and GitOps practices so releases stay dependable as the codebase grows.',
          },
          {
            h: 'AI-assisted development',
            p: 'I’m a daily practitioner of AI-assisted and agentic development. Claude Code, Cursor and GitHub Copilot are part of how I implement features, generate tests, debug production issues and accelerate code review — always paired with my own review, because speed only counts when quality and security hold up.',
          },
        ],
      },
      {
        label: 'Quick facts',
        blocks: [
          {
            h: 'At a glance',
            bullets: [
              'Based in the Greater Toronto Area (GTA), Ontario, Canada',
              'Software Developer at Bell Canada since May 2024 — permanent, full-time, hybrid out of Mississauga',
              'Full-stack developer on FinanceCanada, a financial-literacy platform built with a full product team, since 2023',
              'Certified in GitOps Fundamentals (GitOps with Argo) and Microsoft Azure Fundamentals (AZ-900)',
              'Advanced Diploma in Computer Systems Technology — Software Development, Mohawk College',
            ],
          },
          {
            h: 'What people can count on',
            bullets: [
              'Accessible, well-documented code that other teams can pick up and extend without a hand-off meeting',
              'Honest communication about scope, risk and timelines',
              'Taking ambiguous problems from a rough idea all the way to production, and iterating with real users afterwards',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'experience',
    name: 'Meridian',
    designation: 'EXPERIENCE',
    sector: 'Candidate sector · Planet 2 of 6',
    biome: 'ash',
    brief: 'Professional experience. Three intel terminals, one per role.',
    objectives: [
      {
        label: 'Bell Canada',
        blocks: [
          {
            h: 'Software Developer',
            sub: 'Bell Canada · Mississauga, ON · Permanent full-time, hybrid',
            meta: 'May 2024 – Present',
            p: 'I design, develop and maintain production web applications with React, TypeScript and Node.js that serve internal teams and customer-facing platforms across the organization. The work spans the whole stack — from shared UI components that multiple products depend on, down to .NET services and SQL Server data layers.',
            bullets: [
              'Build reusable front-end components consumed across multiple internal web platforms, integrate them with REST APIs, and document the patterns so distributed teams can adopt them independently.',
              'Develop and support .NET / C# backend services with SQL Server data layers — API design, performance tuning, and production debugging from logs and traces.',
              'Write automated test suites with Jest and React Testing Library, and take part in rigorous code reviews to keep releases dependable as shared components evolve.',
              'Ship through CI/CD pipelines with Docker to cloud infrastructure, applying GitOps practices.',
              'Use AI-assisted tooling daily to accelerate delivery without compromising quality or security.',
            ],
            tags: ['React', 'TypeScript', 'Node.js', '.NET / C#', 'SQL Server', 'REST APIs', 'Jest', 'React Testing Library', 'Docker', 'CI/CD', 'GitOps'],
          },
        ],
      },
      {
        label: 'FinanceCanada',
        blocks: [
          {
            h: 'Full-Stack Developer',
            sub: 'FinanceCanada · financial-literacy platform · full product team',
            meta: '2023 – Present',
            p: 'FinanceCanada is a financial-literacy platform developed with a full product team. I own features end to end — from requirements, through implementation and testing, to deployment and iteration with real users — and I help keep a distributed team shipping consistent, production-quality UI.',
            bullets: [
              'Develop the React / TypeScript front end and the Node.js REST API backend.',
              'Maintain a shared component library and design tokens so everyone on the team ships the same UI to production.',
              'Collaborate across time zones through Git-based workflows with pull-request review and clear written documentation.',
            ],
            tags: ['React', 'TypeScript', 'Node.js', 'REST API', 'Component library', 'Design tokens', 'GitHub'],
          },
        ],
      },
      {
        label: 'Ontario Public Service',
        blocks: [
          {
            h: 'Junior Programmer (Co-op)',
            sub: 'Ministry of the Solicitor General · Ontario Public Service · Hamilton, ON · On-site',
            meta: 'Jan – Aug 2023',
            p: 'An eight-month co-op placement inside a government ministry, where quality and communication standards are strict and every change has to be documented well enough to hand over.',
            bullets: [
              'Developed and maintained internal applications and data-handling workflows, including JSON processing and related tooling.',
              'Worked directly with stakeholders to gather requirements, deliver iterations, and document solutions for handover.',
            ],
            tags: ['JavaScript', 'JSON processing', 'Internal tooling', 'Requirements gathering', 'Documentation'],
          },
        ],
      },
    ],
  },
  {
    id: 'projects',
    name: 'Forge',
    designation: 'PROJECTS',
    sector: 'Candidate sector · Planet 3 of 6',
    biome: 'dust',
    brief: 'Shipped projects. Four intel terminals.',
    objectives: [
      {
        label: 'Wealth Folios',
        blocks: [
          {
            h: 'Wealth Folios',
            sub: 'Investment portfolio tracker',
            p: 'Wealth Folios is a portfolio-analysis tool for Wealthsimple users. It imports the activity CSV exports Wealthsimple provides, parses trade and account activity, and matches buy and sell transactions into FIFO lots so gains and losses are calculated the way a broker would.',
            bullets: [
              'Open and sold position tracking, portfolio allocation, and profit/loss views rendered with Recharts.',
              'Historical “what if I had exited on this date” simulations, powered by a Supabase Edge Function that serves historical prices.',
              'The parsing and lot-matching logic — the part that has to be right — is covered by a Vitest unit-test suite.',
              'Built with React 18, TypeScript and Vite, styled with Tailwind CSS, shadcn/ui and Radix UI, on Supabase (Postgres + Edge Functions).',
            ],
            tags: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn/ui', 'Radix UI', 'Recharts', 'Supabase', 'Edge Functions', 'Vitest'],
            links: [{ label: 'GitHub', href: GITHUB }],
          },
        ],
      },
      {
        label: 'QuickLyft',
        blocks: [
          {
            h: 'QuickLyft',
            sub: 'Moving-services marketplace (MVP)',
            p: 'QuickLyft is a three-sided marketplace for moving services: a Customer app, a Contractor app and an Admin dashboard, all sharing a single booking → dispatch → completion → payment flow. I designed and built it as an MVP, from data model to deployment.',
            bullets: [
              'Stripe handles payments, Twilio sends SMS notifications, and the Google Maps API provides routing and location.',
              'Supabase supplies Postgres, Auth, Storage and Realtime; the API is Node.js with Express.',
              'Delivery was structured in phased milestones (A through G) tracked through GitHub issues, so scope stayed visible as the product grew.',
              'The pricing engine and business rules are unit-tested on the backend.',
            ],
            tags: ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'Supabase', 'Postgres', 'Auth', 'Realtime', 'Stripe', 'Twilio', 'Google Maps API'],
            links: [{ label: 'GitHub', href: GITHUB }],
          },
        ],
      },
      {
        label: 'Anti-Phishing Plugin',
        blocks: [
          {
            h: 'Anti-Phishing Browser Plugin',
            sub: 'Security tooling · client/server architecture',
            p: 'A browser extension with a companion server that helps users detect and avoid phishing websites. It is a security-conscious project that pairs client-side detection UX — warning the user in the moment — with server-side checks that don’t have to live inside the extension.',
            bullets: [
              'Extension UI written in Svelte and JavaScript.',
              'Companion server in Node.js handles the heavier checks and keeps detection logic updatable without shipping a new extension build.',
            ],
            tags: ['Svelte', 'JavaScript', 'Node.js', 'Browser extension', 'Security'],
            links: [{ label: 'GitHub', href: GITHUB }],
          },
        ],
      },
      {
        label: 'Field reports',
        blocks: [
          {
            h: 'MapApp',
            sub: 'Web mapping application',
            p: 'A web mapping app that integrates browser geolocation, address geocoding and live GPS tracking in a single map interface — built in plain JavaScript, HTML and CSS against the Geolocation, Geocoding and GPS APIs.',
            tags: ['JavaScript', 'HTML/CSS', 'Geolocation API', 'Geocoding', 'GPS'],
          },
          {
            h: 'SSD Employers',
            sub: 'Employer management system',
            p: 'An employer management system developed in C# and .NET, covering CRUD workflows and structured data management for employer records.',
            tags: ['C#', '.NET'],
          },
          {
            h: 'Also shipped',
            bullets: [
              'Fit-Path and Streak-Fit-Track — fitness-tracking web apps written in TypeScript.',
              'DoLittle — a self-built URL shortener in Node.js and EJS.',
              'MovieTracker — a movie-tracking web app; The Waitlist App — a waitlist-management implementation in TypeScript.',
              'Freelance small-business marketing sites in TypeScript/React: Apex Roofing, Greenscape Dream and Precision Pixel Shop.',
              'Shopify Engineering Intern Challenge — completed the Braille translation coding challenge in Python.',
            ],
            links: [{ label: 'All repos on GitHub', href: GITHUB }],
          },
        ],
      },
    ],
  },
  {
    id: 'skills',
    name: 'Arsenal',
    designation: 'SKILLS',
    sector: 'Candidate sector · Planet 4 of 6',
    biome: 'crystal',
    brief: 'Technical skills. Three intel terminals.',
    objectives: [
      {
        label: 'Languages & front end',
        blocks: [
          {
            h: 'Languages',
            p: 'TypeScript and modern JavaScript (ES6+) are my daily drivers on both sides of the stack. C# covers .NET services, Python covers scripting and coding challenges, and SQL, HTML5 and CSS3 round out the fundamentals.',
            tags: ['TypeScript', 'JavaScript (ES6+)', 'C#', 'Python', 'SQL', 'HTML5', 'CSS3'],
          },
          {
            h: 'Front end',
            p: 'React 18 with Redux for state, Next.js and Vite for tooling, Svelte where it fits, and Tailwind CSS with shadcn/ui and Radix UI for accessible component foundations. I build responsive, WCAG-minded interfaces, and I like turning them into reusable component libraries with design tokens so a whole team ships the same UI.',
            tags: ['React 18', 'Redux', 'Next.js', 'Vite', 'Svelte', 'Tailwind CSS', 'shadcn/ui', 'Radix UI', 'Recharts', 'Three.js', 'Responsive & accessible UI (WCAG)', 'Component libraries', 'Design tokens'],
          },
        ],
      },
      {
        label: 'Back end & data',
        blocks: [
          {
            h: 'Back end',
            p: 'Node.js with Express and .NET / ASP.NET Core for services, with a focus on clean REST API design, authentication and authorization, webhooks, and serverless functions on Supabase Edge Functions.',
            tags: ['Node.js', 'Express', '.NET / ASP.NET Core', 'REST API design', 'Authentication & authorization', 'Supabase Edge Functions', 'Webhooks'],
          },
          {
            h: 'Data',
            p: 'PostgreSQL through Supabase, Microsoft SQL Server, MongoDB and MySQL — along with the schema and data modelling, caching and query optimization that keep them fast in production.',
            tags: ['PostgreSQL (Supabase)', 'Microsoft SQL Server', 'MongoDB', 'MySQL', 'Schema & data modelling', 'Caching', 'Query optimization'],
          },
          {
            h: 'Integrations',
            p: 'The third-party services real products depend on: Stripe payments, Twilio SMS, the Google Maps API for geolocation, geocoding and GPS, Wealthsimple data pipelines, and Postman for API work.',
            tags: ['Stripe', 'Twilio', 'Google Maps API', 'Wealthsimple data pipelines', 'Postman'],
          },
        ],
      },
      {
        label: 'Delivery & tooling',
        blocks: [
          {
            h: 'Cloud & DevOps',
            p: 'Docker-based CI/CD pipelines to AWS and Azure, GitOps with Argo CD, and Git workflows on GitHub and GitLab with proper code-review practice.',
            tags: ['Docker', 'AWS', 'Azure', 'CI/CD pipelines', 'GitOps with Argo CD', 'Git', 'GitHub', 'GitLab', 'Code review'],
          },
          {
            h: 'Testing & quality',
            p: 'Jest and React Testing Library on the front end, Vitest for Vite projects, unit and integration testing, TDD where it pays off, and disciplined debugging and profiling when something misbehaves in production.',
            tags: ['Jest', 'React Testing Library', 'Vitest', 'Unit & integration testing', 'TDD', 'Debugging & profiling'],
          },
          {
            h: 'AI-assisted development',
            p: 'Claude and Claude Code, GitHub Copilot and Cursor, used daily for implementation, test generation, debugging and review acceleration — with human review on everything that ships.',
            tags: ['Claude & Claude Code', 'GitHub Copilot', 'Cursor'],
          },
        ],
      },
    ],
  },
  {
    id: 'education',
    name: 'Academy',
    designation: 'EDUCATION',
    sector: 'Candidate sector · Planet 5 of 6',
    biome: 'jungle',
    brief: 'Education and certifications. Two intel terminals.',
    objectives: [
      {
        label: 'Mohawk College',
        blocks: [
          {
            h: 'Advanced Diploma, Computer Systems Technology — Software Development',
            sub: 'Mohawk College · Hamilton, ON',
            meta: '3-year program',
            p: 'A three-year advanced diploma focused on software development: programming fundamentals, object-oriented design, databases, web development and the practical engineering habits — version control, testing, documentation — that the rest of this campaign is built on. The program includes a co-op component, which is where the Ontario Public Service placement came from.',
            tags: ['Software development', 'Databases', 'Web development', 'Co-op'],
          },
        ],
      },
      {
        label: 'Certifications',
        blocks: [
          {
            h: 'GitOps Fundamentals (GitOps with Argo)',
            sub: 'Octopus Deploy / Codefresh',
            meta: '2026',
            p: 'Covers the principles of GitOps — Git as the single source of truth for infrastructure and application state — and how Argo CD reconciles clusters to what is declared in the repository. Directly relevant to how I ship at Bell.',
          },
          {
            h: 'Microsoft Certified: Azure Fundamentals (AZ-900)',
            sub: 'Microsoft',
            p: 'Cloud concepts, core Azure services and architecture, governance, security, and pricing and support models — the shared vocabulary for working with cloud infrastructure.',
          },
          {
            h: 'The Complete Full-Stack Web Development Bootcamp',
            sub: 'Dr. Angela Yu · Udemy',
            p: 'Full-stack web development from HTML/CSS and JavaScript through Node.js, databases and React — the foundation that the production experience above was built on top of.',
          },
        ],
      },
    ],
  },
  {
    id: 'contact',
    name: 'Relay',
    designation: 'CONTACT',
    sector: 'Candidate sector · Planet 6 of 6',
    biome: 'moon',
    brief: 'Communications relay. One intel terminal.',
    objectives: [
      {
        label: 'Comms relay',
        blocks: [
          {
            h: 'Let’s talk',
            p: 'Thanks for exploring the whole campaign. I’m open to new opportunities — full-stack or front-end-heavy roles, in the Greater Toronto Area or remote — and I’m always happy to talk about shipping products, fintech, or building with AI. Email is the fastest way to reach me; LinkedIn works too.',
          },
          {
            h: 'Channels',
            bullets: [
              `Email — ${EMAIL}`,
              'GitHub — github.com/Bello-online (every project on the Forge planet lives here)',
              'LinkedIn — linkedin.com/in/bello-olaseni-17002a251',
              'Résumé — a one-page PDF version of everything in this campaign',
            ],
            links: [
              { label: '✉ ' + EMAIL, href: `mailto:${EMAIL}` },
              { label: 'GitHub', href: GITHUB },
              { label: 'LinkedIn', href: LINKEDIN },
              { label: 'Résumé (PDF)', href: '/Olaseni-Bello-Resume.pdf' },
            ],
          },
        ],
      },
    ],
  },
];
