import { and, eq, inArray } from "drizzle-orm";
import { db as dBinstance } from "../../db";
import { callParticipant, callTable } from "../../db/schema";
import { callOutCome, calltype } from "../../db/schema/type";
import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";

class CallRepository {
  constructor(
    private readonly db: typeof dBinstance,
    private readonly calls: typeof callTable,
    private readonly call_participants: typeof callParticipant,
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

  async getCallLog() {}
}

export default CallRepository;
