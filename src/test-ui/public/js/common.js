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

/* ============================================================
   NAVIGATION — push vs replace

   Every `location.href = ...` PUSHES a new browser history entry.
   The UI's own back arrow does that too, so a session accumulates:

     dashboard → chat → call → chat → dashboard → chat → meet → ...

   Ending a call clears CallState, but history knows nothing about
   that. Hardware-back then lands on a call URL that's already dead,
   and the page happily starts a fresh call.

   `location.replace()` swaps the current entry instead of adding
   one, so leaving a call REMOVES the call URL from history rather
   than burying it. Use goReplace() whenever the page you're leaving
   should not be reachable again.
   ============================================================ */

/** Normal navigation — adds a history entry (chat → call). */
function go(url) {
  window.location.href = url;
}

/** Leaving a dead-end page — removes it from history (call → chat). */
function goReplace(url) {
  window.location.replace(url);
}

/**
 * Guard for call pages.
 *
 * `replace()` covers the normal path, but a user can still bookmark
 * a call URL, refresh it, or arrive from a stale history entry. If
 * no live call matches this conversation, bounce to the chat rather
 * than silently starting a new one.
 *
 * Returns true if it redirected, so callers can stop initialising.
 */
function requireActiveCall(target, expectedType) {
  const call = CallState.get();
  const ok = call && call.convId === target.id &&
             (!expectedType || call.type === expectedType);
  if (ok) return false;
  goReplace(chatUrl(target));
  return true;
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
