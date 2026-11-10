/**
 * Plays remote audio. Each remote mic track gets a hidden <audio> sink keyed by
 * publisher. A call is user initiated (you tapped call or accept), so autoplay
 * with sound is allowed. Video tiles arrive with the video UI; this is audio.
 */
export class RemoteAudio {
  private sinks = new Map<string, HTMLAudioElement>();

  attach(key: string, stream: MediaStream) {
    let el = this.sinks.get(key);
    if (!el) {
      el = new Audio();
      el.autoplay = true;
      this.sinks.set(key, el);
    }
    el.srcObject = stream;
    void el.play().catch(() => {
      // Autoplay can still be refused; the call stays up and a later gesture
      // (any control tap) lets playback resume.
    });
  }

  remove(key: string) {
    const el = this.sinks.get(key);
    if (!el) return;
    el.srcObject = null;
    this.sinks.delete(key);
  }

  clear() {
    for (const el of this.sinks.values()) el.srcObject = null;
    this.sinks.clear();
  }
}
