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
  /** The media of the call being answered; the accept schema requires it. */
  callMediaType: CallMediaType;
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
export type MediaStateReq = { callId: string; audioOn: boolean; videoOn: boolean };
export type LeaveReq = { callId: string; conversationId: string };

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
export type NewPublishEvt = { callId: string; userId: string; tracks: { kind: TrackKind }[] };
export type ParticipantLeftEvt = { callId: string; from: string; participants: unknown[] };
export type EndedEvt = { callId: string; reason: string };
