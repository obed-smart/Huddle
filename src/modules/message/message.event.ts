import { Server, Socket } from "socket.io";
import logger from "../../shared/utils/logger";
import { onlineUsers } from "../../shared/utils/utits";
import { conversationService } from "../conversations/conversations.modules";
import { messageService } from "./message.modules";
import { catchSocketAsync } from "../../sockets/socket-error-handler";
import AppError from "../../shared/utils/apiError";

const TYPING_TIMEOUT_MS = 4000;
const typingTimers = new Map<string, NodeJS.Timeout>();

export function messageEvent(io: Server, socket: Socket) {
  socket.on(
    "message:send",
    catchSocketAsync(async (data, callback) => {
      const { tempId, conversationId, content } = data;
      const userId = socket.data.user.sub;

      logger.debug({ conversationId }, "conversation ID");

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

      const message = await messageService.createMessage({
        conversationId,
        senderId: socket.data.user.sub,
        body: content,
        type: "text",
      });

      callback?.({
        success: true,
        message,
      });

      const participantIds =
        await conversationService.findAcceptedDmParticipantIds(conversationId);

      const payload = {
        ...message,
        senderUsername: socket.data.user.username,
        tempId,
      };

      for (const participantId of participantIds) {
        // io.to(`user:${participantId}`).emit("message:new", payload); // to be use in frontend
        socket.to(`user:${participantId}`).emit("message:new", payload);
      }

      // for (const participantId of participantIds) {

      // add a check to make sure you are sending to online user
      // if (onlineUsers.has(userId))
      // io.to(user:${participantId})
      // .emit("conversation:update", {
      // conversationId, // lastMessage: message, // unreadCount: ... // }); // }
    }),
  );

  socket.on(
    "typing:start",
    catchSocketAsync(async (data) => {
      const { username, sub: userId } = socket.data.user;
      const { conversationId } = data;
      logger.debug("typing start");

      const roomId = `conversation:${conversationId}`;
      const timerKey = `${conversationId}:${userId}`;

      logger.debug({ roomId }, "conversation Id test");

      if (!typingTimers.has(timerKey)) {
        logger.debug("no timer sending update");
        socket.to(roomId).emit("typing:update", {
          conversationId,
          isTyping: true,
          userId,
          username,
        });
      }
      clearTimeout(typingTimers.get(timerKey));

      typingTimers.set(
        timerKey,
        setTimeout(() => {
          typingTimers.delete(timerKey);
          logger.debug("timer found restarting timer");
          socket.to(roomId).emit("typing:update", {
            conversationId,
            isTyping: false,
            userId,
            username,
          });
        }, TYPING_TIMEOUT_MS),
      );
    }),
  );

  socket.on("disconnect", () => {
    const { username, sub: userId } = socket.data.user;
    for (const [timerKey, timer] of typingTimers.entries()) {
      const [conversationId, typingUserId] = timerKey.split(":");

      if (typingUserId === userId) {
        clearTimeout(timer);
        typingTimers.delete(timerKey);

        socket.to(`$conversation:${conversationId}`).emit("typing:update", {
          conversationId,
          isTyping: false,
          userId,
          username,
        });
      }
    }
  });

  socket.on(
    "message:read",
    catchSocketAsync(async (data) => {
      const userId = socket.data.user.sub;
      const { conversationId, lastMessageId } = data;
      const message = await messageService.getMessageById(lastMessageId);

      if (message.conversationId !== conversationId) {
        throw new AppError("This message do not belong here", 403);
      }

      if (message.senderId === userId) {
        return;
      }

      const updated = await conversationService.findAndUpdateParticipants(
        conversationId,
        userId,
        lastMessageId,
      );

      if (updated) {
        io.to(`conversation:${conversationId}`).emit("read:update", {
          conversationId,
          userId,
          lastMessageId,
          lastReadAt: new Date(),
          username: socket.data.user.username,
        });
      }
    }),
  );
}
