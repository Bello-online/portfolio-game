// Procedural texture kit — every texture in the game is generated here at
// load time from value noise, so there are no image assets to ship.
import * as THREE from 'three';
import { fbm, noise2 } from './noise.js';

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas, { repeat = 1, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Seamlessly tileable fbm on the unit square (4-way blend of offset samples). */
export function tileableFbm(u, v, scale, seed, octaves = 4) {
  const x = u * scale, y = v * scale;
  const a = fbm(x + seed, y + seed * 0.7, octaves);
  const b = fbm(x - scale + seed, y + seed * 0.7, octaves);
  const c = fbm(x + seed, y - scale + seed * 0.7, octaves);
  const d = fbm(x - scale + seed, y - scale + seed * 0.7, octaves);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

/** Builds an RGB normal map from a height function over the unit square. */
export function normalMapFrom(heightFn, size, strength = 2, wrap = true) {
  const data = new Uint8Array(size * size * 4);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = heightFn(x / size, y / size);
  const at = (x, y) => {
    if (wrap) { x = (x + size) % size; y = (y + size) % size; } else { x = Math.min(size - 1, Math.max(0, x)); y = Math.min(size - 1, Math.max(0, y)); }
    return h[y * size + x];
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  tex.anisotropy = 8;
  return tex;
}

/** Grey rock/soil detail used as a multiply map over terrain vertex colours. */
export function terrainDetail(seed, repeat = 36) {
  const size = 256;
  const canvas = canvasOf(size, size);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const height = (u, v) => tileableFbm(u, v, 6, seed, 5);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = height(x / size, y / size);
      const grit = tileableFbm(x / size, y / size, 40, seed + 9, 2);
      const v = (0.72 + n * 0.3 + (grit - 0.5) * 0.14) * 255;
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const map = toTexture(canvas, { repeat });
  const normalMap = normalMapFrom((u, v) => tileableFbm(u, v, 6, seed, 5) * 6 + tileableFbm(u, v, 40, seed + 9, 2) * 1.2, size, 1.4);
  normalMap.repeat.set(repeat, repeat);
  return { map, normalMap };
}

/** Animated-looking water/lava surface: normal map + emissive noise map. */
export function liquidMaps(seed, repeat = 10) {
  const size = 256;
  const normalMap = normalMapFrom((u, v) => tileableFbm(u, v, 5, seed, 4) * 4, size, 2.2);
  normalMap.repeat.set(repeat, repeat);
  const canvas = canvasOf(size, size);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = tileableFbm(x / size, y / size, 5, seed, 4);
      const crack = Math.pow(1 - Math.abs(n * 2 - 1), 6); // bright veins
      const v = Math.min(255, (0.15 + crack * 1.2) * 255);
      const i = (y * size + x) * 4;
      img.data[i] = v; img.data[i + 1] = v * 0.55; img.data[i + 2] = v * 0.2; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const emissiveMap = toTexture(canvas, { repeat });
  return { normalMap, emissiveMap };
}

/** Equirectangular planet surface + matching normal map, seamless in longitude. */
export function planetMaps(biome, seed) {
  const w = 384, h = 192;
  const canvas = canvasOf(w, h);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const base = new THREE.Color(biome.planet), alt = new THREE.Color(biome.planetAlt), c = new THREE.Color();
  const white = new THREE.Color(0xf4f8ff), lava = new THREE.Color(0xff5a1a), sea = new THREE.Color(biome.planetSea || biome.planet).multiplyScalar(0.6);
  const height = new Float32Array(w * h);
  const sample = (u, v) => {
    const lon = u * Math.PI * 2, lat = (v - 0.5) * Math.PI;
    const cx = Math.cos(lon) * Math.cos(lat), cz = Math.sin(lon) * Math.cos(lat), cy = Math.sin(lat);
    return fbm(cx * 2.4 + cz * 0.7 + seed * 11, cy * 2.6 + cz * 1.9 + seed * 3, 5);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const n = sample(u, v);
      const detail = fbm(u * 40 + seed, v * 20 - seed, 3);
      const lat = Math.abs(v - 0.5) * 2;
      height[y * h + x] = n;
      c.copy(base).lerp(alt, smooth(0.42, 0.62, n));
      if (biome.planetSea && n < 0.42) c.copy(sea).lerp(base, smooth(0.3, 0.42, n) * 0.3);
      if (biome.caps) c.lerp(white, smooth(0.7, 0.88, lat + (detail - 0.5) * 0.2) * 0.85);
      if (biome.lava && n > 0.62) c.lerp(lava, smooth(0.62, 0.7, n));
      if (biome.craters) {
        const cr = fbm(u * 18 + seed, v * 9 + seed, 2);
        if (cr > 0.66) c.multiplyScalar(0.72);
      }
      c.multiplyScalar(0.62 + (detail - 0.5) * 0.3 + (n - 0.5) * 0.3);
      const i = (y * w + x) * 4;
      img.data[i] = Math.min(255, c.r * 255); img.data[i + 1] = Math.min(255, c.g * 255); img.data[i + 2] = Math.min(255, c.b * 255); img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const map = toTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  const normalMap = normalMapFrom((u, v) => sample(u, v) * 3 + fbm(u * 40 + seed, v * 20 - seed, 3) * 0.8, 256, 2.5);
  return { map, normalMap };
}

/** Soft cloud layer (RGBA) for a planet. */
export function cloudMap(seed) {
  const w = 384, h = 192;
  const canvas = canvasOf(w, h);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const lon = u * Math.PI * 2, lat = (v - 0.5) * Math.PI;
      const n = fbm(Math.cos(lon) * 3.2 + seed * 5, Math.sin(lon) * 3.2 + lat * 3.5 + seed, 4);
      const a = smooth(0.5, 0.72, n) * 0.9;
      const i = (y * w + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = toTexture(canvas);
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** Surface-noise map for the star. */
export function starMap(seed) {
  const w = 256, h = 128;
  const canvas = canvasOf(w, h);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const lon = u * Math.PI * 2, lat = (v - 0.5) * Math.PI;
      const n = fbm(Math.cos(lon) * 4 + seed, Math.sin(lon) * 4 + lat * 4, 4);
      const i = (y * w + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 200 + n * 55; img.data[i + 2] = 90 + n * 120; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(canvas);
}

/** Soft round particle sprite. */
export function softCircle() {
  const c = canvasOf(64, 64);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return toTexture(c);
}

/** Wispy fog patch for ground-fog cards. */
export function fogPatch(seed) {
  const size = 256;
  const c = canvasOf(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size - 0.5, v = y / size - 0.5;
      const r = Math.hypot(u, v) * 2;
      const n = fbm(x / size * 5 + seed, y / size * 5 - seed, 4);
      const a = Math.max(0, 1 - r * r) * smooth(0.35, 0.7, n);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c);
}

/** Single grass blade silhouette (alpha). */
export function grassBlade() {
  const c = canvasOf(64, 128);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 128);
  const g = ctx.createLinearGradient(0, 128, 0, 0);
  g.addColorStop(0, '#3f6d33');
  g.addColorStop(1, '#a8e07a');
  ctx.fillStyle = g;
  for (let k = -1; k <= 1; k++) {
    ctx.beginPath();
    ctx.moveTo(32 + k * 12, 128);
    ctx.quadraticCurveTo(38 + k * 18, 60, 30 + k * 26, 4);
    ctx.quadraticCurveTo(28 + k * 14, 60, 22 + k * 12, 128);
    ctx.closePath();
    ctx.fill();
  }
  const tex = toTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** Lens-flare element textures: a bright core and a soft ring. */
export function flareTextures() {
  const core = canvasOf(256, 256);
  let ctx = core.getContext('2d');
  let g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,245,220,0.9)');
  g.addColorStop(0.35, 'rgba(255,200,120,0.25)');
  g.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const ring = canvasOf(128, 128);
  ctx = ring.getContext('2d');
  g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.7, 'rgba(255,255,255,0)');
  g.addColorStop(0.85, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return { core: toTexture(core), ring: toTexture(ring) };
}

function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export { noise2 };
