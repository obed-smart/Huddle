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
    if (!this.stream) return;
    this.stream.getTracks().forEach(t => t.stop());   // releases the camera light
    this.stream = null;
  },

  /* Screen share is a separate capture. In the real app you don't
     add it as a new track — you call sender.replaceTrack(displayTrack)
     on the RTCRtpSender already sending your camera, so the far side
     switches without renegotiating. */
  async share() {
    try {
      return await navigator.mediaDevices.getDisplayMedia({ video: true });
    } catch {
      return null;   // user cancelled the OS picker
    }
  },
};
