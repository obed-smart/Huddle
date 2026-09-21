import { randomUUID } from "crypto";
import logger from "../../shared/utils/logger";
import { Call, CreateCallInput, ParticipantState } from "./call.types";
import AppError from "../../shared/utils/apiError";
import { callOutCome, calltype } from "../../db/schema/type";
import CallRepository from "./call.repository";

class CallService {
  private calls: Map<string, Call>;
  private callsByUser: Map<string, Set<string>>;

  constructor(private readonly callRepo: CallRepository) {
    this.calls = new Map();
    this.callsByUser = new Map();
  }

  async createCall(
    conversationId: string,
    initiatorId: string,
    callType: calltype,
    participantIds: string[],
  ) {
    return await this.callRepo.createCall(
      conversationId,
      initiatorId,
      callType,
      participantIds,
    );
  }

  async joinCall(callId: string, userId: string) {
    await this.callRepo.joinCall(callId, userId);
  }

  async updateCallOutcome(
    callId: string,
    userId: string,
    outcome: callOutCome,
  ) {
    await this.callRepo.updateCallOutcome(callId, userId, outcome);
  }

  async callEnded(callId: string) {
    await this.callRepo.callEnded(callId);
  }

  // The end function when the initiator end the call before any participant joined
  async callEndedWithNOCallUser(callId: string, participantIds: string[]) {
    await this.callRepo.callEndedWithNOCallUser(callId, participantIds);
  }

  // THIS IS FOR AN IN-MEMORY CALL STATES

  createCallSession({
    callId,
    conversationId,
    type,
    name,
    authorizedUserIds,
    initiator,
  }: CreateCallInput): Call {
    const startedAt = Date.now();

    const call: Call = {
      callId,
      conversationId,
      type,
      name: name ?? null,
      startedAt,
      initiatorId: initiator.id,
      authorizedUsers: new Set(authorizedUserIds),
      invitedUsers: new Set(),
      participants: new Map(),
    };

    call.participants.set(initiator.id, {
      state: "initiating",
      name: initiator.displayName,
      avatarUrl: initiator.avatarUrl,
      joinedAt: Date.now(),
    });

    this.calls.set(callId, call);
    logger.debug("new call created from service");
    logger.debug(`Call: ${JSON.stringify(call)}`);

    this.link(initiator.id, callId);

    return call;
  }

  getCall(callId: string): Call | undefined {
    return this.calls.get(callId);
  }

  isAuthorized(callId: string, userId: string): boolean {
    const call = this.calls.get(callId);

    if (!call) {
      return false;
    }

    return call.authorizedUsers.has(userId);
  }

  addParticipant(
    callId: string,
    participant: CreateCallInput["initiator"],
  ): boolean {
    const call = this.calls.get(callId);

    if (!call) {
      return false;
    }

    if (!call.authorizedUsers.has(participant.id)) {
      return false;
    }

    call.participants.set(participant.id, {
      state: "accepted",
      name: participant.displayName,
      avatarUrl: participant.avatarUrl,
      joinedAt: Date.now(),
    });

    this.link(participant.id, callId);

    return true;
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

  addInvitedUser(callId: string, userId: string) {
    const call = this.calls.get(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    call.invitedUsers.add(userId);
  }

  isParticipant(callId: string, userId: string): boolean {
    const call = this.calls.get(callId);

    if (!call) {
      return false;
    }

    return call.participants.has(userId);
  }

  removeParticipant(callId: string, userId: string) {
    const call = this.calls.get(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    call.participants.delete(userId);

    this.unlink(userId, callId);
  }

  setParticipantState(
    callId: string,
    userId: string,
    state: ParticipantState,
  ): boolean {
    const call = this.calls.get(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }

    const participant = call.participants.get(userId);

    if (!participant) {
      return false;
    }

    participant.state = state;

    return true;
  }

  getParticipants(callId: string) {
    const call = this.calls.get(callId);

    if (!call) {
      return [];
    }

    return [...call.participants.entries()].map(([id, participant]) => ({
      id,
      name: participant.name,
      avatar: participant.avatarUrl,
      state: participant.state,
      joinedAt: participant.joinedAt,
    }));
  }

  endCall(callId: string) {
    const call = this.calls.get(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }
    for (const userId of call.participants.keys()) this.unlink(userId, callId);
    this.calls.delete(callId);
  }

  private link(userId: string, callId: string) {
    let callIds = this.callsByUser.get(userId);

    if (!callIds) this.callsByUser.set(userId, (callIds = new Set()));

    callIds.add(callId);
  }

  private unlink(userId: string, callId: string) {
    const callIds = this.callsByUser.get(userId);
    if (!callIds) return;
    callIds.delete(callId);
    if (callIds.size === 0) this.callsByUser.delete(userId);
  }

  callIdsForUser(userId: string): string[] {
    return [...(this.callsByUser.get(userId) ?? [])];
  }
}

export default CallService;
