import AppError from "../../shared/utils/apiError";
import { ApiResponse } from "../../shared/utils/apiResponse";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import logger from "../../shared/utils/logger";
import ConversationService from "./conversations.services";
import env from "../../config/env";
import { CallerDto } from "./conversations.types";

class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  pingUser = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { id: targetId } = req.body;
    const requesterPayload: CallerDto = {
      memberId: req.user.id,
      username: req.user.username,
      avatarUrl: req.user?.avatarUrl,
    };

    const conversation =
      await this.conversationService.createDirectConversation(
        requesterPayload,
        targetId,
      );

    res.status(201).json(ApiResponse.success(conversation));
  });

  createGroup = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const creatorPayload: CallerDto = {
      memberId: req.user.id,
      username: req.user.username,
      avatarUrl: req.user?.avatarUrl,
    };
    const conversation = await this.conversationService.createGroupConversation(
      creatorPayload,
      req.body,
    );

    res.status(201).json(ApiResponse.success(conversation));
  });

  acceptPing = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }
    const { id: conversationId } = req.params;
    const requesterPayload: CallerDto = {
      memberId: req.user.id,
      username: req.user.username,
      avatarUrl: req.user?.avatarUrl,
    };

    if (!conversationId) {
      throw new AppError("conversation ID parameter is required", 400);
    }

    await this.conversationService.acceptPing(
      String(conversationId),
      requesterPayload,
    );

    res.status(200).json(ApiResponse.success({ message: "Ping accepted" }));
  });

  declinePing = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { id: conversationId } = req.params;
    const requesterPayload: CallerDto = {
      memberId: req.user.id,
      username: req.user.username,
      avatarUrl: req.user?.avatarUrl,
    };

    if (!conversationId) {
      throw new AppError("conversation ID parameter is required", 400);
    }

    await this.conversationService.declinePing(
      String(conversationId),
      requesterPayload,
    );

    res.status(200).json(ApiResponse.success({ message: "Ping declined" }));
  });

  // for user being invited by the admin
  groupRequestRespond = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { requestId } = req.params;

    const callerPayload: CallerDto = {
      memberId: req.user.id,
      username: req.user.username,
      avatarUrl: req.user?.avatarUrl,
    };

    const result = await this.conversationService.groupRequestRespond(
      requestId as string,
      callerPayload,
      req.body,
    );

    res.status(200).json(ApiResponse.success(result));
  });

  groupRequestResolve = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { requestId } = req.params;

    const callerPayload: CallerDto = {
      adminId: req.user.id,
      username: req.user.username,
    };

    const result = await this.conversationService.groupRequestResolve(
      requestId as string,
      callerPayload,
      req.body,
    );

    res.status(200).json(ApiResponse.success(result));
  });

  // add or regenerate and invite link
  addInviteCode = catchAsync(async (req, res) => {
    const { conversationId } = req.params;

    logger.debug({ conversationId }, "this is conversation Id");
    console.log({
      conversationId,
    });

    const result = await this.conversationService.addInviteCode(
      conversationId as string,
    );

    res.status(200).json(
      ApiResponse.success({
        inviteCode: result?.inviteCode,
        invitelink: `${env.FRONTEND_URL}/invite/${result?.inviteCode}`,
      }),
    );
  });

  getConversationByInviteCode = catchAsync(async (req, res) => {
    const { inviteCode } = req.params;

    const conversation =
      await this.conversationService.findConversationByInviteCode(
        inviteCode as string,
      );

    res.status(200).json(ApiResponse.success(conversation));
  });

  joinGroup = catchAsync(async (req, res) => {
    const { inviteCode } = req.params;

    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const callerPayload: CallerDto = {
      memberId: req.user.id,
      username: req.user.username,
    };

    const userId = req.user.id;
    const result = await this.conversationService.joinGroup(
      inviteCode as string,
      callerPayload,
    );

    res.status(200).json(ApiResponse.success(result));
  });

  pendingGroupInvites = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const invites = await this.conversationService.pendingGroupInvites(
      req.user?.id,
    );

    res.status(200).json(
      ApiResponse.success({
        result: invites.length,
        invites,
      }),
    );
  });

  pendingJoinRequests = catchAsync(async (req, res) => {
    const { conversationId } = req.params;

    const requests = await this.conversationService.pendingJoinRequests(
      conversationId as string,
    );

    res.status(200).json(
      ApiResponse.success({
        result: requests.length,
        requests,
      }),
    );
  });

  inviteUserToGroup = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { conversationId, userId } = req.body;

    const callerPayload: CallerDto = {
      adminId: req.user.id,
      username: req.user.username,
      avatarUrl: req.user?.avatarUrl,
    };

    await this.conversationService.inviteUserToGroup(
      conversationId,
      userId,
      callerPayload,
    );

    res.status(200).json(
      ApiResponse.success({
        message: "User invited successfully",
      }),
    );
  });

  removeMember = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { conversationId, userId } = req.params;

    const callerPayload: CallerDto = {
      adminId: req.user.id,
      username: req.user.username,
    };

    await this.conversationService.removeUserFromConversation(
      conversationId as string,
      userId as string,
      callerPayload,
    );

    res.status(200).json(
      ApiResponse.success({
        message: "Member removed successfully",
      }),
    );
  });

  updateAdminRole = catchAsync(async (req, res) => {
    const { conversationId, userId } = req.params;
    const { role } = req.body;

    await this.conversationService.updateAdminRole(
      String(conversationId),
      String(userId),
      req.user?.id as string,
      role,
    );

    res
      .status(200)
      .json(
        ApiResponse.success(
          role === "admin"
            ? "New Admin added successfully"
            : "Admin removed successfully",
        ),
      );
  });

  leaveConversation = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { conversationId } = req.params;

    const callerPayload: CallerDto = {
      memberId: req.user.id,
      username: req.user.username,
      avatarUrl: req.user?.avatarUrl,
    };

    await this.conversationService.userLeaveConversation(
      String(conversationId),
      callerPayload,
    );

    res
      .status(200)
      .json(ApiResponse.success("User left the group successfully"));
  });

  updateConversation = catchAsync(async (req, res) => {
    const { conversationId } = req.params;
    const updateData = req.body;

    const updatedConversation =
      await this.conversationService.updateConversation(
        String(conversationId),
        updateData,
        req.user?.id as string,
        req.user?.username as string,
      );

    res.status(200).json(
      ApiResponse.success({
        message: "Conversation updated successfully",
        updatedConversation,
      }),
    );
  });

  deteleConversation = catchAsync(async (req, res) => {
    const { conversationId } = req.params;

    await this.conversationService.deleteConversation(
      String(conversationId),
      req.user?.id as string,
      req.user?.username as string,
    );

    res.status(200).json(
      ApiResponse.success({
        message: "Conversation deleted successfully",
      }),
    );
  });

  getMessages = catchAsync(async (req, res) => {
    const { conversationId } = req.params;

    const { limit, before } = req.query;

    const beforeDate = before ? new Date(before as string) : undefined;
    const numericLimit = limit ? parseInt(limit as string, 10) : 50;

    const history = await this.conversationService.getMessages(
      conversationId as string,
      beforeDate,
      numericLimit,
    );

    res.status(200).json(ApiResponse.success(history));
  });

  getConversation = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const conversations = await this.conversationService.findConversation(
      req.user?.id,
    );

    res.status(201).json(ApiResponse.success(conversations));
  });
}

export default ConversationController;
