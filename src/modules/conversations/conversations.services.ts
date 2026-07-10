import AppError from "../../shared/utils/apiError";
import ConversationsRepository from "./conversations.repository";
import logger from "../../shared/utils/logger";

class ConversationService {
  constructor(
    private readonly conversationRepo: ConversationsRepository,
    private readonly Logger: typeof logger,
  ) {}

  async createConversation(callerId: string, targetId: string) {
    if (callerId === targetId) {
      throw new AppError("Can't start a conversation with yourself", 400);
    }

    const directKey = [callerId, targetId].sort().join(":");

    try {
      const existing = await this.conversationRepo.findByDirectKey(directKey);

      logger.debug("conersation found moving to exist");

      if (existing) {
        logger.debug({ existing }, "Exist conversation");

        if (existing.pingStatus === "declined") {
          logger.debug("its declined. reactivating");

          return await this.conversationRepo.updateConversationStatus(
            existing.id,
            {
              pingStatus: "pending",
              requestedBy: callerId,
            },
          );
        }

        if (
          existing.pingStatus === "pending" &&
          existing.requestedBy !== callerId
        ) {
          return await this.conversationRepo.updateConversationStatus(
            existing.id,
            {
              pingStatus: "accepted",
              requestedBy: null,
            },
          );
        }

        return existing;
      }

      return await this.conversationRepo.createDirectWithParticipants({
        directKey,
        createdBy: callerId,
        pingStatus: "pending",
        requestedBy: callerId,
        participantIds: [callerId, targetId],
      });
    } catch (err: any) {
      if (err?.cause?.code === "23505") {
        const existing = await this.conversationRepo.findByDirectKey(directKey);
        if (
          existing?.pingStatus === "pending" &&
          existing.requestedBy !== callerId
        ) {
          return await this.conversationRepo.updateConversationStatus(
            existing.id,
            {
              pingStatus: "accepted",
              requestedBy: null,
            },
          );
        }
        return existing;
      }

      throw err;
    }
  }

  async findConversationById(conversationId: string) {
    const conversation =
      await this.conversationRepo.findConversationById(conversationId);

    if (!conversation) throw new AppError("Conversation Not found", 404);

    return conversation;
  }

  async acceptPing(conversationId: string, userId: string) {
    const conversation = await this.findConversationById(conversationId);

    if (conversation.pingStatus !== "pending")
      throw new AppError("No pending request", 400);

    if (conversation.requestedBy === userId) {
      throw new AppError("You cannot accept your own ping", 400);
    }

    await this.conversationRepo.updateConversationStatus(conversation.id, {
      pingStatus: "accepted",
      requestedBy: null,
    });
  }

  async declinePing(conversationId: string, userId: string) {
    const conversation = await this.findConversationById(conversationId);

    if (conversation.pingStatus !== "pending")
      throw new AppError("No pending request", 400);

    if (conversation.requestedBy === userId) {
      throw new AppError("You cannot decline your own ping", 400);
    }

    await this.conversationRepo.updateConversationStatus(conversation.id, {
      pingStatus: "declined",
      requestedBy: null,
    });
  }
}

export default ConversationService;
