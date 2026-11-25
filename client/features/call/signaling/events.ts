/** Every call event name in one place. The backend owns these strings; keep
    them here so a rename is a one line change. */
export const CALL_EVENTS = {
  // client to backend (with ack)
  initiate: "call:initiate",
  accept: "call:accept",
  publish: "call:publish",
  subscribe: "call:subscribe",
  renegotiate: "call:renegotiate",
  status: "call:status",
  // Leaving the call. The backend decides from who is left whether the call
  // continues for others or ends, so one event covers leave and end alike.
  end: "call:end",
  reject: "call:reject",
  // Invite someone into this call; they receive it as a normal call:incoming.
  invite: "call:invite",
  // Close our own tracks at the SFU (camera off). Omit kinds to close all mine.
  close: "call:close",

  // backend to client (listen)
  incoming: "call:incoming",
  newAccept: "call:new:accept",
  newPublish: "call:new:publish",
  participantLeft: "call:new:participant:left",
  ended: "call:new:ended",
  rejected: "call:new:rejected",
  handled: "call:new:handled",
  // A peer closed tracks: drop them from the UI and fall back to their avatar.
  newClose: "call:new:close",
  // Someone (re)joined: a reconnected client rebuilds the call from this.
  roster: "call:new:roster",
} as const;
