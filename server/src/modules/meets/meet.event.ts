import { Server, Socket } from "socket.io";
import { catchSocketAsync, validateSocketData } from "../../sockets/utils";
import {
  inviteMeetSchema,
  joinMeetSchema,
  meetIceSchema,
  meetSdpSchema,
} from "./meet.validation";
import { authService } from "../auth/auth.modules";
import AppError from "../../shared/utils/apiError";
import { meetService } from "./meet.modules";

export function meetEvent(io: Server, socket: Socket) {
  socket.on(
    "meet:join",
    catchSocketAsync(async (data, callback) => {
      const { conversationId, meetId } = validateSocketData(
        joinMeetSchema,
        data,
      );

      const {
        id: userId,
        sid: sessionId,
        username: name,
        avatarUrl,
      } = socket.data.user;

      const userSession = authService.isActive(sessionId);

      if (!userSession) {
        throw new AppError("Unauthorized", 401);
      }

      const meet = meetService.getMeet(meetId);

      if (meet.conversationId !== conversationId) {
        throw new AppError(
          "This conference room does not belong to the specified conversation",
          400,
        );
      }

      if (!meetService.isAuthorized(meetId, userId)) {
        throw new AppError(
          "You are not permitted to join  this conference room",
          403,
        );
      }

      const { joinedAt } = await meetService.joinMeet({
        meetId,
        userId,
        sessionId,
      });

      meetService.joinMeetSession(
        meetId,
        userId,
        name,
        avatarUrl,
        sessionId,
        joinedAt,
      );

      socket.join(`meet:${meetId}`);

      const payload = {
        meetId,
        conversationId,
        sessionId,
        participant: meet.participants.get(sessionId),
      };

      socket.to(`meet:${meetId}`).emit("meet:new:join", payload);

      callback?.({
        success: true,
        data: {
          sessionId,
        },
      });
    }),
  );

  socket.on(
    "meet:offer",
    catchSocketAsync(async (data, callback) => {
      const { meetId, conversationId, to, description } = validateSocketData(
        meetSdpSchema,
        data,
      );

      const { sid: sessionId } = socket.data.user;

      const meet = meetService.getMeet(meetId);

      if (meet.conversationId !== conversationId) {
        throw new AppError(
          "This conference room does not belong to the specified conversation",
          400,
        );
      }

      if (!meetService.isParticipant(meetId, sessionId)) {
        throw new AppError(
          "You are not permitted to send offer in this conference room",
          403,
        );
      }

      if (!meetService.isParticipant(meetId, to)) {
        throw new AppError(
          "The target participant is not in this conference room",
          403,
        );
      }

      const payload = {
        meetId,
        conversationId,
        from: sessionId,
        description,
      };

      socket.to(`session:${to}`).emit("meet:new:offer", payload);

      callback?.({
        success: true,
      });
    }),
  );

  socket.on(
    "meet:answer",
    catchSocketAsync(async (data, callback) => {
      const { meetId, conversationId, to, description } = validateSocketData(
        meetSdpSchema,
        data,
      );

      const { sid: sessionId } = socket.data.user;

      const meet = meetService.getMeet(meetId);

      if (meet.conversationId !== conversationId) {
        throw new AppError(
          "This conference room does not belong to the specified conversation",
          400,
        );
      }

      if (!meetService.isParticipant(meetId, sessionId)) {
        throw new AppError(
          "You are not permitted to send offer in this conference room",
          403,
        );
      }

      if (!meetService.isParticipant(meetId, to)) {
        throw new AppError(
          "The target participant is not in this conference room",
          403,
        );
      }

      const payload = {
        meetId,
        conversationId,
        from: sessionId,
        description,
      };

      socket.to(`session:${to}`).emit("meet:new:answer", payload);

      callback?.({
        success: true,
      });
    }),
  );

  socket.on(
    "meet:ice-candidate",
    catchSocketAsync(async (data, callback) => {
      const { meetId, conversationId, to, candidate } = validateSocketData(
        meetIceSchema,
        data,
      );

      const { sid: sessionId } = socket.data.user;

      const meet = meetService.getMeet(meetId);

      if (meet.conversationId !== conversationId) {
        throw new AppError(
          "This conference room does not belong to the specified conversation",
          400,
        );
      }

      if (!meetService.isParticipant(meetId, sessionId)) {
        throw new AppError(
          "You are not permitted to send offer in this conference room",
          403,
        );
      }

      if (!meetService.isParticipant(meetId, to)) {
        throw new AppError(
          "The target participant is not in this conference room",
          403,
        );
      }

      const payload = {
        meetId,
        conversationId,
        from: sessionId,
        candidate,
      };

      socket.to(`session:${to}`).emit("meet:new:ice-candidate", payload);

      callback?.({
        success: true,
      });
    }),
  );

  socket.on(
    "meet:invite",
    catchSocketAsync(async (data, callback) => {
      const { meetId, conversationId, targetUserId } = validateSocketData(
        inviteMeetSchema,
        data,
      );

      const { id: userId, sid: sessionId } = socket.data.user;

      const meet = meetService.getMeet(meetId);

      if (meet.conversationId !== conversationId) {
        throw new AppError(
          "This conference room does not belong to the specified conversation",
          400,
        );
      }

      if (
        !meetService.isAuthorized(meetId, userId) ||
        !meetService.isParticipant(meetId, sessionId)
      ) {
        throw new AppError(
          "You are not permitted to invite participants to this conference room",
          403,
        );
      }

      if (
        meet.authorizedUsers.has(targetUserId) ||
        meet.invitedUsers.has(targetUserId)
      ) {
        throw new AppError(
          "User is already authorized or invited to join this conference room",
          400,
        );
      }

      await meetService.inviteNewUser(meetId, targetUserId);
    }),
  );

  socket.on(
    "meet:send",
    catchSocketAsync(async (data, callback) => {}),
  );
}
