/* ============================================================
   voice-call.js — VOICE CALL SCREEN
   Audio only. Stage + PIP layout (stage.js).

   BACK  = leave the screen, call keeps running (dashboard shows it)
   END   = the call is over
   ============================================================ */

const target = getTarget();
el('callName').textContent = target.name;

/* If you're returning to a call already in progress, don't re-ring —
   pick up where it was. */
let call = CallState.get();
if (!call || call.convId !== target.id) {
  CallState.start(target.id, target.name, 'voice');
  call = CallState.get();
}

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
  }, 30000);

  // DEMO: the other side picks up after ~2.5s.
  // Real: socket.on('call:accepted', markAnswered)
  setTimeout(() => { if (phase === 'calling') markAnswered(); }, 2500);
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
  window.location.href = chatUrl(target);   // call stays live
});

el('endBtn').addEventListener('click', endCall);
function endCall() {
  CallTimer.stop(); clearTimeout(ring); Media.stop();
  CallState.end();
  window.location.href = chatUrl(target);
}

/* ---------- controls ---------- */
let micOn = true;
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
  // TODO: broadcast so everyone sees it, and call CallReactions.fly()
  // from your receive handler.
  onSend: (emoji) => console.log('[reaction]', emoji),
});

paintIcons();
