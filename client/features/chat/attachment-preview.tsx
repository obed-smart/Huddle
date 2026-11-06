"use client";

import { MESSAGE_TYPES, type Attachment as Att } from "@/lib/messages/types";
import { AudioAttachment } from "./attachment-audio";
import { ImageAttachment } from "./attachment-image";
import { VideoAttachment } from "./attachment-video";
import { FileAttachment } from "./attachment-file";

/** One attachment in a bubble, routed to the renderer for its kind. Each one
    handles its own on-demand download, so nothing is fetched from storage until
    the viewer taps it. */
export function ChatAttachment({ attachment, mine }: { attachment: Att; mine: boolean }) {
  switch (attachment.type) {
    case MESSAGE_TYPES.AUDIO:
      return <AudioAttachment attachment={attachment} mine={mine} />;
    case MESSAGE_TYPES.IMAGE:
      return <ImageAttachment attachment={attachment} mine={mine} />;
    case MESSAGE_TYPES.VIDEO:
      return <VideoAttachment attachment={attachment} mine={mine} />;
    default:
      return <FileAttachment attachment={attachment} mine={mine} />;
  }
}
