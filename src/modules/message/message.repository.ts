import { and, eq } from "drizzle-orm";
import { db as DbiInstance } from "../../db";
import { IMessage, INewMessage } from "../../db/schema";
import { messagesTable as messages } from "../../db/schema";
import AppError from "../../shared/utils/apiError";
import { MessageResponseDTO } from "./message.types";

export const messageResponds = {
  id: messages.id,
  conversationId: messages.conversationId,
  senderId: messages.senderId,
  body: messages.body,
  createdAt: messages.createdAt,
};

class MessageRepository {
  constructor(
    private readonly db: typeof DbiInstance,
    private readonly messageTable: typeof messages,
  ) {}

  async createMessage(data: INewMessage): Promise<MessageResponseDTO> {
    const [message] = await this.db
      .insert(this.messageTable)
      .values(data)
      .returning(messageResponds);

    if (!message) {
      throw new AppError("Failed to create message", 500);
    }

    return message;
  }

  // async getMessagesByConversation(
  //   conversationId: string,
  //   limit: number = 50,
  // ): Promise<MessageResponseDTO[]> {
  //   const messages = await this.db.query.messagesTable.findMany({
  //     where: eq(this.messageTable.conversationId, conversationId),
  //     orderBy: (messages, { desc }) => [desc(messages.createdAt)],
  //     limit,
  //     columns: messageResponds,
  //   });

  //   return messages;
  // }

  async getMessageById(messageId: string): Promise<IMessage | null> {
    const message = await this.db.query.messagesTable.findFirst({
      where: eq(this.messageTable.id, messageId),
    });

    return message ?? null;
  }

  async updateMessage(messageId: string, content: string): Promise<IMessage> {
    // Add your database update logic here
    throw new Error("Method not implemented");
  }

  async deleteMessage(messageId: string): Promise<void> {
    // Add your database delete logic here
    throw new Error("Method not implemented");
  }
}

export default MessageRepository;
