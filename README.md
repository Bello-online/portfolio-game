# Portfolio Campaign

A game-like portfolio built with [three.js](https://threejs.org/) and Vite, styled after co-op planet-drop shooters: a holographic campaign map, a drop pod, dark planet surfaces, and arrow-code terminals that unlock each chapter of the résumé.

## How it plays

1. **Campaign map** — six planets orbit a star. Each one is a résumé section. Select with `◀ ▶` (or click) and press `ENTER` to deploy.
2. **Flight** — the deployment vessel warps to the planet (chase cam, warp streaks), parks in orbit, and launches the drop pod.
3. **Drop** — the camera rides the pod down through the atmosphere; it hits the surface and the door opens.
4. **Surface** — walk (`WASD`, `SHIFT` to sprint) to the intel terminals marked on the compass and in the world. At a terminal, punch in its access code with the arrow keys.
5. **Intel** — a correct code opens that section's content. `ESC` closes it.
6. **Extract** — once every terminal is secured an extraction beacon appears. Enter its code to return to the ship and mark the planet liberated.

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

## Graphics

Everything is generated at load time — there are no image, model, or audio assets:

- `textures.js` builds every texture from value noise: terrain albedo + normal maps, equirect planet maps with matching normals, cloud layers, water/lava normal + emissive maps, grass blades, fog wisps, lens-flare elements.
- Post stack (`main.js` + `post.js`): UnrealBloom → tone-map → SMAA → colour grade (vignette, chromatic aberration, film grain).
- Each biome (`biomes.js`) sets its palette, weather (snow / embers / spores / dust / motes), liquid (water or emissive lava that fills low terrain), ground scatter, and whether it grows wind-swayed grass.

## Project layout

```
src/
  main.js        state machine: intro → ship → fly → drop → surface → extract; post stack
  ship.js        campaign map: textured planets, clouds, rings, asteroid belt, star + flare, flight cinematic
  shipmodel.js   the deployment vessel (shared by the map and the surface skyline)
  planet.js      surface: terrain, liquids, weather, fog, grass, props, terminals, beacon, drop pod
  biomes.js      per-planet palettes, weather, liquids and prop mixes
  textures.js    procedural texture generators
  post.js        colour-grading shader pass
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
