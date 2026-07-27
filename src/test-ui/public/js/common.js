/* ============================================================
   common.js — GENERIC UTILITIES ONLY
   No screen logic, no call logic. Loaded by every page.
   ============================================================ */

/** Test peers the DEV buttons pull from. Delete with the dev blocks. */
const PEERS = ['Chris', 'Amaka', 'David', 'Tunde', 'Zainab'];

/** Null-safe element access — a control that doesn't exist on the
    current screen shouldn't throw and kill every handler after it. */
const NOOP = new Proxy(
  { style: {}, dataset: {}, classList: { toggle(){}, add(){}, remove(){}, contains(){ return false; } } },
  { get(t, k) { return k in t ? t[k] : (() => {}); }, set() { return true; } }
);
function el(id) {
  return document.getElementById(id) || NOOP;
}

/** Escape before inserting user text into innerHTML. */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Reads ?id=&name= — how the target conversation travels between pages. */
function getTarget() {
  const p = new URLSearchParams(window.location.search);
  return { id: p.get('id') || '', name: p.get('name') || 'Unknown' };
}

function chatUrl(t) {
  return '/chat?id=' + encodeURIComponent(t.id) + '&name=' + encodeURIComponent(t.name);
}

function callUrl(type, t) {
  const path = type === 'meet' ? 'meet' : type === 'voice' ? 'voice-call' : 'video-call';
  return '/' + path + '?id=' + encodeURIComponent(t.id) + '&name=' + encodeURIComponent(t.name);
}

function kindLabel(t) {
  return t === 'meet' ? 'Meet' : t === 'voice' ? 'Voice' : 'Video';
}

function bytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

/** Brief message, used when a rule blocks an action. */
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

/* mm:ss timer — started only when a call actually connects, never
   on dial, so ringing time isn't counted as talk time. */
const CallTimer = {
  id: null,
  start(elId) {
    const node = document.getElementById(elId);
    if (!node || this.id) return;
    let n = 0;
    node.textContent = '00:00';
    this.id = setInterval(() => {
      n++;
      node.textContent =
        String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
    }, 1000);
  },
  stop() {
    clearInterval(this.id);
    this.id = null;
  },
};
