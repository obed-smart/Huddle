"use client";

import { FileText, Music, Play } from "lucide-react";

import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { MESSAGE_TYPES, type Attachment as Att, type MessageType } from "@/lib/messages/types";
import { useAttachmentUrl } from "./use-attachment-url";

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

const ICONS: Partial<Record<MessageType, typeof FileText>> = {
  [MESSAGE_TYPES.VIDEO]: Play,
  [MESSAGE_TYPES.AUDIO]: Music,
  [MESSAGE_TYPES.FILE]: FileText,
};

/** One attachment inside a bubble, built on the ChatCN Attachment component. */
export function ChatAttachment({ attachment }: { attachment: Att }) {
  const { src, onError } = useAttachmentUrl(attachment);
  const isImage = attachment.type === MESSAGE_TYPES.IMAGE && Boolean(src);
  const Icon = ICONS[attachment.type] || FileText;
  const kind = attachment.type.charAt(0).toUpperCase() + attachment.type.slice(1);
  const meta = [kind, formatSize(attachment.size)].filter(Boolean).join(" · ");

  return (
    <Attachment state="done" orientation={isImage ? "vertical" : "horizontal"}>
      {isImage ? (
        <AttachmentMedia variant="image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={attachment.name} onError={onError} />
        </AttachmentMedia>
      ) : (
        <>
          <AttachmentMedia variant="icon">
            <Icon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{attachment.name}</AttachmentTitle>
            {meta ? <AttachmentDescription>{meta}</AttachmentDescription> : null}
          </AttachmentContent>
        </>
      )}

      {src ? (
        <AttachmentTrigger asChild>
          <a href={src} target="_blank" rel="noreferrer" aria-label={`Open ${attachment.name}`} />
        </AttachmentTrigger>
      ) : null}
    </Attachment>
  );
}
