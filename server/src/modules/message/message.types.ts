import type { IAttachment, IMessage, IsystemEvent } from "../../db/schema";

export type MessageResponseDTO = {
  id: IMessage["id"];
  conversationId: IMessage["conversationId"];
  senderId: IMessage["senderId"];
  body: IMessage["body"];
  createdAt: IMessage["createdAt"];
  editedAt?: IMessage["editedAt"];
};

export type MessageWithAttachmentDTO = MessageResponseDTO & {
  attachments: IAttachment[];
};

export type AttachmentDTO = Omit<
  IAttachment,
  "createdAt" | "status" | "messageId" | "objectKey"
>;

export type MessageTimelineWithAttachmentDTO = MessageResponseDTO & {
  attachments: AttachmentDTO[];
};

export type systemEventDTO = {
  conversationId: IsystemEvent["conversationId"];
  actorId: IsystemEvent["actorId"];
  type: IsystemEvent["type"];
  metadata: IsystemEvent["metadata"];
};
