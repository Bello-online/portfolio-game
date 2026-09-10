// Tiny procedural sound kit (no audio files needed). Everything is
// synthesised with WebAudio oscillators / noise so it stays lightweight.

class AudioKit {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  // Must be called from a user gesture (the Start button click).
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  _tone(freq, dur, { type = 'square', vol = 0.12, at = 0, slide = 0 } = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  _noise(dur, { vol = 0.3, from = 800, to = 80, at = 0, q = 0.7 } = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + at;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.Q.value = q;
    filt.frequency.setValueAtTime(from, t0);
    filt.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt).connect(g).connect(this.master);
    src.start(t0);
  }

  // ---- named cues ----
  uiTick() { this._tone(880, 0.05, { type: 'square', vol: 0.05 }); }
  select() { this._tone(520, 0.08, { type: 'triangle', vol: 0.1 }); this._tone(780, 0.1, { type: 'triangle', vol: 0.08, at: 0.06 }); }
  codeInput(step) { this._tone(600 + step * 140, 0.07, { type: 'square', vol: 0.09 }); }
  codeError() { this._tone(140, 0.28, { type: 'sawtooth', vol: 0.12, slide: -60 }); }
  codeSuccess() {
    [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.16, { type: 'triangle', vol: 0.11, at: i * 0.07 }));
  }
  deploy() { this._noise(1.2, { vol: 0.25, from: 300, to: 2400 }); this._tone(90, 1.0, { type: 'sawtooth', vol: 0.06, slide: 120 }); }
  impact() { this._noise(0.6, { vol: 0.6, from: 900, to: 60, q: 1.2 }); this._tone(55, 0.5, { type: 'sine', vol: 0.3, slide: -30 }); }
  doorOpen() { this._noise(0.35, { vol: 0.15, from: 2000, to: 400 }); }
  extract() { this._noise(1.6, { vol: 0.3, from: 200, to: 4000 }); this._tone(220, 1.4, { type: 'sine', vol: 0.08, slide: 660 }); }
  banner() { this._tone(330, 0.12, { type: 'square', vol: 0.07 }); this._tone(440, 0.18, { type: 'square', vol: 0.07, at: 0.1 }); }
  liberated() {
    [392, 523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.22, { type: 'triangle', vol: 0.12, at: i * 0.09 }));
  }
}

export const audio = new AudioKit();
