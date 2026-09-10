import * as THREE from 'three';
import { BIOMES } from './biomes.js';
import { fbm, noise2, smoothstep, rng } from './noise.js';
import { buildShipModel } from './shipmodel.js';

export const PLAY_RADIUS = 62;
const TERRAIN_SIZE = 260;
const TERRAIN_SEGS = 170;
export const DROP_HEIGHT = 190;

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, metalness: 0.05, ...extra });
}

function mesh(geo, material, { x = 0, y = 0, z = 0, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function jitter(geo, amount, rand) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i, p.getX(i) + (rand() - 0.5) * amount, p.getY(i) + (rand() - 0.5) * amount * 0.6, p.getZ(i) + (rand() - 0.5) * amount);
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------- sky ----------
function makeSky(top, bottom) {
  const geo = new THREE.SphereGeometry(320, 24, 16);
  const material = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 top; uniform vec3 bottom; varying vec3 vP;
      void main(){
        float h = normalize(vP).y;
        float k = smoothstep(-0.02, 0.5, h);
        gl_FragColor = vec4(mix(bottom, top, k), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const m = new THREE.Mesh(geo, material);
  m.renderOrder = -10;
  return m;
}

function makeStars(rand) {
  const n = 1100;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(rand() * 0.9 + 0.1);
    const r = 300;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph);
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.7, fog: false }));
}

function makeGlowSprite(color) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  const col = new THREE.Color(color);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  grad.addColorStop(0, `rgba(${rgb},0.9)`);
  grad.addColorStop(0.3, `rgba(${rgb},0.35)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
}

// ---------- props ----------
function makeRock(rand, scale, color) {
  const geo = jitter(new THREE.DodecahedronGeometry(scale, 1), scale * 0.45, rand);
  const m = mesh(geo, mat(color), { y: scale * 0.3 });
  m.rotation.set(rand() * Math.PI, rand() * Math.PI, 0);
  m.scale.set(1 + rand() * 0.6, 0.55 + rand() * 0.6, 1 + rand() * 0.6);
  return m;
}

function makeSpire(rand, h, color) {
  const geo = jitter(new THREE.ConeGeometry(h * 0.22, h, 7), h * 0.06, rand);
  const m = mesh(geo, mat(color), { y: h / 2 - 0.4 });
  m.rotation.z = (rand() - 0.5) * 0.25;
  m.rotation.x = (rand() - 0.5) * 0.25;
  return m;
}

function makeCrystal(rand, h, accent) {
  const g = new THREE.Group();
  const m = mat(accent, { emissive: accent, emissiveIntensity: 0.7, roughness: 0.25, transparent: true, opacity: 0.92 });
  const n = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const hh = h * (0.5 + rand() * 0.7);
    const c = mesh(new THREE.OctahedronGeometry(hh * 0.25, 0), m, { x: (rand() - 0.5) * 1.2, y: hh * 0.35, z: (rand() - 0.5) * 1.2 });
    c.scale.y = 2.6;
    c.rotation.set((rand() - 0.5) * 0.6, rand() * Math.PI, (rand() - 0.5) * 0.6);
    g.add(c);
  }
  const light = new THREE.PointLight(accent, 4, 10, 2);
  light.position.y = h * 0.4;
  g.add(light);
  return g;
}

function makeDeadTree(rand, h, color) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.12, 0.4, h, 6), mat(color), { y: h / 2 });
  trunk.rotation.z = (rand() - 0.5) * 0.2;
  g.add(trunk);
  const branches = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < branches; i++) {
    const bl = h * (0.25 + rand() * 0.3);
    const b = mesh(new THREE.CylinderGeometry(0.05, 0.12, bl, 5), mat(color), { y: h * (0.45 + rand() * 0.45) });
    b.rotation.z = (rand() > 0.5 ? 1 : -1) * (0.6 + rand() * 0.6);
    b.rotation.y = rand() * Math.PI * 2;
    b.position.x = Math.sin(b.rotation.z) * bl * 0.4;
    g.add(b);
  }
  return g;
}

// abandoned hardware: containers, pipes, antenna masts
function makeStructure(rand, accent) {
  const g = new THREE.Group();
  const steel = mat(0x4a4e58, { metalness: 0.45, roughness: 0.55 });
  const dark = mat(0x22252c, { metalness: 0.3 });
  const stripe = mat(0xffd400);
  const kind = Math.floor(rand() * 3);
  if (kind === 0) {
    // stacked containers
    const n = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const box = mesh(new THREE.BoxGeometry(3.2, 1.7, 1.7), i % 2 ? dark : steel, { x: (rand() - 0.5) * 0.6, y: 0.85 + i * 1.7, z: (rand() - 0.5) * 0.6 });
      box.rotation.y = (rand() - 0.5) * 0.3;
      box.add(mesh(new THREE.BoxGeometry(3.25, 0.25, 1.75), stripe, { y: -0.3 }));
      g.add(box);
    }
  } else if (kind === 1) {
    // pipe run on supports
    const len = 6 + rand() * 6;
    const pipe = mesh(new THREE.CylinderGeometry(0.35, 0.35, len, 8), steel, { y: 1.1 });
    pipe.rotation.z = Math.PI / 2;
    g.add(pipe);
    for (let i = -1; i <= 1; i++) g.add(mesh(new THREE.BoxGeometry(0.4, 1.1, 0.6), dark, { x: i * len * 0.4, y: 0.55 }));
    const valve = mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 16), stripe, { y: 1.75 });
    g.add(valve);
  } else {
    // antenna mast
    const h = 8 + rand() * 6;
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.35, h, 6), steel, { y: h / 2 }));
    g.add(mesh(new THREE.BoxGeometry(1.6, 0.9, 1.6), dark, { y: 0.45 }));
    for (let i = 1; i <= 3; i++) {
      const bar = mesh(new THREE.BoxGeometry(2.4 - i * 0.5, 0.08, 0.08), steel, { y: h * (0.4 + i * 0.18) });
      bar.rotation.y = i * 0.7;
      g.add(bar);
    }
    const lamp = mesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2020, emissiveIntensity: 2 }), { y: h + 0.15, cast: false });
    lamp.name = 'blink';
    g.add(lamp);
  }
  g.rotation.y = rand() * Math.PI * 2;
  return g;
}

// ---------- terminal (objective) ----------
function makeTerminal(accent) {
  const g = new THREE.Group();
  const dark = mat(0x1c1e24, { metalness: 0.3, roughness: 0.6 });
  const steel = mat(0x4a4e58, { metalness: 0.4, roughness: 0.5 });
  g.add(mesh(new THREE.CylinderGeometry(1.9, 2.1, 0.25, 8), steel, { y: 0.12 }));
  g.add(mesh(new THREE.BoxGeometry(1.5, 1.1, 0.9), dark, { y: 0.8 }));
  const screenMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.2, roughness: 0.3 });
  const screen = mesh(new THREE.BoxGeometry(1.3, 0.75, 0.08), screenMat, { y: 1.5, z: 0.3, cast: false });
  screen.rotation.x = -0.55;
  g.add(screen);
  g.add(mesh(new THREE.BoxGeometry(1.3, 0.08, 0.5), steel, { y: 1.2, z: 0.55 }));
  g.add(mesh(new THREE.BoxGeometry(1.52, 0.18, 0.92), mat(0xffd400, { emissive: 0xffd400, emissiveIntensity: 0.2 }), { y: 0.42 }));
  // cable + junction
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 5), dark, { x: 0.9, y: 0.1, z: -0.5 }).rotateZ(Math.PI / 2));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), steel, { x: 1.7, y: 0.25, z: -0.5 }));
  // hologram above the console
  const holoMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, wireframe: true });
  const holo = mesh(new THREE.OctahedronGeometry(0.45, 1), holoMat, { y: 2.6, cast: false, receive: false });
  g.add(holo);
  // antenna + beacon light
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 6), steel, { x: -0.6, y: 2.6, z: -0.35 }));
  const lampMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2 });
  g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), lampMat, { x: -0.6, y: 4.25, z: -0.35, cast: false }));
  const beamMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.8, 70, 10, 1, true), beamMat, { y: 35, cast: false, receive: false }));
  const ringMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const ring = mesh(new THREE.RingGeometry(3.6, 3.9, 48), ringMat, { y: 0.1, cast: false, receive: false });
  ring.rotation.x = -Math.PI / 2;
  g.add(ring);
  const light = new THREE.PointLight(accent, 14, 16, 2);
  light.position.set(0, 2.2, 1);
  g.add(light);
  return { group: g, screenMat, lampMat, beamMat, ringMat, holoMat, holo, light, ring };
}

// ---------- extraction beacon ----------
function makeBeacon() {
  const g = new THREE.Group();
  const col = 0x9fdcff;
  g.add(mesh(new THREE.CylinderGeometry(0.9, 1.3, 0.5, 8), mat(0x2a2e38, { metalness: 0.4 }), { y: 0.25 }));
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.45, 3.4, 8), mat(0x3a3e48, { metalness: 0.4 }), { y: 2.0 }));
  const capMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2.4 });
  g.add(mesh(new THREE.OctahedronGeometry(0.45, 0), capMat, { y: 4.0, cast: false }));
  const beamMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  g.add(mesh(new THREE.CylinderGeometry(0.6, 1.8, 140, 12, 1, true), beamMat, { y: 70, cast: false, receive: false }));
  const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
  const ring = mesh(new THREE.RingGeometry(4.2, 4.6, 48), ringMat, { y: 0.1, cast: false, receive: false });
  ring.rotation.x = -Math.PI / 2;
  g.add(ring);
  const halo = mesh(new THREE.TorusGeometry(1.6, 0.08, 6, 40), new THREE.MeshBasicMaterial({ color: col }), { y: 2.6, cast: false });
  g.add(halo);
  const light = new THREE.PointLight(col, 20, 22, 2);
  light.position.y = 3.5;
  g.add(light);
  g.visible = false;
  return { group: g, beamMat, halo, light, ring };
}

// ---------- drop pod ----------
function makePod() {
  const g = new THREE.Group();
  const hull = mat(0x2b2e36, { metalness: 0.55, roughness: 0.45 });
  const panel = mat(0x3a3e48, { metalness: 0.5, roughness: 0.5 });
  const yellow = mat(0xffd400, { emissive: 0xffd400, emissiveIntensity: 0.15 });
  g.add(mesh(new THREE.CylinderGeometry(1.0, 1.1, 3.4, 12), hull, { y: 1.9 }));
  g.add(mesh(new THREE.ConeGeometry(1.0, 1.4, 12), hull, { y: 4.3 }));
  g.add(mesh(new THREE.TorusGeometry(1.03, 0.07, 6, 28), yellow, { y: 3.0 }).rotateX(Math.PI / 2));
  g.add(mesh(new THREE.TorusGeometry(1.1, 0.07, 6, 28), yellow, { y: 0.6 }).rotateX(Math.PI / 2));
  // panel lines
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const p = mesh(new THREE.BoxGeometry(0.28, 1.6, 0.06), panel, { x: Math.cos(a) * 1.04, y: 1.9, z: Math.sin(a) * 1.04 });
    p.rotation.y = -a + Math.PI / 2;
    g.add(p);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI;
    const fin = mesh(new THREE.BoxGeometry(0.12, 1.4, 0.9), hull, { x: Math.cos(a) * 1.3, y: 0.9, z: Math.sin(a) * 1.3 });
    fin.rotation.y = -a + Math.PI / 2;
    g.add(fin);
    const nozzle = mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.4, 8), panel, { x: Math.cos(a) * 0.6, y: 0.1, z: Math.sin(a) * 0.6 });
    g.add(nozzle);
  }
  const doorGeo = new THREE.BoxGeometry(1.2, 2.5, 0.14);
  doorGeo.translate(0, 1.25, 0);
  const door = mesh(doorGeo, hull, { y: 0.4, z: 1.02 });
  door.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.05), yellow, { y: 1.7, z: 0.09, cast: false }));
  door.add(mesh(new THREE.BoxGeometry(0.9, 0.5, 0.05), panel, { y: 0.8, z: 0.09, cast: false }));
  g.add(door);
  const flame = mesh(
    new THREE.ConeGeometry(0.9, 3.2, 12),
    new THREE.MeshBasicMaterial({ color: 0xffa640, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    { y: -1.4, cast: false, receive: false },
  );
  flame.rotation.x = Math.PI;
  g.add(flame);
  const glow = makeGlowSprite(0xffa640);
  glow.scale.set(8, 8, 1);
  glow.position.y = -1;
  g.add(glow);
  const light = new THREE.PointLight(0xffa640, 60, 40, 2);
  light.position.y = -0.5;
  g.add(light);
  g.visible = false;
  return { group: g, door, flame, glow, light };
}

function makeBurst(color) {
  const n = 220;
  const pos = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.32, transparent: true, opacity: 0, depthWrite: false }));
  pts.frustumCulled = false;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.6, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  let life = -1;
  const origin = new THREE.Vector3();
  return {
    pts, ring,
    start(p, rand) {
      origin.copy(p);
      ring.position.set(p.x, p.y + 0.12, p.z);
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const s = 6 + rand() * 14;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y + 0.3; pos[i * 3 + 2] = p.z;
        vel[i * 3] = Math.cos(a) * s; vel[i * 3 + 1] = 3 + rand() * 10; vel[i * 3 + 2] = Math.sin(a) * s;
      }
      life = 0;
    },
    update(dt) {
      if (life < 0) return;
      life += dt;
      const k = Math.min(1, life / 1.5);
      for (let i = 0; i < n; i++) {
        vel[i * 3 + 1] -= 14 * dt;
        vel[i * 3] *= 0.96; vel[i * 3 + 2] *= 0.96;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] = Math.max(origin.y + 0.1, pos[i * 3 + 1] + vel[i * 3 + 1] * dt);
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      }
      geo.attributes.position.needsUpdate = true;
      pts.material.opacity = 0.9 * (1 - k);
      ring.scale.setScalar(1 + k * 16);
      ring.material.opacity = 0.7 * (1 - k);
      if (k >= 1) life = -1;
    },
  };
}

// =====================================================================
export function createPlanet(planet) {
  const biome = BIOMES[planet.biome] || BIOMES.moon;
  const seedBase = [...planet.id].reduce((a, c) => a + c.charCodeAt(0) * 31, 7);
  const rand = rng(seedBase);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(biome.sky);
  scene.fog = new THREE.Fog(biome.fog, 34, 150);

  // --- lights ---
  scene.add(new THREE.HemisphereLight(biome.hemiSky, biome.hemiGround, biome.hemi));
  const sun = new THREE.DirectionalLight(biome.sun, biome.sunIntensity);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = 55;
  sun.shadow.camera.left = -s; sun.shadow.camera.right = s; sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
  sun.shadow.camera.near = 5; sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(biome.fill, 0.8); // cool rim from the far side for depth
  rim.position.set(-40, 25, -50);
  scene.add(rim);

  // --- sky, stars, moon, orbiting vessel ---
  const skyGroup = new THREE.Group();
  skyGroup.add(makeSky(biome.sky, biome.fog), makeStars(rand));
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(26, 3), new THREE.MeshStandardMaterial({ color: biome.moon, roughness: 1, flatShading: true, fog: false }));
  moon.position.set(-150, 95, -210);
  skyGroup.add(moon);
  const moonGlow = makeGlowSprite(biome.moon);
  moonGlow.position.copy(moon.position);
  moonGlow.scale.set(110, 110, 1);
  moonGlow.material.opacity = 0.35;
  skyGroup.add(moonGlow);
  const orbiter = buildShipModel();
  orbiter.group.scale.setScalar(5);
  orbiter.group.position.set(120, 120, -150);
  orbiter.group.rotation.y = -0.6;
  orbiter.group.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.fog = false; } o.castShadow = false; });
  orbiter.setThrottle(0.4);
  skyGroup.add(orbiter.group);
  scene.add(skyGroup);

  // --- objective layout ---
  const spawn = new THREE.Vector3(0, 0, 0);
  const n = planet.objectives.length;
  const base = rand() * Math.PI * 2;
  const slots = n + 1;
  const terminalPositions = planet.objectives.map((_, i) => {
    const a = base + (i / slots) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const d = 24 + rand() * 14;
    return new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d);
  });
  const beaconAngle = base + (n / slots) * Math.PI * 2;
  const beaconPos = new THREE.Vector3(Math.cos(beaconAngle) * 22, 0, Math.sin(beaconAngle) * 22);
  const anchors = [
    { x: 0, z: 0, r: 8 },
    ...terminalPositions.map((p) => ({ x: p.x, z: p.z, r: 5 })),
    { x: beaconPos.x, z: beaconPos.z, r: 6 },
  ];

  const seed = seedBase % 1000;
  function heightAt(x, z) {
    let h = (fbm(x * 0.028 + seed, z * 0.028 - seed * 0.7, 5) - 0.47) * 17;
    const ridge = 1 - Math.abs(noise2(x * 0.05 + seed * 2, z * 0.05) * 2 - 1);
    h += ridge * ridge * 3.5;
    h += (noise2(x * 0.16 + seed, z * 0.16) - 0.5) * 0.8;
    if (biome.craters) {
      const c = noise2(x * 0.045 + 7, z * 0.045 + 3);
      if (c > 0.72) h -= (c - 0.72) * 30;
    }
    let mask = 1;
    for (const a of anchors) mask = Math.min(mask, smoothstep(a.r, a.r + 10, Math.hypot(x - a.x, z - a.z)));
    h *= mask;
    const d0 = Math.hypot(x, z);
    h += smoothstep(PLAY_RADIUS - 3, PLAY_RADIUS + 22, d0) * 40;
    return h;
  }
  const isWalkable = (x, z) => Math.hypot(x, z) < PLAY_RADIUS - 1.5;

  // --- terrain ---
  {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const g = new THREE.Color(biome.ground), a = new THREE.Color(biome.alt), rock = new THREE.Color(biome.rock), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = heightAt(x, z);
      pos.setY(i, y);
      const slope = Math.abs(heightAt(x + 1, z) - heightAt(x - 1, z)) + Math.abs(heightAt(x, z + 1) - heightAt(x, z - 1));
      const nn = fbm(x * 0.07 + 90, z * 0.07 + 40, 3);
      c.copy(g).lerp(a, smoothstep(0.4, 0.68, nn));
      c.lerp(rock, smoothstep(1.2, 3.2, slope));
      const shade = Math.min(1.25, Math.max(0.5, 0.85 + y * 0.03));
      c.multiplyScalar(shade);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }));
    terrain.receiveShadow = true;
    scene.add(terrain);
  }

  // --- props ---
  const clearOf = (x, z, extra = 0) => {
    for (const an of anchors) if (Math.hypot(x - an.x, z - an.z) < an.r + extra) return false;
    return Math.hypot(x, z) < PLAY_RADIUS + 24;
  };
  const place = (count, factory, { minR = 9, maxR = PLAY_RADIUS + 20 } = {}) => {
    for (let i = 0; i < count; i++) {
      const ang = rand() * Math.PI * 2;
      const d = minR + rand() * (maxR - minR);
      const x = Math.cos(ang) * d, z = Math.sin(ang) * d;
      if (!clearOf(x, z, 1.5)) continue;
      const obj = factory();
      obj.position.set(x, heightAt(x, z), z);
      obj.rotation.y = rand() * Math.PI * 2;
      scene.add(obj);
    }
  };
  const rockColor = new THREE.Color(biome.alt).lerp(new THREE.Color(biome.rock), 0.55).getHex();
  const p = biome.props;
  if (p.rocks) place(p.rocks, () => makeRock(rand, 0.7 + rand() * 2.4, rockColor));
  if (p.spires) place(p.spires, () => makeSpire(rand, 5 + rand() * 12, rockColor), { minR: 14 });
  if (p.crystals) place(p.crystals, () => makeCrystal(rand, 2 + rand() * 3.5, biome.accent));
  if (p.trees) place(p.trees, () => makeDeadTree(rand, 4 + rand() * 5, 0x2b2620));
  const blinkers = [];
  if (p.structures) {
    place(p.structures, () => {
      const st = makeStructure(rand, biome.accent);
      st.traverse((o) => { if (o.name === 'blink') blinkers.push(o); });
      return st;
    }, { minR: 12, maxR: PLAY_RADIUS - 4 });
  }
  place(20, () => makeSpire(rand, 20 + rand() * 24, new THREE.Color(biome.ground).multiplyScalar(0.6).getHex()), { minR: PLAY_RADIUS + 2, maxR: PLAY_RADIUS + 26 });

  // ground scatter (instanced): pebbles / shards / tufts
  {
    const scatterGeo = biome.scatter === 'tufts' ? new THREE.ConeGeometry(0.16, 0.9, 4)
      : biome.scatter === 'shards' ? new THREE.TetrahedronGeometry(0.35, 0)
      : new THREE.DodecahedronGeometry(0.28, 0);
    const scatterColor = biome.scatter === 'tufts' ? 0x6fa55a : biome.scatter === 'shards' ? biome.accent : rockColor;
    const scatterMat = mat(scatterColor, biome.scatter === 'shards' ? { emissive: biome.accent, emissiveIntensity: 0.3 } : {});
    const count = 700;
    const im = new THREE.InstancedMesh(scatterGeo, scatterMat, count);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    let placed = 0;
    for (let tries = 0; tries < count * 3 && placed < count; tries++) {
      const ang = rand() * Math.PI * 2;
      const d = 3 + rand() * (PLAY_RADIUS + 6);
      const x = Math.cos(ang) * d, z = Math.sin(ang) * d;
      const yOff = biome.scatter === 'tufts' ? 0.4 : 0.1;
      v.set(x, heightAt(x, z) + yOff, z);
      e.set(biome.scatter === 'tufts' ? 0 : rand() * 3, rand() * Math.PI * 2, biome.scatter === 'tufts' ? (rand() - 0.5) * 0.4 : rand() * 3);
      q.setFromEuler(e);
      const k = 0.6 + rand() * 1.2;
      sc.set(k, k * (biome.scatter === 'tufts' ? 1 + rand() : 1), k);
      m4.compose(v, q, sc);
      im.setMatrixAt(placed++, m4);
    }
    im.count = placed;
    im.castShadow = biome.scatter !== 'pebbles';
    im.receiveShadow = true;
    scene.add(im);
  }

  // --- ambient dust ---
  const dustN = 600;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (rand() - 0.5) * 150;
    dustPos[i * 3 + 1] = 0.3 + rand() * 14;
    dustPos[i * 3 + 2] = (rand() - 0.5) * 150;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: biome.dust, size: 0.09, transparent: true, opacity: 0.35, depthWrite: false }));
  dust.frustumCulled = false;
  scene.add(dust);

  // --- terminals ---
  const terminals = planet.objectives.map((objective, i) => {
    const t = makeTerminal(biome.accent);
    const pos = terminalPositions[i];
    pos.y = heightAt(pos.x, pos.z);
    t.group.position.copy(pos);
    t.group.rotation.y = Math.atan2(-pos.x, -pos.z);
    scene.add(t.group);
    return { id: `t${i}`, index: i, objective, position: pos, ...t, done: false };
  });
  function completeTerminal(term) {
    term.done = true;
    const green = new THREE.Color(0x3dff8a);
    term.screenMat.color.copy(green); term.screenMat.emissive.copy(green);
    term.lampMat.color.copy(green); term.lampMat.emissive.copy(green);
    term.holoMat.color.copy(green);
    term.light.color.copy(green);
    term.beamMat.opacity = 0.05;
    term.ringMat.opacity = 0.15;
  }

  // --- beacon ---
  const beacon = makeBeacon();
  beaconPos.y = heightAt(beaconPos.x, beaconPos.z);
  beacon.group.position.copy(beaconPos);
  scene.add(beacon.group);

  // --- pod + effects ---
  const pod = makePod();
  scene.add(pod.group);
  const scorch = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
  scorch.rotation.x = -Math.PI / 2;
  scene.add(scorch);
  const burst = makeBurst(biome.dust);
  scene.add(burst.pts, burst.ring);

  let drop = null;
  let extract = null;
  let shake = 0;
  let onEvent = () => {};

  function startDrop(cb) {
    onEvent = cb || onEvent;
    drop = { t: 0, phase: 'falling' };
    pod.group.visible = true;
    pod.flame.visible = true;
    pod.glow.visible = true;
    pod.light.visible = true;
    pod.door.rotation.x = 0;
    pod.group.position.set(spawn.x, DROP_HEIGHT, spawn.z);
    pod.group.rotation.y = 0;
  }

  function startExtract(cb) {
    onEvent = cb || onEvent;
    extract = { t: 0 };
  }

  const FALL = 2.6;
  function update(dt, t, camera, playerPos) {
    skyGroup.position.copy(camera.position);
    orbiter.update(t);
    orbiter.group.position.x = 120 + Math.sin(t * 0.1) * 6;
    burst.update(dt);
    shake = Math.max(0, shake - dt * 2.2);

    for (let i = 0; i < dustN; i++) {
      dustPos[i * 3] += dt * 0.6;
      dustPos[i * 3 + 1] += Math.sin(t + i) * dt * 0.15;
      if (dustPos[i * 3] > 75) dustPos[i * 3] = -75;
    }
    dustGeo.attributes.position.needsUpdate = true;
    for (const b of blinkers) b.visible = Math.sin(t * 3 + b.position.y) > 0;

    for (const term of terminals) {
      term.holo.rotation.y = t * 1.2;
      term.holo.position.y = 2.6 + Math.sin(t * 2 + term.index) * 0.15;
      if (term.done) continue;
      term.ring.scale.setScalar(1 + Math.sin(t * 3 + term.index) * 0.05);
      term.lampMat.emissiveIntensity = 1.4 + Math.sin(t * 6 + term.index) * 1;
    }
    if (beacon.group.visible) {
      beacon.halo.rotation.y = t * 1.5;
      beacon.halo.position.y = 2.6 + Math.sin(t * 2) * 0.3;
      beacon.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
    }

    if (drop) {
      drop.t += dt;
      if (drop.phase === 'falling') {
        const k = Math.min(1, drop.t / FALL);
        pod.group.position.y = spawn.y + DROP_HEIGHT * (1 - k * k);
        pod.flame.scale.setScalar(1 + Math.sin(t * 60) * 0.15);
        pod.group.rotation.y = k * 1.2;
        if (k >= 1) {
          drop.phase = 'impact';
          drop.t = 0;
          pod.flame.visible = false;
          pod.glow.visible = false;
          pod.light.visible = false;
          burst.start(pod.group.position, rand);
          scorch.position.set(spawn.x, spawn.y + 0.06, spawn.z);
          scorch.material.opacity = 0.45;
          shake = 1;
          onEvent('impact');
        }
      } else if (drop.phase === 'impact') {
        if (drop.t > 0.6) { drop.phase = 'opening'; drop.t = 0; onEvent('door'); }
      } else if (drop.phase === 'opening') {
        const k = Math.min(1, drop.t / 0.5);
        pod.door.rotation.x = k * k * 1.5;
        if (k >= 1) { drop.phase = 'done'; onEvent('opened'); }
      }
    }

    if (extract) {
      extract.t += dt;
      const k = Math.min(1, extract.t / 1.8);
      beacon.beamMat.opacity = 0.22 + k * 0.6;
      beacon.light.intensity = 20 + k * 140;
      if (k >= 1) { extract = null; onEvent('extracted'); }
    }

    if (playerPos) {
      sun.position.set(playerPos.x + 30, playerPos.y + 50, playerPos.z + 20);
      sun.target.position.copy(playerPos);
    }
  }

  function dispose() {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
  }

  return {
    scene, biome, spawn, heightAt, isWalkable, terminals, beacon, pod, sun,
    completeTerminal,
    showBeacon: () => { beacon.group.visible = true; },
    startDrop, startExtract, update, dispose,
    get shake() { return shake; },
    get podPosition() { return pod.group.position; },
    get dropPhase() { return drop ? drop.phase : null; },
    get extracting() { return !!extract; },
  };
}
