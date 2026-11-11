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
  publishSchema,
  rejectCallEventSchema,
  rejoinSchema,
  renegotiateSchema,
  subscribeSchema,
} from "./call.validation";
import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import { callRegistry, callService } from "./call.modules";
import { authService } from "../auth/auth.modules";
import { cfRtc } from "../../config/cloudflare/cloudflare.rtc.client";
import { getTurnCredentials } from "../../config/cloudflare/cloudflare.turns";
import { Call, MEDIA_KIND, TrackKind } from "./call.types";
import { TrackRequest } from "../../config/cloudflare/cloudflare.rtc.types";
import { randomUUID } from "node:crypto";

type Ack = ((res: Record<string, unknown>) => void) | undefined;

const callRoom = (callId: string) => `call:${callId}`;
const userRoom = (userId: string) => `user:${userId}`;

async function assertAuthorizedParticipant(
  callId: string,
  userId: string,
  message: string,
) {
  const [authorized, participant] = await Promise.all([
    callRegistry.isAuthorized(callId, userId),
    callRegistry.isParticipant(callId, userId),
  ]);

  if (!authorized || !participant) throw new AppError(message, 403);
}

async function buildRoster(call: Call) {
  return {
    callId: call.callId,
    conversationId: call.conversationId,
    startedAt: call.startedAt,
    serverTime: Date.now(),
    participants: await callRegistry.getParticipants(call.callId),
  };
}

function assertSameConversation(call: Call, conversationId: string) {
  if (call.conversationId !== conversationId) {
    throw new AppError(
      "The call does not belong to the specified conversation",
      400,
    );
  }
}

async function handleLeave(
  io: Server,
  socket: Socket,
  callId: string,
  conversationId: string,
  callback?: Ack,
) {
  const userId = socket.data.user.id;

  const call = await callRegistry.getCall(callId);
  if (!call) return callback?.({ success: true });

  assertSameConversation(call, conversationId);
  await assertAuthorizedParticipant(
    callId,
    userId,
    "You are not authorized to leave this call",
  );

  // snapshot BEFORE removing anyone: people who were called but never joined
  const joinedBefore = new Set(call.participants.keys());
  const neverJoined = [...call.authorizedUsers].filter(
    (id) => !joinedBefore.has(id),
  );

  await callRegistry.removeParticipant(callId, userId);

  // TODO: close this user's Cloudflare tracks (removeParticipant returns their state)

  socket.leave(callRoom(callId));

  const remaining = await callRegistry.getParticipants(callId);

  // enough people left: the call goes on
  if (remaining.length >= 2) {
    io.to(callRoom(callId)).emit("call:new:participant:left", {
      callId,
      from: userId,
      participants: remaining,
    });
    return callback?.({ success: true });
  }

  // 0 or 1 person left: the call is over
  await callService.callEndedWithCallUser(callId, neverJoined);
  await callRegistry.endCall(callId);

  const ended = { callId, reason: "ended" };

  // the last person still in the call (if any)
  io.to(callRoom(callId)).emit("call:new:ended", ended);
  io.in(callRoom(callId)).socketsLeave(callRoom(callId));

  // people whose phones are still ringing
  if (neverJoined.length > 0) {
    socket.to(neverJoined.map(userRoom)).emit("call:new:ended", ended);
  }

  callback?.({ success: true });
}

export function callEvent(io: Server, socket: Socket) {
  // Recovery after a disconnect/reconnect. Runs in the background so the

  // handlers below are registered immediately.
  void (async () => {
    const callId = await callRegistry.callIdForSession(socket.data.user.sid);
    if (!callId) return;

    const call = await callRegistry.getCall(callId);
    if (!call) return;

    socket.join(callRoom(callId));

    const roaster = await buildRoster(call);

    logger.debug({ roaster }, "New roster event");
    io.to(callRoom(callId)).emit("call:new:roster", roaster);
  })().catch((err) => logger.error({ err }, "call recovery failed"));

  socket.on(
    "call:initiate",
    catchSocketAsync(async (data, callback) => {
      const { conversationId, callMediaType } = validateSocketData(
        initiateCallEventSchema,
        data,
      );

      const user = socket.data.user;
      const { id: userId, sid } = user;

      if (!(await authService.isActive(sid))) {
        throw new AppError("Unauthorized", 401);
      }

      if (await callRegistry.callIdForSession(sid)) {
        throw new AppError("This session is already in an active call", 400);
      }

      const {
        type: conversationType,
        name,
        participantIds,
      } = await callService.validateCallParticipant(conversationId, userId);

      const { sessionId: rtcSessionId } = await cfRtc.newSession();
      const iceServers = await getTurnCredentials();

      logger.debug({ iceServers, rtcSessionId }, "INIT CONFIG");

      const dbCall = await callService.createCall(
        conversationId,
        userId,
        sid,
        callMediaType,
        participantIds,
      );

      const callName = conversationType === "direct" ? user.displayName : name;

      const call = await callRegistry.createCall({
        callId: dbCall.id,
        conversationId,
        conversationType,
        type: callMediaType,
        name: callName,
        authorizedUserIds: [...participantIds],
        startedAt: dbCall.startedAt,
        participant: {
          userId,
          sessionId: sid,
          rtcSessionId,
          status: "connecting",
          username: user.username,
          avatarUrl: user.avatarUrl,
          audioOn: false,
          videoOn: false,
          joinedAt: Date.now(),
        },
      });

      logger.debug({ call }, "New call");

      socket.join(callRoom(call.callId));

      const recipientIds = participantIds.filter((id) => id !== userId);

      socket.to(recipientIds.map(userRoom)).emit("call:incoming", {
        callId: call.callId,
        conversationId,
        callMediaType,
        fromName: callName,
        avatarUrl: user.avatarUrl,
        fromId: userId,
      });

      callback?.({
        success: true,
        callId: call.callId,
        rtcSessionId,
        iceServers,
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

      const user = socket.data.user;
      const { id: userId, sid } = user;

      if (!(await authService.isActive(sid))) {
        throw new AppError("Unauthorized", 401);
      }

      const call = await callRegistry.getCall(callId);
      if (!call) return callback?.({ success: false, reason: "call_ended" });

      assertSameConversation(call, conversationId);

      if (call.initiatorId === userId) {
        throw new AppError("You cannot accept your own call", 400);
      }

      const alreadyIn = await callRegistry.isParticipant(callId, userId);

      if (alreadyIn && !rejoin) {
        return callback?.({
          success: false,
          message: "You have already accepted this call",
        });
      }
      if (rejoin && !alreadyIn) {
        return callback?.({ success: false, reason: "not_a_participant" });
      }

      // moves an invited user to authorized (no-op for group members)
      if (!rejoin) await callRegistry.addAuthorizedUser(callId, userId);

      if (!(await callRegistry.isAuthorized(callId, userId))) {
        throw new AppError("You are not authorized to accept this call", 403);
      }

      const { sessionId: rtcSessionId } = await cfRtc.newSession();
      const iceServers = await getTurnCredentials();

      if (rejoin) {
        // new browser connection = new Cloudflare session
        // TODO: the old tracks belonged to the previous Cloudflare session, clear them here
        await callRegistry.updateParticipant(callId, userId, {
          rtcSessionId,
          status: "connecting",
        });
      } else {
        const added = await callRegistry.addParticipant(callId, {
          userId,
          sessionId: sid,
          rtcSessionId,
          status: "accepted",
          username: user.username,
          avatarUrl: user.avatarUrl,
          audioOn: false,
          videoOn: false,
          joinedAt: Date.now(),
        });

        if (!added) {
          throw new AppError("You are not authorized to accept this call", 403);
        }

        try {
          await callService.joinCall(callId, userId, sid);
        } catch (err) {
          await callRegistry.removeParticipant(callId, userId); // roll back
          throw err;
        }
      }

      // tell the user's other devices to stop ringing
      socket.to(userRoom(userId)).emit("call:new:handled", {
        callId,
        conversationId,
        reason: "accepted",
      });

      socket.join(callRoom(callId));

      const roster = await buildRoster(call);

      socket
        .to(callRoom(callId))
        .emit("call:new:accept", { callId, from: userId });
      socket.to(callRoom(callId)).emit("call:new:roster", roster);

      callback?.({ success: true, callId, iceServers });
    }),
  );

  socket.on(
    "call:publish",
    catchSocketAsync(async (data, callback) => {
      const { callId, description, tracks } = validateSocketData(
        publishSchema,
        data,
      );
      const { id: userId, sid } = socket.data.user;

      if ((await callRegistry.callIdForSession(sid)) !== callId) {
        throw new AppError("You are not in this call", 403);
      }

      const call = await callRegistry.getCall(callId);
      const me = call?.participants.get(userId);

      if (!call || !me) throw new AppError("You are not in this call", 403);
      if (!me.rtcSessionId) {
        throw new AppError("Your media session is not ready yet", 400);
      }

      // one track per slot: unpublish the old one before publishing a new one
      for (const t of tracks) {
        if (me.tracks[t.kind]) {
          throw new AppError(`You are already publishing ${t.kind}`, 409);
        }
      }

      // TODO: run this through a per-rtcSessionId queue
      const res = await cfRtc.addTracks(me.rtcSessionId, {
        sessionDescription: description,
        tracks: tracks.map((t) => ({
          location: "local",
          mid: t.mid,
          trackName: t.kind, // "mic" | "cam" | "screen"
        })),
      });

      if (res.errorCode) {
        throw new AppError(res.errorDescription ?? "Publish failed", 502);
      }

      const published: { kind: TrackKind }[] = [];
      const failed: { kind: TrackKind; errorCode: string }[] = [];

      for (const t of tracks) {
        const result = res.tracks?.find((r) => r.trackName === t.kind);

        if (!result || result.errorCode) {
          failed.push({
            kind: t.kind,
            errorCode: result?.errorCode ?? "no_result",
          });
          continue;
        }

        await callRegistry.setTrack(callId, userId, t.kind, {
          trackName: t.kind,
          kind: MEDIA_KIND[t.kind],
          mid: t.mid,
          publishedAt: Date.now(),
        });

        published.push({ kind: t.kind });
      }

      const existing = (await callRegistry.getParticipants(callId))
        .filter((p) => p.userId !== userId)
        .map((p) => ({
          userId: p.userId,
          kinds: Object.keys(p.tracks) as TrackKind[],
        }))
        .filter((p) => p.kinds.length > 0);

      if (published.length > 0) {
        socket.to(`call:${callId}`).emit("call:new:publish", {
          callId,
          userId,
          tracks: published,
        });
      }

      callback?.({
        success: published.length > 0,
        description: res.sessionDescription,
        published,
        failed,
        existing,
      });
    }),
  );

  socket.on(
    "call:subscribe",
    catchSocketAsync(async (data, callback) => {
      const { callId, targets } = validateSocketData(subscribeSchema, data);
      const { id: userId, sid } = socket.data.user;

      if ((await callRegistry.callIdForSession(sid)) !== callId) {
        throw new AppError("You are not in this call", 403);
      }

      const call = await callRegistry.getCall(callId);
      const me = call?.participants.get(userId);

      if (!call || !me) throw new AppError("You are not in this call", 403);
      if (!me.rtcSessionId) {
        throw new AppError("Your media session is not ready yet", 400);
      }

      // resolve what to pull from OUR state, never from client-supplied session ids
      const wanted: {
        userId: string;
        kind: TrackKind;
        rtcSessionId: string;
        trackName: string;
      }[] = [];

      for (const target of targets) {
        if (target.userId === userId) continue;

        const peer = call.participants.get(target.userId);
        if (!peer?.rtcSessionId) continue;

        const kinds = target.kinds ?? (Object.keys(peer.tracks) as TrackKind[]);

        for (const kind of kinds) {
          const track = peer.tracks[kind];
          if (!track) continue;

          wanted.push({
            userId: target.userId,
            kind,
            rtcSessionId: peer.rtcSessionId,
            trackName: track.trackName,
          });
        }
      }

      if (wanted.length === 0) {
        return callback?.({ success: true, subscribed: [], failed: [] });
      }

      // TODO: run this through a per-rtcSessionId queue. For subscribe the lock
      // must stay held until the matching call:renegotiate finishes.
      const res = await cfRtc.addTracks(me.rtcSessionId, {
        tracks: wanted.map((w) => ({
          location: "remote",
          sessionId: w.rtcSessionId,
          trackName: w.trackName,
        })),
      });

      if (res.errorCode) {
        throw new AppError(res.errorDescription ?? "Subscribe failed", 502);
      }

      const subscribed: { userId: string; kind: TrackKind; mid: string }[] = [];
      const failed: { userId: string; kind: TrackKind; errorCode: string }[] =
        [];

      const results = res.tracks ?? [];

      for (const [i, w] of wanted.entries()) {
        const byId = results.find(
          (r) => r.sessionId === w.rtcSessionId && r.trackName === w.trackName,
        );

        // fallback: same position in the request, and the name matches
        const byOrder = results[i];
        const result =
          byId ??
          (byOrder && !byOrder.sessionId && byOrder.trackName === w.trackName
            ? byOrder
            : undefined);

        if (!result || result.errorCode || !result.mid) {
          failed.push({
            userId: w.userId,
            kind: w.kind,
            errorCode: result?.errorCode ?? "no_result",
          });
          continue;
        }

        subscribed.push({ userId: w.userId, kind: w.kind, mid: result.mid });
      }

      callback?.({
        success: subscribed.length > 0,
        // true: the client must apply `description` (an offer) and then
        // reply with call:renegotiate carrying its answer
        requiresRenegotiation: res.requiresImmediateRenegotiation ?? false,
        description: res.sessionDescription,
        subscribed,
        failed,
      });
    }),
  );

  socket.on(
    "call:renegotiate",
    catchSocketAsync(async (data, callback) => {
      const { callId, description } = validateSocketData(
        renegotiateSchema,
        data,
      );
      const { id: userId, sid } = socket.data.user;

      if ((await callRegistry.callIdForSession(sid)) !== callId) {
        throw new AppError("You are not in this call", 403);
      }

      const call = await callRegistry.getCall(callId);
      const me = call?.participants.get(userId);

      if (!call || !me?.rtcSessionId) {
        throw new AppError("You are not in this call", 403);
      }

      await cfRtc.renegotiate(me.rtcSessionId, description);

      callback?.({ success: true });
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

      const call = await callRegistry.getCall(callId);
      if (!call) throw new AppError("Call not found", 404);

      assertSameConversation(call, conversationId);
      await assertAuthorizedParticipant(
        callId,
        userId,
        "You are not authorized to be in this call",
      );

      await callService.markCallAsConnected(callId, userId);
      await callRegistry.updateParticipant(callId, userId, {
        status: "connected",
      });

      callback?.({ success: true });
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

      const call = await callRegistry.getCall(callId);
      if (!call) return callback?.({ success: true });

      assertSameConversation(call, conversationId);

      if (!(await callRegistry.isAuthorized(callId, userId))) {
        throw new AppError("You are not authorized to reject this call", 403);
      }

      await callService.updateCallOutcome(callId, userId, "declined");

      const payload = { callId, from: userId };

      if (call.conversationType === "direct") {
        await callService.callEnd(callId);
        await callRegistry.endCall(callId);

        socket
          .to(userRoom(call.initiatorId))
          .emit("call:new:rejected", payload);
        io.in(callRoom(callId)).socketsLeave(callRoom(callId));
      } else {
        io.to(callRoom(callId)).emit("call:new:rejected", payload);
      }

      // tell the user's other devices to stop ringing
      socket.to(userRoom(userId)).emit("call:new:handled", {
        callId,
        conversationId,
        reason: "rejected",
      });

      callback?.({ success: true });
    }),
  );

  for (const event of ["call:end", "call:leave"] as const) {
    socket.on(
      event,
      catchSocketAsync(async (data, callback) => {
        const { callId, conversationId } = validateSocketData(
          rejectCallEventSchema,
          data,
        );
        await handleLeave(io, socket, callId, conversationId, callback);
      }),
    );
  }

  socket.on(
    "call:invite",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId, to, callMediaType } = validateSocketData(
        inviteCallSchema,
        data,
      );
      const user = socket.data.user;
      const { id: userId, sid } = user;

      const call = await callRegistry.getCall(callId);
      if (!call) throw new AppError("Call not found", 404);

      assertSameConversation(call, conversationId);
      await assertAuthorizedParticipant(
        callId,
        userId,
        "You are not authorized to invite a new user",
      );

      if (call.conversationType === "group") {
        if (!(await callRegistry.isAuthorized(callId, to))) {
          throw new AppError(
            "This user is not authorized to be in this call",
            403,
          );
        }
      } else {
        if (!(await conversationService.canInviteUserOnCall(userId, to))) {
          throw new AppError("You can not invite this user to this call", 403);
        }

        await callService.addInvitedParticipant(
          call.callId,
          sid,
          to,
          call.startedAt,
        );
        await callRegistry.addInvitedUser(callId, to);
      }

      socket.to(userRoom(to)).emit("call:incoming", {
        callId: call.callId,
        conversationId,
        callMediaType,
        fromName:
          call.conversationType === "group" ? call.name : user.displayName,
        avatarUrl: user.avatarUrl,
        fromId: userId,
      });

      callback?.({ success: true });
    }),
  );

  socket.on(
    "call:rejoin",
    catchSocketAsync(async (data, callback) => {
      const { callId, conversationId } = validateSocketData(rejoinSchema, data);
      const userId = socket.data.user.id;

      const call = await callRegistry.getCall(callId);
      if (!call) return callback?.({ success: false, reason: "call_ended" });

      assertSameConversation(call, conversationId);

      if (!(await callRegistry.isParticipant(callId, userId))) {
        return callback?.({ success: false, reason: "not_a_participant" });
      }

      socket.join(callRoom(callId));

      const roster = await buildRoster(call);

      socket.to(callRoom(callId)).emit("call:new:roster", roster);
      callback?.({ success: true, data: roster });
    }),
  );
}
