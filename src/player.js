import * as THREE from 'three';

const WALK = 7.5;
const SPRINT = 12;
const TURN_SPEED = 14;

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.75, metalness: 0.15, ...extra });
}

function part(geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** Armoured trooper with a cape. Walk cycle + cape cloth are procedural. */
export class Player {
  constructor(scene, profile) {
    this.group = new THREE.Group();
    this.walkT = 0;
    this.moving = false;
    this.speedFactor = 0;
    this.targetRot = 0;
    this.groundY = 0;

    const armor = mat(profile.armor);
    const dark = mat(profile.armorDark);
    const accent = mat(profile.accent, { emissive: profile.accent, emissiveIntensity: 0.35 });
    const visor = mat(profile.visor, { emissive: profile.visor, emissiveIntensity: 1.2, roughness: 0.3 });

    // torso + chest plate
    this.body = new THREE.Group();
    this.body.position.y = 1.3;
    this.body.add(part(new THREE.BoxGeometry(0.95, 1.05, 0.6), dark, 0, 0, 0));
    this.body.add(part(new THREE.BoxGeometry(1.0, 0.7, 0.66), armor, 0, 0.15, 0));
    this.body.add(part(new THREE.BoxGeometry(0.3, 0.55, 0.05), accent, 0, 0.15, 0.36)); // chest stripe
    this.body.add(part(new THREE.BoxGeometry(1.15, 0.22, 0.7), armor, 0, 0.5, 0)); // collar
    // backpack
    this.body.add(part(new THREE.BoxGeometry(0.7, 0.8, 0.35), armor, 0, 0.05, -0.47));
    this.body.add(part(new THREE.BoxGeometry(0.16, 0.5, 0.16), accent, 0.2, 0.5, -0.5));
    // shoulder pads
    this.body.add(part(new THREE.BoxGeometry(0.42, 0.28, 0.66), armor, -0.68, 0.42, 0));
    this.body.add(part(new THREE.BoxGeometry(0.42, 0.28, 0.66), armor, 0.68, 0.42, 0));
    this.group.add(this.body);

    // helmet
    this.head = new THREE.Group();
    this.head.position.y = 2.25;
    this.head.add(part(new THREE.BoxGeometry(0.82, 0.8, 0.82), armor, 0, 0, 0));
    this.head.add(part(new THREE.BoxGeometry(0.6, 0.16, 0.06), visor, 0, 0.02, 0.42)); // visor slit
    this.head.add(part(new THREE.BoxGeometry(0.9, 0.18, 0.9), dark, 0, -0.38, 0)); // neck seal
    this.head.add(part(new THREE.BoxGeometry(0.2, 0.3, 0.9), accent, 0, 0.42, 0)); // crest
    this.group.add(this.head);

    // arms (pivot at shoulder)
    const armGeo = () => { const g = new THREE.BoxGeometry(0.3, 0.95, 0.3); g.translate(0, -0.42, 0); return g; };
    this.armL = part(armGeo(), dark, -0.66, 1.72, 0);
    this.armR = part(armGeo(), dark, 0.66, 1.72, 0);
    this.armL.add(part(new THREE.BoxGeometry(0.34, 0.4, 0.34), armor, 0, -0.25, 0)); // upper plate
    this.armR.add(part(new THREE.BoxGeometry(0.34, 0.4, 0.34), armor, 0, -0.25, 0));
    this.armL.add(part(new THREE.BoxGeometry(0.3, 0.24, 0.3), armor, 0, -0.95, 0)); // glove
    this.armR.add(part(new THREE.BoxGeometry(0.3, 0.24, 0.3), armor, 0, -0.95, 0));
    this.group.add(this.armL, this.armR);

    // legs (pivot at hip)
    const legGeo = () => { const g = new THREE.BoxGeometry(0.36, 0.85, 0.38); g.translate(0, -0.4, 0); return g; };
    this.legL = part(legGeo(), dark, -0.25, 0.82, 0);
    this.legR = part(legGeo(), dark, 0.25, 0.82, 0);
    this.legL.add(part(new THREE.BoxGeometry(0.4, 0.42, 0.42), armor, 0, -0.32, 0)); // thigh plate
    this.legR.add(part(new THREE.BoxGeometry(0.4, 0.42, 0.42), armor, 0, -0.32, 0));
    this.legL.add(part(new THREE.BoxGeometry(0.4, 0.26, 0.5), armor, 0, -0.85, 0.05)); // boot
    this.legR.add(part(new THREE.BoxGeometry(0.4, 0.26, 0.5), armor, 0, -0.85, 0.05));
    this.group.add(this.legL, this.legR);

    // cape — a strip of quads hanging off the shoulders, animated per-row
    this.capeRows = 7;
    const capeGeo = new THREE.PlaneGeometry(0.95, 1.45, 1, this.capeRows - 1);
    capeGeo.translate(0, -0.725, 0); // hang from the top edge
    this.cape = new THREE.Mesh(capeGeo, new THREE.MeshStandardMaterial({ color: profile.accent, side: THREE.DoubleSide, roughness: 0.9 }));
    this.cape.position.set(0, 1.85, -0.34);
    this.cape.castShadow = true;
    this.capeBase = capeGeo.attributes.position.array.slice();
    this.group.add(this.cape);

    // blob shadow so the character always reads as grounded
    const blob = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.04;
    this.group.add(blob);

    // helmet lamp — small point light that helps the character pop on dark planets
    this.lamp = new THREE.PointLight(profile.visor, 6, 7, 2);
    this.lamp.position.set(0, 2.3, 0.6);
    this.group.add(this.lamp);

    scene.add(this.group);
  }

  get position() {
    return this.group.position;
  }

  setVisible(v) {
    this.group.visible = v;
  }

  teleport(x, z, heightAt, facing = 0) {
    const y = heightAt ? heightAt(x, z) : 0;
    this.group.position.set(x, y, z);
    this.groundY = y;
    this.group.rotation.y = facing;
    this.targetRot = facing;
  }

  /**
   * @param {number} dt
   * @param {{x:number,z:number}} move   world-space input, length 0..1
   * @param {boolean} sprint
   * @param {{heightAt:(x,z)=>number, isWalkable:(x,z)=>boolean}} env
   */
  update(dt, move, sprint, env) {
    const len = Math.hypot(move.x, move.z);
    this.moving = len > 0.05;
    const speed = sprint ? SPRINT : WALK;
    const targetFactor = this.moving ? (sprint ? 1 : 0.7) : 0;
    this.speedFactor += (targetFactor - this.speedFactor) * Math.min(1, dt * 6);

    if (this.moving) {
      const mx = (move.x / len) * Math.min(1, len);
      const mz = (move.z / len) * Math.min(1, len);
      const p = this.group.position;
      const nx = p.x + mx * speed * dt;
      const nz = p.z + mz * speed * dt;
      if (env.isWalkable(nx, p.z)) p.x = nx;
      if (env.isWalkable(p.x, nz)) p.z = nz;
      this.targetRot = Math.atan2(mx, mz);
    }

    // follow terrain height smoothly
    const gy = env.heightAt(this.group.position.x, this.group.position.z);
    this.groundY += (gy - this.groundY) * Math.min(1, dt * 14);
    this.group.position.y = this.groundY;

    let diff = this.targetRot - this.group.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.group.rotation.y += diff * Math.min(1, dt * TURN_SPEED);

    // walk cycle
    const rate = sprint ? 14 : 10.5;
    this.walkT += dt * rate * (this.moving ? 1 : 0);
    const swing = Math.sin(this.walkT) * (sprint ? 0.95 : 0.7) * (this.moving ? 1 : 0);
    const damp = Math.min(1, dt * 10);
    this.legL.rotation.x += (swing - this.legL.rotation.x) * damp;
    this.legR.rotation.x += (-swing - this.legR.rotation.x) * damp;
    this.armL.rotation.x += (-swing * 0.85 - this.armL.rotation.x) * damp;
    this.armR.rotation.x += (swing * 0.85 - this.armR.rotation.x) * damp;

    const t = performance.now() / 1000;
    const bob = this.moving ? Math.abs(Math.sin(this.walkT)) * 0.08 : Math.sin(t * 2) * 0.015;
    this.body.position.y = 1.3 + bob;
    this.head.position.y = 2.25 + bob;
    this.armL.position.y = this.armR.position.y = 1.72 + bob;
    this.cape.position.y = 1.85 + bob;
    // lean forward when sprinting
    this.body.rotation.x += ((sprint && this.moving ? 0.18 : 0) - this.body.rotation.x) * damp;
    this.head.rotation.x = this.body.rotation.x * 0.5;
    this.head.rotation.y = this.moving ? 0 : Math.sin(t * 0.6) * 0.2;

    // cape cloth: each row lags further behind and flutters more
    const pos = this.cape.geometry.attributes.position;
    const base = this.capeBase;
    const rows = this.capeRows;
    for (let i = 0; i < pos.count; i++) {
      const row = Math.floor(i / 2); // 2 verts per row (1 width segment)
      const k = row / (rows - 1);
      const flutter = Math.sin(t * 7 + row * 0.9 + (i % 2) * 0.6) * 0.05 * k;
      const lift = this.speedFactor * k * k * 0.95; // flies backwards when running
      pos.setXYZ(i, base[i * 3] + flutter * 0.5, base[i * 3 + 1] + lift * 0.55, base[i * 3 + 2] - lift - flutter - k * 0.12);
    }
    pos.needsUpdate = true;
    this.cape.geometry.computeVertexNormals();
  }
}
