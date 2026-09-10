import { BIOMES } from './biomes.js';

const $ = (id) => document.getElementById(id);
const ARROW_GLYPH = { up: '▲', down: '▼', left: '◀', right: '▶' };

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderBlock(b) {
  let html = '<div class="block">';
  if (b.h) html += `<h3>${escapeHtml(b.h)}${b.meta ? `<span class="meta">${escapeHtml(b.meta)}</span>` : ''}</h3>`;
  if (b.sub) html += `<div class="sub">${escapeHtml(b.sub)}</div>`;
  if (b.p) html += `<p>${escapeHtml(b.p)}</p>`;
  if (b.bullets?.length) html += `<ul>${b.bullets.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
  if (b.tags?.length) html += `<div class="tags">${b.tags.map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join('')}</div>`;
  if (b.links?.length) {
    html += `<div class="link-row">${b.links
      .map((l) => `<a class="link-btn" href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`)
      .join('')}</div>`;
  }
  return html + '</div>';
}

export class UI {
  constructor({ profile, campaign, planets, isTouch, onStart, onSelectPlanet, onDeploy, onAbort, onIntelClose, onMute }) {
    this.planets = planets;
    this.isTouch = isTouch;
    this.intelOpen = false;
    this.started = false;
    this.onIntelClose = onIntelClose;
    this.labelEls = new Map();
    this.markerEls = new Map();
    this.compassEls = new Map();

    // ---- intro ----
    $('intro-kicker').textContent = campaign.title;
    $('intro-name').textContent = profile.name;
    $('intro-title').textContent = profile.title;
    $('intro-brief').textContent = campaign.brief;
    document.title = `${profile.name} — ${campaign.title.charAt(0) + campaign.title.slice(1).toLowerCase()}`;
    $('start-btn').addEventListener('click', () => {
      $('intro').hidden = true;
      $('mute-btn').hidden = false;
      this.started = true;
      onStart();
    });

    // ---- ship ----
    $('ship-avatar').textContent = profile.avatarInitial || profile.name[0];
    $('ship-name').textContent = profile.name;
    $('ship-title').textContent = `${profile.title} · ${profile.location}`;
    $('ship-vessel').textContent = campaign.vessel;
    const labels = $('planet-labels');
    planets.forEach((p, i) => {
      const el = document.createElement('div');
      el.className = 'planet-label';
      el.innerHTML = `<div class="pl-name">${escapeHtml(p.name)}</div><div class="pl-sub">${escapeHtml(p.designation)}</div><div class="pl-tick"></div>`;
      el.addEventListener('click', () => onSelectPlanet(i, true));
      labels.appendChild(el);
      this.labelEls.set(p.id, el);
    });
    $('deploy-btn').addEventListener('click', () => onDeploy());

    // ---- surface ----
    $('abort-btn').addEventListener('click', () => onAbort());
    if (isTouch) {
      $('joystick').hidden = false;
      $('prompt-hint').textContent = 'TAP THE ACTION BUTTON TO ENTER THE CODE';
    }
    // compass cardinal ticks
    const strip = $('compass-strip');
    [['N', 0], ['E', 90], ['W', -90], ['NE', 45], ['NW', -45]].forEach(([t, deg]) => {
      const el = document.createElement('div');
      el.className = 'compass-tick';
      el.textContent = t;
      el.dataset.deg = deg;
      strip.appendChild(el);
    });
    this.compassTicks = [...strip.querySelectorAll('.compass-tick')];

    // ---- intel ----
    $('intel-close').addEventListener('click', () => this.closeIntel());
    $('intel').addEventListener('click', (e) => { if (e.target.id === 'intel') this.closeIntel(); });

    $('mute-btn').addEventListener('click', () => {
      const muted = onMute();
      $('mute-btn').textContent = muted ? 'SND OFF' : 'SND ON';
    });
  }

  // ======================= screens =======================
  showShip() {
    $('ship-ui').hidden = false;
    $('surface-ui').hidden = true;
    $('prompt').hidden = true;
  }

  showSurface(planet) {
    $('ship-ui').hidden = true;
    $('surface-ui').hidden = false;
    $('s-planet').textContent = `${planet.name} · ${planet.designation}`;
    $('s-mission').textContent = `Mission: secure ${planet.objectives.length} intel terminal${planet.objectives.length > 1 ? 's' : ''}, then extract`;
    this.clearMarkers();
    this.setObjectives(planet, new Set(), false);
    if (this.isTouch) $('action-btn').hidden = true;
  }

  fade(on) {
    const el = $('fade');
    return new Promise((resolve) => {
      el.classList.toggle('on', on);
      setTimeout(resolve, 580);
    });
  }

  banner(text, sub = '') {
    const el = $('banner');
    el.hidden = true;
    void el.offsetWidth;
    $('banner-text').textContent = text;
    $('banner-sub').textContent = sub;
    el.hidden = false;
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => { el.hidden = true; }, 2400);
  }

  // ======================= ship =======================
  setCampaignProgress(liberated) {
    const n = this.planets.length;
    const pct = Math.round((liberated.size / n) * 100);
    $('campaign-bar').style.width = `${pct}%`;
    $('campaign-text').textContent = `${liberated.size} / ${n} planets liberated`;
  }

  selectPlanet(planet, liberated) {
    const biome = BIOMES[planet.biome] || BIOMES.moon;
    $('pi-sector').textContent = planet.sector;
    $('pi-name').textContent = planet.name;
    $('pi-designation').textContent = planet.designation;
    $('pi-brief').textContent = planet.brief;
    $('pi-biome').textContent = biome.label;
    $('pi-objectives').textContent = String(planet.objectives.length);
    const status = $('pi-status');
    status.textContent = liberated ? 'LIBERATED' : 'AWAITING DEPLOYMENT';
    status.classList.toggle('ok', liberated);
    const btn = $('deploy-btn');
    btn.classList.toggle('done', liberated);
    btn.innerHTML = liberated ? 'REVISIT <span class="kc inv">ENTER</span>' : 'DEPLOY <span class="kc inv">ENTER</span>';
    for (const [id, el] of this.labelEls) el.classList.toggle('selected', id === planet.id);
  }

  updatePlanetLabels(positions, liberated) {
    for (const p of positions) {
      const el = this.labelEls.get(p.id);
      if (!el) continue;
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      el.style.opacity = p.visible ? '1' : '0';
      el.classList.toggle('liberated', liberated.has(p.id));
      const sub = el.querySelector('.pl-sub');
      const planet = this.planets.find((x) => x.id === p.id);
      sub.textContent = liberated.has(p.id) ? 'LIBERATED' : planet.designation;
    }
  }

  // ======================= surface =======================
  setObjectives(planet, doneIds, extractUnlocked, extractDone = false) {
    const list = $('objective-list');
    list.innerHTML = '';
    planet.objectives.forEach((o, i) => {
      const li = document.createElement('li');
      const done = doneIds.has(`t${i}`);
      li.className = done ? 'done' : '';
      li.innerHTML = `<span class="obj-box">${done ? '✓' : ''}</span><span>Secure intel: ${escapeHtml(o.label)}</span>`;
      list.appendChild(li);
    });
    const ex = document.createElement('li');
    ex.className = `extract ${extractUnlocked ? '' : 'locked'} ${extractDone ? 'done' : ''}`;
    ex.innerHTML = `<span class="obj-box">${extractDone ? '✓' : ''}</span><span>Extract from planet</span>`;
    list.appendChild(ex);
  }

  showPrompt(label, code, progress) {
    $('prompt-label').textContent = label;
    const codeEl = $('prompt-code');
    codeEl.classList.remove('error');
    codeEl.innerHTML = code.map((a, i) => `<span class="arrow ${i < progress ? 'done' : ''}">${ARROW_GLYPH[a]}</span>`).join('');
    $('prompt').hidden = false;
    if (this.isTouch) $('action-btn').hidden = false;
  }

  hidePrompt() {
    $('prompt').hidden = true;
    if (this.isTouch) $('action-btn').hidden = true;
  }

  promptError() {
    const codeEl = $('prompt-code');
    codeEl.classList.remove('error');
    void codeEl.offsetWidth;
    codeEl.classList.add('error');
    codeEl.querySelectorAll('.arrow').forEach((a) => a.classList.remove('done'));
  }

  /** markers: [{ id, x, y, visible, label, dist, done, kind: 'intel'|'extract', near }] */
  updateMarkers(markers) {
    const root = $('markers');
    const seen = new Set();
    for (const m of markers) {
      seen.add(m.id);
      let el = this.markerEls.get(m.id);
      if (!el) {
        el = document.createElement('div');
        el.innerHTML = `<div class="m-icon"></div><div class="m-text"></div><div class="m-dist"></div>`;
        root.appendChild(el);
        this.markerEls.set(m.id, el);
      }
      el.className = `marker ${m.kind} ${m.done ? 'done' : ''} ${m.near ? 'near' : ''}`;
      el.style.left = `${m.x}px`;
      el.style.top = `${m.y}px`;
      el.style.opacity = m.visible ? '1' : '0';
      el.querySelector('.m-icon').textContent = m.done ? '✓' : m.kind === 'extract' ? '⇧' : String(m.index + 1);
      el.querySelector('.m-text').textContent = m.label;
      el.querySelector('.m-dist').textContent = m.done ? 'SECURED' : `${Math.round(m.dist)} m`;
    }
    for (const [id, el] of this.markerEls) if (!seen.has(id)) { el.remove(); this.markerEls.delete(id); }
  }

  clearMarkers() {
    for (const el of this.markerEls.values()) el.remove();
    this.markerEls.clear();
    for (const el of this.compassEls.values()) el.remove();
    this.compassEls.clear();
  }

  /** bearings: [{ id, deg (-180..180, 0 = north), done, kind, index }] */
  updateCompass(bearings) {
    const strip = $('compass-strip');
    const w = strip.clientWidth || 1;
    const span = 110; // degrees visible either side of centre
    const px = (deg) => w / 2 + (Math.max(-span, Math.min(span, deg)) / span) * (w / 2 - 14);
    for (const t of this.compassTicks) {
      const deg = Number(t.dataset.deg);
      t.style.left = `${px(deg)}px`;
      t.style.opacity = Math.abs(deg) > span ? '0' : '1';
    }
    const seen = new Set();
    for (const b of bearings) {
      seen.add(b.id);
      let el = this.compassEls.get(b.id);
      if (!el) {
        el = document.createElement('div');
        strip.appendChild(el);
        this.compassEls.set(b.id, el);
      }
      el.className = `compass-mark ${b.kind} ${b.done ? 'done' : ''}`;
      el.textContent = b.done ? '✓' : b.kind === 'extract' ? '⇧' : String(b.index + 1);
      el.style.left = `${px(b.deg)}px`;
    }
    for (const [id, el] of this.compassEls) if (!seen.has(id)) { el.remove(); this.compassEls.delete(id); }
  }

  // ======================= intel =======================
  openIntel(planet, objective) {
    this.intelOpen = true;
    $('intel-kicker').textContent = `${planet.designation} · INTEL · ${objective.label}`;
    $('intel-title').textContent = objective.blocks[0]?.h && objective.blocks.length === 1 ? objective.blocks[0].h : objective.label;
    $('intel-body').innerHTML = objective.blocks.map(renderBlock).join('');
    $('intel-body').scrollTop = 0;
    $('intel').hidden = false;
    this.hidePrompt();
  }

  closeIntel() {
    if (!this.intelOpen) return;
    this.intelOpen = false;
    $('intel').hidden = true;
    this.onIntelClose?.();
  }
}
