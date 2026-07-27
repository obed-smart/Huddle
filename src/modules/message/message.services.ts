import Logger from "../../shared/utils/logger";
import AppError from "../../shared/utils/apiError";
import MessageRepository from "./message.repository";
import { IMessage, INewMessage } from "../../db/schema";
import { MessageResponseDTO } from "./message.types";
import logger from "../../shared/utils/logger";

class MessageService {
  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly logger: typeof Logger,
  ) {}

  async createMessage(data: INewMessage): Promise<MessageResponseDTO> {
    const message = await this.messageRepo.createMessage(data);
    return message;
  }

  // async getMessagesByConversation(
  //   conversationId: string,
  // ): Promise<MessageResponseDTO[]> {
  //   try {
  //     const messages =
  //       await this.messageRepo.getMessagesByConversation(conversationId);

  //     return messages;
  //   } catch (error) {
  //     //   this.logger.error("Error fetching messages:", error);
  //     throw new AppError("Failed to fetch messages", 500);
  //   }
  // }

  async getMessageById(messageId: string): Promise<IMessage | null> {
    try {
      const message = await this.messageRepo.getMessageById(messageId);

      return message;
    } catch (error) {
      this.logger.error({ error }, "Error fetching message:");
      // this.logger
      throw new AppError("Failed to fetch message", 500);
    }
  }

  async updateMessage(messageId: string, content: string): Promise<IMessage> {
    try {
      const message = await this.messageRepo.updateMessage(messageId, content);
      return message;
    } catch (error) {
      this.logger.error({ error }, "Error updating message:");
      throw new AppError("Failed to update message", 500);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.messageRepo.deleteMessage(messageId);
    } catch (error) {
      this.logger.error({ error }, "Error deleting message:");
      throw new AppError("Failed to delete message", 500);
    }
  }

  /**
   * This for the message reaction
   */

  async addOrUpdateReactions(messageId: string, userId: string, emoji: string) {
    await this.messageRepo.addOrUpdateReactions(messageId, userId, emoji);
  }

  async getReactionsSummary(messageId: string) {
    const rows = await this.messageRepo.getReactionsSummary(messageId);

    const summary: Record<string, string[]> = {};

    for (const row of rows) {
      if (!summary[row.emoji]) summary[row.emoji] = [];
      summary[row.emoji]?.push(row.userId);
    }

    return summary;
  }

  async deleteReaction(messageId: string, userId: string) {
    return await this.messageRepo.deleteReaction(messageId, userId);
  }

  /// This for the message mentions

  async createMessageMention(
    conversationId: string,
    messageId: string,
    validMentionIds: string[],
  ) {
    await this.messageRepo.createMessageMention(
      conversationId,
      messageId,
      validMentionIds,
    );
  }

  async updateMentionReadAt(
    conversationId: string,
    userId: string,
    createdAt: IMessage["createdAt"],
  ) {
    try {
      await this.messageRepo.updateMentionReadAt(
        conversationId,
        userId,
        createdAt,
      );
    } catch (error) {
      logger.error({ error }, "error Updating the mention readAt");
      throw new AppError("Failed updating mentions readAt", 500);
    }
  }
}

export default MessageService;

// /react 29241a81-c9fa-40cd-a4ad-4201c1e36928 🎉
