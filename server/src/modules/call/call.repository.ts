import { and, desc, eq, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db as dBinstance } from "../../db";
import {
  callParticipant,
  callTable,
  conversationsTable,
  usersTable,
} from "../../db/schema";
import { callOutCome, calltype } from "../../db/schema/type";
import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import { callCursor } from "./call.types";

class CallRepository {
  constructor(
    private readonly db: typeof dBinstance,
    private readonly calls: typeof callTable,
    private readonly call_participants: typeof callParticipant,
    private readonly user: typeof usersTable,
    private readonly conversation: typeof conversationsTable,
  ) {}

  async createCall(
    conversationId: string,
    initiatorId: string,
    callType: calltype,
    participantIds: string[],
  ) {
    try {
      return await this.db.transaction(async (tx) => {
        const [call] = await tx
          .insert(this.calls)
          .values({
            conversationId,
            initiatorId,
            type: callType,
          })
          .returning({
            id: this.calls.id,
            startedAt: this.calls.startedAt,
          });

        if (!call) {
          throw new AppError("Failed to create call records", 500);
        }

        if (participantIds && participantIds.length > 0) {
          const participantLists = participantIds.map((userId) => {
            return {
              callId: call.id,
              userId: userId,
              outcome: "pending" as callOutCome,
              callStartedAt: call.startedAt,
            };
          });

          await tx.insert(this.call_participants).values(participantLists);
        }

        return call;
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AppError(
          "There is already an active call in this conversation room.",
          400,
        );
      }

      logger.error(error, "Failed initializing new call");
      throw new AppError("Failed initializing new call", 500);
    }
  }

  async joinCall(callId: string, userId: string) {
    try {
      await this.db
        .update(this.call_participants)
        .set({
          outcome: "joined",
          joinedAt: new Date(),
        })
        .where(
          and(
            eq(this.call_participants.callId, callId),
            eq(this.call_participants.userId, userId),
          ),
        );
    } catch (error) {
      logger.error(error, "Failed when joining the call");
      throw new AppError("Failed when joining the call", 500);
    }
  }

  async addInvitedParticipant(
    callId: string,
    userId: string,
    callStartedAt: Date,
  ) {
    try {
      await this.db
        .insert(this.call_participants)
        .values({
          callId,
          userId,
          callStartedAt,
        })
        .onConflictDoNothing();
    } catch (error) {
      throw new AppError("Failed adding new participant", 500);
    }
  }

  async updateCallOutcome(
    callId: string,
    userId: string,
    outcome: callOutCome,
  ) {
    try {
      await this.db
        .update(this.call_participants)
        .set({
          outcome: outcome,
        })
        .where(
          and(
            eq(this.call_participants.callId, callId),
            eq(this.call_participants.userId, userId),
          ),
        );
    } catch (error) {
      logger.error(error, "Failed updating call outcome");
      throw new AppError("Failed updating call outcome", 500);
    }
  }

  async markCallAsConnected(callId: string, userId: string) {
    try {
      await this.db
        .update(this.calls)
        .set({
          connectedAt: sql`now()`,
        })
        .where(
          and(
            eq(this.calls.id, callId),
            isNull(this.calls.connectedAt),
            ne(this.calls.initiatorId, userId),
          ),
        );
    } catch (error) {
      logger.error(error, "Failed updating call connectAt");
      throw new AppError("Failed updating call connectAt", 500);
    }
  }

  async callEnded(callId: string) {
    try {
      await this.db
        .update(this.calls)
        .set({
          endedAt: new Date(),
        })
        .where(eq(this.calls.id, callId));
    } catch (error) {
      await this.db
        .update(this.calls)
        .set({
          endedAt: new Date(),
        })
        .where(eq(this.calls.id, callId));

      logger.error(error, "Failed on call end");
      throw new AppError("Failed on call end", 500);
    }
  }

  // The end function when the initiator end the call before any participant joined
  async callEndedWithNOCallUser(callId: string, participantIds: string[]) {
    try {
      return await this.db.transaction(async (tx) => {
        await tx
          .update(this.calls)
          .set({
            endedAt: new Date(),
          })
          .where(eq(this.calls.id, callId));

        await tx
          .update(this.call_participants)
          .set({
            outcome: "missed" as callOutCome,
          })
          .where(
            and(
              eq(this.call_participants.callId, callId),
              eq(this.call_participants.outcome, "pending"),
              inArray(this.call_participants.userId, participantIds),
            ),
          );
      });
    } catch (error) {
      logger.error(error, "Failed why on call end");
      throw new AppError("Failed why on call end", 500);
    }
  }

  async getCalls(userId: string, limit: number, cursor?: callCursor) {
    try {
      const log = await this.db
        .select({
          callId: this.calls.id,
          initiator: this.calls.initiatorId,
          conversationId: this.conversation.id,
          type: this.calls.type,
          startedAt: this.calls.startedAt,
          connectedAt: this.calls.connectedAt,
          endedAt: this.calls.endedAt,
          callOutCome: this.call_participants.outcome,
          conversationType: this.conversation.type,
          conversationName: this.conversation.name,
          conversationAvatarUrl: this.conversation.avatarUrl,
        })
        .from(this.call_participants)
        .innerJoin(this.calls, eq(this.calls.id, this.call_participants.callId))
        .innerJoin(
          this.conversation,
          eq(this.conversation.id, this.calls.conversationId),
        )
        .where(
          and(
            eq(this.call_participants.userId, userId),
            cursor
              ? or(
                  lt(this.call_participants.callStartedAt, cursor.startedAt),
                  and(
                    eq(this.call_participants.callStartedAt, cursor.startedAt),
                    lt(this.call_participants.callId, cursor.callId),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(
          desc(this.call_participants.callStartedAt),
          desc(this.call_participants.callId),
        )
        .limit(limit);

      logger.debug(log, "New callLog");
      return log;
    } catch (error) {
      logger.error(error, "Failed fetching call log");
      throw new AppError("Failed fetching call log", 500);
    }
  }

  async getOtherCallParticipant(callIds: string[], userId: string) {
    if (callIds.length === 0) return [];

    return this.db
      .select({
        callId: this.call_participants.callId,
        userId: this.user.id,
        username: this.user.username,
        avatarUrl: this.user.avatarUrl,
        callOutCome: this.call_participants.outcome,
      })
      .from(this.call_participants)
      .innerJoin(this.user, eq(this.user.id, this.call_participants.userId))
      .where(
        and(
          inArray(this.call_participants.callId, callIds),
          ne(this.call_participants.userId, userId),
        ),
      );
  }
}

export default CallRepository;
