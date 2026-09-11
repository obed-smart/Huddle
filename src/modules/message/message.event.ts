import { Server, Socket } from "socket.io";
import logger from "../../shared/utils/logger";
import { onlineUsers } from "../../shared/utils/utits";
import { conversationService } from "../conversations/conversations.modules";
import { messageService } from "./message.modules";
import { catchSocketAsync, validateSocketData } from "../../sockets/utils";
import AppError from "../../shared/utils/apiError";
import {
  sendMessageSchema,
  conversationIdSchema,
  messageReadSchema,
  reactionsAddSchema,
  reactionRemoveSchema,
} from "./message.validation";

const TYPING_TIMEOUT_MS = 4000;
const typingTimers = new Map<string, NodeJS.Timeout>();

export function messageEvent(io: Server, socket: Socket) {
  socket.on(
    "message:send",
    catchSocketAsync(async (data, callback) => {
      const { tempId, replyToMessageId, conversationId, content, mentions } =
        validateSocketData(sendMessageSchema, data);

      const userId = socket.data.user.id;

      const requestedMentionIds = [
        ...new Set(mentions?.map((m) => m.userId) ?? []),
      ];

      const { exists, isParticipant, type } =
        await conversationService.checkParticipant(conversationId, userId);

      if (!exists || !type) throw new AppError("Conversation not found", 404);

      if (!isParticipant) {
        throw new AppError(
          "This chat is private, you can not send message",
          403,
        );
      }

      const validMentionIds = await conversationService.filterValidMentions(
        conversationId,
        requestedMentionIds,
      );

      const message = await messageService.createMessage({
        conversationId,
        senderId: socket.data.user.id,
        body: content,
        type: "text",
        replyToMessageId: replyToMessageId ?? null,
      });

      const repliedTo = replyToMessageId
        ? await messageService.getMessageById(replyToMessageId)
        : null;

      if (replyToMessageId && !repliedTo) {
        throw new AppError("Message Not found", 404);
      }

      if (validMentionIds.length > 0) {
        await messageService.createMessageMention(
          conversationId,
          message.id,
          validMentionIds,
        );
      }

      logger.debug({ message }, "New message entry");

      const participantIds =
        await conversationService.findAcceptedParticipantIds(
          conversationId,
          type,
        );

      const payload = {
        ...message,
        senderUsername: socket.data.user.username,
        tempId,
        mentions:
          validMentionIds.length > 0
            ? validMentionIds.map((id) => `[${id.slice(0, 8)}...]`)
            : null,
        replyTo: repliedTo
          ? {
              id: repliedTo.id,
              senderId: repliedTo.senderId,
              content: repliedTo.body?.slice(0, 50),
            }
          : null,
      };

      logger.debug(repliedTo && "this is a reply message");
      for (const participantId of participantIds) {
        // io.to(`user:${participantId}`).emit("message:new", payload); // to be use in frontend
        socket.to(`user:${participantId}`).emit("message:new", payload);
      }

      for (const mentionedUserId of validMentionIds) {
        if (mentionedUserId === userId) continue;
        io.to(`user:${mentionedUserId}`).emit("mention:notify", {
          conversationId: message.conversationId,
          content: message.body,
          senderUsername: socket.data.user.username,
        });
      }
      callback?.({
        success: true,
        message: message.id,
      });

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
      const { conversationId } = validateSocketData(conversationIdSchema, data);

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
      const userId = socket.data.user.id;
      const { conversationId, lastMessageId } = validateSocketData(
        messageReadSchema,
        data,
      );

      logger.debug("message read event recieved");

      const message = await messageService.getMessageById(lastMessageId);

      if (!message) {
        throw new AppError("Message Not found", 404);
      }

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

      logger.debug("checks update");

      if (updated) {
        // mark any of this user's mentions in this conversation as read,
        // up to and including the message they just read

        logger.debug("yes it read updated");

        await messageService.updateMentionReadAt(
          conversationId,
          userId,
          message.createdAt,
        );

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

  /**
   * This for the message reaction
   */

  socket.on(
    "reactions:add",
    catchSocketAsync(async (data, callback) => {
      const userId = socket.data.user.id;
      const { conversationId, messageId, emoji } = validateSocketData(
        reactionsAddSchema,
        data,
      );

      const message = await messageService.getMessageById(messageId);

      if (!message) {
        throw new AppError("Message Not found", 404);
      }

      await messageService.addOrUpdateReactions(messageId, userId, emoji);

      const reactions = await messageService.getReactionsSummary(messageId);

      socket.to(`conversation:${conversationId}`).emit("reactions:update", {
        messageId,
        reactions,
        type: "add",
        senderUserName: socket.data.user.username,
      });

      callback?.({
        success: true,
        message: emoji,
      });
    }),
  );

  socket.on(
    "reactions:remove",
    catchSocketAsync(async (data, callback) => {
      const userId = socket.data.user.id;
      const { conversationId, messageId } = validateSocketData(
        reactionRemoveSchema,
        data,
      );

      const message = await messageService.getMessageById(messageId);

      if (!message) {
        throw new AppError("Message Not found", 404);
      }

      const deletedReaction = await messageService.deleteReaction(
        messageId,
        userId,
      );

      if (!deletedReaction) {
        throw new AppError("Reaction Not found", 404);
      }

      const reactions = await messageService.getReactionsSummary(messageId);

      socket.to(`conversation:${conversationId}`).emit("reactions:update", {
        messageId,
        emoji: deletedReaction.emoji,
        reactions,
        type: "remove",
        senderUserName: socket.data.user.username,
      });

      callback?.({
        success: true,
        emoji: deletedReaction.emoji,
      });
    }),
  );
}
