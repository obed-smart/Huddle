/* ============================================================
   grid.js — MEET LAYOUT (bento grid + tap-to-fullscreen)
   Used by meet only.

   Deliberately a DIFFERENT engine from stage.js. A 1:1 call has a
   subject (the other person) so one face is fullscreen. A meet is a
   room — nobody is "the call" — so everyone shows at once and you
   opt into fullscreening someone.

   Same persistent-element rule as stage.js.
   ============================================================ */

class Grid {
  constructor(gridId) {
    this.root = document.getElementById(gridId);
    this.list = [];
    this.fsId = null;             // null = grid mode
  }

  add(p) {
    if (this.list.some(x => x.id === p.id)) return;
    const item = { ...p, el: this._build(p) };
    this.list.push(item);
    this.root.appendChild(item.el);
    this.draw();
  }

  remove(id) {
    const i = this.list.findIndex(x => x.id === id);
    if (i < 0) return;
    this.list[i].el.remove();
    this.list.splice(i, 1);
    if (this.fsId === id) this.fsId = null;
    this.draw();
  }

  attach(id, stream) {
    const p = this.list.find(x => x.id === id);
    if (!p) return;
    let v = p.el.querySelector('video');
    if (!v) {
      v = document.createElement('video');
      v.autoplay = true;
      v.playsInline = true;
      v.muted = !!p.self;
      const ph = p.el.querySelector('.tile-ph');
      if (ph) ph.remove();
      p.el.insertBefore(v, p.el.firstChild);
    }
    v.srcObject = stream;
  }

  full(id) { this.fsId = id; this.draw(); }
  exit()   { this.fsId = null; this.draw(); }

  /* Fullscreen HIDES the other tiles rather than removing them, so
     their streams stay bound and returning to the grid is instant. */
  draw() {
    this.root.classList.toggle('fs', !!this.fsId);
    this.list.forEach(p => {
      const one = p.id === this.fsId;
      p.el.classList.toggle('hidden', !!this.fsId && !one);
      p.el.classList.toggle('fs-on', one);
      const b = p.el.querySelector('.expand');
      if (b) b.innerHTML = svg(one ? 'minimize' : 'maximize');
    });
  }

  _build(p) {
    const d = document.createElement('div');
    d.className = 'grid-tile';
    d.dataset.participant = p.id;
    d.innerHTML =
      '<div class="tile-ph">' + esc((p.name || '?')[0].toUpperCase()) + '</div>' +
      '<span class="tile-name">' + (p.self ? 'You' : esc(p.name)) + '</span>' +
      '<button class="expand">' + svg('maximize') + '</button>';
    d.querySelector('.expand').addEventListener('click', (e) => {
      e.stopPropagation();
      this.fsId === p.id ? this.exit() : this.full(p.id);
    });
    return d;
  }

  names() { return this.list.map(x => x.name); }
}
