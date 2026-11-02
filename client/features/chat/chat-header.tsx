"use client";

import { ArrowLeft, Phone, Video } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notify";
import type { Conversation } from "@/lib/api/types";

type Props = { conversation: Conversation; onBack: () => void; onOpenInfo?: () => void };

/** The open-conversation header: who you are talking to, plus call actions.
    Tapping a group's name/avatar opens its info screen. */
export function ChatHeader({ conversation, onBack, onOpenInfo }: Props) {
  const isGroup = conversation.type === "group";
  const subtitle = isGroup ? `${conversation.membersCount ?? "?"} members` : "Direct message";
  const canOpenInfo = isGroup && Boolean(onOpenInfo);

  return (
    <header className="glass flex items-center gap-3 border-b px-3 py-3 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Back to conversations"
        onClick={onBack}
      >
        <ArrowLeft />
      </Button>
      <button
        type="button"
        onClick={canOpenInfo ? onOpenInfo : undefined}
        disabled={!canOpenInfo}
        aria-label={canOpenInfo ? "Group info" : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors enabled:hover:bg-secondary/60 disabled:cursor-default"
      >
        <Avatar src={conversation.avatar} name={conversation.name} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{conversation.name}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Start a call"
        onClick={() => toast("Calling is coming soon.")}
      >
        <Phone />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Start a video call"
        onClick={() => toast("Video is coming soon.")}
      >
        <Video />
      </Button>
    </header>
  );
}
