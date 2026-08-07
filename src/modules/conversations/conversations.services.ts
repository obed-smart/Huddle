import AppError from "../../shared/utils/apiError";
import ConversationsRepository from "./conversations.repository";
import logger from "../../shared/utils/logger";
import { CallerDto, IcreateGroupConversation } from "./conversations.types";
import { RealtimeGateway } from "./conversations.types";
import { userService } from "../user/user.modules";
import {
  IjoinRequestResolveSchema,
  IjoinRequestRespondSchema,
  IupdateConversationSchema,
} from "./conversations.validation";
import { IGroupRequest } from "../../db/schema";
import { generateCode } from "../../shared/utils/utits";
import { messageService } from "../message/message.modules";

class ConversationService {
  constructor(
    private readonly conversationRepo: ConversationsRepository,
    private readonly Logger: typeof logger,
    private readonly realtime: RealtimeGateway,
  ) {}
  private async roomEvent(
    eventName: string,
    conversationId: string,
    requesterPayload: CallerDto,
  ) {
    try {
      const excludeIds = await this.realtime.getSocketIdsForUser(
        requesterPayload.memberId!,
      );

      this.realtime.emitToRoom(
        conversationId,
        eventName,
        { conversationId: conversationId, requester: requesterPayload },
        excludeIds,
      );
    } catch (error) {
      this.Logger.warn({ error }, `Failed to notify group ${conversationId}`);
    }
  }

  private async findRequestById(requestId: string) {
    const request = await this.conversationRepo.findRequestById(requestId);

    if (!request || !request.conversationId) {
      throw new AppError("Request not found", 404);
    }

    if (request.status !== "pending") {
      throw new AppError("This request has been resolved", 409);
    }

    return request;
  }

  async createDirectConversation(caller: CallerDto, targetId: string) {
    if (caller.memberId === targetId) {
      throw new AppError("Can't start a conversation with yourself", 400);
    }

    const directKey = [caller.memberId, targetId].sort().join(":");
    const requesterPayload = {
      id: caller.memberId!,
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
              requestedBy: caller.memberId!,
            });

          this.realtime.emitToUser(targetId, "ping:new", {
            conversationId: updatedConversation?.id,
            requester: requesterPayload,
          });

          return updatedConversation;
        }

        if (
          existing.pingStatus === "pending" &&
          existing.requestedBy !== caller.memberId!
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
          createdBy: caller.memberId!,
          pingStatus: "pending",
          requestedBy: caller.memberId!,
          participantIds: [caller.memberId!, targetId],
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
          existing.requestedBy !== caller.memberId!
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

  async createGroupConversation(
    caller: CallerDto,
    data: IcreateGroupConversation,
  ) {
    if (data.participantIds.includes(caller.memberId!)) {
      this.Logger.error("User invited themselves");
      throw new AppError("You cannot invite yourself.", 403);
    }

    const uniqueValidUser = await userService.filterValidInviteUser(
      data.participantIds,
    );

    if (uniqueValidUser.length < 2) {
      throw new AppError(
        "A group requires at least two valid participants on creation.",
        400,
      );
    }

    const requesterPayload = {
      id: caller.memberId!,
      username: caller.username,
      avatarUrl: caller.avatarUrl,
    };

    const conversation =
      await this.conversationRepo.createGroupWithParticipants({
        name: data.name,
        visibility: data.visibility,
        createdBy: caller.memberId!,
        description: data.description,
        participantIds: uniqueValidUser.map((user) => user.userId),
      });

    for (const targetId of data.participantIds) {
      try {
        this.realtime.emitToUser(targetId, "invite:new", {
          conversationId: conversation.id,
          requester: requesterPayload,
        });
      } catch (error) {
        this.Logger.warn({ error }, `Failed to notify participant ${targetId}`);
      }
    }

    logger.info("[Groud Event] Group creation successfull");

    return conversation;
  }

  // async acceptOrDeclineInvites(caller: CallerDto, action: string) {}

  async findConversationById(conversationId: string) {
    const conversation =
      await this.conversationRepo.findConversationById(conversationId);

    if (!conversation) throw new AppError("Conversation Not found", 404);

    return conversation;
  }

  async findAcceptedParticipantIds(
    conversationId: string,
    type: "direct" | "group",
  ) {
    const partucipant = await this.conversationRepo.findAcceptedParticipantIds(
      conversationId,
      type,
    );

    return partucipant;
  }

  async acceptPing(conversationId: string, caller: CallerDto) {
    const conversation = await this.findConversationById(conversationId);

    const requesterPayload = {
      id: caller.memberId!,
      username: caller.username,
      avatarUrl: caller.avatarUrl,
      joinedBy: "member",
    };

    if (conversation.pingStatus !== "pending")
      throw new AppError("No pending request", 400);

    if (conversation.requestedBy === caller.memberId!) {
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

    const requesterPayload: CallerDto = {
      memberId: caller.memberId!,
      username: caller.username,
      avatarUrl: caller.avatarUrl!,
      joinedBy: "member",
    };

    if (conversation.pingStatus !== "pending")
      throw new AppError("No pending request", 400);

    if (conversation.requestedBy === caller.memberId!) {
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
  async filterValidMentions(
    conversationId: string,
    mentionedUserIds: string[],
  ): Promise<string[]> {
    try {
      return await this.conversationRepo.filterValidMentions(
        conversationId,
        mentionedUserIds,
      );
    } catch (error) {
      logger.error(error);
      throw new AppError("failed while filtering mentioned suer", 500);
    }
  }

  /**
   * Accept or decline invite by the invetee only
   * @param requestId - GroupRequestTable Id
   * @param userId - Current user calling the function
   * @param decision Type of action perform my the user enum[accept, decline]
   */

  async groupRequestRespond(
    requestId: string,
    caller: CallerDto,
    data: IjoinRequestRespondSchema,
  ) {
    const request = await this.findRequestById(requestId);

    if (request.userId !== caller.memberId) {
      throw new AppError("Not your invite", 403);
    }

    const requesterPayload: CallerDto = {
      memberId: caller.memberId,
      username: caller.username,
      joinedBy: "member",
    };

    if (data.decision === "decline") {
      await this.conversationRepo.declineGroupJoinRequest(requestId);
      return "declined";
    }

    const result =
      await this.conversationRepo.approveGroupJoinRequest(requestId);

    await messageService.createSystemEvent({
      conversationId: request.conversationId,
      actorId: caller?.memberId!,
      type: "user_join",
      metadata: {
        joinedUserId: caller.memberId,
        invitedBy: request.invitedBy ?? null,
      },
    });

    this.roomEvent("group:join", result.conversationId, requesterPayload);

    return { status: "accepted", conversationId: result.conversationId };
  }

  /**
   * Accept or decline join request by the admin only
   * @param requestId - GroupRequestTable I
   * @param userId - Current user id (must be a group admin)
   * @param decision Type of action performed by the admin enum[approve, decline]
   */
  async groupRequestResolve(
    requestId: string,
    caller: CallerDto,
    data: IjoinRequestResolveSchema,
  ) {
    const request = await this.findRequestById(requestId);

    const requesterPayload: CallerDto = {
      adminId: caller.adminId!,
      username: caller.username,
      memberId: request.userId,
      joinedBy: "admin",
    };

    const admin = await this.checkAdmin(
      request.conversationId,
      caller.adminId!,
    );

    if (!admin) {
      throw new AppError("You are not authorized to manage this group", 403);
    }

    if (data.decision === "decline") {
      await this.conversationRepo.declineGroupJoinRequest(requestId);
      return "declined";
    }

    const result =
      await this.conversationRepo.approveGroupJoinRequest(requestId);

    await messageService.createSystemEvent({
      conversationId: request.conversationId,
      actorId: caller?.adminId!,
      type: "user_added",
      metadata: {
        joinedUserId: request.userId,
        invitedBy: request.invitedBy ?? null,
      },
    });

    this.roomEvent("group:join", result.conversationId, requesterPayload);

    return { status: "accepted", conversationId: result.conversationId };
  }

  async pendingGroupInvites(userId: string) {
    const invites = await this.conversationRepo.pendingGroupInvites(userId);

    return invites;
  }

  async pendingJoinRequests(conversationId: string) {
    await this.findConversationById(conversationId);

    const requests =
      await this.conversationRepo.pendingJoinRequests(conversationId);
    return requests;
  }

  async checkAdmin(conversationId: string, userId: string) {
    const admin = await this.conversationRepo.checkAdmin(
      conversationId,
      userId,
    );
    return admin;
  }

  async addInviteCode(conversationId: string) {
    try {
      const code = await generateCode();

      logger.debug({ code }, "invite code");

      return await this.conversationRepo.addInviteCode(conversationId, code);
    } catch (error) {
      logger.error({ err: error }, "Failed adding inviteCode");
      throw new AppError("Failed adding inviteCode", 500);
    }
  }

  async checkInviteCode(inviteCode: string) {
    try {
      return await this.conversationRepo.checkInviteCode(inviteCode);
    } catch (error) {
      logger.error({ err: error }, "failed checking invite code");
      throw new AppError("failed checking invite code", 500);
    }
  }

  async findConversationByInviteCode(inviteCode: string) {
    const conversation =
      await this.conversationRepo.findConversationByInviteCode(inviteCode);

    if (!conversation) throw new AppError("Conversation not found", 404);

    return conversation;
  }

  /**
   * Join group with the group link
   * @param inviteCode - The group invite link/code
   * @param userId - The requester userId
   * @returns The user details if public or the request detail on private
   */

  async joinGroup(inviteCode: string, caller: CallerDto) {
    const conversation = await this.findConversationByInviteCode(inviteCode);

    const requestPending = await this.conversationRepo.assertGroupRequest(
      conversation.id,
      caller.memberId!,
    );

    if (requestPending && !requestPending.invitedBy) {
      throw new AppError("Your request is still pending", 400);
    }

    const { isParticipant } = await this.checkParticipant(
      String(conversation?.id),
      caller.memberId!,
    );

    if (isParticipant) {
      throw new AppError("Your are a member", 400);
    }

    if (conversation.visibility === "private" && !requestPending?.invitedBy) {
      await this.conversationRepo.createRequest({
        conversationId: String(conversation?.id),
        userId: caller.memberId!,
      });

      return "Request sent successfully and waiting for admin approval";
    }

    const participant = await this.conversationRepo.addNewParticipant({
      conversationId: String(conversation?.id),
      userId: caller.memberId!,
    });

    if (!participant) {
      throw new AppError("Failed to join group", 500);
    }

    const requesterPayload: CallerDto = {
      username: caller.username,
      memberId: caller.memberId!,
      joinedBy: requestPending?.invitedBy ? "admin" : "member",
    };

    await messageService.createSystemEvent({
      conversationId: conversation.id,
      actorId: caller?.memberId!,
      type: "user_join",
      metadata: {
        joinedUserId: caller?.memberId!,
        username: caller.username,
        invitedBy: requestPending?.invitedBy ?? null,
      },
    });

    await this.roomEvent(
      "group:join",
      String(conversation?.id),
      requesterPayload,
    );

    return participant;
  }

  /**
   *  Invite user to group by admin only
   * @param conversationId  - The group conversation Id
   * @param userId  - The userId of the user to be invited
   * @param invitedBy - the userId of the admin invinting the user
   * @param caller - The data of the function caller (admin)
   * @returns The user request data
   */
  async inviteUserToGroup(
    conversationId: string,
    userId: string,
    caller: CallerDto,
  ) {
    const conversation = await this.findConversationById(conversationId);

    const admin = await this.checkAdmin(conversationId, caller.adminId!);

    if (!admin) {
      throw new AppError("You are not authorized to manage this group", 403);
    }

    const { isParticipant } = await this.checkParticipant(
      String(conversationId),
      userId,
    );

    if (isParticipant) {
      throw new AppError("User is already a member", 400);
    }

    const requestPending = await this.conversationRepo.assertGroupRequest(
      conversationId,
      userId,
    );

    if (requestPending) {
      const requesterPayload: CallerDto = {
        adminId: caller.adminId!,
        username: caller.username,
        memberId: requestPending.userId,
        joinedBy: requestPending?.invitedBy ? "admin" : "member",
      };

      const result = await this.conversationRepo.approveGroupJoinRequest(
        requestPending.id,
      );

      await messageService.createSystemEvent({
        conversationId: conversationId,
        actorId: caller?.adminId!,
        type: "user_join",
        metadata: {
          joinedUserId: userId,
        },
      });

      this.roomEvent("group:join", result.conversationId, requesterPayload);

      return "User request is approved successfully";
    }

    await this.conversationRepo.createRequest({
      conversationId: String(conversation?.id),
      userId,
      invitedBy: caller.adminId!,
    });

    const requesterPayload = {
      id: caller.memberId!,
      username: caller.username,
      avatarUrl: caller.avatarUrl,
    };

    await messageService.createSystemEvent({
      conversationId: conversationId,
      actorId: caller?.adminId!,
      type: "group_invite",
      metadata: {
        invitedUserId: userId,
        invitedBy: caller.adminId,
      },
    });

    try {
      this.realtime.emitToUser(userId, "invite:new", {
        conversationId: conversationId,
        requester: requesterPayload,
      });
    } catch (error) {
      this.Logger.warn({ error }, `Failed to notify participant ${userId}`);
    }

    return "User request is pending approval";
  }

  /**
   *  Remove a member from the group by admin
   * @param conversationId  - Group Id
   * @param userId User id of the removee
   * @param caller  Admin detail
   */
  async removeUserFromConversation(
    conversationId: string,
    userId: string,
    caller: CallerDto,
  ) {
    await this.findConversationById(conversationId);

    const { isParticipant } = await this.checkParticipant(
      conversationId,
      userId,
    );

    if (!isParticipant) {
      throw new AppError("User is not a member of this group", 400);
    }

    const superAdmin = await this.conversationRepo.assertSuperAdmin(
      conversationId,
      userId,
    );

    if (superAdmin) {
      throw new AppError("You can not remove a this admin", 403);
    }

    await this.conversationRepo.removeUserFromConversation(
      conversationId,
      userId,
    );

    const requesterPayload: CallerDto = {
      adminId: caller.adminId!,
      username: caller.username,
      memberId: userId,
      joinedBy: "admin",
    };

    await messageService.createSystemEvent({
      conversationId: conversationId,
      actorId: caller?.adminId!,
      type: "user_remove",
      metadata: {
        removedUserId: userId,
      },
    });

    this.roomEvent("group:leave", conversationId, requesterPayload);
  }

  async updateAdminRole(
    conversationId: string,
    userId: string,
    callerId: string,
    role: "admin" | "member",
  ) {
    if (callerId === userId) {
      throw new AppError("You can not change your own role", 400);
    }

    await this.findConversationById(conversationId);

    const { isParticipant } = await this.checkParticipant(
      conversationId,
      userId,
    );
    if (!isParticipant) {
      throw new AppError("User is not a member of this group", 400);
    }

    if (role === "admin") {
      const isAdmin = await this.checkAdmin(conversationId, userId);
      if (isAdmin) {
        throw new AppError("This user is already an admin", 409);
      }
    } else {
      const superAdmin = await this.conversationRepo.assertSuperAdmin(
        conversationId,
        userId,
      );
      if (superAdmin) {
        throw new AppError("You can not unassign a this admin", 403);
      }
    }

    await this.conversationRepo.updateAdminRole(conversationId, userId, role);
  }

  async userLeaveConversation(conversationId: string, caller: CallerDto) {
    await this.findConversationById(conversationId);

    const { isParticipant } = await this.checkParticipant(
      conversationId,
      caller.memberId!,
    );

    if (!isParticipant) {
      throw new AppError("You are not a member of this group", 400);
    }

    const superAdmin = await this.conversationRepo.assertSuperAdmin(
      conversationId,
      caller.memberId!,
    );

    if (superAdmin) {
      throw new AppError("You can not leave as a super admin", 403);
    }

    await this.conversationRepo.userLeaveConversation(
      conversationId,
      caller.memberId!,
    );

    const requesterPayload: CallerDto = {
      memberId: caller.memberId!,
      username: caller.username,
      joinedBy: "member",
    };

    await messageService.createSystemEvent({
      conversationId: conversationId,
      actorId: caller?.memberId!,
      type: "user_leave",
      metadata: {
        username: caller.username,
      },
    });

    this.roomEvent("group:leave", conversationId, requesterPayload);
  }

  async updateConversation(
    conversationId: string,
    data: Partial<IupdateConversationSchema>,
    requesterId: string,
    username: string,
  ) {
    const conversation = await this.findConversationById(conversationId);

    const changes: Partial<IupdateConversationSchema> = {};
    for (const key of Object.keys(
      data,
    ) as (keyof IupdateConversationSchema)[]) {
      if (data[key] !== undefined && data[key] !== conversation[key]) {
        (changes as any)[key] = data[key];
      }
    }

    if (Object.keys(changes).length === 0) {
      return conversation;
    }

    const updatedConversation = await this.conversationRepo.updateConversation(
      conversationId,
      changes,
    );

    await messageService.createSystemEvent({
      conversationId: conversation.id,
      actorId: requesterId,
      type: "conversation_updated",
      metadata: changes,
    });

    this.realtime.emitToRoom(conversationId, "group-settings:updated", {
      conversationId,
      updates: data,
      updatedBy: { id: requesterId, username },
    });

    return updatedConversation;
  }

  async deleteConversation(
    conversationId: string,
    requesterId: string,
    username: string,
  ) {
    const conversation = await this.findConversationById(conversationId);

    if (conversation.createdBy !== requesterId) {
      throw new AppError(
        "You are not authorized to delete this conversation",
        403,
      );
    }

    await this.conversationRepo.deleteConversation(conversationId);

    await messageService.createSystemEvent({
      conversationId: conversation.id,
      actorId: requesterId,
      type: "conversation_deleted",
      metadata: {
        username,
      },
    });

    this.realtime.emitToRoom(conversationId, "group:deleted", {
      conversationId,
      deletedBy: { id: requesterId, username },
    });

    this.realtime.evacuateRoom(conversationId);

    /// this  is for testing if the socket successfully evacuated the room, if not the message will be received by the user

    setTimeout(() => {
      this.realtime.emitToRoom(conversationId, "test:should-not-arrive", {
        message: "if you see this, evacuateRoom failed",
      });
    }, 1000);
  }

  async getMessages(conversationId: string, before?: Date, limit = 50) {
    await this.findConversationById(conversationId);

    return await this.conversationRepo.getTimeline(
      conversationId,
      before,
      limit,
    );
  }
}

export default ConversationService;
