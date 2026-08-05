/* ============================================================
   media.js — YOUR OWN CAMERA / MIC ONLY
   getUserMedia + getDisplayMedia. No peer connection, no
   signaling — that's yours to add.

   Testing note: getUserMedia needs a SECURE CONTEXT. ngrok's https
   works; plain http://192.168.x.x silently fails. Denial is not
   fatal here — tiles fall back to initials.
   ============================================================ */

const Media = {
  stream: null,

  async start(constraints) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch (e) {
      console.warn('[media] unavailable:', e.name);
      return null;
    }
  },

  /* .enabled = false keeps the track alive but sends silence/black.
     That's what a mute button wants — .stop() would end the track
     permanently and need renegotiation to restore. */
  audio(on) { if (this.stream) this.stream.getAudioTracks().forEach(t => { t.enabled = on; }); },
  video(on) { if (this.stream) this.stream.getVideoTracks().forEach(t => { t.enabled = on; }); },

  stop() {
    this.stopShare();                                  // kill any screen capture too
    if (!this.stream) return;
    this.stream.getTracks().forEach(t => t.stop());    // releases the camera light
    this.stream = null;
  },

  /* Screen share is a SEPARATE capture from the camera, and it must
     be retained — otherwise nothing can stop it.

     That was a real bug here: share() returned the stream but kept
     no reference, so the toggle-off button had nothing to call
     .stop() on. The <video> simply stopped being updated, which
     looks exactly like a frozen last frame, while the browser kept
     capturing until you used Chrome's own "Stop sharing" bar.

     In the real app you don't add this as a new track either — you
     call sender.replaceTrack(displayTrack) on the RTCRtpSender
     already sending your camera, so the far side switches without
     renegotiating. */
  displayStream: null,

  async share() {
    try {
      this.displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      return this.displayStream;
    } catch {
      return null;   // user cancelled the OS picker
    }
  },

  /** Ends the screen capture for real (releases the "sharing" indicator). */
  stopShare() {
    if (!this.displayStream) return;
    this.displayStream.getTracks().forEach((t) => t.stop());
    this.displayStream = null;
  },
};
