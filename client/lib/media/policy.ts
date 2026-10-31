/** Mirrors the server's media policy (media.policy.ts). The server is still the
    gate; this lets the picker offer, and the client reject, only what will sign. */

export const MEDIA_POLICY = {
  voice: { maxBytes: 16 * 1024 * 1024, mimes: ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"] },
  image: { maxBytes: 10 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"] },
  video: { maxBytes: 100 * 1024 * 1024, mimes: ["video/mp4", "video/quicktime", "video/webm"] },
  file: { maxBytes: 25 * 1024 * 1024, mimes: ["application/pdf"] },
} as const;

export type ServerKind = keyof typeof MEDIA_POLICY;

export const MAX_FILES = 10;
export const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

/** The composer's media options, each mapped to a server kind and an accept
    filter. "Photo" uses image/* so the picker opens the gallery directly; the
    chosen file is still validated against the policy. "File" is PDF only. */
export const PICKERS: { key: string; label: string; kind: ServerKind; accept: string; multiple: boolean }[] = [
  { key: "photo", label: "Photo", kind: "image", accept: "image/*", multiple: true },
  { key: "video", label: "Video", kind: "video", accept: "video/*", multiple: true },
  { key: "audio", label: "Audio", kind: "voice", accept: "audio/*", multiple: false },
  { key: "file", label: "File", kind: "file", accept: "application/pdf", multiple: true },
];

const LABELS: Record<ServerKind, string> = { voice: "Audio", image: "Image", video: "Video", file: "PDF" };

/** MIME without any ";codecs=…" — the presign signature and the PUT
    Content-Type are for the base type (e.g. "audio/webm", not with codecs). */
export function baseMime(file: File): string {
  return (file.type || "application/octet-stream").split(";")[0].trim();
}

function humanSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${Math.round(mb)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** Why this file cannot be sent as this kind, or null when it is allowed. */
export function validateFile(file: File, kind: ServerKind): string | null {
  const policy = MEDIA_POLICY[kind];
  const mime = baseMime(file);
  if (!(policy.mimes as readonly string[]).includes(mime)) {
    return `${LABELS[kind]} must be ${policy.mimes.map((m) => m.split("/")[1]).join(", ")}.`;
  }
  if (file.size > policy.maxBytes) {
    return `${LABELS[kind]} files must be under ${humanSize(policy.maxBytes)}.`;
  }
  return null;
}
