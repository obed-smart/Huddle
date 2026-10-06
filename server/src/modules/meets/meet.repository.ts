import { and, eq, isNull } from "drizzle-orm";
import { db as dbInstance } from "../../db";
import {
  meetInviteeTable,
  meetParticipantTable,
  meetTable,
} from "../../db/schema/schema.meet";
import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import { IcreateMeet, IjoinMeet } from "./meet.type";
import { dbErrorConstraint } from "../../shared/utils/utits";

class MeetRepository {
  constructor(
    private readonly db: typeof dbInstance,
    private readonly meets: typeof meetTable,
    private readonly meet_participants: typeof meetParticipantTable,
    private readonly meet_invites: typeof meetInviteeTable,
  ) {}

  async create({
    conversationId,
    createdBy,
    title,
    scheduledFor,
  }: IcreateMeet) {
    try {
      const [meet] = await this.db
        .insert(this.meets)
        .values({
          conversationId,
          createdBy,
          title,
          scheduledFor: scheduledFor || null,
        })
        .returning({
          id: this.meets.id,
          title: this.meets.title,
        });

      return meet;
    } catch (error: any) {
      logger.error({ error }, "Error creating meet");

      const dbError =
        error instanceof Error && "cause" in error
          ? (
              error as Error & {
                cause?: {
                  code?: string;
                  constraint?: string;
                };
              }
            ).cause
          : undefined;

      if (
        dbError?.code === "23505" &&
        dbError.constraint === "meets_one_active_instant_per_conversation"
      ) {
        throw new AppError(
          "This conversation already has an active instant meet",
          409,
        );
      }

      throw new AppError("Something went wrong creating meet", 500);
    }
  }

  async joinMeet({ meetId, userId, sessionId }: IjoinMeet) {
    try {
      const [row] = await this.db
        .insert(this.meet_participants)
        .values({
          meetId,
          userId,
          sessionId,
        })
        .returning({
          joinedAt: this.meet_participants.joinedAt,
        });

      if (!row) throw new AppError("Failed joining conference room", 400);

      return row;
    } catch (error: unknown) {
      logger.error({ error }, "Failed to join the meet");
      const dbError = dbErrorConstraint(error);

      if (dbError?.constraint === "meet_one_active_leg_per_session") {
        throw new AppError("You are already in this conference room", 409);
      }

      throw new AppError("Failed joining the conference room", 500);
    }
  }

  async leaveMeet({ meetId, userId, sessionId }: IjoinMeet) {
    try {
      await this.db
        .update(this.meet_participants)
        .set({
          leftAt: new Date(),
        })
        .where(
          and(
            eq(this.meet_participants.meetId, meetId),
            eq(this.meet_participants.userId, userId),
            eq(this.meet_participants.sessionId, sessionId),
            isNull(this.meet_participants.leftAt),
          ),
        );
    } catch (error) {
      logger.error({ error }, "Failed to leave the meet");
      throw new AppError("failed leaving the conference room", 500);
    }
  }

  async endMeet(meetId: string) {
    try {
      await this.db
        .update(this.meets)
        .set({
          endedAt: new Date(),
        })
        .where(and(eq(this.meets.id, meetId), isNull(this.meets.endedAt)));
    } catch (error) {
      logger.error({ error }, "failed ending meet");
      throw new AppError("failed ending the meet", 500);
    }
  }

  async inviteNewUser(meetId: string, userId: string) {
    try {
      await this.db.insert(this.meet_invites).values({
        meetId,
        userId,
      });
    } catch (error) {
      logger.error({ error }, "failed inviting user to meet");
      throw new AppError("failed inviting user to meet", 500);
    }
  }

  async markInviteeAsAccepted(meetId: string, userId: string) {
    try {
      await this.db
        .update(this.meet_invites)
        .set({
          acceptedAt: new Date(),
        })
        .where(
          and(
            eq(this.meet_invites.meetId, meetId),
            eq(this.meet_invites.userId, userId),
            isNull(this.meet_invites.acceptedAt),
          ),
        );
    } catch (error) {
      logger.error({ error }, "failed marking invitee as accepted");
      throw new AppError("failed marking invitee as accepted", 500);
    }
  }
}

export default MeetRepository;
