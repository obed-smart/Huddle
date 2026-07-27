/* ============================================================
   stage.js — 1:1 LAYOUT (one fullscreen + floating PIP cards)
   Used by voice-call and video-call. NOT by meet.

   THE RULE: each participant owns ONE persistent DOM element that
   is MOVED between the stage and the strip with appendChild —
   never destroyed and rebuilt.

   That matters once real media lands. A <video> holds its stream on
   .srcObject; rebuilding on every swap re-binds the stream, flashes
   black, and can drop frames. Moving the node keeps it live.
   ============================================================ */

class Stage {
  constructor(stageId, stripId, kind) {
    this.root  = document.getElementById(stageId);
    this.strip = document.getElementById(stripId);
    this.kind  = kind;            // 'audio' | 'video'
    this.list  = [];
    this.onId  = null;            // who is currently fullscreen
  }

  add(p) {
    if (this.list.some(x => x.id === p.id)) return;
    const item = { ...p, el: this._build(p) };
    this.list.push(item);
    if (!this.onId) this.onId = item.id;   // first arrival takes the stage
    this.draw();
  }

  remove(id) {
    const i = this.list.findIndex(x => x.id === id);
    if (i < 0) return;
    this.list[i].el.remove();
    this.list.splice(i, 1);
    if (this.onId === id) {
      const next = this.list.find(x => !x.self) || this.list[0];
      this.onId = next ? next.id : null;
    }
    this.draw();
  }

  /** ringing -> connected */
  connected(id) {
    const p = this.list.find(x => x.id === id);
    if (!p) return;
    p.pending = false;
    p.el.classList.remove('pending');
    const b = p.el.querySelector('.tile-badge');
    if (b) b.remove();
    this.draw();
  }

  /** Real wiring: pc.ontrack = e => stage.attach(peerId, e.streams[0]) */
  attach(id, stream) {
    const p = this.list.find(x => x.id === id);
    if (!p) return;
    let v = p.el.querySelector('video');
    if (!v) {
      v = document.createElement('video');
      v.autoplay = true;
      v.playsInline = true;
      v.muted = !!p.self;          // never hear yourself
      const ph = p.el.querySelector('.tile-ph');
      if (ph) ph.remove();
      p.el.appendChild(v);
    }
    v.srcObject = stream;
  }

  draw() {
    const on = this.list.find(x => x.id === this.onId);
    const label = document.getElementById('stageLabel');
    if (on) {
      on.el.className = 'stage-tile';
      this.root.appendChild(on.el);              // moves, never rebuilds
      if (label) label.textContent = on.self ? 'You' : on.name;
    } else if (label) label.textContent = '';

    this.list.filter(x => x.id !== this.onId).forEach(p => {
      p.el.className = 'strip-tile' + (p.pending ? ' pending' : '');
      this.strip.appendChild(p.el);
    });
  }

  _build(p) {
    const d = document.createElement('div');
    d.dataset.participant = p.id;
    d.innerHTML =
      '<div class="tile-ph">' + esc((p.name || '?')[0].toUpperCase()) + '</div>' +
      '<span class="tile-name">' + (p.self ? 'You' : esc(p.name)) + '</span>' +
      (p.pending ? '<span class="tile-badge">ringing</span>' : '');
    // tap a small card to swap it onto the stage
    d.addEventListener('click', () => {
      if (d.classList.contains('strip-tile')) { this.onId = p.id; this.draw(); }
    });
    return d;
  }

  names() { return this.list.map(x => x.name); }
}
