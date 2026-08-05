/* ============================================================
   voice-note.js — RECORD AND SEND A VOICE NOTE

   Uses the real MediaRecorder API, so what you test here is what
   you'll ship: same permission prompt, same blob, same failure
   modes. Only the delivery is stubbed.

   THE STATE MACHINE
     idle       → mic button showing
     recording  → timer running, cancel + stop
     review     → play it back, then send or discard
     (send)     → becomes a message, back to idle

   The review step matters. A voice note is the one message type you
   can't skim before sending — without playback you're publishing
   something you haven't heard. WhatsApp lets you cancel mid-record
   but not review; Telegram lets you review. Review is friendlier.

   ── WHAT TO KNOW WHEN YOU BUILD THIS FOR REAL ──

   1. FORMAT IS NOT UNIVERSAL. MediaRecorder gives you whatever the
      browser supports — usually audio/webm;codecs=opus on Chrome
      and Firefox, audio/mp4 on Safari. Check
      MediaRecorder.isTypeSupported() and store the mime type
      alongside the file, or playback breaks across browsers.

   2. UPLOAD IT LIKE A FILE, NOT A MESSAGE FIELD. Same rule as
      images: POST the blob, store the returned key. A base64 audio
      blob in a message row is far worse than an image — voice notes
      are routinely 100KB+.

   3. DURATION COMES FROM YOU, NOT THE FILE. WebM from MediaRecorder
      often has no duration in its metadata, so an <audio> element
      reports Infinity. Record the elapsed seconds yourself while
      capturing (this file does) and store it on the message.

   4. RELEASE THE MIC. Stopping the recorder does NOT stop the
      stream — call .stop() on every track or the browser keeps
      showing the recording indicator.
   ============================================================ */

const VoiceNote = {
  state: 'idle',          // 'idle' | 'recording' | 'review'
  recorder: null,
  stream: null,
  chunks: [],
  seconds: 0,
  timer: null,
  blobUrl: null,
  mimeType: '',

  init({ onSend }) {
    this.onSend = onSend;

    el('vnRecord').addEventListener('click', () => this.start());
    el('vnCancel').addEventListener('click', () => this.cancel());
    el('vnStop').addEventListener('click', () => this.stop());
    el('vnDiscard').addEventListener('click', () => this.cancel());
    el('vnSend').addEventListener('click', () => this.send());
  },

  _show(which) {
    this.state = which;
    el('composeRow').classList.toggle('hidden', which !== 'idle');
    el('vnRecording').classList.toggle('hidden', which !== 'recording');
    el('vnReview').classList.toggle('hidden', which !== 'review');
  },

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      // Denied, no mic, or insecure context (http:// over LAN).
      toast('Microphone unavailable');
      return;
    }

    // Pick a container the browser actually supports.
    this.mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      .find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';

    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream,
      this.mimeType ? { mimeType: this.mimeType } : undefined);

    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) this.chunks.push(e.data);
    };
    this.recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.mimeType || 'audio/webm' });
      this.blobUrl = URL.createObjectURL(blob);
      el('vnAudio').src = this.blobUrl;
      el('vnReviewTime').textContent = fmtDuration(this.seconds);
      this._releaseMic();
      this._show('review');
    };

    this.recorder.start();
    this.seconds = 0;
    el('vnTime').textContent = '0:00';
    this._show('recording');

    // Duration is tracked here because WebM from MediaRecorder often
    // carries no duration metadata — an <audio> element would report
    // Infinity for it.
    this.timer = setInterval(() => {
      this.seconds++;
      el('vnTime').textContent = fmtDuration(this.seconds);
      // Cap it. A runaway recording is a huge upload and usually a
      // forgotten button.
      if (this.seconds >= DEMO.voiceNoteMaxSec) this.stop();
    }, 1000);
  },

  stop() {
    if (this.state !== 'recording') return;
    clearInterval(this.timer);
    this.recorder.stop();   // fires onstop above
  },

  cancel() {
    clearInterval(this.timer);
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.onstop = null;      // don't fall into review
      this.recorder.stop();
    }
    this._releaseMic();
    this._revoke();
    this.chunks = [];
    this._show('idle');
  },

  send() {
    if (this.state !== 'review') return;
    // TODO for real: POST the blob, store the returned key on the
    // message. Do not inline the audio.
    if (this.onSend) this.onSend({ url: this.blobUrl, seconds: this.seconds });
    // Deliberately NOT revoking blobUrl here — the message bubble is
    // now using it. It's released when the tab closes.
    this.blobUrl = null;
    this.chunks = [];
    this._show('idle');
  },

  /** Stopping the recorder does not stop the stream — do it here or
      the browser keeps showing the recording indicator. */
  _releaseMic() {
    if (!this.stream) return;
    this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
  },

  _revoke() {
    if (this.blobUrl) { URL.revokeObjectURL(this.blobUrl); this.blobUrl = null; }
  },
};

function fmtDuration(s) {
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
