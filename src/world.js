import * as THREE from 'three';

// ---------- Layout constants ----------
export const HUB_RADIUS = 8;
export const ISLAND_RADIUS = 9;
export const RING_DISTANCE = 32;
export const BRIDGE_WIDTH = 2.8;

const PALETTE = {
  dirt: 0xc98a5b,
  dirtDark: 0x8f5a3c,
  trunk: 0x8b5a2b,
  leaf: [0x3fa34d, 0x5cb85c, 0x2e8b57, 0x6fcf72],
  rock: 0xb8b8c8,
  plank: 0xd9a066,
  rope: 0x6b4a2b,
  cloud: 0xffffff,
};

// Deterministic pseudo-random so the world looks identical on every load.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...extra });
}

function mesh(geo, material, { x = 0, y = 0, z = 0, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function jitterGeometry(geo, amount, rand) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + (rand() - 0.5) * amount,
      pos.getY(i) + (rand() - 0.5) * amount * 0.5,
      pos.getZ(i) + (rand() - 0.5) * amount,
    );
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------- Decorations ----------
function makeTree(rand, scale = 1) {
  const g = new THREE.Group();
  const trunkH = 1.2 * scale;
  g.add(mesh(new THREE.CylinderGeometry(0.18 * scale, 0.26 * scale, trunkH, 6), mat(PALETTE.trunk), { y: trunkH / 2 }));
  const leaf = mat(PALETTE.leaf[Math.floor(rand() * PALETTE.leaf.length)]);
  const layers = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < layers; i++) {
    const r = (1.1 - i * 0.28) * scale;
    const h = 1.3 * scale;
    g.add(mesh(new THREE.ConeGeometry(r, h, 7), leaf, { y: trunkH + i * 0.75 * scale + h / 2 - 0.2 }));
  }
  g.rotation.y = rand() * Math.PI * 2;
  return g;
}

function makeRock(rand, scale = 1) {
  const geo = jitterGeometry(new THREE.DodecahedronGeometry(0.5 * scale, 0), 0.25 * scale, rand);
  const m = mesh(geo, mat(PALETTE.rock), { y: 0.3 * scale });
  m.rotation.set(rand() * Math.PI, rand() * Math.PI, 0);
  return m;
}

function makeFlower(rand) {
  const g = new THREE.Group();
  const colors = [0xff6b9d, 0xffd166, 0xff8c42, 0xf9f871, 0xffffff];
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4), mat(0x3f8f3f), { y: 0.2, cast: false }));
  g.add(mesh(new THREE.SphereGeometry(0.13, 5, 4), mat(colors[Math.floor(rand() * colors.length)]), { y: 0.42, cast: false }));
  return g;
}

// ---------- Landmarks (one per résumé section) ----------
const LANDMARKS = {
  house(color) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(3.4, 2.4, 3), mat(0xfff1d6), { y: 1.2 }));
    const roof = mesh(new THREE.ConeGeometry(2.9, 1.9, 4), mat(color), { y: 3.3 });
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    g.add(mesh(new THREE.BoxGeometry(0.8, 1.3, 0.2), mat(0x8b5a2b), { y: 0.65, z: 1.55 }));
    g.add(mesh(new THREE.BoxGeometry(0.7, 0.7, 0.2), mat(0x9fd3ff, { emissive: 0x2a6fa8, emissiveIntensity: 0.4 }), { x: -1.0, y: 1.5, z: 1.55 }));
    g.add(mesh(new THREE.BoxGeometry(0.7, 0.7, 0.2), mat(0x9fd3ff, { emissive: 0x2a6fa8, emissiveIntensity: 0.4 }), { x: 1.0, y: 1.5, z: 1.55 }));
    g.add(mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), mat(0x8f5a3c), { x: 1.0, y: 3.4, z: -0.6 }));
    return { group: g, labelY: 5.2 };
  },

  office(color) {
    const g = new THREE.Group();
    const glass = mat(0xcfe9ff, { emissive: 0x3a86c8, emissiveIntensity: 0.25 });
    const levels = [
      { w: 3.6, h: 2.2, d: 3.2 },
      { w: 3.0, h: 2.0, d: 2.6 },
      { w: 2.4, h: 1.8, d: 2.0 },
    ];
    let y = 0;
    levels.forEach((lv, i) => {
      g.add(mesh(new THREE.BoxGeometry(lv.w, lv.h, lv.d), i % 2 === 0 ? mat(color) : glass, { y: y + lv.h / 2 }));
      y += lv.h;
    });
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.6, 5), mat(0x2b2d42), { y: y + 0.8 }));
    g.add(mesh(new THREE.SphereGeometry(0.18, 6, 5), mat(0xff3b3b, { emissive: 0xff0000, emissiveIntensity: 0.8 }), { y: y + 1.6 }));
    return { group: g, labelY: y + 2.6 };
  },

  rocket(color) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.4, 8), mat(0x8a8fa8), { y: 0.2 }));
    const body = new THREE.Group();
    body.add(mesh(new THREE.CylinderGeometry(0.8, 0.9, 3, 10), mat(0xffffff), { y: 1.9 }));
    body.add(mesh(new THREE.ConeGeometry(0.8, 1.4, 10), mat(color), { y: 4.1 }));
    body.add(mesh(new THREE.TorusGeometry(0.42, 0.1, 6, 12), mat(0x2b2d42), { y: 2.4, z: 0.86 }));
    body.add(mesh(new THREE.CircleGeometry(0.36, 12), mat(0x9fd3ff, { emissive: 0x3a86c8, emissiveIntensity: 0.4 }), { y: 2.4, z: 0.88 }));
    for (let i = 0; i < 3; i++) {
      const fin = mesh(new THREE.BoxGeometry(0.15, 1.2, 0.9), mat(color), { y: 0.9 });
      fin.position.x = Math.cos((i / 3) * Math.PI * 2) * 0.95;
      fin.position.z = Math.sin((i / 3) * Math.PI * 2) * 0.95;
      fin.rotation.y = -(i / 3) * Math.PI * 2 + Math.PI / 2;
      body.add(fin);
    }
    body.add(mesh(new THREE.ConeGeometry(0.5, 1.0, 8), mat(0xffa726, { emissive: 0xff6d00, emissiveIntensity: 0.9 }), { y: 0.0 }));
    body.position.y = 0.4;
    body.name = 'rocketBody';
    g.add(body);
    return { group: g, labelY: 6.4, animate: (t) => { body.position.y = 0.4 + Math.sin(t * 2) * 0.12; } };
  },

  crystal(color) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(1.6, 2.0, 0.8, 7), mat(0x8f5a3c), { y: 0.4 }));
    const crys = mesh(
      new THREE.OctahedronGeometry(1.1, 0),
      mat(color, { emissive: new THREE.Color(color), emissiveIntensity: 0.55, roughness: 0.3 }),
      { y: 2.6 },
    );
    crys.scale.set(1, 1.7, 1);
    g.add(crys);
    for (let i = 0; i < 4; i++) {
      const s = mesh(new THREE.OctahedronGeometry(0.3, 0), mat(color, { emissive: new THREE.Color(color), emissiveIntensity: 0.5 }));
      s.userData.angle = (i / 4) * Math.PI * 2;
      s.name = 'orbit';
      g.add(s);
    }
    return {
      group: g,
      labelY: 5.4,
      animate: (t) => {
        crys.rotation.y = t * 0.8;
        crys.position.y = 2.6 + Math.sin(t * 1.5) * 0.2;
        g.children.forEach((c) => {
          if (c.name === 'orbit') {
            const a = c.userData.angle + t * 1.2;
            c.position.set(Math.cos(a) * 1.9, 2.2 + Math.sin(a * 2) * 0.4, Math.sin(a) * 1.9);
            c.rotation.y = t;
          }
        });
      },
    };
  },

  books(color) {
    const g = new THREE.Group();
    const cols = [color, 0xff7b54, 0x7fc8f8, 0xfff1d6];
    let y = 0;
    for (let i = 0; i < 4; i++) {
      const h = 0.55;
      const b = mesh(new THREE.BoxGeometry(2.6 - i * 0.15, h, 1.9), mat(cols[i % cols.length]), { y: y + h / 2 });
      b.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.18 * (i + 1) * 0.5;
      g.add(b);
      // page edge
      g.add(mesh(new THREE.BoxGeometry(2.4 - i * 0.15, h * 0.7, 0.1), mat(0xfffaf0), { y: y + h / 2, z: 0.95 }));
      y += h;
    }
    // graduation cap on top
    g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 8), mat(0x2b2d42), { y: y + 0.25 }));
    const board = mesh(new THREE.BoxGeometry(1.8, 0.12, 1.8), mat(0x2b2d42), { y: y + 0.55 });
    board.rotation.y = Math.PI / 4;
    g.add(board);
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 4), mat(0xffd166), { x: 0.7, y: y + 0.2, z: 0.7 }));
    g.add(mesh(new THREE.SphereGeometry(0.1, 5, 4), mat(0xffd166), { x: 0.7, y: y - 0.25, z: 0.7 }));
    return { group: g, labelY: y + 2.2 };
  },

  mailbox(color) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.6, 6), mat(0x8b5a2b), { y: 0.8 }));
    const box = mesh(new THREE.BoxGeometry(1.0, 0.8, 1.6), mat(color), { y: 2.0 });
    g.add(box);
    g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 10, 1, false, 0, Math.PI), mat(color), { y: 2.4 }).rotateZ(Math.PI / 2).rotateY(Math.PI / 2));
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.5, 0.15), mat(0xff3b3b), { x: 0.55, y: 2.6, z: -0.4 }));
    // signpost with arrows
    const post = new THREE.Group();
    post.position.set(2.4, 0, -0.5);
    post.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 6), mat(0x8b5a2b), { y: 1.6 }));
    ['Hire me', 'Say hi', 'Portfolio'].forEach((_, i) => {
      const arrow = mesh(new THREE.BoxGeometry(1.5, 0.35, 0.12), mat([0xffd166, 0xff7b54, 0x7fc8f8][i]), { x: 0.5, y: 2.9 - i * 0.55 });
      arrow.rotation.y = (i % 2 === 0 ? 0.4 : -0.5);
      post.add(arrow);
    });
    g.add(post);
    return { group: g, labelY: 4.4 };
  },
};

// ---------- Label sprite ----------
function makeLabel(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2b2d42';
  roundRect(ctx, 6, 6, 500, 116, 26);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, 14, 14, 484, 100, 20);
  ctx.fill();
  ctx.fillStyle = '#2b2d42';
  ctx.font = 'bold 44px Nunito, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 256, 66);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true }));
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- Island ----------
function makeIsland({ radius, color, rand, decor = true }) {
  const g = new THREE.Group();
  const grass = mat(color);

  // Top slab (walkable surface at y = 0)
  const top = mesh(new THREE.CylinderGeometry(radius, radius * 0.94, 1.4, 11), grass, { y: -0.7 });
  g.add(top);

  // Rocky underside
  const under = mesh(
    jitterGeometry(new THREE.CylinderGeometry(radius * 0.94, radius * 0.28, radius * 0.9, 11), radius * 0.12, rand),
    mat(PALETTE.dirt),
    { y: -1.4 - radius * 0.45 },
  );
  g.add(under);
  const tip = mesh(new THREE.ConeGeometry(radius * 0.28, radius * 0.5, 7), mat(PALETTE.dirtDark), { y: -1.4 - radius * 0.9 - radius * 0.25 });
  tip.rotation.x = Math.PI;
  g.add(tip);

  if (decor) {
    // Trees around the rim
    const treeCount = 5 + Math.floor(rand() * 3);
    for (let i = 0; i < treeCount; i++) {
      const a = rand() * Math.PI * 2;
      const r = radius * (0.68 + rand() * 0.2);
      // keep the entrance (towards the hub, +x in local space before rotation) clear
      const t = makeTree(rand, 0.8 + rand() * 0.6);
      t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      t.userData.polar = { a, r };
      g.add(t);
    }
    for (let i = 0; i < 4; i++) {
      const a = rand() * Math.PI * 2;
      const r = radius * (0.5 + rand() * 0.35);
      const rock = makeRock(rand, 0.6 + rand() * 0.8);
      rock.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      rock.userData.polar = { a, r };
      g.add(rock);
    }
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2;
      const r = radius * (0.3 + rand() * 0.55);
      const f = makeFlower(rand);
      f.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      g.add(f);
    }
  }
  return g;
}

// ---------- Bridge ----------
function makeBridge(from, to) {
  const g = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  dir.normalize();
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  g.position.copy(mid);
  g.rotation.y = Math.atan2(dir.x, dir.z);

  // planks
  const plankMat = mat(PALETTE.plank);
  const plankCount = Math.floor(len / 0.95);
  for (let i = 0; i < plankCount; i++) {
    const z = -len / 2 + 0.5 + i * (len / plankCount);
    const p = mesh(new THREE.BoxGeometry(BRIDGE_WIDTH, 0.22, 0.7), plankMat, { y: -0.11, z });
    p.rotation.y = (i % 3 - 1) * 0.02;
    g.add(p);
  }
  // rails + posts
  const ropeMat = mat(PALETTE.rope);
  [-1, 1].forEach((side) => {
    const x = side * (BRIDGE_WIDTH / 2 - 0.1);
    g.add(mesh(new THREE.BoxGeometry(0.12, 0.12, len), ropeMat, { x, y: 0.9, cast: false }));
    const posts = Math.max(2, Math.floor(len / 3));
    for (let i = 0; i <= posts; i++) {
      const z = -len / 2 + (len / posts) * i;
      g.add(mesh(new THREE.BoxGeometry(0.22, 1.1, 0.22), ropeMat, { x, y: 0.45, z }));
    }
  });
  return g;
}

// ---------- Clouds ----------
function makeCloud(rand) {
  const g = new THREE.Group();
  const m = mat(PALETTE.cloud, { roughness: 1 });
  const n = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const s = 1.2 + rand() * 1.6;
    const puff = mesh(new THREE.SphereGeometry(s, 7, 5), m, { x: (i - n / 2) * 1.6, y: rand() * 0.6, z: (rand() - 0.5) * 1.2, cast: false, receive: false });
    g.add(puff);
  }
  return g;
}

// =====================================================================
export function createWorld(scene, zones) {
  const rand = mulberry32(1337);
  const islands = new Map();
  const bridges = [];
  const animated = [];

  // --- Lighting ---
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0xffd9a8, 0.9));
  const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = 55;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 140;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(sun.target);

  // --- Hub island (spawn) ---
  const hub = makeIsland({ radius: HUB_RADIUS, color: 0xa3e4a0, rand, decor: false });
  // A little plaza on the hub: a fountain + benches
  const fountain = new THREE.Group();
  fountain.add(mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.5, 9), mat(0xb8b8c8), { y: 0.25 }));
  fountain.add(mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.3, 9), mat(0x7fc8f8, { emissive: 0x3a86c8, emissiveIntensity: 0.15 }), { y: 0.55, cast: false }));
  fountain.add(mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.4, 6), mat(0xb8b8c8), { y: 1.1 }));
  const water = mesh(new THREE.SphereGeometry(0.35, 7, 5), mat(0x9fd3ff, { emissive: 0x3a86c8, emissiveIntensity: 0.3 }), { y: 1.9, cast: false });
  fountain.add(water);
  fountain.position.set(0, 0, -3.2);
  hub.add(fountain);
  animated.push((t) => { water.position.y = 1.9 + Math.sin(t * 3) * 0.15; water.scale.setScalar(1 + Math.sin(t * 3) * 0.1); });
  for (let i = 0; i < 3; i++) {
    const f = makeFlower(rand);
    const a = rand() * Math.PI * 2;
    f.position.set(Math.cos(a) * 5.5, 0, Math.sin(a) * 5.5);
    hub.add(f);
  }
  scene.add(hub);
  islands.set('hub', { id: 'hub', position: new THREE.Vector3(0, 0, 0), radius: HUB_RADIUS, group: hub });

  // --- One island per zone, arranged in a ring ---
  const n = zones.length;
  zones.forEach((zone, i) => {
    // Start at the top (-z) and go clockwise.
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const pos = new THREE.Vector3(Math.cos(angle) * RING_DISTANCE, 0, Math.sin(angle) * RING_DISTANCE);
    const island = makeIsland({ radius: ISLAND_RADIUS, color: new THREE.Color(zone.color), rand });
    island.position.copy(pos);

    // Clear decorations that sit on the bridge entrance (facing the hub)
    const toHub = Math.atan2(-pos.z, -pos.x);
    island.children.slice().forEach((child) => {
      if (!child.userData.polar) return;
      let d = Math.abs(child.userData.polar.a - toHub);
      d = Math.min(d, Math.PI * 2 - d);
      if (d < 0.45) island.remove(child);
    });

    // Landmark
    const build = LANDMARKS[zone.landmark] || LANDMARKS.house;
    const { group, labelY, animate } = build(new THREE.Color(zone.color).getHex());
    group.position.set(0, 0, 0);
    // face the hub
    group.rotation.y = Math.atan2(-pos.x, -pos.z);
    island.add(group);
    if (animate) animated.push(animate);

    // Floating label
    const label = makeLabel(zone.title, zone.color);
    label.position.set(0, labelY, 0);
    island.add(label);
    const baseY = labelY;
    animated.push((t) => { label.position.y = baseY + Math.sin(t * 1.6 + i) * 0.25; });

    // Glow ring shown when the player is inside the zone
    const ring = mesh(
      new THREE.RingGeometry(3.2, 3.7, 32),
      new THREE.MeshBasicMaterial({ color: zone.color, transparent: true, opacity: 0, side: THREE.DoubleSide }),
      { y: 0.06, cast: false, receive: false },
    );
    ring.rotation.x = -Math.PI / 2;
    island.add(ring);

    scene.add(island);
    islands.set(zone.id, { id: zone.id, zone, position: pos, radius: ISLAND_RADIUS, group: island, ring, landmark: group });

    // Bridge hub -> island
    const dir = pos.clone().normalize();
    const from = dir.clone().multiplyScalar(HUB_RADIUS * 0.9);
    const to = dir.clone().multiplyScalar(RING_DISTANCE - ISLAND_RADIUS * 0.9);
    scene.add(makeBridge(from, to));
    bridges.push({ from, to });
  });

  // --- Clouds & floating rocks for depth ---
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    const c = makeCloud(rand);
    const a = rand() * Math.PI * 2;
    const r = 30 + rand() * 60;
    c.position.set(Math.cos(a) * r, -18 + rand() * 30, Math.sin(a) * r);
    c.userData.speed = 0.4 + rand() * 0.6;
    c.scale.setScalar(0.8 + rand() * 1.4);
    scene.add(c);
    clouds.push(c);
  }
  for (let i = 0; i < 10; i++) {
    const rock = makeRock(rand, 1.5 + rand() * 3);
    const a = rand() * Math.PI * 2;
    const r = 15 + rand() * 45;
    rock.position.set(Math.cos(a) * r, -12 - rand() * 20, Math.sin(a) * r);
    rock.userData.phase = rand() * Math.PI * 2;
    scene.add(rock);
    animated.push((t) => {
      rock.position.y += Math.sin(t * 0.5 + rock.userData.phase) * 0.004;
      rock.rotation.y += 0.001;
    });
  }

  // --- Queries ---
  const tmp = new THREE.Vector3();
  function distToSegment(px, pz, a, b) {
    const abx = b.x - a.x, abz = b.z - a.z;
    const apx = px - a.x, apz = pz - a.z;
    const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / (abx * abx + abz * abz)));
    const cx = a.x + abx * t, cz = a.z + abz * t;
    return Math.hypot(px - cx, pz - cz);
  }

  function isWalkable(x, z) {
    const margin = 0.7;
    for (const isl of islands.values()) {
      if (Math.hypot(x - isl.position.x, z - isl.position.z) <= isl.radius - margin) return true;
    }
    for (const b of bridges) {
      if (distToSegment(x, z, b.from, b.to) <= BRIDGE_WIDTH / 2 - 0.35) return true;
    }
    return false;
  }

  /** Returns the zone the point is inside (null on the hub / bridges). */
  function zoneAt(x, z) {
    for (const isl of islands.values()) {
      if (isl.id === 'hub') continue;
      if (Math.hypot(x - isl.position.x, z - isl.position.z) <= isl.radius - 1.2) return isl.zone;
    }
    return null;
  }

  function update(t, dt, activeZoneId) {
    for (const fn of animated) fn(t);
    for (const c of clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 95) c.position.x = -95;
    }
    for (const isl of islands.values()) {
      if (!isl.ring) continue;
      const target = isl.id === activeZoneId ? 0.85 : 0;
      isl.ring.material.opacity += (target - isl.ring.material.opacity) * Math.min(1, dt * 6);
      if (isl.id === activeZoneId) isl.ring.scale.setScalar(1 + Math.sin(t * 4) * 0.05);
    }
    tmp.set(0, 0, 0);
  }

  return { islands, bridges, isWalkable, zoneAt, update, sun };
}
