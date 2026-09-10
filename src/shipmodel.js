import * as THREE from 'three';

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.5, flatShading: true, ...extra });
}

function part(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Low-poly deployment vessel. Nose points along +z so `lookAt()` aims it.
 * Returns { group, setThrottle(0..1), update(t) }.
 */
export function buildShipModel({ accent = 0xffd400, hull = 0x5a606e, engine = 0x7fdcff } = {}) {
  const g = new THREE.Group();
  const hullMat = mat(hull);
  const darkMat = mat(0x2b2f38);
  const accentMat = mat(accent, { emissive: accent, emissiveIntensity: 0.25 });
  const glassMat = mat(0x9fe8ff, { emissive: 0x3ab0e0, emissiveIntensity: 0.9, roughness: 0.2 });
  const engineMat = new THREE.MeshBasicMaterial({ color: engine });

  // main hull
  g.add(part(new THREE.BoxGeometry(1.3, 0.9, 5.2), hullMat, 0, 0, 0));
  g.add(part(new THREE.BoxGeometry(1.7, 0.5, 3.2), darkMat, 0, -0.35, -0.4));
  // nose
  const nose = part(new THREE.ConeGeometry(0.75, 1.9, 6), hullMat, 0, 0, 3.5);
  nose.rotation.x = Math.PI / 2;
  g.add(nose);
  // bridge
  g.add(part(new THREE.BoxGeometry(0.9, 0.55, 1.4), hullMat, 0, 0.65, -0.6));
  g.add(part(new THREE.BoxGeometry(0.92, 0.2, 0.7), glassMat, 0, 0.72, 0.05));
  g.add(part(new THREE.BoxGeometry(0.5, 0.35, 0.5), darkMat, 0, 1.05, -1.0));
  g.add(part(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4), darkMat, 0, 1.9, -1.0));
  // wings
  [-1, 1].forEach((s) => {
    const wing = part(new THREE.BoxGeometry(2.6, 0.14, 1.9), hullMat, s * 1.7, -0.1, -1.2);
    wing.rotation.z = s * 0.12;
    g.add(wing);
    g.add(part(new THREE.BoxGeometry(0.9, 0.16, 0.5), accentMat, s * 2.5, -0.2, -1.2));
    const fin = part(new THREE.BoxGeometry(0.12, 0.8, 1.2), hullMat, s * 2.9, 0.3, -1.6);
    g.add(fin);
    // engines
    const eng = part(new THREE.CylinderGeometry(0.34, 0.42, 1.6, 8), darkMat, s * 0.9, -0.05, -2.9);
    eng.rotation.x = Math.PI / 2;
    g.add(eng);
    const disc = part(new THREE.CircleGeometry(0.3, 12), engineMat, s * 0.9, -0.05, -3.72);
    disc.rotation.y = Math.PI;
    g.add(disc);
  });
  // centre engine
  const eng = part(new THREE.CylinderGeometry(0.4, 0.48, 1.4, 8), darkMat, 0, -0.1, -3.0);
  eng.rotation.x = Math.PI / 2;
  g.add(eng);
  const disc = part(new THREE.CircleGeometry(0.36, 12), engineMat, 0, -0.1, -3.72);
  disc.rotation.y = Math.PI;
  g.add(disc);
  // hull stripes + greebles
  g.add(part(new THREE.BoxGeometry(1.34, 0.12, 0.5), accentMat, 0, 0.2, 1.4));
  g.add(part(new THREE.BoxGeometry(0.3, 0.3, 1.2), darkMat, -0.75, 0.3, 0.6));
  g.add(part(new THREE.BoxGeometry(0.3, 0.3, 1.2), darkMat, 0.75, 0.3, 0.6));
  g.add(part(new THREE.BoxGeometry(0.4, 0.25, 0.8), darkMat, 0, -0.55, 1.6)); // pod bay
  g.add(part(new THREE.BoxGeometry(0.42, 0.06, 0.82), accentMat, 0, -0.68, 1.6));

  // engine flames (additive cones) + light
  const flameMat = new THREE.MeshBasicMaterial({ color: engine, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [];
  [[-0.9, -0.05], [0.9, -0.05], [0, -0.1]].forEach(([x, y]) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.6, 10), flameMat);
    f.position.set(x, y, -4.4);
    f.rotation.x = -Math.PI / 2;
    g.add(f);
    flames.push(f);
  });
  const light = new THREE.PointLight(engine, 6, 12, 2);
  light.position.set(0, 0, -4.2);
  g.add(light);

  // nav lights
  const navL = part(new THREE.SphereGeometry(0.08, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3b3b }), -3.0, 0.1, -1.0);
  const navR = part(new THREE.SphereGeometry(0.08, 6, 4), new THREE.MeshBasicMaterial({ color: 0x3bff6a }), 3.0, 0.1, -1.0);
  g.add(navL, navR);

  let throttle = 0.35;
  return {
    group: g,
    setThrottle(v) { throttle = v; },
    update(t) {
      const k = throttle * (1 + Math.sin(t * 40) * 0.08);
      for (const f of flames) f.scale.set(0.6 + k * 0.6, 0.5 + k * 2.2, 0.6 + k * 0.6);
      flameMat.opacity = 0.35 + throttle * 0.6;
      light.intensity = 2 + throttle * 14;
      const blink = Math.sin(t * 6) > 0.6;
      navL.visible = blink;
      navR.visible = !blink || Math.sin(t * 6 + 1) > 0.6;
    },
  };
}
