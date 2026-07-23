import { Server, Socket } from "socket.io";
import { catchSocketAsync } from "../../sockets/utils";
import AppError from "../../shared/utils/apiError";
import { conversationService } from "./conversations.modules";
import logger from "../../shared/utils/logger";

export function conversationEvent(io: Server, socket: Socket) {
  socket.on(
    "conversation:join",
    catchSocketAsync(async (data, callback) => {
      logger.debug({ data, type: typeof data }, "raw join payload");
      const { conversationId } = data;
      const userId = socket.data.user.sub;

      const isParticipant = await conversationService.checkParticipant(
        conversationId,
        userId,
      );

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
