import { randomUUID } from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { R2 } from "../../config/object.storage";

import AppError from "../../shared/utils/apiError";
import MediaRepository from "./media.repository";
import env from "../../config/env";
import logger from "../../shared/utils/logger";
import { MEDIA_POLICY } from "./media.policy";
import { conversationService } from "../conversations/conversations.modules";
import { UploadFileInput } from "./media.validation";

const PRESIGNED_TTL_SECONDS = 60 * 5;

export type MediaKind = keyof typeof MEDIA_POLICY;

class MediaService {
  constructor(private readonly mediaRepo: MediaRepository) {}

  private async presignOne(userId: string, file: UploadFileInput) {
    const objectKey = `huddle/${file.kind}/${userId}/${randomUUID()}/${Date.now()}`;

    const uploadUrl = await getSignedUrl(
      R2,
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: objectKey,
        ContentType: file.mime,
      }),
      { expiresIn: PRESIGNED_TTL_SECONDS },
    );

    return { uploadUrl, objectKey, expiresIn: PRESIGNED_TTL_SECONDS };
  }

  async getPresignedUrls(userId: string, files: UploadFileInput[]) {
    return Promise.all(files.map((f) => this.presignOne(userId, f)));
  }

  async signAttachmenturl(objectKey: string) {
    const url = await getSignedUrl(
      R2,
      new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: objectKey,
      }),
      { expiresIn: PRESIGNED_TTL_SECONDS },
    );

    return {
      url,
      expiresIn: PRESIGNED_TTL_SECONDS,
    };
  }

  async verifyR2Upload(objectKey: string) {
    try {
      const head = await R2.send(
        new HeadObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: objectKey }),
      );

      return {
        size: head.ContentLength || 0,
        contentType: head.ContentType,
        etag: head.ETag,
      };
    } catch (error) {
      logger.error({ error }, "Not matching objectKey");
      throw new AppError("Not matching objectKey", 500);
    }
  }

  async getMessageAttachmentUrl(attachmentId: string, userId: string) {
    const attachment = await this.mediaRepo.getMessageAttachmentUrl(
      attachmentId,
      userId,
    );

    if (!attachment) throw new AppError("Media not found", 404);

    const signedUrl = this.signAttachmenturl(attachment.objectKey);

    return signedUrl;
  }
}

export default MediaService;
