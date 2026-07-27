import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import { db as DbiInstance } from "../../db";
import { IMessage, INewMessage } from "../../db/schema";
import {
  messagesTable as messages,
  messageReactionsTable as messageReaction,
  messageMentionsTable as messageMenstion,
} from "../../db/schema";
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
    private readonly messageReactionTable: typeof messageReaction,
    private readonly messageMentionsTable: typeof messageMenstion,
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

  /**
   * This for the message reaction
   */

  async addOrUpdateReactions(messageId: string, userId: string, emoji: string) {
    await this.db
      .insert(this.messageReactionTable)
      .values({
        messageId,
        userId,
        emoji,
      })
      .onConflictDoUpdate({
        target: [
          this.messageReactionTable.messageId,
          this.messageReactionTable.userId,
        ],
        set: { emoji },
      });
  }

  async getReactionsSummary(messageId: string) {
    const rows = this.db
      .select({
        userId: this.messageReactionTable.userId,
        emoji: this.messageReactionTable.emoji,
      })
      .from(this.messageReactionTable)
      .where(eq(this.messageReactionTable.messageId, messageId));

    return rows;
  }

  async deleteReaction(messageId: string, userId: string) {
    const [deletedReaction] = await this.db
      .delete(this.messageReactionTable)
      .where(
        and(
          eq(this.messageReactionTable.messageId, messageId),
          eq(this.messageReactionTable.userId, userId),
        ),
      )
      .returning({
        emoji: this.messageReactionTable.emoji,
        messageId: this.messageReactionTable.messageId,
        userId: this.messageReactionTable.userId,
      });

    return deletedReaction;
  }

  /// This is for message mentions

  async createMessageMention(
    conversationId: string,
    messageId: string,
    validMentionIds: string[],
  ) {
    await this.db
      .insert(this.messageMentionsTable)
      .values(
        validMentionIds.map((userId) => ({
          messageId,
          mentionedUserId: userId,
          conversationId,
        })),
      )
      .onConflictDoNothing();
  }

  async updateMentionReadAt(
    conversationId: string,
    userId: string,
    createdAt: IMessage["createdAt"],
  ) {
    await this.db
      .update(this.messageMentionsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(this.messageMentionsTable.conversationId, conversationId),
          eq(this.messageMentionsTable.mentionedUserId, userId),
          isNull(this.messageMentionsTable.readAt),
          inArray(
            this.messageMentionsTable.messageId,
            this.db
              .select({ id: this.messageTable.id })
              .from(this.messageTable)
              .where(
                and(
                  eq(this.messageTable.conversationId, conversationId),
                  lte(this.messageTable.createdAt, createdAt),
                ),
              ),
          ),
        ),
      );
  }
}

export default MessageRepository;
