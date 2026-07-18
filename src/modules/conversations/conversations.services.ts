import AppError from "../../shared/utils/apiError";
import ConversationsRepository from "./conversations.repository";
import logger from "../../shared/utils/logger";
import { CallerDto } from "./conversations.types";
import { RealtimeGateway } from "./conversations.types";

class ConversationService {
  constructor(
    private readonly conversationRepo: ConversationsRepository,
    private readonly Logger: typeof logger,
    private readonly realtime: RealtimeGateway,
  ) {}

  async createConversation(caller: CallerDto, targetId: string) {
    if (caller.id === targetId) {
      throw new AppError("Can't start a conversation with yourself", 400);
    }

    const directKey = [caller.id, targetId].sort().join(":");
    const requesterPayload = {
      id: caller.id,
      username: caller.username,
      avatarUrl: caller.avatarUrl,
    };

    try {
      const existing = await this.conversationRepo.findByDirectKey(directKey);

      if (existing) {
        if (existing.pingStatus === "declined") {
          const updatedConversation =
            await this.conversationRepo.updateConversationStatus(existing.id, {
              pingStatus: "pending",
              requestedBy: caller.id,
            });

          this.realtime.emitToUser(targetId, "ping:new", {
            conversationId: updatedConversation?.id,
            requester: requesterPayload,
          });

          return updatedConversation;
        }

        if (
          existing.pingStatus === "pending" &&
          existing.requestedBy !== caller.id
        ) {
          const updatedConversation =
            await this.conversationRepo.updateConversationStatus(existing.id, {
              pingStatus: "accepted",
              requestedBy: null,
            });

          this.realtime.emitToUser(targetId, "ping:accepted", {
            conversationId: updatedConversation?.id,
            requester: requesterPayload,
          });

          return updatedConversation;
        }

        return existing;
      }

      const conversation =
        await this.conversationRepo.createDirectWithParticipants({
          directKey,
          createdBy: caller.id,
          pingStatus: "pending",
          requestedBy: caller.id,
          participantIds: [caller.id, targetId],
        });

      this.realtime.emitToUser(targetId, "ping:new", {
        conversationId: conversation.id,
        requester: requesterPayload,
      });
      logger.debug("conversation cretae");
      return conversation;
    } catch (err: any) {
      if (err?.cause?.code === "23505") {
        const existing = await this.conversationRepo.findByDirectKey(directKey);
        if (
          existing?.pingStatus === "pending" &&
          existing.requestedBy !== caller.id
        ) {
          const updated = await this.conversationRepo.updateConversationStatus(
            existing.id,
            {
              pingStatus: "accepted",
              requestedBy: null,
            },
          );

          if (!updated) {
            logger.info("[Updated Error]: failed when updation conversation");
            throw new AppError("Updated error", 404);
          }
          this.realtime.emitToUser(targetId, "ping:accepted", {
            conversationId: updated.id,
            requester: requesterPayload,
          });

          return updated;
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

  async findAcceptedDmParticipantIds(conversationId: string) {
    const partucipant =
      await this.conversationRepo.findParticipantsByConversationId(
        conversationId,
      );

    if (!partucipant) throw new AppError("Conversation Not found", 404);

    return partucipant;
  }

  async acceptPing(conversationId: string, caller: CallerDto) {
    const conversation = await this.findConversationById(conversationId);

    const requesterPayload = {
      id: caller.id,
      username: caller.username,
      avatarUrl: caller.avatarUrl,
    };

    if (conversation.pingStatus !== "pending")
      throw new AppError("No pending request", 400);

    if (conversation.requestedBy === caller.id) {
      throw new AppError("You cannot accept your own ping", 400);
    }

    const updated = await this.conversationRepo.updateConversationStatus(
      conversation.id,
      {
        pingStatus: "accepted",
        requestedBy: null,
      },
    );

    if (!updated) {
      logger.info("[Updated Error]: failed when updation conversation");
      throw new AppError("Updated error", 404);
    }

    return this.realtime.emitToUser(updated.createdBy, "ping:accepted", {
      conversationId: updated.id,
      requester: requesterPayload,
    });
  }

  async declinePing(conversationId: string, caller: CallerDto) {
    const conversation = await this.findConversationById(conversationId);

    const requesterPayload = {
      id: caller.id,
      username: caller.username,
      avatarUrl: caller.avatarUrl,
    };

    if (conversation.pingStatus !== "pending")
      throw new AppError("No pending request", 400);

    if (conversation.requestedBy === caller.id) {
      throw new AppError("You cannot decline your own ping", 400);
    }

    const updated = await this.conversationRepo.updateConversationStatus(
      conversation.id,
      {
        pingStatus: "declined",
        requestedBy: null,
      },
    );

    if (!updated) {
      logger.info("[Updated Error]: failed when updation conversation");
      throw new AppError("Updated error", 404);
    }

    return this.realtime.emitToUser(updated.createdBy, "ping:declined", {
      conversationId: updated.id,
      requester: requesterPayload,
    });
  }

  async checkParticipant(conversationId: string, userId: string) {
    const result = await this.conversationRepo.checkParticipant(
      conversationId,
      userId,
    );

    return result;
  }

  async findAndUpdateParticipants(
    conversationId: string,
    userId: string,
    lastMessageId: string,
  ) {
    const isUpdated = await this.conversationRepo.findAndUpdateParticipants(
      conversationId,
      userId,
      lastMessageId,
    );
    return isUpdated;
  }
}

export default ConversationService;
