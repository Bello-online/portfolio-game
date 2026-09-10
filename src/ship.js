import * as THREE from 'three';
import { BIOMES } from './biomes.js';
import { rng } from './noise.js';

/**
 * The ship's bridge: a holographic campaign map. Planets orbit a central
 * star; one is selected at a time and can be deployed to.
 */
export function createShip(planets) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04060c);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1200);
  const rand = rng(4242);

  // --- starfield ---
  {
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 380 + rand() * 120;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(rand() * 2 - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      const c = 0.6 + rand() * 0.4;
      const warm = rand() > 0.8;
      col[i * 3] = c; col[i * 3 + 1] = c * (warm ? 0.85 : 0.95); col[i * 3 + 2] = c * (warm ? 0.6 : 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.9 })));
  }

  // --- hologram table grid ---
  const grid = new THREE.GridHelper(220, 44, 0x1c4a6b, 0x0f2a3f);
  grid.position.y = -0.6;
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);

  // --- central star ---
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 18), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  scene.add(sun);
  const glow = makeGlowSprite(0xffb347);
  glow.scale.set(26, 26, 1);
  scene.add(glow);
  const sunLight = new THREE.PointLight(0xffe0b0, 1400, 0, 2);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x4d5f80, 0.9));
  const fill = new THREE.DirectionalLight(0x6f8fbf, 0.6);
  fill.position.set(-30, 40, 20);
  scene.add(fill);

  // --- planets ---
  const items = planets.map((planet, i) => {
    const biome = BIOMES[planet.biome] || BIOMES.moon;
    const radius = 2.1 + (i % 3) * 0.35;
    const orbit = 13 + i * 5.4;
    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 22, 16),
      new THREE.MeshStandardMaterial({ color: biome.planet, roughness: 0.95, flatShading: true }),
    );
    g.add(body);
    // banding / detail: a slightly displaced second sphere
    const detail = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius * 1.01, 2),
      new THREE.MeshStandardMaterial({ color: biome.planetAlt, roughness: 1, flatShading: true, transparent: true, opacity: 0.55 }),
    );
    detail.rotation.set(rand() * 3, rand() * 3, 0);
    g.add(detail);
    // atmosphere
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.22, 22, 16),
      new THREE.MeshBasicMaterial({ color: biome.fog, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false }),
    );
    g.add(atmo);
    // pick target (invisible, generous)
    const pick = new THREE.Mesh(new THREE.SphereGeometry(radius * 2.1, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    pick.userData.index = i;
    g.add(pick);
    // liberated ring (hidden until earned)
    const libRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.55, 0.09, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd400 }),
    );
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

    // orbit path
    const pts = [];
    for (let k = 0; k <= 128; k++) {
      const a = (k / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * orbit, 0, Math.sin(a) * orbit));
    }
    const orbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x2a5a7f, transparent: true, opacity: 0.55 }),
    );
    scene.add(orbitLine);

    scene.add(g);
    return {
      planet, index: i, group: g, body, pick, libRing, flag, radius, orbit,
      angle: i * 1.15 + 0.6,
      speed: 0.035 / (1 + i * 0.35),
      spin: 0.15 + rand() * 0.2,
      liberated: false,
    };
  });

  // --- selection reticle ---
  const reticle = new THREE.Group();
  const retMat = new THREE.MeshBasicMaterial({ color: 0xffd400, transparent: true, opacity: 0.9 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 8, 64), retMat);
  ring.rotation.x = Math.PI / 2;
  reticle.add(ring);
  for (let k = 0; k < 4; k++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.9), retMat);
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    tick.position.set(Math.cos(a) * 1.35, 0, Math.sin(a) * 1.35);
    tick.rotation.y = -a;
    reticle.add(tick);
  }
  scene.add(reticle);

  // --- link line from the star to the selected planet ---
  const linkGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const link = new THREE.Line(linkGeo, new THREE.LineDashedMaterial({ color: 0xffd400, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.6 }));
  scene.add(link);

  let selected = 0;
  let camAngle = 0.6;
  const raycaster = new THREE.Raycaster();
  const tmp = new THREE.Vector3();

  function update(dt, t) {
    for (const it of items) {
      it.angle += it.speed * dt;
      it.group.position.set(Math.cos(it.angle) * it.orbit, 0, Math.sin(it.angle) * it.orbit);
      it.body.rotation.y += it.spin * dt;
      if (it.flag.visible) it.flag.rotation.y = t * 0.8;
    }
    camAngle += dt * 0.045;
    camera.position.set(Math.sin(camAngle) * 62, 36, Math.cos(camAngle) * 62);
    camera.lookAt(0, -2, 0);

    const sel = items[selected];
    reticle.position.copy(sel.group.position);
    const s = sel.radius * 1.75 * (1 + Math.sin(t * 5) * 0.04);
    reticle.scale.setScalar(s);
    reticle.rotation.y = t * 0.9;
    const arr = linkGeo.attributes.position.array;
    arr[3] = sel.group.position.x; arr[4] = sel.group.position.y; arr[5] = sel.group.position.z;
    linkGeo.attributes.position.needsUpdate = true;
    link.computeLineDistances();
    glow.material.rotation = t * 0.1;
  }

  function pick(ndcX, ndcY) {
    raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
    const hits = raycaster.intersectObjects(items.map((it) => it.pick), false);
    return hits.length ? hits[0].object.userData.index : null;
  }

  /** Screen-space positions for HTML labels. */
  function planetScreen(width, height) {
    return items.map((it) => {
      tmp.copy(it.group.position);
      tmp.y += it.radius + 0.6;
      tmp.project(camera);
      return {
        id: it.planet.id,
        index: it.index,
        x: (tmp.x * 0.5 + 0.5) * width,
        y: (-tmp.y * 0.5 + 0.5) * height,
        visible: tmp.z < 1,
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
    scene, camera, update, pick, planetScreen, setLiberated, resize,
    get selected() { return selected; },
    set selected(i) { selected = ((i % items.length) + items.length) % items.length; },
    count: items.length,
    items,
  };
}

function makeGlowSprite(color) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  const col = new THREE.Color(color);
  const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
  grad.addColorStop(0, `rgba(${rgb},0.95)`);
  grad.addColorStop(0.25, `rgba(${rgb},0.45)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
}
