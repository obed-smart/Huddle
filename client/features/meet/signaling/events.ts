/** Every meet signaling event in one place. The backend owns these strings.
    Meet is an SFU join flow, mirroring the call: join returns our session and
    ICE servers, then we publish our tracks and subscribe to everyone else.
    Offer / answer / ice-candidate (the old mesh events) are not used. */
export const MEET_EVENTS = {
  // client to backend (with ack)
  join: "meet:join",
  publish: "meet:publish",
  subscribe: "meet:subscribe",
  renegotiate: "meet:renegotiate",
  leave: "meet:leave",
  reaction: "meet:reaction",

  // backend to client (listen)
  newJoin: "meet:new:join",
  newPublish: "meet:new:publish",
  newLeave: "meet:new:leave",
  newReaction: "meet:new:reaction",
} as const;
