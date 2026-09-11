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
  conversationId: string;
  authorizedUsers: Set<string>;
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
  conversationId: string;
  type: "direct" | "group";
  authorizedUserIds: string[];
  initiator: {
    id: string;
    displayName: string;
    avatarUrl: string;
  };
};
