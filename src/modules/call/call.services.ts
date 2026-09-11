import { randomUUID } from "crypto";
import logger from "../../shared/utils/logger";
import { Call, CreateCallInput, ParticipantState } from "./call.types";

class CallService {
  private calls: Map<string, Call>;

  constructor() {
    this.calls = new Map();
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

    return true;
  }

  isParticipant(callId: string, userId: string): boolean {
    const call = this.calls.get(callId);

    if (!call) {
      return false;
    }

    return call.participants.has(userId);
  }

  removeParticipant(callId: string, userId: string): boolean {
    const call = this.calls.get(callId);

    if (!call) {
      return false;
    }

    return call.participants.delete(userId);
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

  deleteCall(callId: string): boolean {
    return this.calls.delete(callId);
  }
}

export default CallService;
