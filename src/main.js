import * as THREE from 'three';
import { createWorld } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { profile, zones } from './data/resume.js';

// ---------- Renderer ----------
const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

// ---------- Scene ----------
const SKY = 0x9fd3ff;
const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 70, 150);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 400);
const CAM_OFFSET = new THREE.Vector3(0, 13, 14.5);
const camTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

// ---------- Game objects ----------
const world = createWorld(scene, zones);
const player = new Player(scene, profile);
const input = new Input({ joystickEl: document.getElementById('joystick'), actionBtn: document.getElementById('action-btn') });
const ui = new UI({
  profile,
  zones,
  isTouch: input.isTouch,
  onStart: () => { input.enabled = true; },
  onFastTravel: (id) => {
    const isl = world.islands.get(id);
    if (!isl) return;
    // land just in front of the landmark, on the hub side
    const dir = isl.position.clone().normalize().multiplyScalar(-4.5);
    player.teleport(isl.position.clone().add(dir));
  },
  onPanelClose: () => {},
});

// Initial camera placement (snap, no lerp)
camera.position.copy(player.position).add(CAM_OFFSET);
camera.lookAt(player.position);

// Gentle idle orbit while the intro is showing
let introT = 0;

// ---------- Loop ----------
const clock = new THREE.Clock();
let activeZone = null;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (ui.started) {
    input.update();

    if (ui.panelOpen) {
      if (input.consumeEscape() || input.consumeAction()) ui.closePanel();
    } else {
      input.consumeEscape();
      player.update(dt, input.vector, world.isWalkable);

      const zone = world.zoneAt(player.position.x, player.position.z);
      if (zone?.id !== activeZone?.id) {
        activeZone = zone;
        ui.setZone(zone);
      }
      if (input.consumeAction() && activeZone) ui.openPanel(activeZone);
    }

    // third-person follow
    camTarget.copy(player.position).add(CAM_OFFSET);
    camera.position.lerp(camTarget, 1 - Math.pow(0.001, dt));
    lookTarget.set(player.position.x, player.position.y + 1.2, player.position.z);
    camera.lookAt(lookTarget);
  } else {
    // slow cinematic orbit around the hub before the game starts
    introT += dt * 0.15;
    camera.position.set(Math.sin(introT) * 26, 20, Math.cos(introT) * 26);
    camera.lookAt(0, 2, 0);
    player.update(dt, { x: 0, z: 0 }, world.isWalkable);
  }

  // keep the shadow frustum centred on the player so shadows stay crisp everywhere
  world.sun.position.set(player.position.x + 30, 50, player.position.z + 20);
  world.sun.target.position.copy(player.position);

  world.update(t, dt, activeZone?.id);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

frame();
