import { randomUUID } from "crypto";
import logger from "../../shared/utils/logger";
import {
  Call,
  CreateCallInput,
  callCursor,
  otherUser,
  ParticipantState,
  RawCallEntries,
  CallLogEntry,
} from "./call.types";
import AppError from "../../shared/utils/apiError";
import { callOutCome, calltype } from "../../db/schema/type";
import CallRepository from "./call.repository";
import ca from "zod/v4/locales/ca.js";
import { decodeCursor, encodeCursor } from "./call.utils";
import { ActiveCallSummary } from "./call.validation";

const CALL_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

class CallService {
  private calls: Map<string, Call>;
  private callsByUserSession: Map<string, string>;

  constructor(private readonly callRepo: CallRepository) {
    this.calls = new Map();
    this.callsByUserSession = new Map();
  }

  async createCall(
    conversationId: string,
    initiatorId: string,
    initiatorSessionId: string,
    callType: calltype,
    participantIds: string[],
  ) {
    return await this.callRepo.createCall(
      conversationId,
      initiatorId,
      initiatorSessionId,
      callType,
      participantIds,
    );
  }

  async joinCall(callId: string, userId: string, sessionId: string) {
    await this.callRepo.joinCall(callId, userId, sessionId);
  }

  async addInvitedParticipant(
    callId: string,
    sessionId: string,
    userId: string,
    callStartedAt: Date,
  ) {
    await this.callRepo.addInvitedParticipant(
      callId,
      sessionId,
      userId,
      callStartedAt,
    );
  }

  async updateCallOutcome(
    callId: string,
    userId: string,
    outcome: callOutCome,
  ) {
    await this.callRepo.updateCallOutcome(callId, userId, outcome);
  }

  async markCallAsConnected(callId: string, userId: string) {
    await this.callRepo.markCallAsConnected(callId, userId);
  }

  async callEnd(callId: string) {
    await this.callRepo.callEnded(callId);
  }

  // The end function when the initiator end the call before any participant joined
  async callEndedWithCallUser(callId: string, participantIds: string[]) {
    await this.callRepo.callEndedWithCallUser(callId, participantIds);
  }

  private async buildCallEntries(
    userId: string,
    limit: number,
    cursor?: callCursor,
  ): Promise<RawCallEntries[]> {
    const myCalls = await this.callRepo.getCalls(userId, limit, cursor);
    if (myCalls.length === 0) return [];

    const directCallId = myCalls
      .filter((call) => call.conversationType !== "group")
      .map((c) => c.callId);

    const otherParticipant = await this.callRepo.getOtherCallParticipant(
      directCallId,
      userId,
    );

    logger.debug(otherParticipant, "Other call participants");

    const peopleByCall = new Map<string, otherUser[]>();

    for (const user of otherParticipant) {
      const list = peopleByCall.get(user.callId) ?? [];

      list.push(user);
      peopleByCall.set(user.callId, list);
    }

    return myCalls.map((call) => {
      const people = peopleByCall.get(call.callId) ?? [];

      const direction = call.initiator === userId ? "outgoing" : "incoming";

      const callOutCome: RawCallEntries["callOutCome"] =
        direction === "outgoing"
          ? "joined"
          : call.callOutCome === "joined"
            ? "joined"
            : call.callOutCome === "declined"
              ? "declined"
              : "missed";

      const callDuration =
        call.connectedAt && call.endedAt
          ? Math.round(
              (call.endedAt.getTime() - call.connectedAt.getTime()) / 1000,
            )
          : null;

      const featuredUser =
        people.find((user) => user.callOutCome === "joined") ??
        people[0] ??
        null;

      const displayLabel =
        call.conversationType === "group"
          ? (call.conversationName ?? "Unknown group")
          : people.length <= 1
            ? (featuredUser?.username ?? "Unknown")
            : `${featuredUser?.username ?? "Unknown"} & ${people.length - 1} others`;

      const avatarUrl =
        call.conversationType === "group"
          ? (call.conversationAvatarUrl ?? null)
          : (featuredUser?.avatarUrl ?? null);

      return {
        callId: call.callId,
        conversationId: call.conversationId,
        conversationType: call.conversationType,
        startedAt: call.startedAt,
        type: call.type,
        label: displayLabel,
        avatarUrl,
        direction,
        duration: callDuration,
        callOutCome,
        otherParticipantIds: people.map((p) => p.userId),
        otherParticipants: people.map((p) => ({
          userId: p.userId,
          username: p.username,
          avatarUrl: p.avatarUrl,
        })),
      };
    });
  }

  /** this function helpsme to create a unique key for each call so that i can         * know when to shrink or flat a call based on time and call
   *  Example like ekene(2) or obi(5) just grouping related call
   *  see {@link groupOrMergeConsecutiveCalls} for more
   */
  private getIdentityGruopingKey(entry: RawCallEntries) {
    const baseKey =
      entry.conversationType === "group"
        ? `group:${entry.conversationId}`
        : `direct:${entry.otherParticipantIds.slice().sort().join(",")}`;

    return `${baseKey}:${entry.direction}`;
  }

  /**
   * Collapses repeated calls within the time window defined by {@link CALL_DEDUP_WINDOW_MS}
   * to a single call row in the ui
   *
   * @param entries List of raw call entries produced by {@link buildCallEntries}.
   */

  groupOrMergeConsecutiveCalls(entries: RawCallEntries[]): CallLogEntry[] {
    const grouped: (CallLogEntry & { key: string })[] = [];

    for (const entry of entries) {
      const key = this.getIdentityGruopingKey(entry);
      const last = grouped[grouped.length - 1];
      const closeIntime =
        last &&
        last.callStartedAt.getTime() - entry.startedAt.getTime() <=
          CALL_DEDUP_WINDOW_MS;

      if (last && last.key === key && closeIntime) {
        last.count += 1;
      } else {
        grouped.push({
          key,
          id: entry.callId,
          conversationId: entry.conversationId,
          conversationType: entry.conversationType,
          otherParticipants: entry.otherParticipants,
          label: entry.label,
          avatarUrl: entry.avatarUrl,
          direction: entry.direction,
          outcome: entry.callOutCome,
          type: entry.type,
          callStartedAt: entry.startedAt,
          durationSeconds: entry.duration,
          count: 1,
          callIds: [entry.callId],
        });
      }
    }

    return grouped.map(({ key, ...rest }) => rest);
  }

  /**
   *
   * combining all the function to build a call log for the user
   * {@link buildCallEntries} for a raw db call data and {@link groupOrMergeConsecutiveCalls} for grouping repeated calls within given time {@link CALL_DEDUP_WINDOW_MS}
   *
   * @param userId user id
   * @param cursorString  the cursor string if any
   * @param limit  query limit
   * @returns  calllog and nextCursor if any
   *
   */
  async getCallLog(userId: string, cursorString?: string, limit = 50) {
    const cursor = cursorString ? decodeCursor(cursorString) : undefined;

    const rawCallEntries = await this.buildCallEntries(userId, limit, cursor);
    const callLOg = this.groupOrMergeConsecutiveCalls(rawCallEntries);

    const lastCallEntry = rawCallEntries[rawCallEntries.length - 1];
    const nextCursor =
      rawCallEntries.length === limit && lastCallEntry
        ? encodeCursor({
            startedAt: lastCallEntry.startedAt,
            callId: lastCallEntry.callId,
          })
        : null;

    return { callLOg, nextCursor };
  }

  // THIS IS FOR AN IN-MEMORY CALL STATES

  createCallSession({
    callId,
    conversationId,
    conversationType,
    type,
    name,
    authorizedUserIds,
    participant,
    startedAt,
  }: CreateCallInput): Call {
    const call: Call = {
      callId,
      conversationId,
      conversationType,
      type,
      name,
      startedAt,
      initiatorId: participant.id,
      authorizedUsers: new Set(authorizedUserIds),
      invitedUsers: new Set(),
      participants: new Map(),
    };

    call.participants.set(participant.id, {
      state: "initiating",
      name: participant.displayName,
      sessionId: participant.sid,
      avatarUrl: participant.avatarUrl,
      joinedAt: Date.now(),
    });

    this.calls.set(callId, call);
    logger.debug("new call created from service");
    logger.debug(`Call: ${JSON.stringify(call)}`);

    logger.debug({ sessionId: participant.sid }, "sessionId at creation");
    this.link(participant.sid, callId);

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
    participant: CreateCallInput["participant"],
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
      sessionId: participant.sid,
      avatarUrl: participant.avatarUrl,
      joinedAt: Date.now(),
    });

    this.link(participant.sid, callId);

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

    const participant = call.participants.get(userId);

    if (!participant) return null;

    this.unlink(participant.sessionId, callId);

    call.participants.delete(userId);
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
      sessionId: participant.sessionId,
      avatar: participant.avatarUrl,
      state: participant.state,
      joinedAt: participant.joinedAt,
    }));
  }

  endCallSession(callId: string) {
    const call = this.calls.get(callId);

    if (!call) {
      throw new AppError("Call not found", 404);
    }
    for (const participant of call.participants.values())
      this.unlink(participant.sessionId, callId);

    this.calls.delete(callId);
  }

  private link(sessionId: string, callId: string) {
    const existingCallId = this.callsByUserSession.get(sessionId);

    if (existingCallId) {
      throw new AppError("This session is already in an active call", 400);
    }

    this.callsByUserSession.set(sessionId, callId);

    logger.debug({ sessionId, callId }, "Linked session to call");

    logger.debug(
      {
        sessionId,
        callId: this.callsByUserSession.get(sessionId),
      },
      "Session call index",
    );
  }
  private unlink(sessionId: string, callId: string) {
    const activeCallId = this.callsByUserSession.get(sessionId);

    if (activeCallId !== callId) return;

    this.callsByUserSession.delete(sessionId);
  }

  callIdForUser(sessionId: string): string | undefined {
    const callId = this.callsByUserSession.get(sessionId);

    logger.debug({ callId: callId }, "call Id from the callforUser");

    return callId;
  }

  private isUserEligibleForCall(call: Call, userId: string): boolean {
    return call.authorizedUsers.has(userId) || call.invitedUsers.has(userId);
  }

  getActiveCallsForUsers(userId: string): ActiveCallSummary[] {
    const calls =
      [...this.calls.values()]
        .filter(
          (call) =>
            this.isUserEligibleForCall(call, userId) &&
            !call.participants.has(userId),
        )
        .map((call) => ({
          callId: call.callId,
          conversationId: call.conversationId,
          callMediaType: call.type,
          conversationType: call.conversationType,
          directTypeLenght:
            call.conversationType === "direct"
              ? [...call.participants].length
              : "group",
          name: call.name,
        })) ?? [];

    logger.debug(calls, "the active call summary");

    return calls;
  }
}

export default CallService;
