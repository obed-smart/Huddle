import { IConversation } from "../../db/schema";
import { callOutCome, calltype } from "../../db/schema/type";
import { ActiveCallSummary } from "./call.validation";

export type TrackKind = "mic" | "cam" | "screen";

export const MEDIA_KIND: Record<TrackKind, "audio" | "video"> = {
  mic: "audio",
  cam: "video",
  screen: "video",
};

export type State =
  | "initiating"
  | "ringing"
  | "accepted"
  | "connecting"
  | "connected"
  | "rejected"
  | "left"
  | "joined";

export type PublishedTrack = {
  trackName: string;
  kind: "audio" | "video";
  mid?: string;
  publishedAt: number;
};

export type ParticipantState = {
  rtcSessionId: string;
  sessionId: string;
  status: State;
  audioOn: boolean;
  videoOn: boolean;
  joinedAt: number;
  username: string;
  avatarUrl: string;
  tracks: Partial<Record<TrackKind, PublishedTrack>>;
};

export type ParticipantInput = Omit<ParticipantState, "tracks"> & {
  userId: string;
};

// used when updating the tracks
export type ParticipantPatch = Partial<Omit<ParticipantState, "tracks">>;

// used whe subscribing
export type ParticipantView = Omit<ParticipantState, "sessionId" | "rtcSessionId"> & {
  userId: string;
};

export type Call = {
  callId: string;
  initiatorId: string;
  type: calltype;
  name: string | null;
  conversationId: string;
  conversationType: IConversation["type"];
  authorizedUsers: Set<string>;
  invitedUsers: Set<string>;
  participants: Map<string, ParticipantState>;
  startedAt: Date;

  /**
   * this will be pending for now but its the real deal for calculating duration because it the actual time the call start like when a second perticipant connected but it working will for the call history but not for the in-memory call start.
   *  see {@link callRepository.markCallAsConnected} to understand it more
   */
  connectedAt?: Date;
};

export type CreateCallInput = {
  callId: string;
  conversationId: string;
  conversationType: IConversation["type"];
  type: calltype;
  name: string;
  authorizedUserIds: string[];
  participant: ParticipantInput;
  startedAt: Date;
};
export type callCursor = { startedAt: Date; callId: string };

export type RawCallEntries = {
  callId: string;
  conversationId: string;
  conversationType: IConversation["type"];
  startedAt: Date;
  type: calltype;
  label: string;
  avatarUrl: string | null;
  direction: "incoming" | "outgoing";
  duration: number | null;
  callOutCome: callOutCome;
  otherParticipantIds: string[];
  otherParticipants: {
    userId: string;
    username: string;
    avatarUrl: string | null;
  }[];
};

export type otherUser = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  callOutCome: callOutCome;
};

export type CallLogEntry = {
  id: string;
  conversationId: string;
  conversationType: IConversation["type"];
  label: string;
  avatarUrl: string | null;
  direction: "outgoing" | "incoming";
  outcome: callOutCome;
  type: calltype;
  callStartedAt: Date;
  durationSeconds: number | null;
  count: number;
  callIds: string[];
  otherParticipants: {
    userId: string;
    username: string;
    avatarUrl: string | null;
  }[];
};

export interface CallStore {
  createCall(input: CreateCallInput): Promise<Call>;
  getCall(callId: string): Promise<Call | undefined>;
  endCall(callId: string): Promise<Call>;

  isAuthorized(callId: string, userId: string): Promise<boolean>;
  isParticipant(callId: string, userId: string): Promise<boolean>;
  addAuthorizedUser(callId: string, userId: string): Promise<boolean>;
  addInvitedUser(callId: string, userId: string): Promise<void>;

  addParticipant(callId: string, p: ParticipantInput): Promise<boolean>;
  removeParticipant(
    callId: string,
    userId: string,
  ): Promise<ParticipantState | null>;
  updateParticipant(
    callId: string,
    userId: string,
    patch: ParticipantPatch,
  ): Promise<boolean>;

  getParticipants(callId: string): Promise<ParticipantView[]>;

  setTrack(
    callId: string,
    userId: string,
    kind: TrackKind,
    track: PublishedTrack,
  ): Promise<boolean>;
  removeTrack(
    callId: string,
    userId: string,
    kind: TrackKind,
  ): Promise<PublishedTrack | null>;

  callIdForSession(sessionId: string): Promise<string | undefined>;
  getActiveCallsForUser(userId: string): Promise<ActiveCallSummary[]>;
}
