"use client";

import { useState } from "react";
import { Mic, Loader2 } from "lucide-react";

import type { Attachment as Att } from "@/lib/messages/types";
import { useAttachmentUrl } from "./use-attachment-url";
import { VoiceNote } from "./voice-note";
import { Card, LoadButton } from "./attachment-ui";

/** A voice note. Received notes arrive not downloaded (a card with a download
    control) and become the inline player once loaded. */
export function AudioAttachment({ attachment, mine }: { attachment: Att; mine: boolean }) {
  const ready = mine || attachment.localOnly;
  const [loaded, setLoaded] = useState(ready);
  const { src } = useAttachmentUrl(attachment, loaded);

  if (!loaded) {
    return (
      <Card
        icon={<Mic className="size-5" />}
        title={attachment.name}
        meta="Voice note"
        mine={mine}
        action={<LoadButton loading={false} onLoad={() => setLoaded(true)} dark={mine} />}
      />
    );
  }

  return src ? (
    <VoiceNote src={src} duration={attachment.durationSeconds} mine={mine} />
  ) : (
    <Card icon={<Loader2 className="size-5 animate-spin" />} title={attachment.name} meta="Voice note" mine={mine} />
  );
}
