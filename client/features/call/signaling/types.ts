/** The call signaling contract, mirrored from the backend. The client never
    sees Cloudflare ids: it works in userId, kind, and mid only. */

export type TrackKind = "mic" | "cam" | "screen";
export type CallMediaType = "audio" | "video" | "meet";

/** An SDP, shaped the way the backend wraps it. */
export type RtcDescription = { type: "offer" | "answer"; sdp: string };

/* ---- client to backend (requests + acks) ---- */

export type InitiateReq = { conversationId: string; callMediaType: CallMediaType };

export type InitiateAck = {
  success: boolean;
  callId: string;
  iceServers: RTCIceServer[];
  startedAt?: number;
  serverTime?: number;
};

export type AcceptReq = {
  callId: string;
  conversationId: string;
  /** True when answering an existing call after a network drop (not a fresh
      answer). The backend recovers the session instead of starting one. */
  rejoin: boolean;
};
export type AcceptAck = { success: boolean; callId: string; iceServers: RTCIceServer[] };

export type PublishReq = {
  callId: string;
  description: RtcDescription;
  tracks: { mid: string; kind: TrackKind }[];
};
/** Who is already publishing when we join: subscribe to these at once. */
export type ExistingPublisher = { userId: string; kinds: TrackKind[] };
export type PublishAck = {
  success: boolean;
  description: RtcDescription;
  published: { kind: TrackKind }[];
  failed: unknown[];
  existing: ExistingPublisher[];
};

export type SubscribeTarget = { userId: string; kinds?: TrackKind[] };
export type SubscribeReq = { callId: string; targets: SubscribeTarget[] };
export type SubscribedTrack = { userId: string; kind: TrackKind; mid: string };
export type SubscribeAck = {
  success: boolean;
  /** When true, apply `description` (the SFU offer) and reply with renegotiate. */
  requiresRenegotiation: boolean;
  description: RtcDescription | null;
  subscribed: SubscribedTrack[];
  failed: unknown[];
};

export type RenegotiateReq = { callId: string; description: RtcDescription };
/** Derived from the browser connection state and reported so the backend can
    react: connected, or reconnecting after a drop. */
export type CallStatus = "connected" | "reconnecting";
export type StatusReq = { callId: string; conversationId: string; status: CallStatus };
export type LeaveReq = { callId: string; conversationId: string };
/** Invite a user into the call; the backend rings them with call:incoming. */
export type InviteReq = { callId: string; conversationId: string; to: string; callMediaType: CallMediaType };
/** Close our own tracks at the SFU. Omit kinds to close all of ours; the
    backend reads who we are from the socket, so no userId is sent. */
export type CloseReq = { callId: string; kinds?: TrackKind[] };

/* ---- backend to client (listen payloads) ---- */

export type IncomingEvt = {
  callId: string;
  conversationId: string;
  callMediaType: CallMediaType;
  fromName: string;
  avatarUrl?: string | null;
  fromId: string;
};
export type NewAcceptEvt = { callId: string; from: string };
export type RejectedEvt = { callId: string; from: string };
export type HandledEvt = { callId: string; conversationId: string; reason: string };

/** A participant as the roster lists it. The roster carries no call type, so the
    kind is read from the tracks: a published "cam" (or videoOn) means video. */
export type RosterParticipant = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  audioOn?: boolean;
  videoOn: boolean;
  tracks?: Partial<Record<TrackKind, { kind: TrackKind }>>;
};
/** Sent to everyone in a call when someone (re)joins, so a reconnected client
    can rebuild the call it is already back in. */
export type RosterEvt = {
  callId: string;
  conversationId: string;
  startedAt?: number | string;
  participants: RosterParticipant[];
};
/** A peer closed one or more of their tracks: drop those from the UI. */
export type CloseEvt = { userId: string; kinds: TrackKind[] };
export type NewPublishEvt = { callId: string; userId: string; tracks: { kind: TrackKind }[] };
/** Someone left a call that still has people in it. `participants` is the
    authoritative remaining roster, so the client refreshes from it. */
export type ParticipantLeftEvt = { callId: string; from: string; participants: RosterParticipant[] };
export type EndedEvt = { callId: string; reason: string };
