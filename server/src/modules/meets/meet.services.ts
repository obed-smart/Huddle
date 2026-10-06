import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import { callService } from "../call/call.modules";
import { RealtimeGateway } from "../conversations/conversations.types";
import MeetRepository from "./meet.repository";
import { CreateMeetInput, IcreateMeet, IjoinMeet, Meet } from "./meet.type";

class MeetService {
  private meetBySession: Map<string, string>;
  private meets: Map<string, Meet>;

  constructor(
    private readonly meetRepo: MeetRepository,
    private readonly realtime: RealtimeGateway,
  ) {
    this.meets = new Map();
    this.meetBySession = new Map();
  }

  async createMeet({
    conversationId,
    createdBy,
    title,
    scheduledFor,
  }: IcreateMeet) {
    const { type, participantIds } = await callService.validateCallParticipant(
      conversationId,
      createdBy,
    );

    const meet = await this.meetRepo.create({
      conversationId,
      createdBy,
      title,
      scheduledFor,
    });

    if (!meet) {
      throw new AppError("Failed to create meet", 404);
    }

    this.createMeetSession({
      meetId: meet.id,
      conversationId,
      conversationType: type,
      createdBy,
      title,
      authorizedUserIds: participantIds,
      scheduledFor,
    });

    this.realtime.emitToUser(participantIds, "meet:new", {
      meetId: meet.id,
      conversationId,
      title: meet.title,
    });

    logger.debug("New meet created successfully");

    return {
      meetId: meet.id,
      conversationId,
      title: meet.title,
    };
  }

  async joinMeet({ meetId, userId, sessionId }: IjoinMeet) {
    return await this.meetRepo.joinMeet({ meetId, userId, sessionId });
  }

  async leaveMeet({ meetId, userId, sessionId }: IjoinMeet) {
    await this.meetRepo.leaveMeet({ meetId, userId, sessionId });
  }

  async endMeet(meetId: string) {
    await this.endMeet(meetId);
  }

  async inviteNewUser(meetId: string, userId: string) {
    await this.meetRepo.inviteNewUser(meetId, userId);
  }

  async markInviteeAsAccepted(meetId: string, userId: string) {
    await this.meetRepo.markInviteeAsAccepted(meetId, userId);
  }

  /// LOCAL SESSION
  createMeetSession({
    meetId,
    conversationId,
    conversationType,
    createdBy,
    title,
    authorizedUserIds,
    scheduledFor,
  }: CreateMeetInput) {
    const meet: Meet = {
      meetId,
      createdBy,
      title,
      conversationId,
      conversationType,
      scheduledFor: scheduledFor || null,
      authorizedUsers: new Set(authorizedUserIds),
      invitedUsers: new Set(),
      participants: new Map(),
      createdAt: new Date(),
      startedAt: null,
      lastActiveAt: Date.now(),
    };

    this.meets.set(meetId, meet);
    logger.debug(`Created meet session for meetId: ${meetId}`);
  }

  getMeet(meetId: string) {
    const meet = this.meets.get(meetId);
    if (!meet) throw new AppError("Meet not found", 404);
    return meet;
  }

  isAuthorized(meetId: string, userId: string): boolean {
    const meet = this.getMeet(meetId);

    return meet.authorizedUsers.has(userId);
  }

  isParticipant(meetId: string, sessionId: string): boolean {
    const meet = this.getMeet(meetId);
    return meet.participants.has(sessionId);
  }

  joinMeetSession(
    meetId: string,
    userId: string,
    name: string,
    avatarUrl: string,
    sessionId: string,
    joinedAt: Date,
  ) {
    const meet = this.getMeet(meetId);

    if (!meet.authorizedUsers.has(userId))
      throw new AppError("Not authorized to join this conference room", 403);

    const checkParticipantCount = meet.participants.size;

    if (!meet.participants.has(sessionId)) {
      meet.participants.set(sessionId, {
        state: "connecting",
        userId,
        name,
        avatarUrl,
        sessionId,
        joinedAt: joinedAt,
      });

      // if (checkParticipantCount)
      this.link(sessionId, meetId);
      return;
    }
    return;
  }

  leaveMeetSession(meetId: string, sessionId: string) {
    const meet = this.getMeet(meetId);

    if (!meet) throw new AppError("Meet not found", 404);

    const participant = meet.participants.get(sessionId);

    if (participant) return null;

    this.unlink(meetId, sessionId);

    meet.participants.delete(sessionId);
  }

  inviteUserToMeet(meetId: string, userId: string) {
    const meet = this.getMeet(meetId);

    meet.invitedUsers.add(userId);
  }

    addAuthorizedUser(callId: string, userId: string) {
      const call = this.calls.get(callId);
  
      if (!call) {
        throw new AppError("Call not found", 404);
      }
  
      if (!call.invitedUsers.has(userId) || call.authorizedUsers.has(userId))
        return null;
  
      call.authorizedUsers.add(userId);
      call.invitedUsers.delete(userId);
    }

  private link(sessionId: string, meetId: string) {
    const existingMeetId = this.meetBySession.get(sessionId);

    if (existingMeetId) {
      throw new AppError("This session is already in an active call", 400);
    }

    this.meetBySession.set(sessionId, meetId);

    logger.debug({ sessionId, meetId }, "Linked session to call");

    logger.debug(
      {
        sessionId,
        meetId: this.meetBySession.get(sessionId),
      },
      "Session call index",
    );
  }
  private unlink(sessionId: string, meetId: string) {
    const activeMeetId = this.meetBySession.get(sessionId);

    if (activeMeetId !== meetId) return;

    this.meetBySession.delete(sessionId);
  }

  private isUserEligibleForMeet(meet: Meet, userId: string): boolean {
    return meet.authorizedUsers.has(userId) || meet.invitedUsers.has(userId);
  }

  getActiveMeetsForUsers(userId: string) {
    const meets =
      [...this.meets.values()]
        .filter(
          (meet) =>
            this.isUserEligibleForMeet(meet, userId) &&
            !meet.participants.has(userId),
        )
        .map((meet) => ({
          meetId: meet.meetId,
          conversationId: meet.conversationId,
          title: meet.title,
          scheduledFor: meet.scheduledFor,
        })) ?? [];

    logger.debug(meets, "the active meet summary");

    return meets;
  }
}

export default MeetService;
