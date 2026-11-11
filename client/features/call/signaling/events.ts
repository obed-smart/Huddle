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
  leave: "call:leave",
  reject: "call:reject",
  // We stopped sending a track (camera off): the backend closes it at the SFU.
  mediaState: "call:media:state",

  // backend to client (listen)
  incoming: "call:incoming",
  newAccept: "call:new:accept",
  newPublish: "call:new:publish",
  participantLeft: "call:new:participant:left",
  ended: "call:new:ended",
  rejected: "call:new:rejected",
  handled: "call:new:handled",
  // A peer stopped a track: drop it from the UI and fall back to their avatar.
  newMediaState: "call:new:media:state",
} as const;
