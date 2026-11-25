/** The meet signaling contract, mirrored from the backend. Meet is the same SFU
    media plane as the call and keyed by userId, so the shared call types carry
    straight over. The client only ever sees userId, kind, and mid. */
import type { RosterParticipant, RtcDescription, TrackKind } from "@/features/call/signaling/types";

export type { RosterParticipant };

/* ---- client to backend (requests + acks) ---- */

export type JoinReq = { conversationId: string; meetId: string };
/** The join ack: ICE servers plus the roster, spread at the top level. */
export type JoinAck = {
  success: boolean;
  iceServers?: RTCIceServer[];
  participants?: RosterParticipant[];
};

export type PublishReq = { meetId: string; description: RtcDescription; tracks: { mid: string; kind: TrackKind }[] };
/** Who is already publishing when we join: subscribe to them at once. */
export type ExistingPublisher = { userId: string; kinds: TrackKind[] };
export type PublishAck = {
  success: boolean;
  description?: RtcDescription;
  existing?: ExistingPublisher[];
  /** The SFU session died; rebuild the peer connection and publish again. */
  reason?: string;
};

export type SubscribeTarget = { userId: string; kinds?: TrackKind[] };
export type SubscribeReq = { meetId: string; targets: SubscribeTarget[] };
export type SubscribedTrack = { userId: string; kind: TrackKind; mid: string };
export type SubscribeAck = {
  success: boolean;
  requiresRenegotiation: boolean;
  description: RtcDescription | null;
  subscribed: SubscribedTrack[];
};

export type RenegotiateReq = { meetId: string; description: RtcDescription };
export type CloseReq = { meetId: string; kinds?: TrackKind[] };
export type ConnectedReq = { meetId: string; conversationId: string };
export type LeaveReq = { meetId: string; conversationId: string };

/* ---- backend to client (listen payloads) ---- */

export type NewJoinEvt = { meetId: string; participant?: RosterParticipant };
export type NewPublishEvt = { meetId: string; userId: string; tracks: { kind: TrackKind }[] };
export type NewCloseEvt = { meetId: string; userId: string; kinds: TrackKind[] };
export type RosterEvt = { meetId: string; conversationId: string; participants: RosterParticipant[] };
export type NewLeaveEvt = { meetId?: string; userId?: string; from?: string };
