import * as THREE from 'three';
import { createShip } from './ship.js';
import { createPlanet } from './planet.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { audio } from './audio.js';
import { rng } from './noise.js';
import { profile, campaign, planets } from './data/resume.js';

// ---------- codes ----------
const ARROWS = ['up', 'down', 'left', 'right'];
const LETTER = { U: 'up', D: 'down', L: 'left', R: 'right' };
const codeRand = rng(90210);
function makeCode(len) {
  const out = [];
  while (out.length < len) {
    const a = ARROWS[Math.floor(codeRand() * 4)];
    if (out.length >= 2 && out[out.length - 1] === a && out[out.length - 2] === a) continue; // avoid triples
    out.push(a);
  }
  return out;
}
planets.forEach((p) => p.objectives.forEach((o, i) => {
  o.code = typeof o.code === 'string' ? [...o.code.toUpperCase()].map((c) => LETTER[c]).filter(Boolean) : makeCode(4 + (i % 2));
}));
const EXTRACT_CODE = ['up', 'down', 'right', 'left', 'up'];

// ---------- renderer ----------
const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// ---------- state ----------
const state = {
  mode: 'intro', // intro | ship | transition | drop | surface | extract
  planet: null,
  surface: null,
  liberated: new Set(),
  done: new Set(),
  extractUnlocked: false,
  target: null,      // current interactable { kind, id, code, label, position }
  progress: 0,
};

const surfaceCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 700);
const CAM_OFFSET = new THREE.Vector3(0, 20, 15);
const camTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const tmp = new THREE.Vector3();

const ship = createShip(planets);
ship.resize(window.innerWidth / window.innerHeight);

const input = new Input({ joystickEl: document.getElementById('joystick'), actionBtn: document.getElementById('action-btn') });
let player = null;

const ui = new UI({
  profile, campaign, planets,
  isTouch: input.isTouch,
  onStart: () => {
    audio.init();
    audio.select();
    state.mode = 'ship';
    ui.showShip();
    ui.setCampaignProgress(state.liberated);
    selectPlanet(0);
    ui.banner('CAMPAIGN MAP', 'select a planet and deploy');
  },
  onSelectPlanet: (i, fromClick) => {
    if (state.mode !== 'ship') return;
    if (fromClick && ship.selected === i) return deploy();
    selectPlanet(i);
  },
  onDeploy: () => deploy(),
  onAbort: () => returnToShip(false),
  onIntelClose: () => onIntelClosed(),
  onMute: () => audio.toggleMute(),
});

function selectPlanet(i) {
  ship.selected = i;
  const p = planets[ship.selected];
  ui.selectPlanet(p, state.liberated.has(p.id));
  audio.uiTick();
}

// click / hover on the campaign map
canvas.addEventListener('click', (e) => {
  if (state.mode !== 'ship') return;
  const idx = ship.pick((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  if (idx === null) return;
  if (idx === ship.selected) deploy();
  else selectPlanet(idx);
});
canvas.addEventListener('pointermove', (e) => {
  if (state.mode !== 'ship') { canvas.style.cursor = ''; return; }
  const idx = ship.pick((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  canvas.style.cursor = idx === null ? '' : 'pointer';
});

// ---------- deployment ----------
async function deploy() {
  if (state.mode !== 'ship') return;
  const planet = planets[ship.selected];
  state.mode = 'transition';
  audio.deploy();
  ui.banner(`DEPLOYING TO ${planet.name}`, planet.designation);
  await ui.fade(true);

  state.planet = planet;
  state.done = new Set();
  state.extractUnlocked = false;
  state.target = null;
  state.progress = 0;
  state.surface = createPlanet(planet);
  player = new Player(state.surface.scene, profile);
  player.setVisible(false);
  ui.showSurface(planet);

  // cinematic camera for the drop
  const sp = state.surface.spawn;
  surfaceCamera.position.set(sp.x + 22, sp.y + 11, sp.z + 26);
  surfaceCamera.lookAt(sp.x, sp.y + 20, sp.z);

  await ui.fade(false);
  state.mode = 'drop';
  state.surface.startDrop((ev) => {
    if (ev === 'impact') audio.impact();
    if (ev === 'door') audio.doorOpen();
    if (ev === 'opened') {
      const pp = state.surface.podPosition;
      player.teleport(pp.x, pp.z + 2.2, state.surface.heightAt, 0);
      player.setVisible(true);
      state.mode = 'surface';
      ui.banner(`${planet.name}`, `secure ${planet.objectives.length} intel terminal${planet.objectives.length > 1 ? 's' : ''}`);
      audio.banner();
    }
  });
}

async function returnToShip(liberatedNow) {
  if (!['surface', 'extract'].includes(state.mode)) return;
  const planet = state.planet;
  state.mode = 'transition';
  ui.closeIntel();
  ui.hidePrompt();
  await ui.fade(true);
  state.surface.dispose();
  state.surface = null;
  player = null;
  if (liberatedNow) {
    state.liberated.add(planet.id);
    ship.setLiberated(planet.id);
    ui.setCampaignProgress(state.liberated);
  }
  ui.showShip();
  ui.clearMarkers();
  selectPlanet(ship.selected);
  await ui.fade(false);
  state.mode = 'ship';
  if (liberatedNow) {
    audio.liberated();
    if (state.liberated.size === planets.length) {
      ui.banner('CAMPAIGN COMPLETE', 'every planet liberated — thank you for reading');
    } else {
      ui.banner(`${planet.name} LIBERATED`, `${state.liberated.size} of ${planets.length} planets secured`);
      // auto-advance the selection to the next un-liberated planet
      for (let k = 1; k <= planets.length; k++) {
        const idx = (ship.selected + k) % planets.length;
        if (!state.liberated.has(planets[idx].id)) { selectPlanet(idx); break; }
      }
    }
  } else {
    ui.banner('RETURNED TO SHIP', 'mission aborted');
  }
}

// ---------- surface interaction ----------
function findTarget() {
  const s = state.surface;
  const p = player.position;
  let best = null;
  for (const t of s.terminals) {
    if (t.done) continue;
    const d = Math.hypot(p.x - t.position.x, p.z - t.position.z);
    if (d < 5 && (!best || d < best.d)) best = { kind: 'intel', id: t.id, d, terminal: t, code: t.objective.code, label: `Access terminal: ${t.objective.label}` };
  }
  if (state.extractUnlocked && s.beacon.group.visible) {
    const b = s.beacon.group.position;
    const d = Math.hypot(p.x - b.x, p.z - b.z);
    if (d < 5.5 && (!best || d < best.d)) best = { kind: 'extract', id: 'beacon', d, code: EXTRACT_CODE, label: 'Call extraction' };
  }
  return best;
}

function completeTarget() {
  const t = state.target;
  state.target = null;
  state.progress = 0;
  ui.hidePrompt();
  audio.codeSuccess();
  if (t.kind === 'intel') {
    state.surface.completeTerminal(t.terminal);
    state.done.add(t.id);
    ui.setObjectives(state.planet, state.done, state.extractUnlocked);
    ui.banner('INTEL SECURED', t.terminal.objective.label);
    ui.openIntel(state.planet, t.terminal.objective);
  } else {
    state.mode = 'extract';
    audio.extract();
    ui.banner('EXTRACTION CALLED', 'stand by');
    state.surface.startExtract((ev) => { if (ev === 'extracted') returnToShip(true); });
  }
}

function onIntelClosed() {
  if (state.mode !== 'surface') return;
  if (!state.extractUnlocked && state.done.size === state.planet.objectives.length) {
    state.extractUnlocked = true;
    state.surface.showBeacon();
    ui.setObjectives(state.planet, state.done, true);
    ui.banner('ALL INTEL SECURED', 'proceed to the extraction beacon');
    audio.banner();
  }
}

function handleCodeInput() {
  const arrows = input.consumeArrows();
  if (!state.target) return;
  const code = state.target.code;
  // touch fallback: the action button enters the whole code
  if (input.isTouch && input.consumeAction()) { state.progress = code.length; }
  for (const a of arrows) {
    if (state.progress >= code.length) break;
    if (a === code[state.progress]) {
      state.progress++;
      audio.codeInput(state.progress);
    } else {
      state.progress = 0;
      audio.codeError();
      ui.promptError();
      return;
    }
  }
  if (state.progress >= code.length) completeTarget();
  else ui.showPrompt(state.target.label, code, state.progress);
}

function updateSurfaceHud() {
  const s = state.surface;
  const p = player.position;
  const w = window.innerWidth, h = window.innerHeight;
  const markers = [];
  const bearings = [];
  const add = (id, kind, index, position, label, done) => {
    tmp.copy(position);
    tmp.y += 4.2;
    tmp.project(surfaceCamera);
    const dx = position.x - p.x, dz = position.z - p.z;
    const dist = Math.hypot(dx, dz);
    markers.push({ id, kind, index, label, done, dist, near: dist < 6, x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, visible: tmp.z < 1 && dist > 2.5 });
    bearings.push({ id, kind, index, done, deg: (Math.atan2(dx, -dz) * 180) / Math.PI });
  };
  s.terminals.forEach((t) => add(t.id, 'intel', t.index, t.position, `INTEL ${t.index + 1}`, t.done));
  if (state.extractUnlocked) add('beacon', 'extract', 0, s.beacon.group.position, 'EXTRACT', false);
  ui.updateMarkers(markers);
  ui.updateCompass(bearings);
}

// ---------- main loop ----------
const clock = new THREE.Clock();
const shakeVec = new THREE.Vector3();
const STEP = 0.05;

function frame() {
  const raw = clock.getDelta();
  input.update();
  // Fixed-size sub-steps: a normal 60 fps frame is one step, and after a stall
  // (tab switch, throttled background timer) the simulation catches up instead
  // of freezing timed sequences like the drop.
  const steps = Math.min(60, Math.max(1, Math.ceil(raw / STEP)));
  for (let i = 0; i < steps; i++) tick(raw / steps, clock.elapsedTime);
  render();
  if (document.hidden) setTimeout(frame, 50);
  else requestAnimationFrame(frame);
}

function render() {
  const onSurface = state.surface && state.mode !== 'ship' && state.mode !== 'intro';
  if (onSurface) renderer.render(state.surface.scene, surfaceCamera);
  else renderer.render(ship.scene, ship.camera);
}

function tick(dt, t) {
  if (state.mode === 'intro' || state.mode === 'ship' || (state.mode === 'transition' && !state.surface)) {
    if (state.mode === 'ship') {
      for (const a of input.consumeArrows()) {
        if (a === 'left' || a === 'up') selectPlanet(ship.selected - 1);
        if (a === 'right' || a === 'down') selectPlanet(ship.selected + 1);
      }
      if (input.consumeAction()) deploy();
      input.consumeEscape();
    } else {
      input.consumeArrows(); input.consumeAction(); input.consumeEscape();
    }
    ship.update(dt, t);
    if (state.mode !== 'intro') ui.updatePlanetLabels(ship.planetScreen(window.innerWidth, window.innerHeight), state.liberated);
  } else if (state.surface) {
    const s = state.surface;

    if (state.mode === 'drop') {
      input.consumeArrows(); input.consumeAction(); input.consumeEscape();
      // track the falling pod, then ease into the follow camera once the door opens
      const pp = s.podPosition;
      lookTarget.set(pp.x, Math.min(pp.y, 40) * 0.45 + 3, pp.z);
      surfaceCamera.lookAt(lookTarget);
    } else if (state.mode === 'surface') {
      if (ui.intelOpen) {
        input.consumeArrows();
        if (input.consumeEscape() || input.consumeAction()) ui.closeIntel();
      } else {
        input.consumeEscape();
        player.update(dt, input.vector, input.sprint, s);
        const target = findTarget();
        if (target?.id !== state.target?.id) {
          state.target = target;
          state.progress = 0;
          if (target) { ui.showPrompt(target.label, target.code, 0); audio.uiTick(); }
          else ui.hidePrompt();
        }
        if (state.target) handleCodeInput();
        else { input.consumeArrows(); input.consumeAction(); }
      }
    } else {
      // extract / transition: freeze input
      input.consumeArrows(); input.consumeAction(); input.consumeEscape();
      if (player) player.update(dt, { x: 0, z: 0 }, false, s);
    }

    if (player && state.mode !== 'drop') {
      camTarget.copy(player.position).add(CAM_OFFSET);
      surfaceCamera.position.lerp(camTarget, 1 - Math.pow(0.002, dt));
      lookTarget.set(player.position.x, player.position.y + 1.4, player.position.z);
      surfaceCamera.lookAt(lookTarget);
    }
    if (s.shake > 0) {
      const k = s.shake * s.shake * 0.6;
      shakeVec.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
      surfaceCamera.position.add(shakeVec);
    }

    s.update(dt, t, surfaceCamera, player ? player.position : s.spawn);
    if (player && state.mode === 'surface') updateSurfaceHud();
  }
}

window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  surfaceCamera.aspect = aspect;
  surfaceCamera.updateProjectionMatrix();
  ship.resize(aspect);
  renderer.setSize(window.innerWidth, window.innerHeight);
});

frame();

// Dev-only hook for poking at the game from the console (stripped from production builds).
if (import.meta.env.DEV) {
  window.__game = { state, get player() { return player; }, ship, planets };
}
