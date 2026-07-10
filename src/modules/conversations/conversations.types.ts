import { IConversation } from "../../db/schema";
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
  pingStatus: IConversation["pingStatus"];
  lastMessageAt: IConversation["lastMessageAt"];
  createdAt: IConversation["createdAt"];
}
