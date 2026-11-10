/** Every call event name in one place. The backend owns these strings; keep
    them here so a rename is a one line change. */
export const CALL_EVENTS = {
  // client to backend (with ack)
  initiate: "call:initiate",
  accept: "call:accept",
  publish: "call:publish",
  subscribe: "call:subscribe",
  renegotiate: "call:renegotiate",
  mediaState: "call:media-state",
  leave: "call:leave",

  // backend to client (listen)
  incoming: "call:incoming",
  newAccept: "call:new:accept",
  newPublish: "call:new:publish",
  participantLeft: "call:new:participant:left",
  ended: "call:new:ended",
} as const;
