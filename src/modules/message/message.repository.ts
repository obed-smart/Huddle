import { db as DbiInstance } from "../../db";
import { INewMessage, IMessage } from "./message.types";

class MessageRepository {
  constructor(private readonly db: typeof DbiInstance) {}

  async createMessage(data: INewMessage): Promise<IMessage> {
    // Add your database insert logic here
    // Example: return await this.db.insert(messagesTable).values(data);
    throw new Error("Method not implemented");
  }

  async getMessagesByConversation(conversationId: string): Promise<IMessage[]> {
    // Add your database query logic here
    throw new Error("Method not implemented");
  }

  async getMessageById(messageId: string): Promise<IMessage | null> {
    // Add your database query logic here
    throw new Error("Method not implemented");
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
