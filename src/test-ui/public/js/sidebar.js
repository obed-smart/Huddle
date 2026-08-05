/* ============================================================
   sidebar.js — THE CONVERSATION LIST

   Rendered on BOTH dashboard and chat. On mobile only one pane
   shows at a time (CSS decides); on desktop they sit side by side,
   which is what stops a wide screen looking empty.

   Rows only OPEN the chat. Calls are started from inside the chat,
   so there are no call buttons here — the list just shows whether
   a call is running.
   ============================================================ */

// TODO: replace with real endpoints.
//   GET /api/conversations?type=direct   (accepted DMs)
//   GET /api/conversations?type=group
const DIRECT = [
  { id: 'c1', name: 'Chris', sub: 'Hey 👋' },
  { id: 'c2', name: 'Amaka', sub: 'See you then' },
];
const GROUPS = [
  { id: 'g1', name: 'Backend Engineers', sub: '12 members' },
  { id: 'g2', name: 'Huddle Testers', sub: '4 members' },
];

/** @param {string} activeId  highlight the open conversation (chat page) */
function renderSidebar(activeId) {
  const call = CallState.get();

  // "in a call" bar — only while a call is running
  const bar = el('onCall');
  if (call) {
    bar.classList.remove('hidden');
    el('onCallTitle').textContent = call.convName;
    el('onCallSub').textContent = kindLabel(call.type) + ' · ' + call.people.length + ' in call';
    bar.onclick = () => {
      go(callUrl(call.type, { id: call.convId, name: call.convName }));
    };
  } else {
    bar.classList.add('hidden');
  }

  fillList('listDirect', DIRECT, false, activeId, call);
  fillList('listGroups', GROUPS, true, activeId, call);
}

function fillList(boxId, items, group, activeId, call) {
  const box = el(boxId);
  box.innerHTML = '';
  items.forEach((it) => {
    const live = call && call.convId === it.id;
    const row = document.createElement('div');
    row.className = 'row' + (it.id === activeId ? ' active' : '');
    row.innerHTML =
      '<div class="avatar' + (group ? ' group' : '') + '">' + esc(it.name[0]) + '</div>' +
      '<div class="row-text"><div class="row-name">' + esc(it.name) + '</div>' +
      (live
        ? '<div class="row-sub live"><span class="dot"></span>' +
          kindLabel(call.type) + ' in progress</div>'
        : '<div class="row-sub">' + esc(it.sub) + '</div>') +
      '</div>';
    row.addEventListener('click', () => { window.location.href = chatUrl(it); });
    box.appendChild(row);
  });
}
