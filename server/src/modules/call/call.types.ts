import { IConversation } from "../../db/schema";
import { callOutCome, calltype } from "../../db/schema/type";

export type ParticipantState =
  | "initiating"
  | "ringing"
  | "accepted"
  | "connecting"
  | "connected"
  | "rejected"
  | "left"
  | "joined";

export type Call = {
  callId: string;
  initiatorId: string;
  type: calltype;
  name: string | null;
  conversationId: string;
  conversationType: IConversation["type"];
  authorizedUsers: Set<string>;
  invitedUsers: Set<string>;
  participants: Map<
    string,
    {
      state: ParticipantState;
      name: string;
      sessionId: string;
      avatarUrl: string;
      joinedAt: number;
    }
  >;
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
  participant: {
    id: string;
    displayName: string;
    sid: string;
    avatarUrl: string;
  };
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
