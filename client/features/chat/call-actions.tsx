"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Video, Users } from "lucide-react";

import { toast } from "@/lib/notify";
import { InfoAction } from "@/features/group-info/info-action";
import { callSession } from "@/features/call/call-session";
import { MeetCreateSheet } from "@/features/meet/meet-create-sheet";
import type { CallPeer } from "@/features/call/call-types";

type Props = {
  /** The conversation the call belongs to. */
  conversationId: string;
  /** The person to call. When absent (a group, for now), voice is still a stub. */
  peer?: CallPeer | null;
};

/** Voice, video, and meet, shown inside an info panel. Voice and video place a
    real call when we know who to ring; meet opens the new-meeting sheet, where
    you start one instantly or schedule it. */
export function CallActions({ conversationId, peer }: Props) {
  const router = useRouter();
  const [meetOpen, setMeetOpen] = useState(false);

  const place = (media: "audio" | "video") =>
    peer
      ? callSession.initiate({ conversationId, peer, media })
      : toast("Calling is coming soon.");

  function openRoom(meetId: string) {
    setMeetOpen(false);
    router.push(`/meet/${meetId}?conversationId=${encodeURIComponent(conversationId)}`);
  }

  return (
    <div className="flex items-center justify-center gap-7 border-y px-4 py-3">
      <InfoAction icon={<Phone className="size-5" />} label="Voice" onClick={() => place("audio")} />
      <InfoAction icon={<Video className="size-5" />} label="Video" onClick={() => place("video")} />
      <InfoAction icon={<Users className="size-5" />} label="Meet" onClick={() => setMeetOpen(true)} />
      <MeetCreateSheet conversationId={conversationId} open={meetOpen} onClose={() => setMeetOpen(false)} onStarted={openRoom} />
    </div>
  );
}
