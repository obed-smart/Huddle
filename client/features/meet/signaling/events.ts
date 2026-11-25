/** Every meet signaling event in one place. The backend owns these strings.
    Meet is an SFU join flow, the same shape as the call and keyed by userId:
    join returns ICE servers and the roster, then we publish our tracks and
    subscribe to everyone else. Offer/answer/ice-candidate (the old mesh) are
    gone. */
export const MEET_EVENTS = {
  // client to backend (with ack)
  join: "meet:join",
  publish: "meet:publish",
  subscribe: "meet:subscribe",
  renegotiate: "meet:renegotiate",
  close: "meet:close",
  connected: "meet:connected",
  leave: "meet:leave",

  // backend to client (listen)
  newJoin: "meet:new:join",
  newPublish: "meet:new:publish",
  newClose: "meet:new:close",
  newRoster: "meet:new:roster",
  newLeave: "meet:new:leave",
} as const;
