"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAttachmentUrl } from "@/lib/api/media";
import type { Attachment } from "@/lib/messages/types";

/**
 * The best URL to render an attachment from: the one it carried (a local object
 * URL, or the server's signed URL), falling back to a freshly-signed URL when
 * the carried one is missing or fails to load (signed URLs expire in minutes).
 *
 * `fresh || carried` means the local object URL shows instantly on send, and
 * the server's signed URL takes over once the echo merges it in.
 */
export function useAttachmentUrl(attachment: Attachment) {
  const carried = attachment.url || attachment.remoteUrl || "";
  const [fresh, setFresh] = useState("");
  const tried = useRef(false);

  const refresh = useCallback(() => {
    if (tried.current || attachment.localOnly || !attachment.id) return;
    tried.current = true;
    fetchAttachmentUrl(attachment.id)
      .then((url) => {
        if (url) setFresh(url);
      })
      .catch(() => {
        // Leave the broken state; the bubble still shows the file name.
      });
  }, [attachment.id, attachment.localOnly]);

  // Received media whose payload carried no URL needs one before it can load.
  useEffect(() => {
    if (carried || attachment.localOnly || !attachment.id) return;
    let cancelled = false;
    fetchAttachmentUrl(attachment.id)
      .then((url) => {
        if (!cancelled && url) setFresh(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [carried, attachment.localOnly, attachment.id]);

  return { src: fresh || carried, onError: refresh };
}
