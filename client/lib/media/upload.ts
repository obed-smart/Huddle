import { presignUploads, type Presign, type PresignInput } from "@/lib/api/media";
import { baseMime, type ServerKind } from "./policy";

export type UploadInput = { file: File; kind: ServerKind };
export type UploadResult =
  | { ok: true; index: number; objectKey: string; mime: string; kind: ServerKind }
  | { ok: false; index: number; error: string; mime: string; kind: ServerKind };

/**
 * Move files to R2 the presigned-URL way: one batch presign, then a PUT of each
 * file straight to its URL (browser → R2, never through our server). Resilient
 * on purpose (allSettled + one retry) so one failure does not sink the batch.
 */
export async function uploadFiles(items: UploadInput[], attempts = 2): Promise<UploadResult[]> {
  const results = new Array<UploadResult>(items.length);
  let pending = items.map((item, index) => ({ item, index }));

  for (let attempt = 1; attempt <= attempts && pending.length; attempt += 1) {
    const metas: PresignInput[] = pending.map((p) => ({
      kind: p.item.kind,
      mime: baseMime(p.item.file),
      size: p.item.file.size,
    }));

    let presigns: Presign[];
    try {
      presigns = await presignUploads(metas);
    } catch (err) {
      const error = err instanceof Error ? err.message : "Could not reach storage";
      pending.forEach((p, k) => {
        results[p.index] = { ok: false, index: p.index, error, mime: metas[k].mime, kind: metas[k].kind };
      });
      pending = [];
      continue;
    }

    const settled = await Promise.allSettled(
      pending.map((p, k) => putOne(p.item.file, metas[k].mime, presigns[k])),
    );

    const retry: typeof pending = [];
    settled.forEach((res, k) => {
      const p = pending[k];
      const meta = metas[k];
      if (res.status === "fulfilled") {
        results[p.index] = { ok: true, index: p.index, objectKey: res.value, mime: meta.mime, kind: meta.kind };
      } else {
        const error = res.reason instanceof Error ? res.reason.message : "Upload failed";
        results[p.index] = { ok: false, index: p.index, error, mime: meta.mime, kind: meta.kind };
        retry.push(p);
      }
    });
    pending = retry;
  }

  return results;
}

/** PUT one file to its presigned URL. No credentials: the URL carries its own
    auth, and Content-Type must equal the base type it was signed with. */
async function putOne(file: File, mime: string, presign?: Presign): Promise<string> {
  if (!presign?.uploadUrl) throw new Error("Storage did not return an upload URL");
  let res: Response;
  try {
    res = await fetch(presign.uploadUrl, { method: "PUT", headers: { "Content-Type": mime }, body: file });
  } catch {
    throw new Error("Storage blocked the upload");
  }
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  if (!presign.objectKey) throw new Error("Storage did not return an object key");
  return presign.objectKey;
}
