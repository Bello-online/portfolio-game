import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';
import { BIOMES } from './biomes.js';
import { rng } from './noise.js';
import { buildShipModel } from './shipmodel.js';
import { planetMaps, cloudMap, starMap, flareTextures, softCircle } from './textures.js';

const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeIn = (k) => k * k * k;

// flight timing (seconds)
const CRUISE = 2.6, ORBIT = 1.1, POD = 1.4;

/**
 * The campaign map: planets orbit a star, the deployment vessel flies between
 * them, and the camera switches between a slow overview orbit and a chase cam.
 */
export function createShip(planets) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050a);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 1500);
  const rand = rng(4242);

  // ---------------- background ----------------
  {
    const n = 3200;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 420 + rand() * 160;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(rand() * 2 - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      const c = 0.5 + rand() * 0.5;
      const warm = rand() > 0.8;
      col[i * 3] = c; col[i * 3 + 1] = c * (warm ? 0.85 : 0.95); col[i * 3 + 2] = c * (warm ? 0.6 : 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.7, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.9 })));
  }
  [[0x3a5fd9, -260, 80, -300, 420], [0x8a3fd9, 300, -40, -220, 360], [0xd94f8a, -120, -120, 320, 300], [0x2fb5a8, 260, 140, 260, 280]].forEach(([c, x, y, z, s]) => {
    const sp = makeGlowSprite(c, 0.55);
    sp.position.set(x, y, z);
    sp.scale.set(s, s * 0.7, 1);
    sp.material.opacity = 0.22;
    scene.add(sp);
  });
  // near-field space dust for parallax during flight
  const dustTex = softCircle();
  {
    const n = 1600;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 140;
      pos[i * 3 + 1] = (rand() - 0.5) * 50;
      pos[i * 3 + 2] = (rand() - 0.5) * 140;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb8d8, size: 0.35, map: dustTex, transparent: true, opacity: 0.5, depthWrite: false })));
  }

  const grid = new THREE.GridHelper(260, 52, 0x1c4a6b, 0x0f2a3f);
  grid.position.y = -1.2;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  // ---------------- star ----------------
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3.6, 48, 32), new THREE.MeshBasicMaterial({ map: starMap(3) }));
  scene.add(sun);
  const corona = makeGlowSprite(0xffb347);
  corona.scale.set(12, 12, 1);
  scene.add(corona);
  const corona2 = makeGlowSprite(0xffe8a0);
  corona2.scale.set(8, 8, 1);
  scene.add(corona2);
  const flareTex = flareTextures();
  const flare = new Lensflare();
  flare.addElement(new LensflareElement(flareTex.core, 300, 0, new THREE.Color(0xffe0b0)));
  flare.addElement(new LensflareElement(flareTex.ring, 70, 0.3, new THREE.Color(0xffd400)));
  flare.addElement(new LensflareElement(flareTex.ring, 120, 0.55, new THREE.Color(0xff9a5a)));
  flare.addElement(new LensflareElement(flareTex.core, 50, 0.8, new THREE.Color(0x9fe8ff)));
  scene.add(flare);
  const sunLight = new THREE.PointLight(0xffe0b0, 1100, 0, 2);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x4a5a78, 1.1));
  const fill = new THREE.DirectionalLight(0x5f7fbf, 0.7);
  fill.position.set(-30, 40, 20);
  scene.add(fill);

  // ---------------- asteroid belt ----------------
  const belt = new THREE.Group();
  {
    const count = 700;
    const geo = new THREE.DodecahedronGeometry(0.35, 0);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0x8a8e98, roughness: 1, flatShading: true }), count);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = 36.4 + (rand() - 0.5) * 3.2;
      v.set(Math.cos(a) * r, (rand() - 0.5) * 1.2, Math.sin(a) * r);
      e.set(rand() * 3, rand() * 3, rand() * 3);
      q.setFromEuler(e);
      const k = 0.3 + rand() * rand() * 1.6;
      sc.set(k, k * (0.6 + rand() * 0.8), k);
      m4.compose(v, q, sc);
      im.setMatrixAt(i, m4);
    }
    belt.add(im);
    scene.add(belt);
  }

  // ---------------- planets ----------------
  const items = planets.map((planet, i) => {
    const biome = BIOMES[planet.biome] || BIOMES.moon;
    const radius = 2.3 + (i % 3) * 0.4;
    const orbit = 14 + i * 5.6;
    const g = new THREE.Group();

    const maps = planetMaps(biome, i + 1);
    const body = new THREE.Mesh(
      displaced(new THREE.SphereGeometry(radius, 96, 64), radius, i, rand),
      new THREE.MeshStandardMaterial({ map: maps.map, normalMap: maps.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.9, metalness: 0 }),
    );
    if (biome.lava) { body.material.emissive = new THREE.Color(0xff3a00); body.material.emissiveIntensity = 0.1; }
    if (biome.planetSea) { body.material.roughness = 0.6; body.material.metalness = 0.15; }
    body.rotation.z = (rand() - 0.5) * 0.5;
    g.add(body);

    let clouds = null;
    if (biome.clouds) {
      clouds = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.045, 48, 32),
        new THREE.MeshStandardMaterial({ map: cloudMap(i + 7), transparent: true, opacity: biome.clouds, depthWrite: false, roughness: 1 }),
      );
      clouds.rotation.z = body.rotation.z;
      g.add(clouds);
    }
    g.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 1.14, 48, 32), makeAtmosphereMaterial(biome.fog, 2.6)));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 1.3, 48, 32), makeAtmosphereMaterial(biome.fog, 5.0, 0.35)));

    if (biome.rings) g.add(makeRings(radius, rand));
    let moonlet = null;
    if (biome.moonlet) {
      moonlet = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.22, 1), new THREE.MeshStandardMaterial({ color: 0x9aa3b0, roughness: 1, flatShading: true }));
      g.add(moonlet);
    }

    const pick = new THREE.Mesh(new THREE.SphereGeometry(radius * 2.0, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    pick.userData.index = i;
    g.add(pick);

    const libRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.65, 0.08, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffd400 }));
    libRing.rotation.x = Math.PI / 2 - 0.35;
    libRing.visible = false;
    g.add(libRing);
    const flag = new THREE.Group();
    flag.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5), new THREE.MeshBasicMaterial({ color: 0xffffff })));
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), new THREE.MeshBasicMaterial({ color: 0xffd400, side: THREE.DoubleSide }));
    cloth.position.set(0.55, 0.75, 0);
    flag.add(cloth);
    flag.position.y = radius + 1.1;
    flag.visible = false;
    g.add(flag);

    const pts = [];
    for (let k = 0; k <= 160; k++) {
      const a = (k / 160) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * orbit, 0, Math.sin(a) * orbit));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x2a5a7f, transparent: true, opacity: 0.5 })));

    scene.add(g);
    return {
      planet, index: i, group: g, body, clouds, pick, libRing, flag, moonlet, radius, orbit,
      angle: i * 1.15 + 0.6,
      speed: 0.03 / (1 + i * 0.35),
      spin: 0.12 + rand() * 0.15,
      liberated: false,
    };
  });

  // ---------------- reticle + link ----------------
  const reticle = new THREE.Group();
  const retMat = new THREE.MeshBasicMaterial({ color: 0xffd400, transparent: true, opacity: 0.9 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 64), retMat);
  ring.rotation.x = Math.PI / 2;
  reticle.add(ring);
  for (let k = 0; k < 4; k++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.8), retMat);
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    tick.position.set(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3);
    tick.rotation.y = -a;
    reticle.add(tick);
  }
  scene.add(reticle);
  const linkGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const link = new THREE.Line(linkGeo, new THREE.LineDashedMaterial({ color: 0xffd400, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.55 }));
  scene.add(link);

  // ---------------- the vessel ----------------
  const vessel = buildShipModel();
  vessel.group.scale.setScalar(0.85);
  vessel.group.position.set(6, 2.5, 48);
  vessel.group.lookAt(0, 2.5, 0);
  scene.add(vessel.group);

  const streakCount = 90;
  const streakPos = new Float32Array(streakCount * 6);
  for (let i = 0; i < streakCount; i++) {
    const a = rand() * Math.PI * 2;
    const r = 1.5 + rand() * 5;
    const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.6;
    const z0 = -2 - rand() * 10;
    const len = 4 + rand() * 10;
    streakPos.set([x, y, z0, x, y, z0 - len], i * 6);
  }
  const streakGeo = new THREE.BufferGeometry();
  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
  const streakMat = new THREE.LineBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  vessel.group.add(streaks);

  // drop pod for the orbit → surface launch shot
  const pod = new THREE.Group();
  const podMat = new THREE.MeshStandardMaterial({ color: 0x2b2e36, metalness: 0.5, roughness: 0.5, flatShading: true });
  const podBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.8, 8), podMat);
  const podNose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 8), podMat);
  podNose.position.y = 0.55;
  const podStripe = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 6, 16), new THREE.MeshBasicMaterial({ color: 0xffd400 }));
  podStripe.rotation.x = Math.PI / 2;
  podStripe.position.y = 0.2;
  const podFlame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 8), new THREE.MeshBasicMaterial({ color: 0xffa640, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  podFlame.position.y = -0.8;
  podFlame.rotation.x = Math.PI;
  const podGlow = makeGlowSprite(0xffa640);
  podGlow.scale.set(2.2, 2.2, 1);
  podGlow.position.y = -0.6;
  pod.add(podBody, podNose, podStripe, podFlame, podGlow);
  pod.visible = false;
  scene.add(pod);

  // ---------------- camera + flight state ----------------
  let selected = 0;
  let camAngle = 0.6;
  let camMode = 'overview';
  const camPos = new THREE.Vector3(Math.sin(camAngle) * 58, 32, Math.cos(camAngle) * 58);
  const camLook = new THREE.Vector3(0, -2, 0);
  const desiredPos = new THREE.Vector3();
  const desiredLook = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmp3 = new THREE.Vector3();
  const planetWorld = new THREE.Vector3();
  let flight = null;
  let freezeOrbits = false;

  function worldPos(it) {
    return it.group.getWorldPosition(planetWorld);
  }

  function startFlight(index, cb) {
    const it = items[index];
    scene.attach(vessel.group);
    flight = { phase: 'fly', t: 0, D: CRUISE, from: vessel.group.position.clone(), target: it, cb };
    freezeOrbits = true;
    camMode = 'chase';
    vessel.setThrottle(1);
  }

  function showOverview() {
    flight = null;
    pod.visible = false;
    streakMat.opacity = 0;
    freezeOrbits = false;
    camMode = 'overview';
    vessel.setThrottle(0.35);
  }

  function arrivalPoint(it, out) {
    // park on the star-facing side: the camera looks at a front-lit planet with the star behind it
    const p = worldPos(it);
    tmp2.copy(p).setY(0).normalize().negate();
    return out.copy(p).addScaledVector(tmp2, it.radius * 3.6).add(tmp3.set(0, it.radius * 0.8, 0));
  }

  function update(dt, t) {
    if (!freezeOrbits) for (const it of items) it.angle += it.speed * dt;
    for (const it of items) {
      it.group.position.set(Math.cos(it.angle) * it.orbit, 0, Math.sin(it.angle) * it.orbit);
      it.body.rotation.y += it.spin * dt;
      if (it.clouds) it.clouds.rotation.y += it.spin * 1.35 * dt;
      if (it.moonlet) {
        it.moonlet.position.set(Math.cos(t * 0.9 + it.index) * it.radius * 1.9, Math.sin(t * 0.9) * 0.5, Math.sin(t * 0.9 + it.index) * it.radius * 1.9);
      }
      if (it.flag.visible) it.flag.rotation.y = t * 0.8;
    }
    belt.rotation.y = t * 0.012;
    sun.rotation.y = t * 0.05;
    vessel.update(t);
    corona.material.rotation = t * 0.05;
    corona2.material.rotation = -t * 0.08;

    const sel = items[selected];
    const selPos = worldPos(sel);
    reticle.position.copy(selPos);
    reticle.scale.setScalar(sel.radius * 1.75 * (1 + Math.sin(t * 5) * 0.04));
    reticle.rotation.y = t * 0.9;
    reticle.visible = camMode === 'overview';
    link.visible = camMode === 'overview';
    const arr = linkGeo.attributes.position.array;
    arr[3] = selPos.x; arr[4] = selPos.y; arr[5] = selPos.z;
    linkGeo.attributes.position.needsUpdate = true;
    link.computeLineDistances();

    if (flight) {
      flight.t += dt;
      const it = flight.target;
      const pPos = worldPos(it);
      if (flight.phase === 'fly') {
        const k = Math.min(1, flight.t / flight.D);
        const e = easeInOut(k);
        const to = arrivalPoint(it, tmp);
        const lift = Math.sin(k * Math.PI) * 7;
        const pos = vessel.group.position;
        pos.lerpVectors(flight.from, to, e);
        pos.y += lift;
        const e2 = easeInOut(Math.min(1, k + 0.02));
        tmp2.lerpVectors(flight.from, to, e2);
        tmp2.y += Math.sin(Math.min(1, k + 0.02) * Math.PI) * 7;
        if (tmp2.distanceToSquared(pos) > 1e-4) vessel.group.lookAt(tmp2);
        vessel.group.rotateZ(Math.sin(k * Math.PI) * 0.25);
        const warp = Math.sin(k * Math.PI);
        streakMat.opacity = warp * 0.8;
        streaks.scale.z = 0.5 + warp * 1.5;
        vessel.setThrottle(0.6 + warp * 0.4);
        vessel.group.getWorldDirection(tmp3);
        desiredPos.copy(pos).addScaledVector(tmp3, -11).add(tmp2.set(0, 4.2, 0));
        desiredLook.copy(pos).addScaledVector(tmp3, 8);
        if (k > 0.75) desiredLook.lerp(pPos, (k - 0.75) / 0.25);
        if (k >= 1) {
          flight.phase = 'orbit';
          flight.t = 0;
          streakMat.opacity = 0;
          vessel.setThrottle(0.3);
          it.group.attach(vessel.group);
        }
      } else if (flight.phase === 'orbit') {
        const k = Math.min(1, flight.t / ORBIT);
        vessel.group.getWorldPosition(tmp);
        vessel.group.lookAt(pPos.x, tmp.y, pPos.z);
        tmp3.subVectors(tmp, pPos).normalize();
        tmp2.crossVectors(tmp3, new THREE.Vector3(0, 1, 0)).normalize();
        desiredPos.copy(tmp).addScaledVector(tmp2, 15 - k * 3).add(new THREE.Vector3(0, 4.5, 0)).addScaledVector(tmp3, 4);
        desiredLook.lerpVectors(tmp, pPos, 0.5);
        if (k >= 1) {
          flight.phase = 'pod';
          flight.t = 0;
          pod.visible = true;
          pod.position.copy(tmp);
          flight.podFrom = tmp.clone();
          flight.podTo = pPos.clone().addScaledVector(tmp3, it.radius * 0.9);
        }
      } else if (flight.phase === 'pod') {
        const k = Math.min(1, flight.t / POD);
        const e = easeIn(k);
        pod.position.lerpVectors(flight.podFrom, flight.podTo, e);
        pod.lookAt(flight.podTo);
        pod.rotateX(Math.PI / 2);
        pod.scale.setScalar(0.9 + k * 0.6);
        podGlow.scale.setScalar(1.5 + e * 6);
        podFlame.scale.y = 1 + e * 3;
        tmp3.subVectors(flight.podFrom, pPos).normalize();
        tmp2.crossVectors(tmp3, new THREE.Vector3(0, 1, 0)).normalize();
        desiredPos.copy(pod.position).addScaledVector(tmp2, 4.5 + k * 2).addScaledVector(tmp3, 3 + k * 5).add(new THREE.Vector3(0, 1.4, 0));
        desiredLook.copy(pod.position).lerp(pPos, 0.25 + k * 0.35);
        if (k >= 1) {
          const cb = flight.cb;
          flight = { phase: 'hold', t: 0, target: it, cb: null };
          cb?.();
        }
      }
    }

    if (camMode === 'overview') {
      camAngle += dt * 0.04;
      desiredPos.set(Math.sin(camAngle) * 58, 32, Math.cos(camAngle) * 58);
      desiredLook.set(0, -2, 0);
    }
    const holding = flight && flight.phase === 'hold';
    if (!holding) {
      const k = camMode === 'overview' ? 1 - Math.pow(0.15, dt) : 1 - Math.pow(0.002, dt);
      camPos.lerp(desiredPos, k);
      camLook.lerp(desiredLook, k);
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  }

  function pick(ndcX, ndcY) {
    raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
    const hits = raycaster.intersectObjects(items.map((it) => it.pick), false);
    return hits.length ? hits[0].object.userData.index : null;
  }

  function planetScreen(width, height) {
    return items.map((it) => {
      worldPos(it);
      tmp.copy(planetWorld);
      tmp.y += it.radius + 0.8;
      tmp.project(camera);
      return {
        id: it.planet.id, index: it.index,
        x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height,
        visible: tmp.z < 1 && camMode === 'overview',
        liberated: it.liberated,
      };
    });
  }

  function setLiberated(id) {
    const it = items.find((x) => x.planet.id === id);
    if (!it) return;
    it.liberated = true;
    it.libRing.visible = true;
    it.flag.visible = true;
  }

  function resize(aspect) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }

  return {
    scene, camera, update, pick, planetScreen, setLiberated, resize, startFlight, showOverview,
    get selected() { return selected; },
    set selected(i) { selected = ((i % items.length) + items.length) % items.length; },
    get flying() { return camMode === 'chase'; },
    count: items.length,
    items,
  };
}

// ---------------------------------------------------------------- helpers
/** Gentle radial displacement so the silhouette isn't a perfect sphere (UVs stay intact). */
function displaced(geo, radius, seed, rand) {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    const n = Math.sin(v.x * 5 + seed) * Math.sin(v.y * 4 - seed) * Math.sin(v.z * 6 + seed * 2);
    v.multiplyScalar(radius * (1 + n * 0.025));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function makeAtmosphereMaterial(color, power = 3, strength = 0.9) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, power: { value: power }, strength: { value: strength } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      uniform vec3 color; uniform float power; uniform float strength; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), power); gl_FragColor = vec4(color * 1.4, f * strength);
      #include <tonemapping_fragment>
      #include <colorspace_fragment> }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
  });
}

function makeRings(radius, rand) {
  const inner = radius * 1.45, outer = radius * 2.4;
  const geo = new THREE.RingGeometry(inner, outer, 96, 8);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i));
    const k = (r - inner) / (outer - inner);
    const band = 0.45 + 0.55 * Math.abs(Math.sin(k * 26) * Math.sin(k * 7 + 1));
    c.setHSL(0.09, 0.35, 0.35 + band * 0.4);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = Math.PI / 2 - 0.35;
  m.rotation.y = rand() * 0.5;
  return m;
}

function makeGlowSprite(color, mid = 0.25) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  const col = new THREE.Color(color);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  grad.addColorStop(0, `rgba(${rgb},0.95)`);
  grad.addColorStop(mid, `rgba(${rgb},0.4)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
}
