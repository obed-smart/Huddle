import { IConversation } from "../../db/schema";
import { INewMeet } from "../../db/schema/schema.meet";
import { ParticipantState } from "../call/call.types";

export type Meet = {
  meetId: string;
  createdBy: string;
  title: INewMeet["title"];
  conversationId: string;
  conversationType: IConversation["type"];

  scheduledFor: Date | null;
  authorizedUsers: Set<string>;
  invitedUsers: Set<string>;

  participants: Map<
    string,
    {
      state: ParticipantState;
      userId: string;
      name: string;
      avatarUrl: string;
      sessionId: string;
      joinedAt: Date;
      // media: {
      //   // mesh needs this in the roster so a new joiner
      //   camera: boolean; // knows each peer's state before negotiating
      //   micMuted: boolean;
      //   screenSharing: boolean;
      // };
    }
  >;

  createdAt: Date;
  startedAt: Date | null;
  lastActiveAt: number; // updated on every join/leave — drives idle-sweep
};

export type CreateMeetInput = {
  meetId: string;
  conversationId: string;
  conversationType: IConversation["type"];
  createdBy: string;
  title: INewMeet["title"];
  authorizedUserIds: string[];
  scheduledFor?: Date | null;
  startedAt?: Date | null;
};

// export type UpdateMeetInput = {
//   meetId: string;
//   title?: INewMeet["title"];
//   scheduledFor?: Date | null;
//   startedAt?: Date | null;
//   endedAt?: Date | null;
// };

export type IcreateMeet = {
  conversationId: string;
  createdBy: string;
  title: INewMeet["title"];
  scheduledFor: Date | null;
};

export type IjoinMeet = {
  meetId: string;
  userId: string;
  sessionId: string;
};
