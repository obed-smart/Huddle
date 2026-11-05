/**
 * One voice note plays at a time across the whole chat. When a player starts,
 * the one that was playing is paused, so two never overlap. A tiny shared
 * registry, no dependencies and no context.
 */
let current: HTMLMediaElement | null = null;

/** Mark this element as the one now playing, pausing whoever held it before. */
export function startPlayback(el: HTMLMediaElement) {
  if (current && current !== el) {
    try {
      current.pause();
    } catch {
      // A detached element can throw on pause; nothing to do.
    }
  }
  current = el;
}

/** Release the slot if this element still holds it (on pause or end). */
export function endPlayback(el: HTMLMediaElement) {
  if (current === el) current = null;
}
