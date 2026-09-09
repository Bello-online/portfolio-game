// =====================================================================
//  RESUME DATA — this is the only file you need to edit to make the
//  game "yours". Every island on the map is one entry in `zones`.
//
//  Block shapes supported inside `content`:
//    { h: 'Heading', sub: 'Subtitle', meta: '2022 – now', p: 'Paragraph',
//      bullets: ['...'], tags: ['React', 'Three.js'], links: [{ label, href }] }
//  Every field is optional — use whichever ones fit the section.
//
//  TODO: replace every "PLACEHOLDER" string with your real details.
// =====================================================================

export const profile = {
  name: 'Olaseni Bello',            // PLACEHOLDER — confirm spelling
  title: 'Software Developer',      // PLACEHOLDER — your headline role
  tagline: 'I build things for the web.', // PLACEHOLDER
  avatarInitial: 'O',
  // Character colours (hex)
  shirt: 0xff7b54,
  pants: 0x2b2d42,
  skin: 0xf2c6a0,
  hair: 0x1b1b2f,
};

export const zones = [
  {
    id: 'about',
    title: 'About Me',
    kicker: 'CHAPTER 1',
    landmark: 'house',
    color: '#8ed081',
    prompt: 'Knock on the door',
    content: [
      {
        p: 'PLACEHOLDER — a two or three sentence intro. Who you are, what you love building, and what you are looking for next.',
      },
      {
        h: 'Quick facts',
        bullets: [
          'PLACEHOLDER — Based in City, Country',
          'PLACEHOLDER — X years of experience',
          'PLACEHOLDER — Currently working on …',
        ],
      },
    ],
  },
  {
    id: 'experience',
    title: 'Experience',
    kicker: 'CHAPTER 2',
    landmark: 'office',
    color: '#7fc8f8',
    prompt: 'Visit the office',
    content: [
      {
        h: 'PLACEHOLDER — Job Title',
        sub: 'PLACEHOLDER — Company',
        meta: '2023 – Present',
        bullets: [
          'PLACEHOLDER — Impact statement with a number in it.',
          'PLACEHOLDER — Something you shipped.',
          'PLACEHOLDER — Something you improved.',
        ],
        tags: ['PLACEHOLDER', 'Tech', 'Used'],
      },
      {
        h: 'PLACEHOLDER — Previous Job Title',
        sub: 'PLACEHOLDER — Company',
        meta: '2021 – 2023',
        bullets: [
          'PLACEHOLDER — Impact statement.',
          'PLACEHOLDER — Impact statement.',
        ],
        tags: ['PLACEHOLDER'],
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    kicker: 'CHAPTER 3',
    landmark: 'rocket',
    color: '#f6a5c0',
    prompt: 'Check the launch pad',
    content: [
      {
        h: 'PLACEHOLDER — Project name',
        sub: 'PLACEHOLDER — one-line description',
        p: 'PLACEHOLDER — what it does, why you built it, what was hard.',
        tags: ['Next.js', 'TypeScript', 'PLACEHOLDER'],
        links: [
          { label: 'Live site', href: 'https://example.com' },
          { label: 'GitHub', href: 'https://github.com/Bello-online' },
        ],
      },
      {
        h: 'PLACEHOLDER — Another project',
        sub: 'PLACEHOLDER — one-line description',
        p: 'PLACEHOLDER — details.',
        tags: ['PLACEHOLDER'],
        links: [{ label: 'GitHub', href: 'https://github.com/Bello-online' }],
      },
    ],
  },
  {
    id: 'skills',
    title: 'Skills',
    kicker: 'CHAPTER 4',
    landmark: 'crystal',
    color: '#ffd166',
    prompt: 'Inspect the crystal',
    content: [
      { h: 'Languages', tags: ['JavaScript', 'TypeScript', 'PLACEHOLDER'] },
      { h: 'Frontend', tags: ['React', 'Next.js', 'Three.js', 'Tailwind', 'PLACEHOLDER'] },
      { h: 'Backend & data', tags: ['Node.js', 'PostgreSQL', 'Prisma', 'PLACEHOLDER'] },
      { h: 'Tools', tags: ['Git', 'Vercel', 'Figma', 'PLACEHOLDER'] },
    ],
  },
  {
    id: 'education',
    title: 'Education',
    kicker: 'CHAPTER 5',
    landmark: 'books',
    color: '#b8a1ff',
    prompt: 'Open the books',
    content: [
      {
        h: 'PLACEHOLDER — Degree / Program',
        sub: 'PLACEHOLDER — School',
        meta: '2019 – 2023',
        bullets: ['PLACEHOLDER — Honours, relevant coursework, or clubs.'],
      },
      {
        h: 'Certifications',
        bullets: ['PLACEHOLDER — Certification (Year)'],
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    kicker: 'FINAL CHAPTER',
    landmark: 'mailbox',
    color: '#7ee8d0',
    prompt: 'Check the mailbox',
    content: [
      {
        p: 'PLACEHOLDER — Thanks for exploring! I’m open to new opportunities and always happy to chat.',
      },
      {
        links: [
          { label: '✉️ Email', href: 'mailto:PLACEHOLDER@example.com' },
          { label: 'GitHub', href: 'https://github.com/Bello-online' },
          { label: 'LinkedIn', href: 'https://linkedin.com/in/PLACEHOLDER' },
          { label: '📄 Résumé (PDF)', href: '#' },
        ],
      },
    ],
  },
];
