"use client";

import { Phone, Video, Users } from "lucide-react";

import { toast } from "@/lib/notify";
import { InfoAction } from "@/features/group-info/info-action";

/** Voice, video, and meet, shown inside an info panel. Calling is not built
    yet, so each one says so for now; this is where the real call flow lands. */
export function CallActions() {
  return (
    <div className="flex items-center justify-center gap-7 border-y px-4 py-3">
      <InfoAction icon={<Phone className="size-5" />} label="Voice" onClick={() => toast("Calling is coming soon.")} />
      <InfoAction icon={<Video className="size-5" />} label="Video" onClick={() => toast("Video is coming soon.")} />
      <InfoAction icon={<Users className="size-5" />} label="Meet" onClick={() => toast("Meet is coming soon.")} />
    </div>
  );
}
