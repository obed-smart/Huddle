import { and, eq, isNull } from "drizzle-orm";
import { db as dbInstance } from "../../db";
import {
  attachmentsTable,
  conversationParticipants,
  messagesTable,
} from "../../db/schema";
import logger from "../../shared/utils/logger";
import AppError from "../../shared/utils/apiError";

class MediaRepository {
  constructor(
    private readonly db: typeof dbInstance,
    private readonly attachment: typeof attachmentsTable,
    private readonly message: typeof messagesTable,
    private readonly participant: typeof conversationParticipants,
  ) {}

  async getMessageAttachmentUrl(attachmentId: string, userId: string) {
    try {
      const [attachment] = await this.db
        .select({
          objectKey: this.attachment.objectKey,
        })
        .from(this.attachment)
        .innerJoin(this.message, eq(this.message.id, this.attachment.messageId))
        .innerJoin(
          this.participant,
          and(
            eq(this.participant.conversationId, this.message.conversationId),
            eq(this.participant.userId, userId),
          ),
        )
        .where(
          and(
            eq(this.attachment.id, attachmentId),
            eq(this.attachment.status, "ready"),
            isNull(this.message.deletedAt),
          ),
        )
        .limit(1);

      return attachment ?? null;
    } catch (error) {
      logger.error({ error }, "Failed getting attachment url");
      throw new AppError("Failed getting attachment url", 500);
    }
  }
}

export default MediaRepository;
