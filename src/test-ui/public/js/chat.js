/* ============================================================
   chat.js — THE HUB

   Calls are started here and announced here as a card in the
   transcript. Two rules matter:

   1. ONE CALL AT A TIME. Tapping the call button while a call is
      running is blocked with a message. (UI only — the server must
      reject a second call:invite too.)

   2. EACH CARD HAS ITS OWN ID. A card is "live" only if it is THE
      active call — not merely because some call exists in this
      conversation. Without that, every old card in the room lights
      up again the moment a new call starts.
   ============================================================ */

const target = getTarget();

/* Message history. TODO: GET /api/conversations/:id/messages */
const messages = [
  { from: target.name, text: 'Hey 👋', mine: false },
  { from: 'You', text: "Hey! what's up", mine: true },
];

el('chatName').textContent = target.name;
el('chatAv').textContent = (target.name || '?')[0].toUpperCase();
el('chatSub').textContent = 'online';

/* ---------- render ---------- */

function renderChat() {
  const box = el('chatInner');
  box.innerHTML = '';
  messages.forEach((m) => {
    if (m.type === 'call') { box.appendChild(callCard(m)); return; }
    const d = document.createElement('div');
    d.className = 'msg' + (m.mine ? ' mine' : '');
    d.innerHTML = '<div class="bubble">' + esc(m.text) + '</div>';
    box.appendChild(d);
  });
  box.scrollTop = box.scrollHeight;
}

/**
 * A call announcement. Live only when CallState says THIS card is
 * the active call — see the note at the top of the file.
 */
function callCard(m) {
  const live = CallState.isCard(m.cardId);
  const call = CallState.get();

  const card = document.createElement('div');
  card.className = 'call-card' + (live ? ' live' : '');

  const icon = m.callType === 'meet' ? 'users' : m.callType === 'voice' ? 'phone' : 'video';

  let html =
    '<div class="cc-top"><span class="cc-icon">' + svg(icon) + '</span>' +
    '<div class="cc-body">' +
    '<div class="cc-title">' + (m.mine ? 'You' : esc(m.from)) +
    ' started a ' + kindLabel(m.callType).toLowerCase() + ' call</div>' +
    '<div class="cc-meta">' + (live ? call.people.length + ' in call' : 'Ended') + '</div>' +
    '</div></div>';

  if (live) {
    const inIt = call.people.includes('You');
    html +=
      '<button class="cc-btn ' + (inIt ? 'btn-return' : 'btn-join') + '" data-act="' +
      (inIt ? 'return' : 'join') + '">' +
      svg(inIt ? 'arrow-left' : 'phone') +
      (inIt ? 'Return to call' : 'Join') + '</button>';
  }

  card.innerHTML = html;

  card.querySelectorAll('[data-act]').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.act === 'join') CallState.join();
      window.location.href = callUrl(m.callType, target);
    });
  });

  return card;
}

/* ---------- messages ---------- */

function sendMessage() {
  const input = el('msgInput');
  const text = input.value.trim();
  if (!text) return;
  // TODO: socket.emit('message:send', { conversationId: target.id, text })
  messages.push({ from: 'You', text, mine: true });
  input.value = '';
  renderChat();
}
el('sendBtn').addEventListener('click', sendMessage);
el('msgInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

/* ---------- starting a call ---------- */

el('callBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const call = CallState.get();
  if (call) {
    // ONE CALL AT A TIME. Advisory only — enforce server-side too,
    // since a second tab never sees this check.
    toast(call.convId === target.id
      ? 'You are already in this call'
      : 'End your call with ' + call.convName + ' first');
    return;
  }
  openCallMenu();
});

/**
 * Position the menu under the call button and open it.
 *
 * Anchored rather than fixed to the viewport: the button sits in a
 * different place on mobile vs desktop (and moves with the sidebar),
 * so hard-coding coordinates would put the menu in the wrong spot on
 * one of them.
 */
function openCallMenu() {
  const btn = document.getElementById('callBtn');
  const menu = el('sheet');
  const r = btn.getBoundingClientRect();

  menu.style.position = 'fixed';
  menu.style.top = (r.bottom + 8) + 'px';
  // Right-align to the button, clamped so it can't run off-screen.
  const right = Math.max(12, window.innerWidth - r.right);
  menu.style.right = right + 'px';
  menu.style.left = 'auto';

  menu.classList.add('open');
}

document.querySelectorAll('[data-start]').forEach((row) => {
  row.addEventListener('click', () => {
    el('sheet').classList.remove('open');
    startCall(row.dataset.start);
  });
});

/* An anchored menu goes stale if the layout moves under it. */
window.addEventListener('resize', () => el('sheet').classList.remove('open'));

/* tap outside to dismiss */
document.addEventListener('click', (e) => {
  const sheet = el('sheet');
  const btn = document.getElementById('callBtn');
  if (sheet.classList.contains('open') && !sheet.contains(e.target) &&
      btn && !btn.contains(e.target)) {
    sheet.classList.remove('open');
  }
});

function startCall(type) {
  const cardId = CallState.start(target.id, target.name, type);
  messages.push({ type: 'call', callType: type, from: 'You', mine: true, cardId });
  renderChat();
  window.location.href = callUrl(type, target);
}

renderSidebar(target.id);   // keeps the desktop list in sync + highlighted
renderChat();
paintIcons();
