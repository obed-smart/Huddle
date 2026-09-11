import { Server, Socket } from "socket.io";
import { catchSocketAsync, validateSocketData } from "../../sockets/utils";
import AppError from "../../shared/utils/apiError";
import { conversationService } from "./conversations.modules";
import logger from "../../shared/utils/logger";
import { conversationIdEventSchema } from "./conversations.validation";

export function conversationEvent(io: Server, socket: Socket) {
  socket.on(
    "conversation:join",
    catchSocketAsync(async (data, callback) => {
      logger.debug({ data, type: typeof data }, "raw join payload");
      const { conversationId } = validateSocketData(
        conversationIdEventSchema,
        data,
      );
      
      const userId = socket.data.user.id;

      const { exists, isParticipant, type } =
        await conversationService.checkParticipant(conversationId, userId);


      if (!exists || !type) throw new AppError("Conversation not found", 404);

      if (!isParticipant) {
        throw new AppError(
          "This chat is private, you can not send message",
          403,
        );
      }

      socket.join(`conversation:${conversationId}`);

      callback?.({
        success: true,
        conversationId,
        message: "conversation join successfully",
      });
    }),
  );

  socket.on("conversation:leave", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });
}
