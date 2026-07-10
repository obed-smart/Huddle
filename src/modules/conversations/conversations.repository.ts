import { and, eq, isNull, ne } from "drizzle-orm";
import { db as dBinstance } from "../../db";
import {
  conversationsTable as conversation,
  IConversation,
  INewConversation,
  conversationParticipants,
} from "../../db/schema/schema.conversations";
import {
  ConversationResponseDto,
  ICreateDirectWithParticipants,
  IUpdatePing,
} from "./conversations.types";
import AppError from "../../shared/utils/apiError";
import logger from "../../shared/utils/logger";

export const conversationResponse = {
  id: conversation.id,
  type: conversation.type,
  visibility: conversation.visibility,
  name: conversation.name,
  description: conversation.description,
  avatarUrl: conversation.avatarUrl,
  requestedBy: conversation.requestedBy,
  pingStatus: conversation.pingStatus,
  lastMessageAt: conversation.lastMessageAt,
  createdAt: conversation.createdAt,
};

class ConversationsRepository {
  constructor(
    private readonly db: typeof dBinstance,
    private readonly conversationsTable: typeof conversation,
    private readonly conversation_participants: typeof conversationParticipants,
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
  ): Promise<IConversation | null> {
    const [result] = await this.db
      .update(this.conversationsTable)
      .set({
        pingStatus: data.pingStatus,
        requestedBy: data.requestedBy,
      })
      .where(eq(this.conversationsTable.id, conversationId))
      .returning();

    return result ?? null;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    // Add your database delete logic here
    throw new Error("Method not implemented");
  }
}

export default ConversationsRepository;
