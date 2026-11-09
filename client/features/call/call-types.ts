/** Shared call domain types. Kept transport agnostic: the same shapes drive the
    UI whether the media runs over the Cloudflare Realtime SFU or anything else. */

/** What kind of call this is. Audio ships first; video follows. */
export type CallMedia = "audio" | "video";

/**
 * The lifecycle of a single call, from the local user's point of view.
 *  - outgoing:   we placed it, waiting for the other side to answer
 *  - incoming:   the other side is calling us, not yet answered
 *  - connecting: answered, media is being negotiated
 *  - active:     connected, conversation in progress
 *  - ended:      wrapping up, the screen is about to close
 */
export type CallPhase = "outgoing" | "incoming" | "connecting" | "active" | "ended";

/** The person on the other end (a direct call, for now). */
export type CallPeer = {
  id: string;
  name: string;
  avatar?: string | null;
};

/** The whole live state of the one call the UI can show at a time. */
export type CallSnapshot = {
  peer: CallPeer;
  media: CallMedia;
  phase: CallPhase;
  muted: boolean;
  speaker: boolean;
  /** Collapsed to the floating banner so the rest of the app is usable. */
  minimized: boolean;
  /** Epoch ms the call connected at, for the duration timer (null until then). */
  startedAt: number | null;
};
