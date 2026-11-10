import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import {
  Call,
  CallStore,
  CreateCallInput,
  ParticipantInput,
  ParticipantPatch,
  ParticipantState,
  ParticipantView,
  PublishedTrack,
  TrackKind,
} from "./call.types";
import { ActiveCallSummary } from "./call.validation";

export class InMemoryCallRegistry implements CallStore {
  private calls = new Map<string, Call>();
  
  private callsByUserSession = new Map<string, string>();

  async createCall({
    callId,
    conversationId,
    conversationType,
    type,
    name,
    authorizedUserIds,
    participant,
    startedAt,
  }: CreateCallInput): Promise<Call> {
    this.link(participant.sessionId, callId);

    const { userId, ...state } = participant;

    const call: Call = {
      callId,
      conversationId,
      conversationType,
      type,
      name,
      startedAt,
      initiatorId: userId,
      authorizedUsers: new Set(authorizedUserIds),
      invitedUsers: new Set(),
      participants: new Map([[userId, { ...state, tracks: {} }]]),
    };

    this.calls.set(callId, call);
    logger.debug({ callId, conversationId }, "call session created");

    return call;
  }

  async getCall(callId: string): Promise<Call | undefined> {
    return this.calls.get(callId);
  }

  async endCall(callId: string): Promise<Call> {
    const call = this.requireCall(callId);

    for (const p of call.participants.values()) {
      this.unlink(p.sessionId, callId);
    }
    this.calls.delete(callId);

    return call;
  }

  async isAuthorized(callId: string, userId: string): Promise<boolean> {
    return this.calls.get(callId)?.authorizedUsers.has(userId) ?? false;
  }

  async isParticipant(callId: string, userId: string): Promise<boolean> {
    return this.calls.get(callId)?.participants.has(userId) ?? false;
  }

  async addAuthorizedUser(callId: string, userId: string): Promise<boolean> {
    const call = this.requireCall(callId);

    if (!call.invitedUsers.has(userId) || call.authorizedUsers.has(userId)) {
      return false;
    }

    call.authorizedUsers.add(userId);
    call.invitedUsers.delete(userId);
    return true;
  }

  async addInvitedUser(callId: string, userId: string): Promise<void> {
    this.requireCall(callId).invitedUsers.add(userId);
  }

  async addParticipant(callId: string, p: ParticipantInput): Promise<boolean> {
    const call = this.calls.get(callId);
    if (!call) return false;
    if (!call.authorizedUsers.has(p.userId)) return false;

    if (call.participants.has(p.userId)) {
      throw new AppError("User is already in this call", 409);
    }

    this.link(p.sessionId, callId);

    const { userId, ...state } = p;
    call.participants.set(userId, { ...state, tracks: {} });
    return true;
  }

  async removeParticipant(
    callId: string,
    userId: string,
  ): Promise<ParticipantState | null> {
    const call = this.requireCall(callId);
    const participant = call.participants.get(userId);
    if (!participant) return null;

    this.unlink(participant.sessionId, callId);
    call.participants.delete(userId);

    return participant;
  }

 

  async updateParticipant(
    callId: string,
    userId: string,
    patch: ParticipantPatch,
  ): Promise<boolean> {
    const participant = this.requireCall(callId).participants.get(userId);
    if (!participant) return false;

    Object.assign(participant, patch);
    return true;
  }

  async getParticipants(callId: string): Promise<ParticipantView[]> {
    const call = this.calls.get(callId);
    if (!call) return [];

    return [...call.participants.entries()].map(([userId, p]) => ({
      userId,
      username: p.username,
      avatarUrl: p.avatarUrl,
      status: p.status,
      audioOn: p.audioOn,
      videoOn: p.videoOn,
      joinedAt: p.joinedAt,
      tracks: p.tracks,
    }));
  }



  async setTrack(
    callId: string,
    userId: string,
    kind: TrackKind,
    track: PublishedTrack,
  ): Promise<boolean> {
    const participant = this.requireCall(callId).participants.get(userId);
    if (!participant) return false;

    participant.tracks[kind] = track;
    return true;
  }

  
  async removeTrack(
    callId: string,
    userId: string,
    kind: TrackKind,
  ): Promise<PublishedTrack | null> {
    const participant = this.requireCall(callId).participants.get(userId);
    const track = participant?.tracks[kind];
    if (!participant || !track) return null;

    delete participant.tracks[kind];
    return track;
  }

 

  async callIdForSession(sessionId: string): Promise<string | undefined> {
    return this.callsByUserSession.get(sessionId);
  }

  async getActiveCallsForUser(userId: string): Promise<ActiveCallSummary[]> {
    return [...this.calls.values()]
      .filter(
        (call) =>
          (call.authorizedUsers.has(userId) || call.invitedUsers.has(userId)) &&
          !call.participants.has(userId),
      )
      .map((call) => ({
        callId: call.callId,
        conversationId: call.conversationId,
        callMediaType: call.type,
        conversationType: call.conversationType,
        directTypeLenght:
          call.conversationType === "direct" ? call.participants.size : "group",
        name: call.name,
      }));
  }


 /* ---- INTERNALS -------- */


  private requireCall(callId: string): Call {
    const call = this.calls.get(callId);
    if (!call) throw new AppError("Call not found", 404);
    return call;
  }

  private link(sessionId: string, callId: string) {
    if (this.callsByUserSession.has(sessionId)) {
      throw new AppError("This session is already in an active call", 400);
    }
    this.callsByUserSession.set(sessionId, callId);
    logger.debug({ sessionId, callId }, "linked session to call");
  }

  private unlink(sessionId: string, callId: string) {
    if (this.callsByUserSession.get(sessionId) !== callId) return;
    this.callsByUserSession.delete(sessionId);
  }
}

export default InMemoryCallRegistry