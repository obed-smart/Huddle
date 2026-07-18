import { Server, Socket } from "socket.io";
import { catchSocketAsync } from "../../sockets/socket-error-handler";
import AppError from "../../shared/utils/apiError";
import { conversationService } from "./conversations.modules";

export function conversationEvent(io: Server, socket: Socket) {
  socket.on(
    "conversation:join",
    catchSocketAsync(async (conversationId, callback) => {
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
