// ============================================================
// MEET — growing tiles + screen share + the chat/file panel.
// The chat panel is what makes this a meet rather than a call.
// ============================================================

const target = getTargetFromQuery();
document.getElementById('meetTitle').textContent = target.name;

let meetChat = [];

// A meet has no ringing phase — you just join. Others appear as they
// arrive, one tile per join event.
addTile('meetGrid', 'You', 'video');
meetChat.push({ type: 'system', text: 'You joined ' + target.name });
renderMeetChat();

// TODO: socket.emit('meet:join', { conversationId: target.id })
//       then open an RTCDataChannel per peer for chat/files.

bindToggle('meetMicBtn', '🎙️ Mute', '🔇 Unmute', (on) => {
  // TODO: localStream.getAudioTracks()[0].enabled = on;
});
bindToggle('meetCamBtn', '🎥 Camera', '📷 Camera off', (on) => {
  // TODO: localStream.getVideoTracks()[0].enabled = on;
});

document.getElementById('meetShareBtn').addEventListener('click', () => {
  // TODO: navigator.mediaDevices.getDisplayMedia({ video: true })
  //       then sender.replaceTrack(displayTrack) on each peer connection.
  alert('Stub: wire to getDisplayMedia() + replaceTrack().');
});

document.getElementById('meetInviteBtn').addEventListener('click', () => {
  const peer = nextFakePeer('meetGrid');
  if (!peer) return alert('No more dummy peers.');
  addTile('meetGrid', peer, 'video', { pending: true, status: 'invited' });
});

document.getElementById('meetLeaveBtn').addEventListener('click', () => {
  // TODO: close peer connections + data channels, socket.emit('meet:leave', ...)
  window.location.href = '/dashboard';
});

document.getElementById('meetSimJoin').addEventListener('click', () => {
  const peer = nextFakePeer('meetGrid');
  if (!peer) return alert('No more dummy peers.');
  addTile('meetGrid', peer, 'video');
  meetChat.push({ type: 'system', text: peer + ' joined' });
  renderMeetChat();
});

document.getElementById('meetSimLeave').addEventListener('click', () => {
  const gone = removeLastPeer('meetGrid');
  if (gone) {
    meetChat.push({ type: 'system', text: gone + ' left' });
    renderMeetChat();
  }
});

// ---- Chat panel (RTCDataChannel in real life) ----
function renderMeetChat() {
  const log = document.getElementById('meetChatLog');
  log.innerHTML = '';
  meetChat.forEach((m) => {
    const line = document.createElement('div');
    line.className = 'chat-msg ' + (m.type || '');
    if (m.type === 'system') {
      line.textContent = m.text;
    } else if (m.type === 'file') {
      line.innerHTML =
        '<span class="sender">' + m.sender + ':</span>sent an image' +
        (m.dataUrl ? '<img src="' + m.dataUrl + '" alt="" />' : '');
    } else {
      line.innerHTML = '<span class="sender">' + m.sender + ':</span>' + m.text;
    }
    log.appendChild(line);
  });
  log.scrollTop = log.scrollHeight;
}

function sendMeetMessage() {
  const input = document.getElementById('meetChatInput');
  const text = input.value.trim();
  if (!text) return;
  // TODO: dataChannel.send(JSON.stringify({ kind: 'text', text }))
  //       and render incoming ones from dataChannel.onmessage.
  meetChat.push({ sender: 'You', text });
  input.value = '';
  renderMeetChat();
}

document.getElementById('meetSendBtn').addEventListener('click', sendMeetMessage);
document.getElementById('meetChatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMeetMessage();
});

document.getElementById('meetFileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  // Local preview only. TODO: read as ArrayBuffer, chunk it (~16KB slices —
  // that's the safe portable data-channel message size), send the chunks
  // with a small header (filename/size/index), reassemble on the far end.
  const reader = new FileReader();
  reader.onload = () => {
    meetChat.push({ type: 'file', sender: 'You', dataUrl: reader.result });
    renderMeetChat();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});
