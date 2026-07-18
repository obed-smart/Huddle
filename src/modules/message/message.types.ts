import type { IMessage } from "../../db/schema";

export type MessageResponseDTO = {
  id: IMessage["id"];
  conversationId: IMessage["conversationId"];
  senderId: IMessage["senderId"];
  body: IMessage["body"];
  createdAt: IMessage["createdAt"];
};
