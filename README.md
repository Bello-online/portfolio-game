# Portfolio Quest

A game-like portfolio built with [three.js](https://threejs.org/) and Vite. Each section of the résumé is a floating low-poly island; walk the character across the bridges and press **E** to read that chapter.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5180.

## Make it yours

Everything shown in the game comes from one file: [`src/data/resume.js`](src/data/resume.js).

- `profile` — name, headline, tagline, and the character's colours.
- `zones` — one entry per island. `title`, `landmark` (`house` · `office` · `rocket` · `crystal` · `books` · `mailbox`), `color`, the on-screen `prompt`, and `content` blocks.

Content blocks are plain objects; use whichever fields you need:

```js
{ h: 'Job title', sub: 'Company', meta: '2023 – now',
  p: 'Paragraph', bullets: ['…'], tags: ['React'], links: [{ label, href }] }
```

Add or remove zones freely — the islands are laid out in a ring automatically.

## Controls

| Input | Action |
| --- | --- |
| `W A S D` / arrows | Move |
| `E` / `Enter` / `Space` | Explore the island you're standing on |
| `Esc` | Close the panel |
| Click a quest-log entry | Fast travel |
| Touch | Left joystick to move, `E` button to explore |

## Project layout

```
src/
  main.js       renderer, camera follow, game loop
  world.js      islands, bridges, landmarks, walkability
  player.js     blocky character + walk cycle
  input.js      keyboard + touch joystick
  ui.js         intro, HUD, quest log, section panel
  data/resume.js  ← your content
```

## Deploy

`npm run build` produces a static site in `dist/` — drop it on Vercel, Netlify, or GitHub Pages.
