import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import { db as DbiInstance } from "../../db";
import { IMessage, INewMessage } from "../../db/schema";
import {
  messagesTable as messages,
  messageReactionsTable as messageReaction,
  messageMentionsTable as messageMenstion,
  systemEventsTable as conversationlog,
  conversationTimeline,
} from "../../db/schema";
import AppError from "../../shared/utils/apiError";
import { MessageResponseDTO, systemEventDTO } from "./message.types";
import logger from "../../shared/utils/logger";

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
    private readonly conversationlogTable: typeof conversationlog,
    private readonly conversationTimelineTable: typeof conversationTimeline,
  ) {}

  async createMessage(data: INewMessage): Promise<MessageResponseDTO> {
    try {
      return await this.db.transaction(async (tx) => {
        const timestamp = new Date();

        const [message] = await tx
          .insert(this.messageTable)
          .values(data)
          .returning(messageResponds);

        if (!message) {
          throw new AppError("Failed to create message records", 500);
        }

        await tx.insert(this.conversationTimelineTable).values({
          conversationId: message.conversationId,
          createdAt: message.createdAt,
          type: "message",
          refId: message.id,
        });
        return message;
      });
    } catch (error) {
      logger.error({ error }, "Failed creating message");
      throw new AppError("Failed creating message", 500);
    }
  }

  async createSystemEvent(input: systemEventDTO) {
    try {
      return await this.db.transaction(async (tx) => {
        const [event] = await tx
          .insert(this.conversationlogTable)
          .values(input)
          .returning();

        if (!event) {
          throw new AppError("Failed to record system event logs", 500);
        }

        
        await tx.insert(this.conversationTimelineTable).values({
          conversationId: event.conversationId,
          createdAt: event.createdAt,
          type: "event",
          refId: event.id,
        });

        return event;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        error instanceof Error
          ? error.message
          : "Internal database timeline failure",
        500,
      );
    }
  }

  async getMessagesByConversation(
    conversationId: string,
    limit: number = 50,
  ): Promise<MessageResponseDTO[]> {
    // Use .select(messageResponds) instead of .query
    const messages = await this.db
      .select(messageResponds)
      .from(this.messageTable)
      .where(eq(this.messageTable.conversationId, conversationId))
      .orderBy(desc(this.messageTable.createdAt))
      .limit(limit);

    return messages as MessageResponseDTO[];
  }

  async getMessageById(messageId: string): Promise<IMessage | null> {
    const message = await this.db.query.messagesTable.findFirst({
      where: eq(this.messageTable.id, messageId),
    });

    return message ?? null;
  }

  async editMessage(
    messageId: string,
    content: string,
    senderId: string,
  ): Promise<MessageResponseDTO | null> {
    try {
      const [updatedMessage] = await this.db
        .update(this.messageTable)
        .set({ body: content, editedAt: new Date() })
        .where(
          and(
            eq(this.messageTable.id, messageId),
            eq(this.messageTable.senderId, senderId),
          ),
        )
        .returning(messageResponds);

      return updatedMessage ?? null;
    } catch (error) {
      logger.error({ err: error }, "Error editing message:");
      throw new AppError("Failed to edit message", 500);
    }
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
