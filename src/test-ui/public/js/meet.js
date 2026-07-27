/* ============================================================
   meet.js — MEET SCREEN
   Bento grid (grid.js), participants panel, chat + file transfer.

   A meet has no ringing phase — you join a room that already
   exists — so the timer starts immediately.

   BACK = leave the screen, meet keeps running
   END  = end it
   ============================================================ */

const target = getTarget();
el('callName').textContent = target.name;

let call = CallState.get();
if (!call || call.convId !== target.id) {
  CallState.start(target.id, target.name, 'meet');
  call = CallState.get();
}

/* Screen capture cannot survive a page load — getDisplayMedia needs
   a fresh user gesture. So whatever the state said, you are not
   sharing right now. Clearing it stops the banner lying. */
CallState.clearSharing();

const grid = new Grid('grid');
call.people.forEach((n) =>
  grid.add({ id: n === 'You' ? 'self' : 'p-' + n, name: n, self: n === 'You' })
);

CallTimer.start('callStatus');

Media.start({ audio: true, video: true }).then((s) => {
  if (s) grid.attach('self', s);
});

/* TODO: socket.emit('meet:join', { conversationId: target.id })
   TODO: on 'peer:joined' -> grid.add + CallState.addPerson
   TODO: pc.ontrack = e => grid.attach(peerId, e.streams[0]) */

/* ---------- leave vs end ---------- */
el('backBtn').addEventListener('click', () => {
  CallTimer.stop();
  Media.stop();          // ends the camera AND any screen capture
  CallState.clearSharing();
  window.location.href = chatUrl(target);   // meet itself stays live
});

el('endBtn').addEventListener('click', () => {
  CallTimer.stop(); Media.stop();
  CallState.end();
  window.location.href = chatUrl(target);
});

/* ---------- mic / camera ---------- */
let micOn = true;
el('micBtn').addEventListener('click', function () {
  micOn = !micOn;
  this.classList.toggle('off', !micOn);
  setIcon('micBtn', micOn ? 'mic' : 'mic-off');
  Media.audio(micOn);
});

let camOn = true;
el('camBtn').addEventListener('click', function () {
  camOn = !camOn;
  this.classList.toggle('off', !camOn);
  setIcon('camBtn', camOn ? 'video' : 'video-off');
  Media.video(camOn);
});

/* ---------- screen share, with a visible state ---------- */
let sharing = false;
el('shareBtn').addEventListener('click', async function () {
  if (sharing) return stopShare();
  const s = await Media.share();
  if (!s) return;                       // cancelled the OS picker
  sharing = true;
  CallState.setSharing(true);
  grid.attach('self', s);
  grid.full('self');                    // your screen fills the grid
  this.classList.add('on');
  el('sharing').classList.remove('hidden');
  // Chrome's own "Stop sharing" bar ends the track — mirror it back
  // or the banner keeps lying.
  s.getVideoTracks()[0].addEventListener('ended', stopShare);
});

function stopShare() {
  if (!sharing) return;
  sharing = false;
  CallState.setSharing(false);
  el('shareBtn').classList.remove('on');
  el('sharing').classList.add('hidden');
  grid.exit();
  if (Media.stream) grid.attach('self', Media.stream);
  // TODO: sender.replaceTrack(cameraTrack) on each peer connection
}

/* ---------- participants ---------- */
el('peopleBtn').addEventListener('click', () => {
  renderPeople();
  el('peoplePanel').classList.add('open');
});
el('peopleClose').addEventListener('click', () =>
  el('peoplePanel').classList.remove('open')
);

function renderPeople() {
  const c = CallState.get();
  const people = c ? c.people : [];
  el('pCount').textContent = people.length;
  const box = el('peopleBody');
  box.innerHTML = '';
  people.forEach((n) => {
    const d = document.createElement('div');
    d.className = 'prow';
    d.innerHTML =
      '<div class="pav">' + esc(n[0]) + '</div>' +
      '<div class="pname">' + esc(n) + (n === 'You' ? ' (you)' : '') + '</div>' +
      svg('mic');
    box.appendChild(d);
  });
}

/* ---------- meet chat ---------- */
let meetMsgs = [{ sys: true, text: 'You joined' }];

el('chatBtn').addEventListener('click', () => {
  el('chatPanel').classList.toggle('open');
});
el('chatClose').addEventListener('click', () =>
  el('chatPanel').classList.remove('open')
);

function sendMeetMsg() {
  const input = el('meetInput');
  const text = input.value.trim();
  if (!text) return;
  // TODO: dataChannel.send(JSON.stringify({ kind: 'text', text }))
  meetMsgs.push({ from: 'You', text });
  input.value = '';
  renderMeetChat();
}
el('meetSend').addEventListener('click', sendMeetMsg);
el('meetInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMeetMsg();
});

/* Forward the click explicitly — a <label for> wrapper doesn't fire
   reliably inside the sliding panel. */
el('fileBtn').addEventListener('click', () => el('fileInput').click());

el('fileInput').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  e.target.value = '';

  const msg = { file: true, from: 'You', name: f.name, size: f.size, pct: 0 };
  meetMsgs.push(msg);
  renderMeetChat();

  /* Simulated chunked send. THE REAL VERSION:
       const CHUNK = 16 * 1024;                 // safe portable cap
       const buf = await f.arrayBuffer();
       const total = Math.ceil(buf.byteLength / CHUNK);
       for (let i = 0; i < total; i++) {
         dataChannel.send(buf.slice(i * CHUNK, (i + 1) * CHUNK));
         msg.pct = Math.round(((i + 1) / total) * 100);
         renderMeetChat();
         // watch dataChannel.bufferedAmount and pause if it climbs,
         // or you'll overflow the send buffer and kill the channel
       }
     Send a small header first (name, size, chunk count) so the far
     side knows how to reassemble. */
  const step = () => {
    msg.pct = Math.min(100, msg.pct + 14 + Math.random() * 18);
    renderMeetChat();
    if (msg.pct < 100) setTimeout(step, 170);
  };
  setTimeout(step, 180);
});

function renderMeetChat() {
  const box = el('meetLog');
  box.innerHTML = '';
  meetMsgs.forEach((m) => {
    const d = document.createElement('div');
    if (m.sys) {
      d.className = 'pmsg sys';
      d.textContent = m.text;
    } else if (m.file) {
      d.className = 'pmsg';
      d.innerHTML =
        '<span class="from">' + esc(m.from) + '</span>' +
        '<div class="file">' + svg('file') + '<div class="file-info">' +
        '<div class="file-name">' + esc(m.name) + '</div>' +
        '<div class="file-bar"><div class="file-fill" style="width:' + m.pct + '%"></div></div>' +
        '<div class="file-stat">' +
        (m.pct >= 100 ? 'Sent · ' : 'Sending ' + Math.round(m.pct) + '% · ') + bytes(m.size) +
        '</div></div></div>';
    } else {
      d.className = 'pmsg';
      d.innerHTML = '<span class="from">' + esc(m.from) + '</span>' + esc(m.text);
    }
    box.appendChild(d);
  });
  box.scrollTop = box.scrollHeight;
}

/* ---------- dev ---------- */
el('devJoin').addEventListener('click', () => {
  const c = CallState.get(); if (!c) return;
  const p = PEERS.find((n) => !c.people.includes(n));
  if (!p) return toast('No more test peers');
  CallState.addPerson(p);
  grid.add({ id: 'p-' + p, name: p });
  meetMsgs.push({ sys: true, text: p + ' joined' });
  renderMeetChat();
  renderPeople();
});

el('devLeave').addEventListener('click', () => {
  const c = CallState.get(); if (!c) return;
  const p = c.people.filter((n) => n !== 'You').pop();
  if (!p) return;
  CallState.removePerson(p);
  grid.remove('p-' + p);
  meetMsgs.push({ sys: true, text: p + ' left' });
  renderMeetChat();
  renderPeople();
});

renderMeetChat();
renderPeople();

/* ---------- auto-hide chrome + reactions ---------- */
CallUI.init('callRoot');
CallReactions.init({
  buttonId: 'reactBtn',
  barId: 'reactBar',
  layerId: 'reactLayer',
  // TODO: broadcast so everyone sees it, and call CallReactions.fly()
  // from your receive handler.
  onSend: (emoji) => console.log('[reaction]', emoji),
});

paintIcons();
