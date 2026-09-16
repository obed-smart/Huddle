import { Server, Socket } from "socket.io";
import { catchSocketAsync, validateSocketData } from "../../sockets/utils";
import { conversationService } from "../conversations/conversations.modules";
import {
  acceptCallEventSchema,
  callIceSchema,
  callSdpSchema,
  initiateCallEventSchema,
  rejectCallEventSchema,
} from "./call.validation";
import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import { callService } from "./call.modules";

async function validateCallParticipant(conversationId: string, userId: string) {
  const { exists, isParticipant, type, name } =
    await conversationService.checkParticipant(conversationId, userId);

  if (!exists || !type) throw new AppError("Conversation not found", 404);

  if (!isParticipant) {
    throw new AppError("You are not a participant in this conversation", 403);
  }

  const participantIds = await conversationService.findAcceptedParticipantIds(
    conversationId,
    type,
  );

  return { type, name, participantIds };
}

function handleLeave(
  io: Server,
  socket: Socket,
  callId: string,
  conversationId: string,
  callback: Function,
) {
  const userId = socket.data.user.id;
  const call = callService.getCall(callId);
  if (!call) return callback?.({ success: true });

  if (call.conversationId !== conversationId) {
    throw new AppError(
      "The call does not belong to the specified conversation",
      400,
    );
  }
  if (
    !callService.isAuthorized(callId, userId) ||
    !callService.isParticipant(callId, userId)
  ) {
    throw new AppError("You are not authorized to leave this call", 403);
  }

  callService.removeParticipant(callId, userId);
  socket.leave(`call:${callId}`);

  const remaining = callService.getParticipants(callId);

  // this is for initial hangup when no one have accepted the call yet
  if (remaining.length === 0) {
    const authorizedUserIds = [...call.authorizedUsers].filter(
      (id) => id !== userId,
    );

    callService.endCall(callId);
    for (const userId of authorizedUserIds) {
      socket
        .to(`user:${userId}`)
        .emit("call:new:ended", { callId, reason: "ended" });
    }

    // this is when at least one last person is remaining so no need of keeping the call just hange up
  } else if (remaining.length < 2) {
    callService.endCall(callId);

    logger.debug(`Remaining Participant is up to tow`);

    io.to(`call:${callId}`).emit("call:new:ended", { callId, reason: "ended" });
  } else {
    io.to(`call:${callId}`).emit("call:new:participant-left", {
      callId,
      from: userId,
      participants: remaining,
    });
  }
}

export function callEvent(io: Server, socket: Socket) {
  logger.debug("New recovery");
  logger.debug(socket.recovered);

  /**
   * this is for a disconnect and reconnect even though that the connectionStateRecovery
   * is implemented but it can not be fully trusted
   *
   **/
  for (const callId of callService.callIdsForUser(socket.data.user.id)) {
    const call = callService.getCall(callId);

    if (!call) continue;

    socket.join(`call:${callId}`);

    socket.to(`call:${callId}`).emit("call:new:roster", {
      callId: call.callId,
      conversationId: call.conversationId,
      startedAt: call.startedAt,
      serverTime: Date.now(),
      participants: callService.getParticipants(callId),
    });
  }

  socket.on(
    "call:initiate",
    catchSocketAsync(async (data, callback) => {
      const { conversationId, callMediaType } = validateSocketData(
        initiateCallEventSchema,
        data,
      );
      console.log("initiate call ", data);

      const userId = socket.data.user.id;
      const initiator = socket.data.user;

      const { type, name, participantIds } = await validateCallParticipant(
        conversationId,
        userId,
      );

      logger.debug({ participantIds }, "authorizedUserIds");

      const call = callService.createCall({
        conversationId,
        type,
        authorizedUserIds: [...participantIds],
        initiator,
      });

      logger.debug(
        {
          authorizedUsers: [...call.authorizedUsers],
          participants: [...call.participants.entries()],
        },
        "Call collections",
      );

      socket.join(`call:${call.callId}`);

      const recipientIds = participantIds.filter(
        (participantId) => participantId !== userId,
      );

      const payload = {
        callId: call.callId,
        conversationId,
        callMediaType,
        fromName: type === "direct" ? socket.data.user.displayName : name,
        avatarUrl: socket.data.user.avatarUrl,
        fromId: userId,
      };

      for (const recipientId of recipientIds) {
        socket.to(`user:${recipientId}`).emit("call:incoming", payload);
        logger.debug(
          `Emitted call:incoming to user:${recipientId} for conversation ${conversationId}`,
        );
      }

      callback?.({
        success: true,
        callId: call.callId,
        startedAt: call.startedAt,
        serverTime: Date.now(),
      });
    }),
  );

  socket.on(
    "call:accept",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId, callMediaType } = validateSocketData(
        acceptCallEventSchema,
        data,
      );

      console.time(`CALL START ${callId}`);

      const userId = socket.data.user.id;

      if (callService.isParticipant(callId, userId)) {
        throw new AppError("You have already accepted this call", 400);
      }

      const call = callService.getCall(callId);

      logger.debug(`Call retrieved: ${JSON.stringify(call)}`);

      if (!call) {
        throw new AppError("Call not found", 404);
      }

      if (call.conversationId !== conversationId) {
        throw new AppError(
          "The call does not belong to the specified conversation",
          400,
        );
      }

      if (call.initiatorId === userId) {
        throw new AppError("You cannot accept your own call", 400);
      }

      if (!callService.isAuthorized(callId, userId)) {
        throw new AppError("You are not authorized to accept this call", 403);
      }

      callService.addParticipant(callId, socket.data.user);

      socket.join(`call:${callId}`);

      const rosterPayload = {
        callId: call.callId,
        conversationId: call.conversationId,
        startedAt: call.startedAt,
        serverTime: Date.now(),
        participants: callService.getParticipants(callId),
      };

      /// this is now legacy now, the rosteris sent to both the initiator and the participant but i want to leave i for now.
      const payload = {
        callId,
        conversationId,
        fromName: socket.data.user.displayName,
        from: socket.data.user.id,
        startedAt: call.startedAt,
        serverTime: Date.now(),
      };

      // socket.to(`user:${call.initiatorId}`).emit("call:new:accepted", payload);
      // logger.debug(
      //   `Emitted call:accepted to user:${call.initiatorId} for conversation ${conversationId}`,
      // );

      callback?.({
        success: true,
        data: rosterPayload,
      });

      socket.to(`call:${callId}`).emit("call:new:roster", rosterPayload);
    }),
  );

  socket.on(
    "call:offer",
    catchSocketAsync(async (data, callback) => {
      logger.debug(`Received call:offer with data: ${JSON.stringify(data)}`);

      const { callId, conversationId, to, description } = validateSocketData(
        callSdpSchema,
        data,
      );
      const userId = socket.data.user.id;

      const call = callService.getCall(String(callId));

      logger.debug(`Call retrieved: ${JSON.stringify(call)}`);

      if (!call) {
        throw new AppError("Call not found", 404);
      }

      if (call.conversationId !== conversationId) {
        throw new AppError(
          "The call does not belong to the specified conversation",
          400,
        );
      }

      if (!callService.isParticipant(String(callId), userId)) {
        throw new AppError("You are not a participant in this call", 403);
      }

      if (!callService.isParticipant(String(callId), to)) {
        throw new AppError(
          "The recipient is not a participant in this call",
          403,
        );
      }

      const payload = {
        conversationId,
        from: userId,
        description,
      };

      socket.to(`user:${to}`).emit("call:new:offer", payload);
      logger.debug(
        `Emitted call:new:offer to user:${to} for conversation ${conversationId}`,
      );

      callback?.({
        success: true,
      });
    }),
  );

  socket.on(
    "call:answer",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId, to, description } = validateSocketData(
        callSdpSchema,
        data,
      );
      const userId = socket.data.user.id;

      const call = callService.getCall(String(callId));

      if (!call) {
        throw new AppError("Call not found", 404);
      }

      if (call.conversationId !== conversationId) {
        throw new AppError(
          "The call does not belong to the specified conversation",
          400,
        );
      }

      // if (call.initiatorId === userId) {
      //   throw new AppError("You cannot answer your own call", 400);
      // }

      if (!callService.isParticipant(String(callId), userId)) {
        throw new AppError(
          "You are not authorized to send an answer for this call",
          403,
        );
      }

      if (!callService.isParticipant(String(callId), to)) {
        throw new AppError(
          "The recipient is not a participant in this call",
          403,
        );
      }

      const payload = {
        conversationId,
        from: userId,
        description,
      };

      socket.to(`user:${to}`).emit("call:new:answer", payload);

      callback?.({
        success: true,
      });
    }),
  );

  socket.on(
    "call:ice-candidate",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId, to, candidate } = validateSocketData(
        callIceSchema,
        data,
      );

      const userId = socket.data.user.id;

      const call = callService.getCall(String(callId));

      if (!call) {
        throw new AppError("Call not found", 404);
      }

      if (call.conversationId !== conversationId) {
        throw new AppError(
          "The call does not belong to the specified conversation",
          400,
        );
      }

      if (
        !callService.isAuthorized(String(callId), userId) ||
        !callService.isParticipant(String(callId), userId)
      ) {
        throw new AppError(
          "You are not authorized to send an ICE candidate for this call",
          403,
        );
      }

      if (!callService.isParticipant(String(callId), to)) {
        throw new AppError(
          "The recipient is not a participant in this call",
          403,
        );
      }

      const payload = {
        conversationId,
        from: userId,
        candidate,
      };

      socket.to(`user:${to}`).emit("call:new:ice-candidate", payload);

      callback?.({
        success: true,
      });
    }),
  );

  socket.on(
    "call:connected",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId } = data;
      logger.debug(
        `Received call:connected with data: ${JSON.stringify(data)}`,
      );

      console.timeEnd(`CALL START ${callId}`);
    }),
  );

  socket.on(
    "call:reject",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId } = validateSocketData(
        rejectCallEventSchema,
        data,
      );
      const userId = socket.data.user.id;

      const call = callService.getCall(String(callId));

      logger.debug({ call }, "call");

      if (!call) {
        return callback?.({
          success: true,
        });
      }

      if (call.conversationId !== conversationId) {
        throw new AppError(
          "The call does not belong to the specified conversation",
          400,
        );
      }

      if (!callService.isAuthorized(String(callId), userId)) {
        throw new AppError("You are not authorized to reject this call", 403);
      }

      const payload = {
        callId,
        from: userId,
      };

      if (call.type === "direct") {
        callService.endCall(callId);

        socket
          .to(`user:${call.initiatorId}`)
          .emit("call:new:rejected", payload);
      } else {
        io.to(`call:${callId}`).emit("call:new:rejected", payload);
      }

      callback?.({
        success: true,
      });

      socket.leave(`call:${callId}`);
    }),
  );

  socket.on(
    "call:end",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId } = validateSocketData(
        rejectCallEventSchema,
        data,
      );
      await handleLeave(io, socket, callId, conversationId, callback);
      callback?.({ success: true });
    }),
  );

  socket.on(
    "call:leave",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId } = validateSocketData(
        rejectCallEventSchema,
        data,
      );
      await handleLeave(io, socket, callId, conversationId, callback);
      callback?.({ success: true });
    }),
  );

  socket.on(
    "call:invite",
    catchSocketAsync(async (data, callback) => {
      
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
