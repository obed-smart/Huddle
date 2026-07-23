// ============================================================
// DASHBOARD — fetches your real conversation/group lists.
//
// TODO: build these two endpoints for real:
//   GET /api/conversations?type=direct&status=accepted
//   GET /api/conversations?type=group
//
// Until they exist, this falls back to dummy data so the UI is
// still testable with your friend over ngrok. Delete the fallback
// once the endpoints are live — silently falling back forever would
// hide real API failures.
// ============================================================

const DUMMY_DIRECT = [
  { id: 'c1', name: 'Chris', sub: 'Last message 2h ago' },
  { id: 'c2', name: 'Amaka', sub: 'Last message yesterday' },
  { id: 'c3', name: 'David', sub: 'Last message 3d ago' },
];
const DUMMY_GROUPS = [
  { id: 'g1', name: 'Backend Engineers NG', sub: '12 members' },
  { id: 'g2', name: 'Huddle Testers', sub: '4 members' },
];

async function fetchConversations(type) {
  try {
    const res = await fetch(`/api/conversations?type=${type}`);
    if (!res.ok) throw new Error('Bad response: ' + res.status);
    return await res.json();
  } catch (err) {
    console.warn(`/api/conversations?type=${type} not available yet, using dummy data`, err);
    return type === 'group' ? DUMMY_GROUPS : DUMMY_DIRECT;
  }
}

function renderList(containerId, items, isGroup) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  if (!items.length) {
    box.innerHTML = '<div class="empty-note">Nothing here yet.</div>';
    return;
  }
  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'list-item';

    const q = `id=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}`;

    row.innerHTML =
      `<div class="avatar${isGroup ? ' group' : ''}">${item.name[0]}</div>` +
      `<div class="item-text">
         <div class="item-name">${item.name}</div>
         <div class="item-sub">${item.sub}</div>
       </div>` +
      `<div class="item-actions">
         <a class="button icon" title="Voice call" href="/voice-call?${q}">📞</a>
         <a class="button icon" title="Video call" href="/video-call?${q}">🎥</a>
         <a class="button icon" title="Meet"       href="/meet?${q}">🧑‍🤝‍🧑</a>
       </div>`;

    box.appendChild(row);
  });
}

(async function init() {
  const [direct, groups] = await Promise.all([
    fetchConversations('direct'),
    fetchConversations('group'),
  ]);
  renderList('directList', direct, false);
  renderList('groupList', groups, true);
})();
