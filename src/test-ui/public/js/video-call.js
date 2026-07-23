// ============================================================
// VIDEO CALL — same growth pattern as voice, plus camera. No chat.
// ============================================================

const target = getTargetFromQuery();
document.getElementById('videoTitle').textContent = target.name;

addTile('videoGrid', 'You', 'video');
addTile('videoGrid', target.name, 'video', { pending: true, status: 'ringing' });
setCallState('videoState', 'calling');

// TODO: socket.emit('call:invite', { toUserId: target.id, callType: 'video' })

bindToggle('videoMicBtn', '🎙️ Mute', '🔇 Unmute', (on) => {
  // TODO: localStream.getAudioTracks()[0].enabled = on;
});
bindToggle('videoCamBtn', '🎥 Camera', '📷 Camera off', (on) => {
  // TODO: localStream.getVideoTracks()[0].enabled = on;
});

document.getElementById('videoInviteBtn').addEventListener('click', () => {
  const peer = nextFakePeer('videoGrid');
  if (!peer) return alert('No more dummy peers.');
  addTile('videoGrid', peer, 'video', { pending: true, status: 'ringing' });
});

document.getElementById('videoLeaveBtn').addEventListener('click', () => {
  setCallState('videoState', 'ended');
  setTimeout(() => { window.location.href = '/dashboard'; }, 500);
});

document.querySelectorAll('[data-devstate="video"] [data-state]').forEach((btn) =>
  btn.addEventListener('click', () => setCallState('videoState', btn.dataset.state))
);

document.getElementById('videoSimJoin').addEventListener('click', () => {
  const peer = nextFakePeer('videoGrid');
  if (!peer) return alert('No more dummy peers.');
  addTile('videoGrid', peer, 'video');
  setCallState('videoState', 'connected');
});
document.getElementById('videoSimLeave').addEventListener('click', () => removeLastPeer('videoGrid'));
