import Logger from "../../shared/utils/logger";
import AppError from "../../shared/utils/apiError";
import MessageRepository from "./message.repository";
import { INewMessage, IMessage } from "./message.types";

class MessageService {
  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly logger: typeof Logger,
  ) {}

  async createMessage(data: INewMessage): Promise<IMessage> {

  }

  async getMessagesByConversation(conversationId: string): Promise<IMessage[]> {
    try {
      const messages =
        await this.messageRepo.getMessagesByConversation(conversationId);
      return messages;
    } catch (error) {
    //   this.logger.error("Error fetching messages:", error);
      throw new AppError("Failed to fetch messages", 500);
    }
  }

  async getMessageById(messageId: string): Promise<IMessage> {
    try {
      const message = await this.messageRepo.getMessageById(messageId);
      if (!message) {
        throw new AppError("Message not found", 404);
      }
      return message;
    } catch (error) {
      this.logger.error("Error fetching message:", error);
      throw new AppError("Failed to fetch message", 500);
    }
  }

  async updateMessage(messageId: string, content: string): Promise<IMessage> {
    try {
      const message = await this.messageRepo.updateMessage(messageId, content);
      return message;
    } catch (error) {
      this.logger.error("Error updating message:", error);
      throw new AppError("Failed to update message", 500);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.messageRepo.deleteMessage(messageId);
    } catch (error) {
      this.logger.error("Error deleting message:", error);
      throw new AppError("Failed to delete message", 500);
    }
  }
}

export default MessageService;
