/* Optional dependency check. Guarded, so boot.js can be deleted or
   commented out and this page still runs — a diagnostic must never
   be load-bearing. */
if (typeof __reportMissing === 'function') __reportMissing([['CallState', typeof CallState], ['Stage', typeof Stage], ['Media', typeof Media], ['CallUI', typeof CallUI], ['el', typeof el]]);

/* ============================================================
   video-call.js — VIDEO CALL SCREEN
   Camera on. Stage + PIP layout (stage.js). No chat panel —
   chat is what makes a meet a meet.

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

const stage = new Stage('stage', 'strip', 'video');
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

/* Self-preview starts while it rings — matches every real video app:
   you check your framing before they pick up. Nothing transmits yet,
   since no peer connection exists. */
Media.start({ audio: true, video: true }).then(s => { if (s) stage.attach('self', s); });

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
