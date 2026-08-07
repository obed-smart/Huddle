import {
  and,
  desc,
  eq,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notInArray,
  sql,
} from "drizzle-orm";
import { db as dBinstance } from "../../db";
import {
  conversationsTable as conversation,
  IConversation,
  INewConversation,
  conversationParticipants,
  INewConversationParticipant,
} from "../../db/schema/schema.conversations";
import {
  groupJoinRequestsTable as groupRequest,
  INewGroupRequest,
  conversationTimeline,
  messagesTable as messages,
  systemEventsTable as conversationlog,
} from "../../db/schema";
import {
  ConversationResponseDto,
  ICreateDirectWithParticipants,
  IcreateGroupConversation,
  IUpdatePing,
  TimelineItem,
} from "./conversations.types";
import { usersTable as users } from "../../db/schema";
import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import { inArray } from "drizzle-orm";
import { count } from "drizzle-orm";
import { IupdateConversationSchema } from "./conversations.validation";

export const conversationResponse = {
  id: conversation.id,
  type: conversation.type,
  visibility: conversation.visibility,
  name: conversation.name,
  description: conversation.description,
  avatarUrl: conversation.avatarUrl,
  requestedBy: conversation.requestedBy,
  createdBy: conversation.createdBy,
  pingStatus: conversation.pingStatus,
  lastMessageAt: conversation.lastMessageAt,
  createdAt: conversation.createdAt,
};

class ConversationsRepository {
  constructor(
    private readonly db: typeof dBinstance,
    private readonly conversationsTable: typeof conversation,
    private readonly conversation_participants: typeof conversationParticipants,
    private readonly groupRequestTable: typeof groupRequest,
    private readonly usersTable: typeof users,
    private readonly conversationTimelineTable: typeof conversationTimeline,
    private readonly messageTable: typeof messages,
    private readonly conversationEventTable: typeof conversationlog,
  ) {}

  private async conversationLock<T>(
    conversationId: string,
    errorMessageContext: string,
    action: (tx: any) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.db.transaction(async (tx) => {
        await tx
          .select({ id: this.conversationsTable.id })
          .from(this.conversationsTable)
          .where(eq(this.conversationsTable.id, conversationId))
          .for("update", { noWait: true });

        return await action(tx);
      });
    } catch (error: any) {
      if (error.code === "55P03") {
        logger.warn(
          { conversationId, context: errorMessageContext },
          "Action blocked: lock already held",
        );
        throw new AppError(
          "Another admin is currently modifying this conversation. Please try again.",
          409,
        );
      }

      logger.error({ err: error }, `failed operation: ${errorMessageContext}`);
      throw new AppError(`failed operation: ${errorMessageContext}`, 500);
    }
  }

  async createDirectWithParticipants(
    data: ICreateDirectWithParticipants,
  ): Promise<ConversationResponseDto> {
    try {
      return await this.db.transaction(async (tx) => {
        const [conversation] = await tx
          .insert(this.conversationsTable)
          .values({
            directKey: data.directKey,
            type: "direct",
            visibility: "private",
            createdBy: data.createdBy,
            pingStatus: data.pingStatus,
            requestedBy: data.requestedBy,
          })
          .returning(conversationResponse);

        if (!conversation)
          throw new AppError("Failed to create conversation entry", 500);

        await tx.insert(this.conversation_participants).values(
          data.participantIds.map((userId) => ({
            conversationId: conversation.id,
            userId,
          })),
        );

        return conversation;
      });
    } catch (err: any) {
      logger.error(
        {
          code: (err as any).cause?.code,
          constraint: (err as any).cause?.constraint,
          detail: (err as any).cause?.detail,
          message: (err as any).message,
        },
        "PG ERROR DETECTED:",
      );
      throw new AppError(err as string, err.code);
    }
  }

  async createGroupWithParticipants(
    data: IcreateGroupConversation,
  ): Promise<ConversationResponseDto> {
    try {
      return this.db.transaction(async (tx) => {
        const [conversation] = await tx
          .insert(this.conversationsTable)
          .values({
            name: data.name,
            type: "group",
            visibility: data.visibility,
            createdBy: data.createdBy,
            description: data.description,
          })
          .returning(conversationResponse);

        if (!conversation)
          throw new AppError("Failed to create conversation entry", 500);

        await tx.insert(this.conversation_participants).values({
          conversationId: conversation.id,
          userId: conversation.createdBy,
          status: "accepted",
          role: "super_admin",
        });

        await tx.insert(this.groupRequestTable).values(
          data.participantIds.map((userId) => ({
            conversationId: conversation.id,
            userId: userId,
            invitedBy: conversation.createdBy,
          })),
        );

        return conversation;
      });
    } catch (err: any) {
      logger.error(
        {
          code: (err as any).cause?.code,
          constraint: (err as any).cause?.constraint,
          detail: (err as any).cause?.detail,
          message: (err as any).message,
        },
        "PG ERROR DETECTED:",
      );
      throw new AppError(err as string, err.code);
    }
  }

  async findByDirectKey(directKey: IConversation["directKey"]) {
    const [conversation] = await this.db
      .select(conversationResponse)
      .from(this.conversationsTable)
      .where(
        directKey
          ? eq(this.conversationsTable.directKey, directKey)
          : isNull(this.conversationsTable.directKey),
      );

    return conversation ?? null;
  }

  async findConversationById(
    conversationId: string,
  ): Promise<ConversationResponseDto | null> {
    const [conversation] = await this.db
      .select(conversationResponse)
      .from(this.conversationsTable)
      .where(eq(this.conversationsTable.id, conversationId));

    return conversation ?? null;
  }

  async updateConversationStatus(
    conversationId: string,
    data: IUpdatePing,
  ): Promise<ConversationResponseDto | null> {
    const [result] = await this.db
      .update(this.conversationsTable)
      .set({
        pingStatus: data.pingStatus,
        requestedBy: data.requestedBy,
      })
      .where(eq(this.conversationsTable.id, conversationId))
      .returning(conversationResponse);

    return result ?? null;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await this.db
        .delete(this.conversationsTable)
        .where(eq(this.conversationsTable.id, conversationId));
    } catch (error) {
      logger.error({ err: error }, "Failed to delete conversation");
      throw new AppError("Failed to delete conversation", 500);
    }
  }

  async findAcceptedParticipantIds(
    conversationId: string,
    type: "direct" | "group",
  ): Promise<string[]> {
    if (type === "group") {
      const rows = await this.db
        .select({ userId: this.conversation_participants.userId })
        .from(this.conversation_participants)
        .where(
          eq(this.conversation_participants.conversationId, conversationId),
        );
      return rows.map((r) => r.userId);
    }

    const rows = await this.db
      .select({ userId: this.conversation_participants.userId })
      .from(this.conversation_participants)
      .innerJoin(
        this.conversationsTable,
        eq(
          this.conversation_participants.conversationId,
          this.conversationsTable.id,
        ),
      )
      .where(
        and(
          eq(this.conversation_participants.conversationId, conversationId),
          eq(this.conversationsTable.pingStatus, "accepted"),
        ),
      );
    return rows.map((r) => r.userId);
  }

  //  async userNameExists(username: string): Promise<boolean> {
  //     const result = await this.db.execute(
  //       sql`SELECT EXISTS (SELECT 1 FROM ${this.usersTable} WHERE username = ${username}) AS "exists"`,
  //     );

  //     return result.rows[0]?.exists as boolean;
  //   }

  // async findAcceptedParticipantIds(
  //   conversationId: string,
  //   type: "direct" | "group",
  // ): Promise<string[]> {
  //   if (type === "direct") {
  //     const [conversation] = await this.db
  //       .select({ pingStatus: this.conversationsTable.pingStatus })
  //       .from(this.conversationsTable)
  //       .where(eq(this.conversationsTable.id, conversationId))
  //       .limit(1);

  //     if (conversation?.pingStatus && conversation.pingStatus !== "accepted") {
  //       return [];
  //     }
  //   }

  //   // Fetch participants whose participant status is 'accepted'
  //   const rows = await this.db
  //     .select({ userId: this.conversation_participants.userId })
  //     .from(this.conversation_participants)
  //     .where(
  //       and(
  //         eq(this.conversation_participants.conversationId, conversationId),
  //         eq(this.conversation_participants.status, "accepted"), // Checks participant-level acceptance!
  //       ),
  //     );

  //   return rows.map((r) => r.userId);
  // }

  async checkParticipant(
    conversationId: INewConversationParticipant["conversationId"],
    userId: INewConversationParticipant["userId"],
  ): Promise<{
    exists: boolean;
    isParticipant: boolean;
    type: "direct" | "group" | null;
  }> {
    try {
      const result = await this.db.execute(
        sql`
      SELECT
        c.type AS "type",
        EXISTS (SELECT 1 FROM ${this.conversationsTable} WHERE id = ${conversationId}) AS "exists",
        EXISTS (
          SELECT 1 FROM ${this.conversation_participants}
          WHERE conversation_id = ${conversationId} AND user_id = ${userId}
        ) AS "isParticipant"
      FROM ${this.conversationsTable} c
      WHERE c.id = ${conversationId}
    `,
      );

      const row = result.rows[0];

      return {
        exists: !!row?.exists,
        isParticipant: !!row?.isParticipant,
        type: (row?.type as "direct" | "group" | undefined) ?? null,
      };
    } catch (error) {
      logger.error({ err: error }, "Failed when checking participant");
      throw new AppError("Failed when checking participant", 500);
    }
  }

  async findAndUpdateParticipants(
    conversationId: string,
    userId: string,
    lastMessageId: string,
  ) {
    try {
      let isUpdated = false;
      return this.db.transaction(async (tx) => {
        const participant = await tx.query.conversationParticipants.findFirst({
          where: and(
            eq(this.conversation_participants.conversationId, conversationId),
            eq(this.conversation_participants.userId, userId),
          ),
        });

        if (!participant) {
          throw new AppError(
            "This chat is private, you can not send message",
            403,
          );
        }

        const alreadyReadPast = participant.lastReadMessageId === lastMessageId;

        if (!alreadyReadPast) {
          await tx.update(this.conversation_participants).set({
            lastReadMessageId: lastMessageId,
            lastReadAt: new Date(),
          });
          isUpdated = true;
        }
        return isUpdated;
      });
    } catch (error) {
      logger.error(error);
    }
  }

  async filterValidMentions(
    conversationId: string,
    mentionedUserIds: string[],
  ): Promise<string[]> {
    if (mentionedUserIds.length === 0) return [];

    const validParticipants = await this.db
      .select({ userId: this.conversation_participants.userId })
      .from(this.conversation_participants)
      .where(
        and(
          eq(this.conversation_participants.conversationId, conversationId),
          inArray(this.conversation_participants.userId, mentionedUserIds),
        ),
      );

    return validParticipants.map((p) => p.userId);
  }

  /// Group

  async findRequestById(requestId: string) {
    try {
      const [request] = await this.db
        .select()
        .from(this.groupRequestTable)
        .where(eq(this.groupRequestTable.id, requestId));
      return request;
    } catch (error) {
      logger.error({ err: error }, "[Group Event] - error fetching request");
      throw new AppError("Failed fetching request", 500);
    }
  }

  /// this function need a table lock but lets leave it for now, we can add it later if we need to
  async approveGroupJoinRequest(requesterId: string) {
    try {
      return await this.db.transaction(async (tx) => {
        const [request] = await tx
          .update(this.groupRequestTable)
          .set({ status: "approved", resolvedAt: new Date() })
          .where(
            and(
              eq(this.groupRequestTable.id, requesterId),
              eq(this.groupRequestTable.status, "pending"),
            ),
          )
          .returning();

        if (!request) {
          throw new AppError("Request not found or already resolved", 409);
        }

        await tx.insert(this.conversation_participants).values({
          conversationId: request.conversationId,
          userId: request.userId,
          status: "accepted",
        });

        return request;
      });
    } catch (error) {
      logger.error(
        { err: error },
        "[Group Event] -> Error approving group join request",
      );
      throw new AppError(
        `error approving group join request: ${
          error instanceof Error ? error.message : String(error)
        }`,
        500,
      );
    }
  }

  async declineGroupJoinRequest(requesterId: string) {
    try {
      await this.db
        .update(this.groupRequestTable)
        .set({
          status: "declined",
          resolvedAt: new Date(),
        })
        .where(eq(this.groupRequestTable.id, requesterId));
    } catch (error) {
      logger.error(
        { err: error },
        "[Group Event] -> failed declining join request",
      );
      throw new AppError("failed declining join request", 500);
    }
  }

  async pendingGroupInvites(userId: string) {
    try {
      const invite = await this.db
        .select({
          id: this.groupRequestTable.id,
          kind: sql<string>`'invite'`.as("kind"),
          conversationId: this.groupRequestTable.conversationId,
          fromUser: this.groupRequestTable.invitedBy,
          conversationName: this.conversationsTable.name,
          conversationAvatar: this.conversationsTable.avatarUrl,
          createdAt: this.groupRequestTable.requestedAt,
        })
        .from(this.groupRequestTable)
        .innerJoin(
          this.conversationsTable,
          eq(this.groupRequestTable.conversationId, this.conversationsTable.id),
        )
        .where(
          and(
            eq(this.groupRequestTable.userId, userId),
            eq(this.groupRequestTable.status, "pending"),
            isNotNull(this.groupRequestTable.invitedBy),
          ),
        );

      return invite;
    } catch (error) {
      logger.error(
        { err: error },
        "[Group Event] -> failed fetching pending group invite",
      );
      throw new AppError("failed fetching pending group invite", 500);
    }
  }

  async pendingJoinRequests(conversationId: string) {
    try {
      const requests = await this.db
        .select({
          id: this.groupRequestTable.id,
          kind: sql<string>`'request'`.as("kind"),
          userId: this.groupRequestTable.userId,
          Name: this.usersTable.username,
          username: this.usersTable.username,
          avatarUrl: this.usersTable.avatarUrl,
        })
        .from(this.groupRequestTable)
        .innerJoin(
          this.usersTable,
          eq(this.groupRequestTable.userId, this.usersTable.id),
        )
        .where(
          and(
            eq(this.groupRequestTable.conversationId, conversationId),
            eq(this.groupRequestTable.status, "pending"),
          ),
        );
      return requests;
    } catch (error) {
      logger.error(
        { err: error },
        "[Group Event] -> failed fetching pending join requests",
      );
      throw new AppError("failed fetching pending join requests", 500);
    }
  }

  async checkAdmin(conversationId: string, userId: string) {
    try {
      const isAdmin = await this.db.execute(
        sql`
      SELECT EXISTS (
        SELECT 1
        FROM ${this.conversation_participants}
        WHERE conversation_id = ${conversationId}
          AND user_id = ${userId}
          AND role IN ('admin', 'super_admin')
      ) AS admin
    `,
      );

      return !!isAdmin.rows[0]?.admin;
    } catch (error) {
      logger.error({ err: error }, "Failed checking admin");
      throw new AppError("Failed checking admin", 500);
    }
  }

  async assertSuperAdmin(conversationId: string, userId: string) {
    try {
      const isAdmin = await this.db.execute(
        sql`
      SELECT EXISTS (
        SELECT 1
        FROM ${this.conversation_participants}
        WHERE conversation_id = ${conversationId}
          AND user_id = ${userId}
          AND role = 'super_admin'
      ) AS admin
    `,
      );

      return !!isAdmin.rows[0]?.admin;
    } catch (error) {
      logger.error({ err: error }, "Failed checking admin");
      throw new AppError("Failed checking admin", 500);
    }
  }

  async findConversationByInviteCode(
    inviteCode: string,
  ): Promise<ConversationResponseDto | null> {
    try {
      const [conversation] = await this.db
        .select({
          ...conversationResponse,
          membersCount: sql<number>`
      (
        SELECT COUNT(*)
        FROM ${this.conversation_participants}
        WHERE ${this.conversation_participants.conversationId} = ${this.conversationsTable.id}
      )
    `,
        })
        .from(this.conversationsTable)
        .where(eq(this.conversationsTable.inviteCode, inviteCode));
      return conversation ?? null;
    } catch (error) {
      logger.error(
        { err: error },
        "failed fetching conversation By inviteCode",
      );
      throw new AppError("failed fetching conversation By inviteCode", 500);
    }
  }

  // A two way join fro public / request fro private grout
  // async joinGroup() {}

  async addInviteCode(conversationId: string, code: string) {
    return await this.conversationLock(
      conversationId,
      "adding invite code",
      async (tx) => {
        const [result] = await tx
          .update(this.conversationsTable)
          .set({
            inviteCode: code,
          })
          .where(eq(this.conversationsTable.id, conversationId))
          .returning({ inviteCode: this.conversationsTable.inviteCode });

        return result;
      },
    );
  }

  async checkInviteCode(inviteCode: string): Promise<boolean> {
    const result = await this.db.execute(
      sql`SELECT EXISTS (SELECT 1 FROM ${this.conversationsTable} WHERE invite_code = ${inviteCode}) AS inviteCode`,
    );

    return result.rows[0]?.inviteCode as boolean;
  }

  async createRequest(data: INewGroupRequest) {
    try {
      const request = await this.db.insert(this.groupRequestTable).values(data);

      return request;
    } catch (error) {
      logger.error({ err: error }, "Failed creating request");
      throw new AppError("Failed creating request", 500);
    }
  }

  async addNewParticipant(data: INewConversationParticipant) {
    try {
      const participant = await this.db
        .insert(this.conversation_participants)
        .values(data)
        .returning({
          conversationId: this.conversation_participants.conversationId,
          userId: this.conversation_participants.userId,
          role: this.conversation_participants.role,
          status: this.conversation_participants.status,
        });

      return participant;
    } catch (error) {
      logger.error({ err: error }, "Failed adding new participant");
      throw new AppError("Failed adding new participant", 500);
    }
  }

  async assertGroupRequest(conversationId: string, userId: string) {
    const [result] = await this.db
      .select({
        id: this.groupRequestTable.id,
        userId: this.groupRequestTable.userId,
        invitedBy: this.groupRequestTable.invitedBy,
      })
      .from(this.groupRequestTable)
      .where(
        and(
          eq(this.groupRequestTable.conversationId, conversationId),
          eq(this.groupRequestTable.userId, userId),
          eq(this.groupRequestTable.status, "pending"),
        ),
      );

    return result ?? null;
  }

  async updateAdminRole(
    conversationId: string,
    userId: string,
    role: "admin" | "member",
  ) {
    const MAX_ADMIN_COUNT = 10;

    return this.conversationLock(
      conversationId,
      `updating admin role to ${role}`,
      async (tx) => {
        if (role === "admin") {
          const [result] = await tx
            .select({ count: count() })
            .from(this.conversation_participants)
            .where(
              and(
                eq(
                  this.conversation_participants.conversationId,
                  conversationId,
                ),
                inArray(this.conversation_participants.role, [
                  "admin",
                  "super_admin",
                ]),
              ),
            );

          if (result && result.count >= MAX_ADMIN_COUNT) {
            throw new AppError(
              `This group has reached the maximum limit of ${MAX_ADMIN_COUNT} administrators.`,
              400,
            );
          }

          await tx
            .update(this.conversation_participants)
            .set({ role: "admin" })
            .where(
              and(
                eq(
                  this.conversation_participants.conversationId,
                  conversationId,
                ),
                eq(this.conversation_participants.userId, userId),
                notInArray(this.conversation_participants.role, [
                  "admin",
                  "super_admin",
                ]),
              ),
            );
        } else {
          await tx
            .update(this.conversation_participants)
            .set({ role: "member" })
            .where(
              and(
                eq(
                  this.conversation_participants.conversationId,
                  conversationId,
                ),
                eq(this.conversation_participants.userId, userId),
                eq(this.conversation_participants.role, "admin"),
              ),
            );
        }
      },
    );
  }

  async removeUserFromConversation(conversationId: string, userId: string) {
    return await this.conversationLock(
      conversationId,
      "removing user from conversation",
      async (tx) => {
        await tx
          .delete(this.groupRequestTable)
          .where(
            and(
              eq(this.groupRequestTable.conversationId, conversationId),
              eq(this.groupRequestTable.userId, userId),
            ),
          );

        await tx
          .delete(this.conversation_participants)
          .where(
            and(
              eq(this.conversation_participants.conversationId, conversationId),
              eq(this.conversation_participants.userId, userId),
            ),
          );
      },
    );
  }

  async userLeaveConversation(conversationId: string, userId: string) {
    return await this.db.transaction(async (tx) => {
      await tx
        .delete(this.groupRequestTable)
        .where(
          and(
            eq(this.groupRequestTable.conversationId, conversationId),
            eq(this.groupRequestTable.userId, userId),
          ),
        );

      await tx
        .delete(this.conversation_participants)
        .where(
          and(
            eq(this.conversation_participants.conversationId, conversationId),
            eq(this.conversation_participants.userId, userId),
          ),
        );
    });
  }

  async updateConversation(
    conversationId: string,
    data: Partial<IupdateConversationSchema>,
  ) {
    return await this.conversationLock(
      conversationId,
      "updating conversation",
      async (tx) => {
        const [result] = await tx
          .update(this.conversationsTable)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(this.conversationsTable.id, conversationId))
          .returning(conversationResponse);

        return result ?? null;
      },
    );
  }

  async getTimeline(
    conversationId: string,
    before?: Date,
    limit = 50,
  ): Promise<TimelineItem[]> {
    try {
      const timelineRows = await this.db
        .select()
        .from(this.conversationTimelineTable)
        .where(
          before
            ? and(
                eq(
                  this.conversationTimelineTable.conversationId,
                  conversationId,
                ),
                lt(this.conversationTimelineTable.createdAt, before),
              )
            : eq(this.conversationTimelineTable.conversationId, conversationId),
        )
        .orderBy(desc(this.conversationTimelineTable.createdAt))
        .limit(limit);

      const messageIds = timelineRows
        .filter((r) => r.type === "message")
        .map((r) => r.refId);
      const eventIds = timelineRows
        .filter((r) => r.type === "event")
        .map((r) => r.refId);

      const [msgs, events] = await Promise.all([
        messageIds.length
          ? this.db
              .select()
              .from(this.messageTable)
              .where(inArray(this.messageTable.id, messageIds))
          : [],

        eventIds.length
          ? this.db
              .select()
              .from(this.conversationEventTable)
              .where(inArray(this.conversationEventTable.id, eventIds))
          : [],
      ]);

      const msgMap = new Map(msgs.map((m) => [m.id, m]));
      const eventMap = new Map(events.map((e) => [e.id, e]));

      return timelineRows.map((row): TimelineItem => {
        if (row.type === "message") {
          return {
            type: "message",
            createdAt: row.createdAt,
            data: msgMap.get(row.refId)!,
          };
        }

        if (row.type === "event") {
          return {
            type: "system_event",
            createdAt: row.createdAt,
            data: eventMap.get(row.refId)!,
          };
        }

       
        return {
          type: "deleted_message",
          createdAt: row.createdAt,
          data: null,
        };
      });
    } catch (error) {
      logger.error({ err: error }, "failed fetching conversation Timeline");
      throw new AppError("failed fetching conversation Timeline", 500);
    }
  }

}

export default ConversationsRepository;
