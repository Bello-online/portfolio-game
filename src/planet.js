import * as THREE from 'three';
import { BIOMES } from './biomes.js';
import { fbm, noise2, smoothstep, rng } from './noise.js';

export const PLAY_RADIUS = 62;
const TERRAIN_SIZE = 240;
const TERRAIN_SEGS = 120;

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

// ---------- sky dome ----------
function makeSky(top, bottom) {
  const geo = new THREE.SphereGeometry(300, 24, 16);
  const material = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 top; uniform vec3 bottom; varying vec3 vP;
      void main(){
        float h = normalize(vP).y;
        float k = smoothstep(-0.02, 0.45, h);
        vec3 c = mix(bottom, top, k);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const m = new THREE.Mesh(geo, material);
  m.renderOrder = -10;
  return m;
}

function makeStars(rand) {
  const n = 900;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(rand() * 0.9 + 0.1); // upper hemisphere only
    const r = 280;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph);
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.7, fog: false }));
}

// ---------- props ----------
function makeRock(rand, scale, color) {
  const geo = jitter(new THREE.DodecahedronGeometry(scale, 0), scale * 0.5, rand);
  const m = mesh(geo, mat(color), { y: scale * 0.35 });
  m.rotation.set(rand() * Math.PI, rand() * Math.PI, 0);
  m.scale.set(1 + rand() * 0.6, 0.6 + rand() * 0.6, 1 + rand() * 0.6);
  return m;
}

function makeSpire(rand, h, color) {
  const geo = jitter(new THREE.ConeGeometry(h * 0.22, h, 6), h * 0.06, rand);
  const m = mesh(geo, mat(color), { y: h / 2 - 0.4 });
  m.rotation.z = (rand() - 0.5) * 0.25;
  m.rotation.x = (rand() - 0.5) * 0.25;
  return m;
}

function makeCrystal(rand, h, accent) {
  const g = new THREE.Group();
  const m = mat(accent, { emissive: accent, emissiveIntensity: 0.6, roughness: 0.3, transparent: true, opacity: 0.92 });
  const n = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const hh = h * (0.5 + rand() * 0.7);
    const c = mesh(new THREE.OctahedronGeometry(hh * 0.25, 0), m, { x: (rand() - 0.5) * 1.2, y: hh * 0.35, z: (rand() - 0.5) * 1.2 });
    c.scale.y = 2.6;
    c.rotation.set((rand() - 0.5) * 0.6, rand() * Math.PI, (rand() - 0.5) * 0.6);
    g.add(c);
  }
  const light = new THREE.PointLight(accent, 3, 9, 2);
  light.position.y = h * 0.4;
  g.add(light);
  return g;
}

function makeDeadTree(rand, h, color) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.12, 0.35, h, 6), mat(color), { y: h / 2 });
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

// ---------- terminal (objective) ----------
function makeTerminal(accent) {
  const g = new THREE.Group();
  const dark = mat(0x1c1e24, { metalness: 0.3, roughness: 0.6 });
  const steel = mat(0x4a4e58, { metalness: 0.4, roughness: 0.5 });
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.3, 1.6), steel, { y: 0.15 })); // plinth
  g.add(mesh(new THREE.BoxGeometry(1.5, 1.1, 0.9), dark, { y: 0.85 })); // console body
  const screenMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.1, roughness: 0.3 });
  const screen = mesh(new THREE.BoxGeometry(1.3, 0.75, 0.08), screenMat, { y: 1.55, z: 0.3, cast: false });
  screen.rotation.x = -0.55;
  g.add(screen);
  g.add(mesh(new THREE.BoxGeometry(1.3, 0.08, 0.5), steel, { y: 1.25, z: 0.55 })); // keyboard ledge
  // hazard stripe
  const stripe = mesh(new THREE.BoxGeometry(1.52, 0.18, 0.92), mat(0xffd400, { emissive: 0xffd400, emissiveIntensity: 0.2 }), { y: 0.45 });
  g.add(stripe);
  // antenna + beacon light
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 6), steel, { x: -0.6, y: 2.6, z: -0.35 }));
  const lampMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2 });
  const lamp = mesh(new THREE.SphereGeometry(0.16, 8, 6), lampMat, { x: -0.6, y: 4.25, z: -0.35, cast: false });
  g.add(lamp);
  // sky beam so it's visible from far away
  const beamMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const beam = mesh(new THREE.CylinderGeometry(0.18, 0.7, 60, 10, 1, true), beamMat, { y: 30, cast: false, receive: false });
  g.add(beam);
  const ringMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const ring = mesh(new THREE.RingGeometry(3.6, 3.9, 40), ringMat, { y: 0.08, cast: false, receive: false });
  ring.rotation.x = -Math.PI / 2;
  g.add(ring);
  const light = new THREE.PointLight(accent, 12, 14, 2);
  light.position.set(0, 2.2, 1);
  g.add(light);
  return { group: g, screenMat, lampMat, beamMat, ringMat, light, ring };
}

// ---------- extraction beacon ----------
function makeBeacon() {
  const g = new THREE.Group();
  const col = 0x9fdcff;
  g.add(mesh(new THREE.CylinderGeometry(0.9, 1.3, 0.5, 8), mat(0x2a2e38, { metalness: 0.4 }), { y: 0.25 }));
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.45, 3.4, 8), mat(0x3a3e48, { metalness: 0.4 }), { y: 2.0 }));
  const capMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2.2 });
  g.add(mesh(new THREE.OctahedronGeometry(0.45, 0), capMat, { y: 4.0, cast: false }));
  const beamMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const beam = mesh(new THREE.CylinderGeometry(0.6, 1.6, 120, 12, 1, true), beamMat, { y: 60, cast: false, receive: false });
  g.add(beam);
  const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
  const ring = mesh(new THREE.RingGeometry(4.2, 4.6, 48), ringMat, { y: 0.08, cast: false, receive: false });
  ring.rotation.x = -Math.PI / 2;
  g.add(ring);
  const halo = mesh(new THREE.TorusGeometry(1.6, 0.08, 6, 40), new THREE.MeshBasicMaterial({ color: col }), { y: 2.6, cast: false });
  g.add(halo);
  const light = new THREE.PointLight(col, 18, 20, 2);
  light.position.y = 3.5;
  g.add(light);
  g.visible = false;
  return { group: g, beamMat, halo, light, ring };
}

// ---------- drop pod ----------
function makePod() {
  const g = new THREE.Group();
  const hull = mat(0x2b2e36, { metalness: 0.55, roughness: 0.45 });
  const yellow = mat(0xffd400, { emissive: 0xffd400, emissiveIntensity: 0.15 });
  g.add(mesh(new THREE.CylinderGeometry(1.0, 1.1, 3.4, 10), hull, { y: 1.9 }));
  g.add(mesh(new THREE.ConeGeometry(1.0, 1.3, 10), hull, { y: 4.25 }));
  g.add(mesh(new THREE.TorusGeometry(1.03, 0.07, 6, 24), yellow, { y: 3.0 }).rotateX(Math.PI / 2));
  g.add(mesh(new THREE.TorusGeometry(1.1, 0.07, 6, 24), yellow, { y: 0.6 }).rotateX(Math.PI / 2));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI;
    const fin = mesh(new THREE.BoxGeometry(0.12, 1.4, 0.8), hull, { x: Math.cos(a) * 1.25, y: 0.9, z: Math.sin(a) * 1.25 });
    fin.rotation.y = -a + Math.PI / 2;
    g.add(fin);
  }
  // door: pivots at its bottom edge and falls open towards +z
  const doorGeo = new THREE.BoxGeometry(1.2, 2.5, 0.14);
  doorGeo.translate(0, 1.25, 0);
  const door = mesh(doorGeo, hull, { y: 0.4, z: 1.02 });
  door.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.05), yellow, { y: 1.7, z: 0.09, cast: false }));
  g.add(door);
  // thruster glow
  const flame = mesh(
    new THREE.ConeGeometry(0.8, 2.6, 10),
    new THREE.MeshBasicMaterial({ color: 0xffa640, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    { y: -1.1, cast: false, receive: false },
  );
  flame.rotation.x = Math.PI;
  g.add(flame);
  const light = new THREE.PointLight(0xffa640, 40, 30, 2);
  light.position.y = -0.5;
  g.add(light);
  g.visible = false;
  return { group: g, door, flame, light };
}

// ---------- impact dust ----------
function makeBurst(color) {
  const n = 160;
  const pos = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.3, transparent: true, opacity: 0, depthWrite: false }));
  pts.frustumCulled = false;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.6, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
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
        const s = 6 + rand() * 12;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y + 0.3; pos[i * 3 + 2] = p.z;
        vel[i * 3] = Math.cos(a) * s; vel[i * 3 + 1] = 3 + rand() * 9; vel[i * 3 + 2] = Math.sin(a) * s;
      }
      life = 0;
    },
    update(dt) {
      if (life < 0) return;
      life += dt;
      const k = Math.min(1, life / 1.4);
      for (let i = 0; i < n; i++) {
        vel[i * 3 + 1] -= 14 * dt;
        vel[i * 3] *= 0.96; vel[i * 3 + 2] *= 0.96;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] = Math.max(origin.y + 0.1, pos[i * 3 + 1] + vel[i * 3 + 1] * dt);
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      }
      geo.attributes.position.needsUpdate = true;
      pts.material.opacity = 0.9 * (1 - k);
      ring.scale.setScalar(1 + k * 14);
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
  scene.fog = new THREE.Fog(biome.fog, 28, 120);

  // --- lights ---
  scene.add(new THREE.HemisphereLight(biome.hemiSky, biome.hemiGround, biome.hemi));
  const sun = new THREE.DirectionalLight(biome.sun, biome.sunIntensity);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = 48;
  sun.shadow.camera.left = -s; sun.shadow.camera.right = s; sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
  sun.shadow.camera.near = 5; sun.shadow.camera.far = 160;
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  // --- sky & stars follow the camera ---
  const skyGroup = new THREE.Group();
  skyGroup.add(makeSky(biome.sky, biome.fog), makeStars(rand));
  scene.add(skyGroup);

  // --- objective layout (decided before the terrain so it can be flattened there) ---
  const spawn = new THREE.Vector3(0, 0, 0);
  const n = planet.objectives.length;
  const base = rand() * Math.PI * 2;
  const slots = n + 1;
  const terminalPositions = planet.objectives.map((_, i) => {
    const a = base + (i / slots) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const d = 22 + rand() * 14;
    return new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d);
  });
  const beaconAngle = base + (n / slots) * Math.PI * 2;
  const beaconPos = new THREE.Vector3(Math.cos(beaconAngle) * 20, 0, Math.sin(beaconAngle) * 20);
  const anchors = [
    { x: 0, z: 0, r: 7 },
    ...terminalPositions.map((p) => ({ x: p.x, z: p.z, r: 5 })),
    { x: beaconPos.x, z: beaconPos.z, r: 6 },
  ];

  const seed = seedBase % 1000;
  function heightAt(x, z) {
    let h = (fbm(x * 0.03 + seed, z * 0.03 - seed * 0.7, 4) - 0.47) * 15;
    h += (noise2(x * 0.14 + seed, z * 0.14) - 0.5) * 0.7;
    let mask = 1;
    for (const a of anchors) mask = Math.min(mask, smoothstep(a.r, a.r + 9, Math.hypot(x - a.x, z - a.z)));
    h *= mask;
    const d0 = Math.hypot(x, z);
    h += smoothstep(PLAY_RADIUS - 3, PLAY_RADIUS + 18, d0) * 34; // cliff wall around the play area
    return h;
  }
  const isWalkable = (x, z) => Math.hypot(x, z) < PLAY_RADIUS - 1.5;

  // --- terrain ---
  {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const g = new THREE.Color(biome.ground), a = new THREE.Color(biome.alt), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = heightAt(x, z);
      pos.setY(i, y);
      const nn = fbm(x * 0.07 + 90, z * 0.07 + 40, 3);
      c.copy(g).lerp(a, smoothstep(0.4, 0.68, nn));
      const shade = Math.min(1.2, Math.max(0.55, 0.85 + y * 0.025));
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
    return Math.hypot(x, z) < PLAY_RADIUS + 20;
  };
  const place = (count, factory, { minR = 8, maxR = PLAY_RADIUS + 18 } = {}) => {
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
  const rockColor = new THREE.Color(biome.alt).lerp(new THREE.Color(biome.ground), 0.4).getHex();
  const p = biome.props;
  if (p.rocks) place(p.rocks, () => makeRock(rand, 0.6 + rand() * 2.2, rockColor));
  if (p.spires) place(p.spires, () => makeSpire(rand, 5 + rand() * 12, rockColor), { minR: 14 });
  if (p.crystals) place(p.crystals, () => makeCrystal(rand, 2 + rand() * 3.5, biome.accent));
  if (p.trees) place(p.trees, () => makeDeadTree(rand, 4 + rand() * 5, 0x2b2620));
  // big background silhouettes on the cliff ring
  place(18, () => makeSpire(rand, 18 + rand() * 20, new THREE.Color(biome.ground).multiplyScalar(0.7).getHex()), { minR: PLAY_RADIUS + 2, maxR: PLAY_RADIUS + 22 });

  // --- ambient dust ---
  const dustN = 500;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (rand() - 0.5) * 140;
    dustPos[i * 3 + 1] = 0.3 + rand() * 12;
    dustPos[i * 3 + 2] = (rand() - 0.5) * 140;
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
    t.group.rotation.y = Math.atan2(-pos.x, -pos.z); // face the spawn
    scene.add(t.group);
    return { id: `t${i}`, index: i, objective, position: pos, ...t, done: false };
  });
  function completeTerminal(term) {
    term.done = true;
    const green = new THREE.Color(0x3dff8a);
    term.screenMat.color.copy(green); term.screenMat.emissive.copy(green);
    term.lampMat.color.copy(green); term.lampMat.emissive.copy(green);
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
  const burst = makeBurst(biome.dust);
  scene.add(burst.pts, burst.ring);

  let drop = null;    // { t, phase }
  let extract = null; // { t }
  let shake = 0;
  let onEvent = () => {};

  function startDrop(cb) {
    onEvent = cb || onEvent;
    drop = { t: 0, phase: 'falling' };
    pod.group.visible = true;
    pod.flame.visible = true;
    pod.light.visible = true;
    pod.door.rotation.x = 0;
    pod.group.position.set(spawn.x, 170, spawn.z);
    pod.group.rotation.y = 0;
  }

  function startExtract(cb) {
    onEvent = cb || onEvent;
    extract = { t: 0 };
  }

  const FALL = 1.7;
  function update(dt, t, camera, playerPos) {
    skyGroup.position.copy(camera.position);
    burst.update(dt);
    shake = Math.max(0, shake - dt * 2.2);

    // dust drift
    for (let i = 0; i < dustN; i++) {
      dustPos[i * 3] += dt * 0.6;
      dustPos[i * 3 + 1] += Math.sin(t + i) * dt * 0.15;
      if (dustPos[i * 3] > 70) dustPos[i * 3] = -70;
    }
    dustGeo.attributes.position.needsUpdate = true;

    for (const term of terminals) {
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
        pod.group.position.y = spawn.y + 170 * (1 - k * k);
        pod.flame.scale.setScalar(1 + Math.sin(t * 60) * 0.15);
        if (k >= 1) {
          drop.phase = 'impact';
          drop.t = 0;
          pod.flame.visible = false;
          pod.light.visible = false;
          burst.start(pod.group.position, rand);
          shake = 1;
          onEvent('impact');
        }
      } else if (drop.phase === 'impact') {
        if (drop.t > 0.55) {
          drop.phase = 'opening';
          drop.t = 0;
          onEvent('door');
        }
      } else if (drop.phase === 'opening') {
        const k = Math.min(1, drop.t / 0.5);
        pod.door.rotation.x = k * k * 1.5;
        if (k >= 1) {
          drop.phase = 'done';
          onEvent('opened');
        }
      }
    }

    if (extract) {
      extract.t += dt;
      const k = Math.min(1, extract.t / 1.5);
      beacon.beamMat.opacity = 0.22 + k * 0.6;
      beacon.light.intensity = 18 + k * 120;
      if (k >= 1) {
        extract = null;
        onEvent('extracted');
      }
    }

    // keep the shadow frustum on the player
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
  };
}
