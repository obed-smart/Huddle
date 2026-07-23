// ============================================================
// VOICE CALL — audio only. Tiles grow as people are invited.
// No chat panel. See common.js for addTile/removeLastPeer/etc.
// ============================================================

const target = getTargetFromQuery();
document.getElementById('voiceTitle').textContent = target.name;

addTile('voiceGrid', 'You', 'audio');
addTile('voiceGrid', target.name, 'audio', { pending: true, status: 'ringing' });
setCallState('voiceState', 'calling');

// TODO: socket.emit('call:invite', { toUserId: target.id, callType: 'voice' })
// TODO: on 'call:accepted' -> remove the pending flag on that tile and
//       start the offer/answer/ICE exchange, then setCallState('voiceState','connected')

bindToggle('voiceMicBtn', '🎙️ Mute', '🔇 Unmute', (on) => {
  // TODO: localStream.getAudioTracks()[0].enabled = on;
});

document.getElementById('voiceInviteBtn').addEventListener('click', () => {
  // TODO: open a real user picker, then socket.emit('call:invite', ...) per invitee
  const peer = nextFakePeer('voiceGrid');
  if (!peer) return alert('No more dummy peers.');
  addTile('voiceGrid', peer, 'audio', { pending: true, status: 'ringing' });
});

document.getElementById('voiceLeaveBtn').addEventListener('click', () => {
  // TODO: close every RTCPeerConnection, stop local tracks, socket.emit('call:end', ...)
  setCallState('voiceState', 'ended');
  setTimeout(() => { window.location.href = '/dashboard'; }, 500);
});

// DEV: force a state to check the UI before real signaling exists
document.querySelectorAll('[data-devstate="voice"] [data-state]').forEach((btn) =>
  btn.addEventListener('click', () => setCallState('voiceState', btn.dataset.state))
);

// DEV: simulate a peer joining/leaving without real signaling
document.getElementById('voiceSimJoin').addEventListener('click', () => {
  const peer = nextFakePeer('voiceGrid');
  if (!peer) return alert('No more dummy peers.');
  addTile('voiceGrid', peer, 'audio');
  setCallState('voiceState', 'connected');
});
document.getElementById('voiceSimLeave').addEventListener('click', () => removeLastPeer('voiceGrid'));
