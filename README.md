# Portfolio Campaign

A game-like portfolio built with [three.js](https://threejs.org/) and Vite, styled after co-op planet-drop shooters: a holographic campaign map, a drop pod, dark planet surfaces, and arrow-code terminals that unlock each chapter of the résumé.

## How it plays

1. **Campaign map** — six planets orbit a star. Each one is a résumé section. Select with `◀ ▶` (or click) and press `ENTER` to deploy.
2. **Drop** — a pod falls from orbit, hits the surface, and the door opens.
3. **Surface** — walk (`WASD`, `SHIFT` to sprint) to the intel terminals marked on the compass and in the world. At a terminal, punch in its access code with the arrow keys.
4. **Intel** — a correct code opens that section's content. `ESC` closes it.
5. **Extract** — once every terminal is secured an extraction beacon appears. Enter its code to return to the ship and mark the planet liberated.

Touch devices get a joystick and an action button that enters the code for you.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5180.

## Make it yours

Everything the game says comes from one file: [`src/data/resume.js`](src/data/resume.js).

- `profile` — name, headline, location, and the trooper's armour colours.
- `campaign` — title, vessel name, and the intro brief.
- `planets` — one entry per planet: `name`, `designation`, `biome` (`ice` · `ash` · `dust` · `crystal` · `jungle` · `moon`), a short `brief`, and its `objectives`. Each objective becomes one terminal on the surface and holds an array of content `blocks`:

```js
{ h: 'Job title', sub: 'Company', meta: '2023 – now',
  p: 'Paragraph', bullets: ['…'], tags: ['React'], links: [{ label, href }] }
```

Every field is optional. Add or remove planets and objectives freely — orbits, terminal placement and access codes are generated automatically (set `code: 'UDLR'` on an objective to pin one).

## Project layout

```
src/
  main.js        state machine: intro → ship → drop → surface → extract
  ship.js        campaign map (planets, orbits, selection reticle)
  planet.js      surface: terrain, props, terminals, beacon, drop pod, effects
  biomes.js      per-planet palettes and prop mixes
  player.js      armoured trooper with cape + walk cycle
  input.js       keyboard + touch joystick
  ui.js          intro, HUD, compass, markers, code prompt, intel panel
  audio.js       procedural sound cues (WebAudio, no assets)
  noise.js       value noise / seeded RNG
  data/resume.js ← your content
public/
  Olaseni-Bello-Resume.pdf   linked from the Contact planet
```

## Deploy

`npm run build` produces a static site in `dist/` — drop it on Vercel, Netlify, or GitHub Pages.
