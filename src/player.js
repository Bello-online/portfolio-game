import * as THREE from 'three';

const SPEED = 7.5;
const TURN_SPEED = 12;

function mat(color) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8 });
}

function part(geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

export class Player {
  constructor(scene, profile) {
    this.group = new THREE.Group();
    this.walkT = 0;
    this.moving = false;
    this.targetRot = 0;
    this.velocity = new THREE.Vector3();

    const shirt = mat(profile.shirt);
    const pants = mat(profile.pants);
    const skin = mat(profile.skin);
    const hair = mat(profile.hair);

    // torso
    this.body = part(new THREE.BoxGeometry(0.9, 1.0, 0.55), shirt, 0, 1.25, 0);
    this.group.add(this.body);

    // head
    const head = new THREE.Group();
    head.position.set(0, 2.15, 0);
    head.add(part(new THREE.BoxGeometry(0.85, 0.8, 0.8), skin, 0, 0, 0));
    head.add(part(new THREE.BoxGeometry(0.92, 0.32, 0.88), hair, 0, 0.3, -0.04)); // hair cap
    head.add(part(new THREE.BoxGeometry(0.92, 0.5, 0.2), hair, 0, 0.05, -0.36)); // back of hair
    const eye = mat(0x1b1b2f);
    head.add(part(new THREE.BoxGeometry(0.1, 0.14, 0.05), eye, -0.2, -0.02, 0.41));
    head.add(part(new THREE.BoxGeometry(0.1, 0.14, 0.05), eye, 0.2, -0.02, 0.41));
    head.add(part(new THREE.BoxGeometry(0.22, 0.05, 0.05), mat(0xd98b7a), 0, -0.24, 0.41)); // smile
    this.head = head;
    this.group.add(head);

    // arms
    this.armL = part(new THREE.BoxGeometry(0.28, 0.95, 0.28), shirt, -0.62, 1.7, 0);
    this.armR = part(new THREE.BoxGeometry(0.28, 0.95, 0.28), shirt, 0.62, 1.7, 0);
    // pivot at the shoulder: offset geometry downwards
    this.armL.geometry.translate(0, -0.42, 0);
    this.armR.geometry.translate(0, -0.42, 0);
    this.armL.add(part(new THREE.BoxGeometry(0.26, 0.22, 0.26), skin, 0, -0.95, 0));
    this.armR.add(part(new THREE.BoxGeometry(0.26, 0.22, 0.26), skin, 0, -0.95, 0));
    this.group.add(this.armL, this.armR);

    // legs
    this.legL = part(new THREE.BoxGeometry(0.34, 0.8, 0.36), pants, -0.24, 0.78, 0);
    this.legR = part(new THREE.BoxGeometry(0.34, 0.8, 0.36), pants, 0.24, 0.78, 0);
    this.legL.geometry.translate(0, -0.38, 0);
    this.legR.geometry.translate(0, -0.38, 0);
    this.legL.add(part(new THREE.BoxGeometry(0.36, 0.2, 0.44), mat(0x2b2d42), 0, -0.85, 0.05));
    this.legR.add(part(new THREE.BoxGeometry(0.36, 0.2, 0.44), mat(0x2b2d42), 0, -0.85, 0.05));
    this.group.add(this.legL, this.legR);

    // soft blob shadow helper (cheap, always visible even without shadow maps)
    const blob = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.03;
    this.group.add(blob);

    scene.add(this.group);
  }

  get position() {
    return this.group.position;
  }

  teleport(pos) {
    this.group.position.set(pos.x, 0, pos.z);
    this.spawnPop = 0.001;
  }

  /**
   * @param {number} dt seconds
   * @param {{x:number, z:number}} move  normalized input direction in world space
   * @param {(x:number, z:number)=>boolean} isWalkable
   */
  update(dt, move, isWalkable) {
    const len = Math.hypot(move.x, move.z);
    this.moving = len > 0.05;

    if (this.moving) {
      const mx = (move.x / len) * Math.min(1, len);
      const mz = (move.z / len) * Math.min(1, len);
      const p = this.group.position;
      const nx = p.x + mx * SPEED * dt;
      const nz = p.z + mz * SPEED * dt;
      // axis-separated so the player slides along edges instead of sticking
      if (isWalkable(nx, p.z)) p.x = nx;
      if (isWalkable(p.x, nz)) p.z = nz;
      this.targetRot = Math.atan2(mx, mz);
    }

    // smooth turn towards travel direction (shortest path)
    let diff = this.targetRot - this.group.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.group.rotation.y += diff * Math.min(1, dt * TURN_SPEED);

    // walk cycle
    const speedMul = this.moving ? 1 : 0;
    this.walkT += dt * 11 * speedMul;
    const swing = Math.sin(this.walkT) * 0.75 * (this.moving ? 1 : 0);
    const damp = Math.min(1, dt * 10);
    this.legL.rotation.x += (swing - this.legL.rotation.x) * damp;
    this.legR.rotation.x += (-swing - this.legR.rotation.x) * damp;
    this.armL.rotation.x += (-swing * 0.8 - this.armL.rotation.x) * damp;
    this.armR.rotation.x += (swing * 0.8 - this.armR.rotation.x) * damp;

    const t = performance.now() / 1000;
    const bob = this.moving ? Math.abs(Math.sin(this.walkT)) * 0.09 : Math.sin(t * 2) * 0.02;
    this.body.position.y = 1.25 + bob;
    this.head.position.y = 2.15 + bob;
    this.armL.position.y = this.armR.position.y = 1.7 + bob;
    this.head.rotation.y = this.moving ? 0 : Math.sin(t * 0.7) * 0.25;

    // little pop after teleport
    if (this.spawnPop) {
      this.spawnPop += dt * 4;
      const s = 1 + Math.sin(Math.min(Math.PI, this.spawnPop * Math.PI)) * 0.25;
      this.group.scale.setScalar(s);
      if (this.spawnPop >= 1) {
        this.spawnPop = 0;
        this.group.scale.setScalar(1);
      }
    }
  }
}
