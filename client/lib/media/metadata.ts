import type { ServerKind } from "./policy";

export type MediaMeta = { width?: number; height?: number; duration?: number };

/** Positive ints only, to match the server's attachment schema; drop the rest. */
function sanitize(raw: { width?: number; height?: number; duration?: number }): MediaMeta {
  const out: MediaMeta = {};
  if (Number.isFinite(raw.width) && raw.width! > 0) out.width = Math.round(raw.width!);
  if (Number.isFinite(raw.height) && raw.height! > 0) out.height = Math.round(raw.height!);
  if (Number.isFinite(raw.duration) && raw.duration! >= 0) out.duration = Math.round(raw.duration!);
  return out;
}

function withUrl(file: File, make: (url: string) => Promise<MediaMeta>): Promise<MediaMeta> {
  const url = URL.createObjectURL(file);
  return make(url).finally(() => URL.revokeObjectURL(url));
}

function imageDimensions(file: File): Promise<MediaMeta> {
  return withUrl(file, (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({});
      img.src = url;
    }),
  );
}

function mediaElement(tag: "video" | "audio", file: File): Promise<MediaMeta> {
  return withUrl(file, (url) =>
    new Promise((resolve) => {
      const el = document.createElement(tag);
      el.preload = "metadata";
      el.onloadedmetadata = () =>
        resolve(
          tag === "video"
            ? { width: (el as HTMLVideoElement).videoWidth, height: (el as HTMLVideoElement).videoHeight, duration: el.duration }
            : { duration: el.duration },
        );
      el.onerror = () => resolve({});
      el.src = url;
    }),
  );
}

/** The dimensions/duration a kind of file carries, read in the browser so the
    server need not decode the bytes. Best-effort: metadata failures are empty. */
export async function describeMedia(file: File, kind: ServerKind): Promise<MediaMeta> {
  try {
    if (kind === "image") return sanitize(await imageDimensions(file));
    if (kind === "video") return sanitize(await mediaElement("video", file));
    if (kind === "voice") return sanitize(await mediaElement("audio", file));
  } catch {
    // Metadata is an optimization, never a reason to block a send.
  }
  return {};
}
