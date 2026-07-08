import { db as dBinstance } from "../../db";
import {
  conversationsTable as conversation,
  IConversation,
  INewConversation,
} from "../../db/schema/schema.conversations";

class ConversationsRepository {
  constructor(
    private readonly db: typeof dBinstance,
    private readonly conversationsTable: typeof conversation,
  ) {}

  async createConversation(
    conversation: INewConversation,
  ): Promise<IConversation | null> {
    const [newConversation] = await this.db
      .insert(this.conversationsTable)
      .values(conversation)
      .returning();

    return newConversation ?? null;
  }

  async getConversationById(
    conversationId: string,
  ): Promise<IConversation | null> {
    // Add your database query logic here
    throw new Error("Method not implemented");
  }

  async updateConversation(
    conversationId: string,
    data: {},
  ): Promise<IConversation | null> {
    // Add your database update logic here
    throw new Error("Method not implemented");
  }

  async deleteConversation(conversationId: string): Promise<void> {
    // Add your database delete logic here
    throw new Error("Method not implemented");
  }
}

export default ConversationsRepository;
