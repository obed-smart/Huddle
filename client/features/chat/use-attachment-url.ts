"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAttachmentUrl } from "@/lib/api/media";
import type { Attachment } from "@/lib/messages/types";

/**
 * The best URL to render an attachment from: the one it carried (a local object
 * URL, or the server's signed URL), falling back to a freshly-signed URL when
 * the carried one is missing or fails to load (signed URLs expire in minutes).
 *
 * `enabled` gates the whole thing: received media stays "not downloaded" until
 * the viewer taps it, so nothing is fetched from storage on load. While it is
 * false the hook does no work and returns an empty `src`.
 */
export function useAttachmentUrl(attachment: Attachment, enabled = true) {
  const carried = attachment.url || attachment.remoteUrl || "";
  const [fresh, setFresh] = useState("");
  const tried = useRef(false);

  const refresh = useCallback(() => {
    if (!enabled || tried.current || attachment.localOnly || !attachment.id) return;
    tried.current = true;
    fetchAttachmentUrl(attachment.id)
      .then((url) => {
        if (url) setFresh(url);
      })
      .catch(() => {
        // Leave the broken state; the bubble still shows the file name.
      });
  }, [enabled, attachment.id, attachment.localOnly]);

  // Once enabled, media whose payload carried no URL needs one before it loads.
  useEffect(() => {
    if (!enabled || carried || attachment.localOnly || !attachment.id) return;
    let cancelled = false;
    fetchAttachmentUrl(attachment.id)
      .then((url) => {
        if (!cancelled && url) setFresh(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, carried, attachment.localOnly, attachment.id]);

  return { src: enabled ? fresh || carried : "", onError: refresh };
}
