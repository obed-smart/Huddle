import type { IMessage, IsystemEvent } from "../../db/schema";

export type MessageResponseDTO = {
  id: IMessage["id"];
  conversationId: IMessage["conversationId"];
  senderId: IMessage["senderId"];
  body: IMessage["body"];
  createdAt: IMessage["createdAt"];
  editedAt?: IMessage["editedAt"];
};

export type systemEventDTO = {
  conversationId: IsystemEvent["conversationId"];
  actorId: IsystemEvent["actorId"];
  type: IsystemEvent["type"];
  metadata: IsystemEvent["metadata"];
};
