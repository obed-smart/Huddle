"use client";

import { ArrowLeft, Phone, Video } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notify";
import type { Conversation } from "@/lib/api/types";

type Props = { conversation: Conversation; onBack: () => void };

/** The open-conversation pane. The live thread lands in the next section. */
export function ThreadPlaceholder({ conversation, onBack }: Props) {
  const subtitle =
    conversation.type === "group"
      ? `${conversation.membersCount ?? "?"} members`
      : "Direct message";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-secondary/40">
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
        <Avatar src={conversation.avatar} name={conversation.name} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{conversation.name}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
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

      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          The message thread for{" "}
          <span className="font-medium text-foreground">{conversation.name}</span>{" "}
          arrives in the next section.
        </p>
      </div>
    </div>
  );
}
