/** The meet signaling contract, mirrored from the backend. Meet works in
    sessionId (one per device) the way the call works in userId; the client only
    ever sees sessionId, kind, and mid. RtcDescription and TrackKind are shared
    with the call, since the SFU media plane is the same. */
import type { RtcDescription, TrackKind } from "@/features/call/signaling/types";

/** A participant as the backend lists them, keyed by their socket session. */
export type MeetParticipantWire = {
  sessionId: string;
  name: string;
  avatarUrl?: string | null;
  audioOn?: boolean;
  videoOn?: boolean;
};

/* ---- client to backend (requests + acks) ---- */

export type JoinReq = { conversationId: string; meetId: string };
export type JoinAck = {
  success: boolean;
  data?: {
    sessionId: string;
    /** The SFU's ICE servers, as the call's accept ack returns them. */
    iceServers?: RTCIceServer[];
    participants?: MeetParticipantWire[];
  };
};

export type PublishReq = { meetId: string; description: RtcDescription; tracks: { mid: string; kind: TrackKind }[] };
/** Who is already publishing when we join: subscribe to them at once. */
export type ExistingPublisher = { sessionId: string; kinds: TrackKind[] };
export type PublishAck = { success: boolean; description: RtcDescription; existing?: ExistingPublisher[] };

export type SubscribeTarget = { sessionId: string; kinds?: TrackKind[] };
export type SubscribeReq = { meetId: string; targets: SubscribeTarget[] };
export type SubscribedTrack = { sessionId: string; kind: TrackKind; mid: string };
export type SubscribeAck = {
  success: boolean;
  requiresRenegotiation: boolean;
  description: RtcDescription | null;
  subscribed: SubscribedTrack[];
};

export type RenegotiateReq = { meetId: string; description: RtcDescription };
export type LeaveReq = { meetId: string; conversationId: string };
export type ReactionReq = { meetId: string; emoji: string };

/* ---- backend to client (listen payloads) ---- */

export type NewJoinEvt = { meetId: string; participant: MeetParticipantWire };
export type NewPublishEvt = { meetId: string; sessionId: string; tracks: { kind: TrackKind }[] };
export type NewLeaveEvt = { meetId: string; from: string };
export type NewReactionEvt = { from: string; name?: string; emoji: string };
