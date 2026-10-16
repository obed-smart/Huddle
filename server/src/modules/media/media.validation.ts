import z from "zod";
import { MEDIA_POLICY } from "./media.policy";
import { MediaKind } from "./media.services";

export const getUrlSchema = z.object({
  id: z.uuid(),
});

export const MAX_FILES_PER_MESSAGE = 10;
export const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

const mediaKinds = Object.keys(MEDIA_POLICY) as [MediaKind, ...MediaKind[]];

const uploadFileSchema = z
  .object({
    kind: z.enum(mediaKinds),
    mime: z.string().min(1),
    size: z.number().int().positive(),
  })
  .superRefine((file, ctx) => {
    const policy = MEDIA_POLICY[file.kind];

    if (!(policy.mimes as readonly string[]).includes(file.mime)) {
      ctx.addIssue({
        code: "custom",
        path: ["mime"],
        message: `mime type ${file.mime} is not allowed for ${file.kind}`,
      });
    }

    if (file.size > policy.maxBytes) {
      ctx.addIssue({
        code: "custom",
        path: ["size"],
        message: `file size ${file.size} exceeds the maximum of ${policy.maxBytes} bytes for ${file.kind}`,
      });
    }
  });

export const presignRequestSchema = z
  .object({
    files: z.array(uploadFileSchema).min(1).max(MAX_FILES_PER_MESSAGE),
  })
  .superRefine(({ files }, ctx) => {
    if (files.length > 1 && files.some((f) => f.kind === "voice")) {
      ctx.addIssue({
        code: "custom",
        path: ["files"],
        message: "A voice note must be a single file",
      });
    }

    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      ctx.addIssue({
        code: "custom",
        path: ["files"],
        message: "Total upload size is too large",
      });
    }
  });

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
