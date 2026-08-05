import AppError from "../../shared/utils/apiError";
import catchAsync from "../../shared/utils/catchAsyncHandler";
import logger from "../../shared/utils/logger";
import { conversationService } from "./conversations.modules";

type Params = {
  conversationId: string;
};

export const requireGroupAdmin = catchAsync(async (req, res, next) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const { conversationId } = req.params as Params;

  logger.debug(
    req.params,
    `Checking if user ${req.user.id} is admin of conversation ${conversationId}`,
  );

  const requesterId = req.user?.id;

  const isAdmin = await conversationService.checkAdmin(
    conversationId,
    requesterId,
  );
  if (!isAdmin) {
    throw new AppError("You are not authorized to manage this group", 403);
  }

  next();
});
