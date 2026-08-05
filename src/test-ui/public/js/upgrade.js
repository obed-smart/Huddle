/* ============================================================
   upgrade.js — VOICE → VIDEO IS A HANDSHAKE, NOT A TOGGLE

   You cannot just switch your camera on mid voice-call. The other
   person answered a VOICE call; they may not be dressed, may not be
   somewhere they want seen. So it's a request they can refuse:

     you tap 📹  →  "Asking Chris for video…"
                     ├─ they accept  → both sides go to video
                     └─ they decline → stays voice, you're told

   It works both directions: they can ask YOU, in which case you get
   the accept/decline prompt.

   ── TRANSPORT ──
   Sockets, not the data channel. Same reason as reactions: the
   server stamps who is asking. It also has to survive the case
   where media hasn't connected yet, which a data channel can't.

     socket.emit('call:upgrade-request', { conversationId })
     socket.on('call:upgrade-request',  UpgradeRequest.incoming)
     socket.on('call:upgrade-accepted', UpgradeRequest.remoteAccepted)
     socket.on('call:upgrade-declined', UpgradeRequest.remoteDeclined)

   ── SILENCE IS NOT CONSENT ──
   There is deliberately NO auto-accept. If the other side doesn't
   actively agree within DEMO.upgradeTimeoutMs, the request expires
   and the initiator is told they declined — the same outcome and
   the same wording as an explicit decline.

   That symmetry is intentional: the initiator learns "not now", and
   nothing about whether the other person tapped decline, was away
   from their phone, or ignored it. Reporting "they ignored you"
   would leak their behaviour; reporting nothing would leave the
   request hanging forever with a camera about to turn on.

   ── WHAT ACCEPTING ACTUALLY COSTS ──
   Adding a video track to a live peer connection means
   RENEGOTIATION: new offer, new answer, new ICE. It is not free and
   it can fail. Treat "they accepted" as the start of negotiation,
   not the end — only flip the UI to video once the track is
   actually flowing, or you'll show a video call that never arrives.
   ============================================================ */

const UpgradeRequest = {
  state: 'none',        // 'none' | 'outgoing' | 'incoming'
  expiry: null,
  peerName: '',
  onAccepted: null,     // host turns the camera on

  init({ peerName, onAccepted }) {
    this.peerName = peerName || 'them';
    this.onAccepted = onAccepted;

    el('upWaitingWho').textContent = this.peerName;
    el('upPromptWho').textContent = this.peerName;

    el('upCancel').addEventListener('click', () => this.cancel());
    el('upAccept').addEventListener('click', () => this.accept());
    el('upDecline').addEventListener('click', () => this.decline());
  },

  /* ---------- you ask them ---------- */
  request() {
    if (this.state !== 'none') return;
    this.state = 'outgoing';
    el('upWaiting').classList.add('open');
    // TODO: socket.emit('call:upgrade-request', { conversationId })

    // No auto-accept. If they don't actively agree, the request
    // expires and is reported as a decline.
    clearTimeout(this.expiry);
    this.expiry = setTimeout(() => this.remoteDeclined(), DEMO.upgradeTimeoutMs);
  },

  cancel() {
    if (this.state !== 'outgoing') return;
    clearTimeout(this.expiry);
    this.state = 'none';
    el('upWaiting').classList.remove('open');
    // TODO: socket.emit('call:upgrade-cancel', ...)
  },

  remoteAccepted() {
    if (this.state !== 'outgoing') return;
    clearTimeout(this.expiry);
    this.state = 'none';
    el('upWaiting').classList.remove('open');
    this._apply();
  },

  /**
   * They said no — OR said nothing until the request expired. Both
   * produce this identical result on purpose. See the note at the
   * top: the initiator learns "not now" and nothing more.
   */
  remoteDeclined() {
    if (this.state !== 'outgoing') return;
    clearTimeout(this.expiry);
    this.state = 'none';
    el('upWaiting').classList.remove('open');
    toast(this.peerName + ' declined the video request');
  },

  /* ---------- they ask you ---------- */
  incoming() {
    if (this.state !== 'none') return;
    this.state = 'incoming';
    el('upPrompt').classList.add('open');
    // Their side is counting down too. Drop the prompt when it
    // expires rather than leaving a stale request on screen.
    clearTimeout(this.expiry);
    this.expiry = setTimeout(() => {
      if (this.state !== 'incoming') return;
      this.state = 'none';
      el('upPrompt').classList.remove('open');
    }, DEMO.upgradeTimeoutMs);
  },

  accept() {
    if (this.state !== 'incoming') return;
    clearTimeout(this.expiry);
    this.state = 'none';
    el('upPrompt').classList.remove('open');
    // TODO: socket.emit('call:upgrade-accept', ...)
    this._apply();
  },

  decline() {
    if (this.state !== 'incoming') return;
    clearTimeout(this.expiry);
    this.state = 'none';
    el('upPrompt').classList.remove('open');
    // TODO: socket.emit('call:upgrade-decline', ...)
  },

  /* Both paths land here: the call is now video. */
  _apply() {
    if (this.onAccepted) this.onAccepted();
  },
};
