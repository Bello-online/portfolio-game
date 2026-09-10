// Planet looks. `planet`/`planetAlt` colour the globe on the campaign map;
// the rest colour the surface when you deploy.
export const BIOMES = {
  ice: {
    label: 'Frozen',
    planet: 0x8fa7bf, planetAlt: 0xd7e6f2, caps: true,
    ground: 0x6a7c8e, alt: 0xb9c9d8, rock: 0x4b5666, fog: 0x8ea6bd, sky: 0x0a1420,
    sun: 0xdcefff, sunIntensity: 2.4, fill: 0x4a6a9a, hemiSky: 0x9fb8d0, hemiGround: 0x3a4a5a, hemi: 0.55,
    accent: 0x7fdcff, dust: 0xdff2ff, moon: 0xc9d6e6,
    props: { rocks: 60, crystals: 26, spires: 10, structures: 5 }, scatter: 'shards',
  },
  ash: {
    label: 'Volcanic',
    planet: 0x3a3a42, planetAlt: 0xff6a2a, lava: true,
    ground: 0x3d373c, alt: 0x625860, rock: 0x241f22, fog: 0x4a4048, sky: 0x0a0809,
    sun: 0xff9a5a, sunIntensity: 2.8, fill: 0x8a3a2a, hemiSky: 0x7a6060, hemiGround: 0x2a1c1c, hemi: 0.9,
    accent: 0xff7a2a, dust: 0xffa060, moon: 0x8a6a5a,
    props: { rocks: 80, spires: 26, structures: 7 }, scatter: 'pebbles',
  },
  dust: {
    label: 'Desert',
    planet: 0xb8783f, planetAlt: 0xe0a86a, rings: true,
    ground: 0x6f4a2c, alt: 0x9a6c40, rock: 0x4d3220, fog: 0xb37c4c, sky: 0x2a180f,
    sun: 0xffc07a, sunIntensity: 2.6, fill: 0x7a5a9a, hemiSky: 0xd9a070, hemiGround: 0x5a3a20, hemi: 0.6,
    accent: 0xffd400, dust: 0xffd9a0, moon: 0xd9b48a,
    props: { rocks: 70, spires: 22, structures: 8 }, scatter: 'pebbles',
  },
  crystal: {
    label: 'Crystalline',
    planet: 0x5a3f7f, planetAlt: 0xb48cff,
    ground: 0x3c2c58, alt: 0x5a4578, rock: 0x241a36, fog: 0x5b4a7c, sky: 0x0c0816,
    sun: 0xd8bfff, sunIntensity: 2.6, fill: 0x3a9aa0, hemiSky: 0x9a7ac8, hemiGround: 0x2a1c40, hemi: 0.8,
    accent: 0xc9a0ff, dust: 0xe4d0ff, moon: 0x9a86c0,
    props: { rocks: 45, crystals: 60, structures: 4 }, scatter: 'shards',
  },
  jungle: {
    label: 'Overgrown',
    planet: 0x2f6b3a, planetAlt: 0x8fd07a, moonlet: true,
    ground: 0x2c4c30, alt: 0x4a7446, rock: 0x25302a, fog: 0x3d5a45, sky: 0x08120a,
    sun: 0xd4f5b8, sunIntensity: 2.6, fill: 0x2a6a8a, hemiSky: 0x93bf8c, hemiGround: 0x1c2e1e, hemi: 0.85,
    accent: 0x9dff6a, dust: 0xc8f0a8, moon: 0xa8c0a0,
    props: { rocks: 40, trees: 55, crystals: 8, structures: 5 }, scatter: 'tufts',
  },
  moon: {
    label: 'Barren',
    planet: 0x8c9098, planetAlt: 0xc9ccd2, craters: true,
    ground: 0x45484f, alt: 0x61656d, rock: 0x2c2f36, fog: 0x6b7280, sky: 0x05070c,
    sun: 0xffffff, sunIntensity: 2.6, fill: 0x4a5a8a, hemiSky: 0x8a90a0, hemiGround: 0x22252c, hemi: 0.5,
    accent: 0x9fe8ff, dust: 0xd0d6e0, moon: 0x6f8fc0,
    props: { rocks: 100, structures: 8 }, scatter: 'pebbles',
  },
};
