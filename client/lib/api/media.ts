import { request } from "./http";
import type { Presign, PresignInput } from "@/lib/contracts";

export type { Presign, PresignInput };

/**
 * Ask the server to sign a short-lived PUT URL per file. The server holds the
 * R2 credentials; the browser never sees a secret. One batch, signed in
 * parallel, returned in input order.
 */
export async function presignUploads(files: PresignInput[]): Promise<Presign[]> {
  const data = await request<unknown>("/api/v1/media/presigned", {
    method: "POST",
    body: JSON.stringify({ files }),
  });
  const list = Array.isArray(data) ? data : [];
  return list.map((e) => {
    const entry = (e ?? {}) as Partial<Presign>;
    return {
      uploadUrl: entry.uploadUrl ?? null,
      objectKey: entry.objectKey ?? null,
      expiresIn: entry.expiresIn ?? null,
    };
  });
}

/**
 * A fresh signed GET URL for an already-stored attachment, by its id. The URL a
 * message carries expires (~5 min), so this is asked when the bytes need to
 * load and the carried URL is missing or stale.
 */
export async function fetchAttachmentUrl(attachmentId: string): Promise<string | null> {
  const data = await request<{ url?: string } | null>(
    `/api/v1/media/${encodeURIComponent(attachmentId)}/url`,
  );
  return data?.url ?? null;
}
