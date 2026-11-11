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
  mediaState: "call:media-state",
  leave: "call:leave",
  reject: "call:reject",
  close: "call:close",

  // backend to client (listen)
  incoming: "call:incoming",
  newAccept: "call:new:accept",
  newPublish: "call:new:publish",
  participantLeft: "call:new:participant:left",
  ended: "call:new:ended",
  rejected: "call:new:rejected",
  handled: "call:new:handled",
} as const;
