// ============================================================
// SHARED HELPERS — used by voice-call.js, video-call.js, meet.js
//
// The core idea: never render a fixed participant list. Render
// yourself, then append exactly one tile per join event as it
// arrives. Real wiring for a tile once you have actual media:
//
//   peerConnection.ontrack = (e) => {
//     const tile = addTile(gridId, peerName, 'video');
//     tile.querySelector('video').srcObject = e.streams[0];
//   };
// ============================================================

const FAKE_PEERS = ['Chris', 'Amaka', 'David', 'Tunde', 'Zainab', 'Ify'];

function addTile(gridId, name, kind /* 'audio' | 'video' */, opts = {}) {
  const grid = document.getElementById(gridId);
  const tile = document.createElement('div');
  tile.className = 'tile ' + (kind === 'audio' ? 'audio' : '');
  if (opts.pending) tile.classList.add('pending');
  tile.dataset.participant = name;

  // TODO: for video, replace this glyph with a <video autoplay playsinline>
  // element and bind its srcObject in your ontrack handler.
  tile.innerHTML =
    (kind === 'audio' ? '🎙️' : '👤') +
    '<span class="tile-name">' + name + '</span>' +
    (opts.status ? '<span class="tile-status">' + opts.status + '</span>' : '');

  grid.appendChild(tile);
  return tile;
}

function removeTile(gridId, name) {
  const grid = document.getElementById(gridId);
  const tile = grid.querySelector('[data-participant="' + CSS.escape(name) + '"]');
  if (tile) tile.remove();
}

// Removes the most recently added peer. Never removes "You" — that's
// your own local tile, not a peer who left.
function removeLastPeer(gridId) {
  const tiles = [...document.getElementById(gridId).querySelectorAll('.tile')];
  for (let i = tiles.length - 1; i >= 0; i--) {
    if (tiles[i].dataset.participant !== 'You') {
      const name = tiles[i].dataset.participant;
      tiles[i].remove();
      return name;
    }
  }
  return null;
}

function tileNames(gridId) {
  return [...document.getElementById(gridId).querySelectorAll('.tile')]
    .map((t) => t.dataset.participant);
}

// Pull the next unused fake peer name for the DEV join buttons.
function nextFakePeer(gridId) {
  const taken = tileNames(gridId);
  return FAKE_PEERS.find((n) => !taken.includes(n)) || null;
}

function setCallState(badgeId, state) {
  const el = document.getElementById(badgeId);
  el.textContent = state;
  el.className = 'state-badge state-' + state;
}

// Toggle button helper for mute/camera controls.
function bindToggle(btnId, labelOn, labelOff, onChange) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.textContent = labelOn;
  btn.addEventListener('click', () => {
    const nowOn = !btn.classList.contains('on');
    btn.classList.toggle('on', nowOn);
    btn.textContent = nowOn ? labelOn : labelOff;
    if (onChange) onChange(nowOn);
  });
}

// Reads ?id=&name= from the current URL — how target info travels
// between pages now that this is a real multi-page app instead of
// one file with JS-toggled sections.
function getTargetFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get('id') || '',
    name: params.get('name') || 'Unknown',
  };
}
