// Planet looks. `planet`/`planetAlt` colour the globe on the campaign map;
// the rest colour the surface when you deploy.
export const BIOMES = {
  ice: {
    label: 'Frozen',
    planet: 0x8fa7bf, planetAlt: 0xd7e6f2,
    ground: 0x6a7c8e, alt: 0xb9c9d8, fog: 0x8ea6bd, sky: 0x0a1420,
    sun: 0xdcefff, sunIntensity: 2.4, hemiSky: 0x9fb8d0, hemiGround: 0x3a4a5a, hemi: 0.55,
    accent: 0x7fdcff, dust: 0xdff2ff,
    props: { rocks: 70, crystals: 26, spires: 10 },
  },
  ash: {
    label: 'Volcanic',
    planet: 0x3a3a42, planetAlt: 0xff6a2a,
    ground: 0x3d373c, alt: 0x625860, fog: 0x4a4048, sky: 0x0a0809,
    sun: 0xff9a5a, sunIntensity: 2.8, hemiSky: 0x7a6060, hemiGround: 0x2a1c1c, hemi: 0.9,
    accent: 0xff7a2a, dust: 0xffa060,
    props: { rocks: 90, spires: 28, embers: 1 },
  },
  dust: {
    label: 'Desert',
    planet: 0xb8783f, planetAlt: 0xe0a86a,
    ground: 0x6f4a2c, alt: 0x9a6c40, fog: 0xb37c4c, sky: 0x2a180f,
    sun: 0xffc07a, sunIntensity: 2.6, hemiSky: 0xd9a070, hemiGround: 0x5a3a20, hemi: 0.6,
    accent: 0xffd400, dust: 0xffd9a0,
    props: { rocks: 80, spires: 22, arches: 1 },
  },
  crystal: {
    label: 'Crystalline',
    planet: 0x5a3f7f, planetAlt: 0xb48cff,
    ground: 0x3c2c58, alt: 0x5a4578, fog: 0x5b4a7c, sky: 0x0c0816,
    sun: 0xd8bfff, sunIntensity: 2.6, hemiSky: 0x9a7ac8, hemiGround: 0x2a1c40, hemi: 0.8,
    accent: 0xc9a0ff, dust: 0xe4d0ff,
    props: { rocks: 50, crystals: 60 },
  },
  jungle: {
    label: 'Overgrown',
    planet: 0x2f6b3a, planetAlt: 0x8fd07a,
    ground: 0x2c4c30, alt: 0x4a7446, fog: 0x3d5a45, sky: 0x08120a,
    sun: 0xd4f5b8, sunIntensity: 2.6, hemiSky: 0x93bf8c, hemiGround: 0x1c2e1e, hemi: 0.85,
    accent: 0x9dff6a, dust: 0xc8f0a8,
    props: { rocks: 40, trees: 55, crystals: 8 },
  },
  moon: {
    label: 'Barren',
    planet: 0x8c9098, planetAlt: 0xc9ccd2,
    ground: 0x45484f, alt: 0x61656d, fog: 0x6b7280, sky: 0x05070c,
    sun: 0xffffff, sunIntensity: 2.6, hemiSky: 0x8a90a0, hemiGround: 0x22252c, hemi: 0.5,
    accent: 0x9fe8ff, dust: 0xd0d6e0,
    props: { rocks: 110, craters: 1 },
  },
};
