import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { db as dBinstance } from "../../db";
import {
  conversationsTable as conversation,
  IConversation,
  INewConversation,
  conversationParticipants,
  INewConversationParticipant,
} from "../../db/schema/schema.conversations";
import { groupJoinRequestsTable as groupRequest } from "../../db/schema";
import {
  ConversationResponseDto,
  ICreateDirectWithParticipants,
  IcreateGroupConversation,
  IUpdatePing,
} from "./conversations.types";
import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";
import { IMessage } from "../../db/schema";
import { inArray } from "drizzle-orm";

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
  ) {}

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

       await tx.insert(this.groupRequestTable).values(
          data.participantIds.map((userId) => ({
            conversationId: conversation.id,
            requestedUserId: userId,
            invitedBy: conversation.createdBy
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
    // Add your database delete logic here
    throw new Error("Method not implemented");
  }

  async findParticipantsByConversationId(
    conversationId: string,
  ): Promise<string[]> {
    const participants = await this.db
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

    return participants.map((p) => p.userId);
  }

  //  async userNameExists(username: string): Promise<boolean> {
  //     const result = await this.db.execute(
  //       sql`SELECT EXISTS (SELECT 1 FROM ${this.usersTable} WHERE username = ${username}) AS "exists"`,
  //     );

  //     return result.rows[0]?.exists as boolean;
  //   }

  async checkParticipant(
    conversationId: INewConversationParticipant["conversationId"],
    userId: INewConversationParticipant["userId"],
  ): Promise<boolean> {
    const result = await this.db.execute(
      sql`SELECT EXISTS (SELECT 1 FROM ${this.conversation_participants} WHERE conversation_id = ${conversationId} AND user_id = ${userId}) AS "exists"`,
    );

    return result.rows[0]?.exists as boolean;
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
}

export default ConversationsRepository;
