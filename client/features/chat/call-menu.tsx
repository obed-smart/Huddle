"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Phone, Video, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { callSession } from "@/features/call/call-session";
import { MeetCreateSheet } from "@/features/meet/meet-create-sheet";
import type { Conversation } from "@/lib/api/types";

/** The one entry point for reaching people in a conversation: a voice call, a
    video call, or a meeting (instant or scheduled). One button, one menu, used
    by direct chats and groups alike. For a group the call peer is the group
    itself and the backend rings every member. */
export function CallMenu({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [meetOpen, setMeetOpen] = useState(false);

  const otherId = conversation.otherUserId ?? null;
  const peer = { id: otherId ?? conversation.id, name: conversation.name, avatar: conversation.avatar };

  function place(media: "audio" | "video") {
    setOpen(false);
    callSession.initiate({ conversationId: conversation.id, peer, media });
  }
  function openRoom(meetId: string) {
    setMeetOpen(false);
    router.push(`/meet/${meetId}?conversationId=${encodeURIComponent(conversation.id)}`);
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label="Call or meet" onClick={() => setOpen((o) => !o)}>
        <Phone />
      </Button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
            <Item icon={<Phone className="size-4" />} label="Voice call" onClick={() => place("audio")} />
            <Item icon={<Video className="size-4" />} label="Video call" onClick={() => place("video")} />
            <Item icon={<Users className="size-4" />} label="Meeting" onClick={() => { setOpen(false); setMeetOpen(true); }} />
          </div>
        </>
      ) : null}

      <MeetCreateSheet conversationId={conversation.id} open={meetOpen} onClose={() => setMeetOpen(false)} onStarted={openRoom} />
    </div>
  );
}

function Item({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-secondary"
    >
      {icon}
      {label}
    </button>
  );
}
