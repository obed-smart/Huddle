import { Server, Socket } from "socket.io";
import { catchSocketAsync, validateSocketData } from "../../sockets/utils";
import { conversationService } from "../conversations/conversations.modules";
import { initiateCallEventSchema } from "./call.validation";
import AppError from "../../shared/utils/apiError";

export function callEvent(io: Server, socket: Socket) {
  socket.on(
    "call:initiate",
    catchSocketAsync(async (data, callback) => {
      const { conversationId, callMediaType } = validateSocketData(
        initiateCallEventSchema,
        data,
      );

      console.log("initiate call ", data);

      const userId = socket.data.user.sub;

      const { exists, isParticipant, type } =
        await conversationService.checkParticipant(conversationId, userId);

      if (!exists || !type) throw new AppError("Conversation not found", 404);

      if (!isParticipant) {
        throw new AppError(
          "You are not a participant in this conversation",
          403,
        );
      }

      const participantIds =
        await conversationService.findAcceptedParticipantIds(
          conversationId,
          type,
        );

      const payload = {
        conversationId,
        callMediaType,
      };
      for (const participantId of participantIds) {
        socket.to(`user:${participantId}`).emit("call:incoming", payload);
      }

      callback?.({
        success: true,
        reachableParticipantCount: participantIds.length,
      });
    }),
  );

  socket.on(
    "call:send",
    catchSocketAsync(async (data, callback) => {}),
  );

  socket.on(
    "call:send",
    catchSocketAsync(async (data, callback) => {}),
  );
}
