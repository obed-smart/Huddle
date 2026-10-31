import { FileText, Play } from "lucide-react";

import { MESSAGE_TYPES, type Attachment } from "@/lib/messages/types";

function formatSize(bytes: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** One attachment inside a bubble: a thumbnail for media, a chip for a file. */
export function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const src = attachment.url || attachment.remoteUrl || "";

  if (attachment.type === MESSAGE_TYPES.IMAGE && src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={attachment.name} className="max-h-72 w-full rounded-lg object-cover" />;
  }

  if (attachment.type === MESSAGE_TYPES.VIDEO && src) {
    return <video src={src} controls className="max-h-72 w-full rounded-lg" />;
  }

  if (attachment.type === MESSAGE_TYPES.AUDIO && src) {
    return <audio src={src} controls className="w-full" />;
  }

  return (
    <a
      href={src || undefined}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-lg bg-background/60 p-2.5 text-left transition-colors hover:bg-background"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        {attachment.type === MESSAGE_TYPES.VIDEO ? <Play className="size-4" /> : <FileText className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{attachment.name}</span>
        {attachment.size ? (
          <span className="block text-xs text-muted-foreground">{formatSize(attachment.size)}</span>
        ) : null}
      </span>
    </a>
  );
}
