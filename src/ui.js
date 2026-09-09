const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderBlock(b) {
  let html = '<div class="block">';
  if (b.h) {
    html += `<h3>${escapeHtml(b.h)}${b.meta ? `<span class="meta">${escapeHtml(b.meta)}</span>` : ''}</h3>`;
  }
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
  constructor({ profile, zones, onStart, onFastTravel, onPanelClose, isTouch }) {
    this.zones = zones;
    this.visited = new Set();
    this.panelOpen = false;
    this.started = false;
    this.currentZone = null;
    this.onPanelClose = onPanelClose;

    // Intro
    $('intro-name').textContent = profile.name;
    $('intro-title').textContent = `${profile.title} · ${profile.tagline}`;
    $('hud-name').textContent = profile.name;
    $('hud-title').textContent = profile.title;
    $('hud-avatar').textContent = profile.avatarInitial || profile.name[0];
    document.title = `${profile.name} — Portfolio Quest`;

    $('start-btn').addEventListener('click', () => {
      $('intro').hidden = true;
      $('hud').hidden = false;
      if (isTouch) {
        $('joystick').hidden = false;
      }
      this.started = true;
      onStart?.();
      this.toast('Welcome, traveller!');
    });

    // Quest log
    const list = $('quest-list');
    zones.forEach((z) => {
      const li = document.createElement('li');
      li.dataset.id = z.id;
      li.style.setProperty('--z', z.color);
      li.innerHTML = `<span class="dot"></span><span>${escapeHtml(z.title)}</span><span class="check"></span>`;
      li.title = `Fast travel to ${z.title}`;
      li.addEventListener('click', () => {
        if (!this.started || this.panelOpen) return;
        onFastTravel(z.id);
        this.toast(`→ ${z.title}`);
      });
      list.appendChild(li);
    });

    $('panel-close').addEventListener('click', () => this.closePanel());
    $('panel').addEventListener('click', (e) => { if (e.target.id === 'panel') this.closePanel(); });
  }

  setZone(zone) {
    if (zone?.id === this.currentZone?.id) return;
    this.currentZone = zone;
    const prompt = $('prompt');
    const btn = $('action-btn');
    document.querySelectorAll('#quest-list li').forEach((li) => li.classList.toggle('active', li.dataset.id === zone?.id));
    if (zone) {
      $('prompt-text').textContent = zone.prompt || `Explore ${zone.title}`;
      prompt.hidden = false;
      if (!$('joystick').hidden) btn.hidden = false;
      this.toast(zone.title);
    } else {
      prompt.hidden = true;
      btn.hidden = true;
    }
  }

  openPanel(zone) {
    if (!zone) return;
    this.panelOpen = true;
    $('panel-kicker').textContent = zone.kicker || '';
    $('panel-title').textContent = zone.title;
    $('panel-header').style.setProperty('--z', zone.color);
    $('panel-body').innerHTML = zone.content.map(renderBlock).join('');
    $('panel-body').scrollTop = 0;
    $('panel').hidden = false;
    $('prompt').hidden = true;
    this.markVisited(zone.id);
  }

  closePanel() {
    if (!this.panelOpen) return;
    this.panelOpen = false;
    $('panel').hidden = true;
    if (this.currentZone) $('prompt').hidden = false;
    this.onPanelClose?.();
  }

  markVisited(id) {
    if (this.visited.has(id)) return;
    this.visited.add(id);
    const li = document.querySelector(`#quest-list li[data-id="${id}"]`);
    if (li) {
      li.classList.add('done');
      li.querySelector('.check').textContent = '✓';
    }
    const pct = Math.round((this.visited.size / this.zones.length) * 100);
    $('quest-bar').style.width = `${pct}%`;
    $('quest-pct').textContent = `${pct}% explored`;
    if (pct === 100) setTimeout(() => this.toast('🏆 100% explored — thanks for visiting!'), 400);
  }

  toast(text) {
    const el = $('zone-toast');
    el.hidden = true;
    // restart the CSS animation
    void el.offsetWidth;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
  }
}
