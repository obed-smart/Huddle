import AppError from "../../shared/utils/apiError";
import { ApiResponse } from "../../shared/utils/apiResponse";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import ConversationService from "./conversations.services";

class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  pingUser = catchAsync(async (req, res) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { id: targetId } = req.body;
    const requesterPayload = {
      id: req.user.id,
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

    const creatorPayload = {
      id: req.user.id,
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
    const requesterPayload = {
      id: req.user.id,
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
    const requesterPayload = {
      id: req.user.id,
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

  inviteUser = catchAsync(async (req, res) => {});
  joinGroup = catchAsync(async (req, res) => {});
}

export default ConversationController;
