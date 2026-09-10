/**
 * Keyboard + touch input.
 *  - WASD moves (world space; the camera never rotates, so "up" is -z).
 *  - Arrow keys are reserved for code input (stratagem-style) and planet selection.
 *  - E / Enter / Space queue an "action"; Escape queues an "escape".
 *  - Shift = sprint.
 */
const ARROWS = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right' };

export class Input {
  constructor({ joystickEl, actionBtn }) {
    this.keys = new Set();
    this.vector = { x: 0, z: 0 };
    this.actionQueued = false;
    this.escapeQueued = false;
    this.arrowQueue = [];
    this.isTouch = window.matchMedia('(pointer: coarse)').matches;

    window.addEventListener('keydown', (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (ARROWS[k] || k === ' ') e.preventDefault();
      if (e.repeat) return;
      if (ARROWS[k]) this.arrowQueue.push(ARROWS[k]);
      if (k === 'e' || k === 'enter' || k === ' ') this.actionQueued = true;
      if (k === 'escape') this.escapeQueued = true;
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    // ----- touch joystick -----
    this.joy = { active: false, id: null, cx: 0, cy: 0, x: 0, y: 0 };
    this.knob = joystickEl.querySelector('.joystick-knob');
    const RADIUS = 46;

    const onStart = (e) => {
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const rect = joystickEl.getBoundingClientRect();
      this.joy.active = true;
      this.joy.id = t.identifier ?? 'mouse';
      this.joy.cx = rect.left + rect.width / 2;
      this.joy.cy = rect.top + rect.height / 2;
      onMove(e);
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!this.joy.active) return;
      const touches = e.changedTouches ? Array.from(e.changedTouches) : [e];
      const t = touches.find((x) => (x.identifier ?? 'mouse') === this.joy.id);
      if (!t) return;
      let dx = t.clientX - this.joy.cx;
      let dy = t.clientY - this.joy.cy;
      const d = Math.hypot(dx, dy);
      if (d > RADIUS) { dx = (dx / d) * RADIUS; dy = (dy / d) * RADIUS; }
      this.joy.x = dx / RADIUS;
      this.joy.y = dy / RADIUS;
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      e.preventDefault();
    };
    const onEnd = (e) => {
      const touches = e.changedTouches ? Array.from(e.changedTouches) : [e];
      if (!touches.find((x) => (x.identifier ?? 'mouse') === this.joy.id)) return;
      this.joy.active = false;
      this.joy.x = this.joy.y = 0;
      this.knob.style.transform = '';
    };
    joystickEl.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    joystickEl.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    actionBtn.addEventListener('click', () => { this.actionQueued = true; });
  }

  get sprint() {
    return this.keys.has('shift');
  }

  update() {
    let x = 0, z = 0;
    const k = this.keys;
    if (k.has('w')) z -= 1;
    if (k.has('s')) z += 1;
    if (k.has('a')) x -= 1;
    if (k.has('d')) x += 1;
    const len = Math.hypot(x, z);
    if (len > 0) { x /= len; z /= len; }
    if (this.joy.active) { x = this.joy.x; z = this.joy.y; }
    this.vector.x = x;
    this.vector.z = z;
  }

  consumeArrows() {
    const a = this.arrowQueue;
    this.arrowQueue = [];
    return a;
  }

  consumeAction() {
    const a = this.actionQueued;
    this.actionQueued = false;
    return a;
  }

  consumeEscape() {
    const a = this.escapeQueued;
    this.escapeQueued = false;
    return a;
  }
}
