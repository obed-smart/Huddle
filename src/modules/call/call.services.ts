import { randomUUID } from "crypto";
import logger from "../../shared/utils/logger";
import { Call, CreateCallInput, ParticipantState } from "./call.types";

class CallService {
  private calls: Map<string, Call>;
  private callByUser: Map<string, Set<string>>;

  constructor() {
    this.calls = new Map();
    this.callByUser = new Map();
  }

  createCall({
    conversationId,
    type,
    authorizedUserIds,
    initiator,
  }: CreateCallInput): Call {
    const callId = randomUUID();
    const startedAt = Date.now();

    const call: Call = {
      callId,
      conversationId,
      type,
      startedAt,
      initiatorId: initiator.id,
      authorizedUsers: new Set(authorizedUserIds),
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

    const callIds = this.callByUser.get(initiator.id) ?? new Set<string>();

    callIds.add(callId);

    this.callByUser.set(initiator.id, callIds);

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

    const callIds = this.callByUser.get(participant.id) ?? new Set<string>();

    callIds.add(callId);

    this.callByUser.set(participant.id, callIds);

    return true;
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
      return false;
    }

    call.participants.delete(userId);

    const callIds = this.callByUser.get(userId);

    if (callIds) {
      callIds.delete(callId);

      if (callIds.size === 0) {
        this.callByUser.delete(userId);
      }
    }
  }

  setParticipantState(
    callId: string,
    userId: string,
    state: ParticipantState,
  ): boolean {
    const call = this.calls.get(callId);

    if (!call) {
      return false;
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
    if (!call) return;

    for (const userId of call.participants.keys()) {
      const callIds = this.callByUser.get(userId);
      if (!callIds) continue;

      callIds.delete(userId);

      if (callIds.size === 0) {
        this.callByUser.delete(userId);
      }
    }

    this.calls.delete(callId);
  }

  callIdsForUser(userId: string): string[] {
    return [...(this.callByUser.get(userId) ?? [])];
  }
}

export default CallService;
