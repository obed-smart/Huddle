import { IConversation, IUser } from "../../db/schema";
import { MessageResponseDTO, systemEventDTO } from "../message/message.types";
export interface SendMessageDto {
  roomId: string;
  content: string;
}

export interface IUpdatePing {
  requestedBy: IConversation["requestedBy"];
  pingStatus: IConversation["pingStatus"];
}

export interface ICreateDirectWithParticipants {
  directKey: string;
  createdBy: string;
  pingStatus: "pending";
  requestedBy: string;
  participantIds: string[];
}

export interface ConversationResponseDto {
  id: IConversation["id"];
  type: IConversation["type"];
  visibility: IConversation["visibility"];
  name: IConversation["name"];
  description: IConversation["description"];
  avatarUrl: IConversation["avatarUrl"];
  requestedBy: IConversation["requestedBy"];
  createdBy: IConversation["createdBy"];
  pingStatus: IConversation["pingStatus"];
  lastMessageAt: IConversation["lastMessageAt"];
  createdAt: IConversation["createdAt"];
}

export interface CallerDto {
  memberId?: string;
  adminId?: string;
  username: IUser["username"];
  avatarUrl?: IUser["avatarUrl"];
  joinedBy?: "member" | "admin";
}

export interface RealtimeGateway {
  emitToRoom(
    roomId: string,
    event: string,
    payload: unknown,
    excludeIds?: string | string[],
  ): void;
  emitToUser(userId: string, event: string, payload: unknown): void;
  getSocketIdsForUser(userId: string): Promise<string[]>;
  evacuateRoom(roomId: string): Promise<void>;
}

export interface IcreateGroupConversation {
  name: IConversation["name"];
  description: IConversation["description"];
  visibility: IConversation["visibility"];
  createdBy: IConversation["createdBy"];
  participantIds: string[];
}

export type TimelineItem =
  | { type: "message"; createdAt: Date; data: MessageResponseDTO }
  | { type: "system_event"; createdAt: Date; data: systemEventDTO }
  | { type: "deleted_message"; createdAt: Date; data: null };
