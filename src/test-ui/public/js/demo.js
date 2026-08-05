/* ============================================================
   demo.js — EVERY SIMULATED DELAY, IN ONE PLACE

   Nothing in this harness talks to a server, so anything that would
   normally arrive as a socket event is faked with a timer. They all
   live here so you can find them, tune them while testing, and
   delete them in one pass when you wire real signaling.

   Each entry names the real event it stands in for.
   ============================================================ */

const DEMO = {
  /* Enable/disable ALL simulation at once. Set false to see the raw
     states — a call that rings forever, an upgrade nobody answers.
     Useful for checking your "no answer" and timeout handling. */
  enabled: true,

  /* The other side picks up an outgoing 1:1 call.
     Real: socket.on('call:accepted') */
  answerCallMs: 2500,


  /* An invited person joins.
     Real: socket.on('call:accepted') for that invitee */
  inviteJoinMs: 2500,

  /* ---- NOT simulation — real product behaviour, keep these ---- */

  /* Give up on an unanswered call. Your SERVER needs its own copy of
     this: a tab that crashed will never send the give-up signal. */
  ringTimeoutMs: 30000,

  /* Give up on an unanswered VIDEO UPGRADE request and treat it as a
     decline.

     This is NOT simulation — it's the privacy rule. Silence must
     never turn someone's camera on. If they don't actively accept,
     the answer is no. */
  upgradeTimeoutMs: 20000,

  /* Auto-hide the call chrome after this long idle. */
  chromeIdleMs: 4000,

  /* Hard cap on a voice note. A runaway recording is a huge upload
     and usually a forgotten button. */
  voiceNoteMaxSec: 300,

  /* Longest video that may be sent as PLAYABLE video. Past this it
     still sends — as a file attachment — so the recipient downloads
     it instead of a chat trying to stream a 40-minute clip inline.

     Enforce this SERVER-side too. A client check is a courtesy; the
     server is what stops someone posting a 2GB file. */
  maxVideoMinutes: 20,

  /* Refuse outright past this, whatever the type. */
  maxFileMB: 100,
};

/**
 * setTimeout that respects DEMO.enabled.
 * Use for simulated remote events ONLY — never for real product
 * timers, or disabling simulation would break the app.
 */
function demoDelay(fn, ms) {
  if (!DEMO.enabled) return null;
  return setTimeout(fn, ms);
}
