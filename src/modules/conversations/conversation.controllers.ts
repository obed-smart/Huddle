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
    const currentUserId = req.user.id;

    const conversation = await this.conversationService.createConversation(
      currentUserId,
      targetId,
    );

    res.status(201).json(ApiResponse.success(conversation));
  });

  acceptPing = catchAsync(async (req, res) => {
    const { id: conversationId } = req.params;
    const userId = req.user!.id;

    if (!conversationId) {
      throw new AppError("conversation ID parameter is required", 400);
    }

    await this.conversationService.acceptPing(String(conversationId), userId);

    res.status(200).json(ApiResponse.success({ message: "Ping accepted" }));
  });

  declinePing = catchAsync(async (req, res) => {
    const { id: conversationId } = req.params;
    const userId = req.user!.id;

    if (!conversationId) {
      throw new AppError("conversation ID parameter is required", 400);
    }

    await this.conversationService.declinePing(String(conversationId), userId);

    res.status(200).json(ApiResponse.success({ message: "Ping declined" }));
  });
}

export default ConversationController;
