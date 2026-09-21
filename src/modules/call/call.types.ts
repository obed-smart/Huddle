export type ParticipantState =
  | "initiating"
  | "ringing"
  | "accepted"
  | "connecting"
  | "connected"
  | "rejected"
  | "left";

export type Call = {
  callId: string;
  initiatorId: string;
  type: "direct" | "group";
  name: string | null;
  conversationId: string;
  authorizedUsers: Set<string>;
  invitedUsers: Set<string>;
  participants: Map<
    string,
    {
      state: ParticipantState;
      name: string;
      avatarUrl: string;
      joinedAt: number;
    }
  >;
  startedAt: number;
};

export type CreateCallInput = {
  callId: string;
  conversationId: string;
  type: "direct" | "group";
  name: string | null;
  authorizedUserIds: string[];
  initiator: {
    id: string;
    displayName: string;
    avatarUrl: string;
  };
};
