import { Server, Socket } from "socket.io";
import { catchSocketAsync, validateSocketData } from "../../sockets/utils";
import { conversationService } from "../conversations/conversations.modules";
import {
  acceptCallEventSchema,
  callIceSchema,
  callSdpSchema,
  connectCallSchema,
  IacceptCallEventSchema,
  initiateCallEventSchema,
  inviteCallSchema,
  rejectCallEventSchema,
  rejoinSchema,
} from "./call.validation";
import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import { callService } from "./call.modules";
import { authService } from "../auth/auth.modules";

async function handleLeave(
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

    await callService.callEndedWithCallUser(callId, authorizedUserIds);

    callService.endCallSession(callId);

    socket
      .to(authorizedUserIds.map((id) => `user:${id}`))
      .emit("call:new:ended", { callId, reason: "ended" });

    // for (const userId of authorizedUserIds) {
    //   socket
    //     .to(`user:${userId}`)
    //     .emit("call:new:ended", { callId, reason: "ended" });
    // }

    socket.leave(`call:${callId}`);

    return;
    // this is when at least one last person is remaining so no need of keeping the call just hange up
  } else if (remaining.length < 2) {
    const newUsers = [...call.authorizedUsers].filter((userId) => {
      return !call.participants.has(userId);
    });

    await callService.callEndedWithCallUser(callId, newUsers);

    callService.endCallSession(callId);

    logger.debug(`Remaining Participant is up to tow`);

    io.to(`call:${callId}`).emit("call:new:ended", { callId, reason: "ended" });
    socket.leave(`call:${callId}`);
    return;
  } else {
    io.to(`call:${callId}`).emit("call:new:participant-left", {
      callId,
      from: userId,
      participants: remaining,
    });

    socket.leave(`call:${callId}`);

    return;
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

  logger.debug(
    { sessionIdForCall: socket.data.user.sid },
    "sesssionId for call recovery",
  );

  const callId = callService.callIdForUser(socket.data.user.sid);

  logger.debug({ callId: callId }, "New Recovery call ");

  if (callId) {
    const call = callService.getCall(callId);

    if (call) {
      socket.join(`call:${callId}`);

      io.to(`call:${callId}`).emit("call:new:roster", {
        callId: call.callId,
        conversationId: call.conversationId,
        startedAt: call.startedAt,
        serverTime: Date.now(),
        participants: callService.getParticipants(callId),
      });
    }
  }

  socket.on(
    "call:initiate",
    catchSocketAsync(async (data, callback) => {
      const { conversationId, callMediaType } = validateSocketData(
        initiateCallEventSchema,
        data,
      );

      const { id: userId, sid } = socket.data.user;
      const initiator = socket.data.user;

      logger.debug({ initiator: initiator }, "this is the initiator data");
      logger.debug({ initiatorSid: sid }, "this is the initiator data");

      const userSession = authService.isActive(sid);

      if (!userSession) {
        throw new AppError("Unauthorized", 401);
      }

      const {
        type: conversationType,
        name,
        participantIds,
      } = await callService.validateCallParticipant(conversationId, userId);

      const newCall = await callService.createCall(
        conversationId,
        userId,
        sid,
        callMediaType,
        participantIds,
      );

      const call = callService.createCallSession({
        callId: newCall.id,
        conversationId,
        conversationType,
        type: callMediaType,
        name: conversationType === "direct" ? initiator.displayName : name,
        authorizedUserIds: [...participantIds],
        participant: initiator,
        startedAt: newCall.startedAt,
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
        fromName:
          conversationType === "direct" ? socket.data.user.displayName : name,
        avatarUrl: socket.data.user.avatarUrl,
        fromId: userId,
      };

      // a clean way to emit the incoming call my simulation a sockect pipe method to the recipient users without using a loop

      socket
        .to(recipientIds.map((id) => `user:${id}`))
        .emit("call:incoming", payload);

      // this is an alternative way of emitting the call:incoming event to multiple users without using a loop

      // for (const recipientId of recipientIds) {
      //   socket.to(`user:${recipientId}`).emit("call:incoming", payload);
      //   logger.debug(
      //     `Emitted call:incoming to user:${recipientId} for conversation ${conversationId}`,
      //   );
      // }

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
    catchSocketAsync(async (data: IacceptCallEventSchema, callback) => {
      const { callId, conversationId, rejoin } = validateSocketData(
        acceptCallEventSchema,
        data,
      );

      logger.debug("New Call accept");

      const { id: userId, sid } = socket.data.user;

      const userSession = authService.isActive(sid);

      if (!userSession) {
        throw new AppError("Unauthorized", 401);
      }

      if (callService.isParticipant(callId, userId) && !rejoin) {
        return callback?.({
          success: false,
          message: "You have already accepted this call",
        });
      } else {
        socket
          .to(`call:${callId}`)
          .emit("call:new:participant-joined", { callId, from: userId });
        logger.debug("New rejion event recieved");
      }

      const call = callService.getCall(callId);

      logger.debug(`Call retrieved: ${JSON.stringify(call)}`);

      if (!call) {
        return callback?.({ success: false, reason: "call_ended" });
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

      if (!rejoin) callService.addAuthorizedUser(callId, userId);

      if (!callService.isAuthorized(callId, userId)) {
        throw new AppError("You are not authorized to accept this call", 403);
      }

      socket.to(`user:${userId}`).emit("call:new:handled", {
        callId,
        conversationId,
        reason: "accepted",
      });

      if (!rejoin) {
        await callService.joinCall(callId, userId, sid);

        callService.addParticipant(callId, socket.data.user);
        logger.debug("New User added");
      } else {
        logger.debug(
          { Name: socket.data.user.displayName },
          "New rejoined User",
        );
      }

      socket.join(`call:${callId}`);

      const rosterPayload = {
        callId: call.callId,
        conversationId: call.conversationId,
        startedAt: call.startedAt,
        serverTime: Date.now(),
        participants: callService.getParticipants(callId),
      };

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
      logger.debug(
        `Received call:offer with data: ${JSON.stringify(data.callId)}`,
      );

      const { callId, conversationId, to, description } = validateSocketData(
        callSdpSchema,
        data,
      );

      const { id: userId, sid } = socket.data.user;

      logger.debug({ sessionId: sid }, "socket User");

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

      const participant = call.participants.get(to);

      if (!participant) {
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

      socket
        .to(`session:${participant.sessionId}`)
        .emit("call:new:offer", payload);
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
      logger.debug(
        `Received call:anwser with data: ${JSON.stringify(data.callId)}`,
      );

      const { callId, conversationId, to, description } = validateSocketData(
        callSdpSchema,
        data,
      );
      const { id: userId, sid } = socket.data.user;

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

      const participant = call.participants.get(to);

      if (!participant) {
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

      socket
        .to(`session:${participant.sessionId}`)
        .emit("call:new:answer", payload);

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

      const { id: userId, sid } = socket.data.user;

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

      const participant = call.participants.get(to);

      if (!participant) {
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

      socket
        .to(`session:${participant.sessionId}`)
        .emit("call:new:ice-candidate", payload);

      callback?.({
        success: true,
      });
    }),
  );

  socket.on(
    "call:connected",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId } = validateSocketData(
        connectCallSchema,
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
        throw new AppError("You are not authorized to to be in this call", 403);
      }

      await callService.markCallAsConnected(callId, userId);
      callService.getActiveCallsForUsers(userId);

      logger.debug(
        `Received call:connected with data: ${JSON.stringify(data)}`,
      );

      for (const id of call.authorizedUsers) {
        logger.debug({ Id: id }, "call users on connected");
      }
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

      await callService.updateCallOutcome(callId, userId, "declined");

      const payload = {
        callId,
        from: userId,
      };

      if (call.conversationType === "direct") {
        const participant = call.participants.get(call.initiatorId);

        if (!participant) {
          throw new AppError(
            "The recipient is not a participant in this call",
            403,
          );
        }

        await callService.callEnd(callId);
        callService.endCallSession(callId);

        socket
          .to(`user:${participant.sessionId}`)
          .emit("call:new:rejected", payload);
      } else {
        io.to(`call:${callId}`).emit("call:new:rejected", payload);
      }

      socket.to(`user:${userId}`).emit("call:new:handled", {
        callId,
        conversationId,
        reason: "rejected",
      });

      callback?.({
        success: true,
      });
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
    }),
  );

  socket.on(
    "call:invite",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId, to, callMediaType } = validateSocketData(
        inviteCallSchema,
        data,
      );
      const { id: userId, sid } = socket.data.user;

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
        throw new AppError("You are not authorized to invite a new user", 403);
      }

      if (
        call.conversationType === "group" &&
        !callService.isAuthorized(String(callId), to)
      ) {
        throw new AppError(
          "This user is not authorized to be in this call",
          403,
        );
      }

      if (call.conversationType === "direct") {
        if (!(await conversationService.canIniviteUserOnCall(userId, to))) {
          throw new AppError("You can not invite this user to this call", 403);
        }

        await callService.addInvitedParticipant(
          call.callId,
          sid,
          to,
          call.startedAt,
        );
        
        callService.addInvitedUser(String(callId), to);
      }

      const fromName =
        call.conversationType === "group"
          ? call.name
          : socket.data.user.displayName;

      const payload = {
        callId: call.callId,
        conversationId,
        callMediaType,
        fromName,
        avatarUrl: socket.data.user.avatarUrl,
        fromId: userId,
      };

      socket.to(`user:${to}`).emit("call:incoming", payload);
      logger.debug(
        `Emitted call:incoming to user:${to} for conversation ${conversationId}`,
      );

      callback?.({
        success: true,
      });
    }),
  );

  socket.on(
    "call:rejoin",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId } = validateSocketData(rejoinSchema, data);
      const userId = socket.data.user.id;

      const call = callService.getCall(callId);
      if (!call) {
        return callback?.({ success: false, reason: "call_ended" });
      }

      if (call.conversationId !== conversationId) {
        throw new AppError(
          "The call does not belong to the specified conversation",
          400,
        );
      }

      if (!callService.isParticipant(callId, userId)) {
        return callback?.({ success: false, reason: "not_a_participant" });
      }

      socket.join(`call:${callId}`);

      const rosterPayload = {
        callId: call.callId,
        conversationId: call.conversationId,
        startedAt: call.startedAt,
        serverTime: Date.now(),
        participants: callService.getParticipants(callId),
      };

      socket.to(`call:${callId}`).emit("call:new:roaster", rosterPayload);

      callback?.({ success: true, data: rosterPayload });
    }),
  );

  socket.on(
    "call:send",
    catchSocketAsync(async (data, callback) => {}),
  );
}
