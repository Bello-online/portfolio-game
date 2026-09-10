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
            p: 'I’m a full-stack developer at Bell Canada with production experience across the whole stack, and a shipping-focused side portfolio that spans fintech, marketplaces, security tooling and small-business web.',
          },
          {
            p: 'I build end to end — React/TypeScript front ends, Node.js and .NET/C# back ends, Postgres/Supabase and MongoDB data layers, and integrations like Stripe, Twilio and Google Maps — and I ship with automated tests, CI/CD and GitOps. I use AI-assisted, agentic development (Claude Code, Cursor, Copilot) every day.',
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
              'Software Developer at Bell Canada since May 2024',
              'Certified: GitOps Fundamentals (Argo) · Microsoft Azure Fundamentals',
              'Known for accessible, well-documented code and honest communication',
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
            sub: 'Bell Canada · Mississauga, ON (Hybrid)',
            meta: 'May 2024 – Present',
            bullets: [
              'Design, develop and maintain production web apps in React, TypeScript and Node.js for internal teams and customer-facing platforms.',
              'Build reusable front-end components consumed across multiple internal platforms, wired to REST APIs and documented so distributed teams adopt them independently.',
              'Develop and support .NET/C# backend services on SQL Server — API design, performance tuning and production debugging from logs and traces.',
              'Write automated test suites (Jest, React Testing Library) and take part in rigorous code review to keep releases dependable as shared components evolve.',
              'Ship through Docker-based CI/CD pipelines to cloud infrastructure using GitOps practices.',
            ],
            tags: ['React', 'TypeScript', 'Node.js', '.NET / C#', 'SQL Server', 'Jest', 'Docker', 'GitOps'],
          },
        ],
      },
      {
        label: 'FinanceCanada',
        blocks: [
          {
            h: 'Full-Stack Developer',
            sub: 'FinanceCanada · financial-literacy platform',
            meta: '2023 – Present',
            bullets: [
              'Own features end to end — requirements, implementation, testing, deployment and iteration with real users — on a full product team.',
              'Build the React/TypeScript front end and Node.js REST API; maintain a shared component library and design tokens so a distributed team ships consistent UI.',
              'Collaborate across time zones through Git-based workflows with PR review and clear documentation.',
            ],
            tags: ['React', 'TypeScript', 'Node.js', 'Design tokens', 'GitHub'],
          },
        ],
      },
      {
        label: 'Ontario Public Service',
        blocks: [
          {
            h: 'Junior Programmer (Co-op)',
            sub: 'Ministry of the Solicitor General · Ontario Public Service · Hamilton, ON',
            meta: 'Jan – Aug 2023',
            bullets: [
              'Developed and maintained internal applications and data-handling workflows (JSON processing and tooling) in a government environment with strict quality standards.',
              'Worked directly with stakeholders to gather requirements, deliver iterations and document solutions for handover.',
            ],
            tags: ['JavaScript', 'JSON', 'Stakeholder management'],
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
            p: 'Imports Wealthsimple activity CSV exports, parses trades and account activity, and matches buys/sells into FIFO lots. Tracks open and sold positions, allocation and P/L with Recharts, plus historical exit-date simulations served by a Supabase Edge Function.',
            bullets: ['Parsing and lot-matching logic covered by a Vitest unit-test suite.'],
            tags: ['React 18', 'TypeScript', 'Vite', 'Tailwind', 'shadcn/ui', 'Recharts', 'Supabase', 'Vitest'],
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
            p: 'A three-sided marketplace — Customer app, Contractor app and Admin dashboard — sharing one booking → dispatch → completion → payment flow.',
            bullets: [
              'Stripe payments, Twilio SMS notifications and Google Maps routing/location.',
              'Delivered in phased milestones (A–G) tracked through GitHub issues; pricing engine and business rules unit-tested on the backend.',
            ],
            tags: ['React', 'Node.js', 'Express', 'Supabase', 'Stripe', 'Twilio', 'Google Maps'],
            links: [{ label: 'GitHub', href: GITHUB }],
          },
        ],
      },
      {
        label: 'Anti-Phishing Plugin',
        blocks: [
          {
            h: 'Anti-Phishing Browser Plugin',
            sub: 'Security tooling',
            p: 'A browser extension with a companion server that helps users detect and avoid phishing websites — client-side detection UX paired with server-side checks.',
            tags: ['Svelte', 'JavaScript', 'Node.js'],
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
            p: 'Browser geolocation, address geocoding and live GPS tracking in one map UI.',
            tags: ['JavaScript', 'Geolocation API', 'Geocoding'],
          },
          {
            h: 'SSD Employers',
            sub: 'Employer management system',
            p: 'CRUD workflows and structured data management for employer records.',
            tags: ['C#', '.NET'],
          },
          {
            h: 'Also shipped',
            bullets: [
              'Fit-Path & Streak-Fit-Track — fitness-tracking web apps (TypeScript)',
              'DoLittle — self-built URL shortener (Node.js / EJS)',
              'MovieTracker & The Waitlist App',
              'Freelance small-business sites — Apex Roofing, Greenscape Dream, Precision Pixel Shop (React / TypeScript)',
              'Shopify Engineering Intern Challenge — Braille translation (Python)',
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
          { h: 'Languages', tags: ['TypeScript', 'JavaScript (ES6+)', 'C#', 'Python', 'SQL', 'HTML5', 'CSS3'] },
          {
            h: 'Front end',
            tags: ['React 18', 'Redux', 'Next.js', 'Vite', 'Svelte', 'Tailwind CSS', 'shadcn/ui', 'Radix UI', 'Recharts', 'Three.js', 'Accessible UI (WCAG)', 'Design tokens'],
          },
        ],
      },
      {
        label: 'Back end & data',
        blocks: [
          {
            h: 'Back end',
            tags: ['Node.js', 'Express', '.NET / ASP.NET Core', 'REST API design', 'Auth & authorization', 'Supabase Edge Functions', 'Webhooks'],
          },
          {
            h: 'Data',
            tags: ['PostgreSQL (Supabase)', 'Microsoft SQL Server', 'MongoDB', 'MySQL', 'Data modeling', 'Caching & query optimization'],
          },
          { h: 'Integrations', tags: ['Stripe', 'Twilio', 'Google Maps API', 'Wealthsimple data pipelines', 'Postman'] },
        ],
      },
      {
        label: 'Delivery & tooling',
        blocks: [
          { h: 'Cloud & DevOps', tags: ['Docker', 'AWS', 'Azure', 'CI/CD', 'GitOps with Argo CD', 'Git / GitHub / GitLab'] },
          { h: 'Testing & quality', tags: ['Jest', 'React Testing Library', 'Vitest', 'TDD', 'Debugging & profiling'] },
          { h: 'AI-assisted development', tags: ['Claude & Claude Code', 'GitHub Copilot', 'Cursor'] },
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
          },
        ],
      },
      {
        label: 'Certifications',
        blocks: [
          {
            h: 'Certifications',
            bullets: [
              'GitOps Fundamentals (GitOps with Argo) — Octopus Deploy / Codefresh, 2026',
              'Microsoft Certified: Azure Fundamentals (AZ-900) — Microsoft',
              'The Complete Full-Stack Web Development Bootcamp — Dr. Angela Yu (Udemy)',
            ],
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
            p: 'Thanks for exploring. I’m open to new opportunities and always happy to talk about full-stack work, fintech, or building things with AI. The fastest way to reach me is email.',
          },
          {
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
