"use client";

import { FileText, Music, Play, X } from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import type { StagedItem } from "@/lib/media/staged";
import type { ServerKind } from "@/lib/media/policy";

const ICONS: Partial<Record<ServerKind, typeof FileText>> = {
  video: Play,
  voice: Music,
  file: FileText,
};

function sizeLabel(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type Props = { items: StagedItem[]; onRemove: (id: string) => void };

/** The row of chosen-but-unsent files above the composer input. */
export function StagedTray({ items, onRemove }: Props) {
  if (items.length === 0) return null;

  return (
    <AttachmentGroup className="px-1 pt-1">
      {items.map((s) => {
        const isImage = s.kind === "image";
        const Icon = ICONS[s.kind] ?? FileText;
        return (
          <Attachment key={s.id} state="idle" size="sm" orientation={isImage ? "vertical" : "horizontal"}>
            {isImage ? (
              <AttachmentMedia variant="image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={s.file.name} />
              </AttachmentMedia>
            ) : (
              <>
                <AttachmentMedia variant="icon">
                  <Icon />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{s.file.name}</AttachmentTitle>
                  <AttachmentDescription>{sizeLabel(s.file.size)}</AttachmentDescription>
                </AttachmentContent>
              </>
            )}
            <AttachmentActions>
              <AttachmentAction aria-label={`Remove ${s.file.name}`} onClick={() => onRemove(s.id)}>
                <X />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        );
      })}
    </AttachmentGroup>
  );
}
