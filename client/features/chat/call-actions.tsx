"use client";

import { Phone, Video, Users } from "lucide-react";

import { toast } from "@/lib/notify";
import { InfoAction } from "@/features/group-info/info-action";
import { callSession } from "@/features/call/call-session";
import type { CallPeer } from "@/features/call/call-types";

type Props = {
  /** The conversation the call belongs to. */
  conversationId: string;
  /** The person to call. When absent (a group, for now), voice is still a stub. */
  peer?: CallPeer | null;
};

/** Voice, video, and meet, shown inside an info panel. Voice places a real
    audio call when we know who to ring; video and meet land next. */
export function CallActions({ conversationId, peer }: Props) {
  const onVoice = peer
    ? () => callSession.initiate({ conversationId, peer, media: "audio" })
    : () => toast("Calling is coming soon.");

  return (
    <div className="flex items-center justify-center gap-7 border-y px-4 py-3">
      <InfoAction icon={<Phone className="size-5" />} label="Voice" onClick={onVoice} />
      <InfoAction icon={<Video className="size-5" />} label="Video" onClick={() => toast("Video is coming soon.")} />
      <InfoAction icon={<Users className="size-5" />} label="Meet" onClick={() => toast("Meet is coming soon.")} />
    </div>
  );
}
