/* Optional dependency check. Guarded, so boot.js can be deleted or
   commented out and this page still runs — a diagnostic must never
   be load-bearing. */
if (typeof __reportMissing === 'function') __reportMissing([['CallState', typeof CallState], ['Stage', typeof Stage], ['Media', typeof Media], ['CallUI', typeof CallUI], ['UpgradeRequest', typeof UpgradeRequest], ['el', typeof el]]);

/* ============================================================
   voice-call.js — VOICE CALL SCREEN
   Audio only. Stage + PIP layout (stage.js).

   BACK  = leave the screen, call keeps running (dashboard shows it)
   END   = the call is over
   ============================================================ */

const target = getTarget();
el('callName').textContent = target.name;

/* A call page is only valid while that call is live. Arriving here
   from a stale history entry, a refresh, or a bookmark must NOT
   start a new call — bounce back to the chat instead. */
if (requireActiveCall(target)) { throw new Error('redirecting'); }
const call = CallState.get();

const stage = new Stage('stage', 'strip', 'audio');
const answered = call.people.includes(target.name);
stage.add({ id: 'peer', name: target.name, pending: !answered });
stage.add({ id: 'self', name: 'You', self: true });
call.people.filter(n => n !== 'You' && n !== target.name)
    .forEach(n => stage.add({ id: 'p-' + n, name: n }));

let phase = 'idle', ring = null;

if (answered) {
  phase = 'connected';
  stage.connected('peer');
  CallTimer.start('callStatus');
} else {
  startRinging();
}

/* Mic on now so mute works and you're audible the moment they answer. */
Media.start({ audio: true, video: false });

/* ---------- ringing ----------
   The timer starts on ANSWER, never on dial — otherwise ringing time
   is counted as talk time, and that error follows you into whatever
   call-duration row you write later. */
function startRinging() {
  phase = 'calling';
  el('callStatus').textContent = 'Calling…';
  clearTimeout(ring);
  // Give up after 30s. The server needs its own timeout too: a tab
  // that crashed will never send the give-up signal.
  ring = setTimeout(() => {
    if (phase === 'calling') { el('callStatus').textContent = 'No answer'; setTimeout(endCall, 1200); }
  }, DEMO.ringTimeoutMs);

  // DEMO: the other side picks up after ~2.5s.
  // Real: socket.on('call:accepted', markAnswered)
  demoDelay(() => { if (phase === 'calling') markAnswered(); }, DEMO.answerCallMs);
}

function markAnswered() {
  if (phase !== 'calling') return;
  clearTimeout(ring);
  phase = 'connected';
  stage.connected('peer');
  CallState.addPerson(target.name);
  CallTimer.start('callStatus');
}

/* ---------- leave vs end ---------- */
el('backBtn').addEventListener('click', () => {
  CallTimer.stop(); clearTimeout(ring); Media.stop();
  goReplace(chatUrl(target));   // call stays live; drop this page from history
});

el('endBtn').addEventListener('click', endCall);
function endCall() {
  CallTimer.stop(); clearTimeout(ring); Media.stop();
  CallState.end();
  goReplace(chatUrl(target));
}

/* ---------- controls ---------- */
let micOn = true;
let camOn = true;
el('micBtn').addEventListener('click', function () {
  micOn = !micOn;
  this.classList.toggle('off', !micOn);
  setIcon('micBtn', micOn ? 'mic' : 'mic-off');
  Media.audio(micOn);
});

/* ---------- dev ---------- */
el('devJoin').addEventListener('click', () => {
  const c = CallState.get(); if (!c) return;
  const p = PEERS.find(n => !c.people.includes(n));
  if (!p) return toast('No more test peers');
  CallState.addPerson(p);
  stage.add({ id: 'p-' + p, name: p });
});
el('devLeave').addEventListener('click', () => {
  const c = CallState.get(); if (!c) return;
  const p = c.people.filter(n => n !== 'You' && n !== target.name).pop();
  if (!p) return;
  CallState.removePerson(p);
  stage.remove('p-' + p);
});

/* ---------- auto-hide chrome + reactions ---------- */
CallUI.init('callRoot');
CallReactions.init({
  buttonId: 'reactBtn',
  barId: 'reactBar',
  layerId: 'reactLayer',
  myName: 'You',
  // TODO: socket.emit('call:reaction', { conversationId: target.id, emoji })
  // and render everyone's (including your own) from the broadcast:
  //   socket.on('call:reaction', ({ fromName, emoji }) =>
  //     CallReactions.fly(emoji, fromName));
  onSend: (emoji) => console.log('[reaction]', emoji),
});

/* ---------- voice → video upgrade ---------- */
/* Has this call actually become video? Drives what the camera
   button does. Declared before UpgradeRequest.init, which closes
   over it. */
let isVideo = false;

UpgradeRequest.init({
  peerName: target.name,
  onAccepted: () => {
    // Either side accepting turns this into a video call.
    CallState.setType('video');
    Media.start({ audio: true, video: true }).then((s) => {
      if (s) stage.attach('self', s);
    });
    // The same button now means "camera on/off" instead of "ask for
    // video". Its behaviour is decided by isVideo below, NOT by
    // swapping handlers — see the note on the click handler.
    isVideo = true;
    camOn = true;
    const btn = el('upgradeBtn');
    btn.classList.remove('off');
    btn.innerHTML = svg('video');
    btn.title = 'Camera';
    toast('Video is on');
    // TODO: renegotiate the peer connection to add your video track
  },
});

/* ONE handler, branching on state.
   Before the upgrade this button asks for video; after it, it's a
   plain camera toggle.

   Do NOT do this by assigning .onclick later — addEventListener and
   .onclick both fire, so the button would toggle the camera AND
   send a fresh upgrade request on every tap. (That was a real bug
   here.) */
el('upgradeBtn').addEventListener('click', () => {
  if (!isVideo) { UpgradeRequest.request(); return; }
  camOn = !camOn;
  const btn = el('upgradeBtn');
  btn.classList.toggle('off', !camOn);
  btn.innerHTML = svg(camOn ? 'video' : 'video-off');
  Media.video(camOn);
});

/* DEV: simulate THEM asking you for video */
el('devAskVideo').addEventListener('click', () => UpgradeRequest.incoming());

/* DEV: simulate them ACCEPTING your request. There is no automatic
   accept — silence must never turn a camera on — so this is the only
   way to exercise the happy path while testing alone. */
el('devAcceptVideo').addEventListener('click', () => UpgradeRequest.remoteAccepted());

/* DEV: simulate someone else reacting, so you can see the name
   badge on a reaction that isn't yours. Real: this is exactly what
   your socket.on('call:reaction') handler does. */
el('devReact').addEventListener('click', () => {
  const c = CallState.get();
  const others = c ? c.people.filter((n) => n !== 'You') : [];
  const who = others.length ? others[Math.floor(Math.random() * others.length)] : 'Chris';
  const emoji = CallReactions.SET[Math.floor(Math.random() * CallReactions.SET.length)];
  CallReactions.fly(emoji, who);
});

paintIcons();
