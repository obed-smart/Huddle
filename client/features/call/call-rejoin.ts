import { useSession } from "@/stores/session";
import type { CallMedia, CallPeer } from "./call-types";
import type { RosterEvt } from "./signaling/types";

/** Work out, from a reconnect roster, who we are talking to and what kind of
    call it is, so a dropped client can rebuild the call it is already back in.
    The roster carries no call type, so we read it from the tracks: anyone
    sending a camera (or marked video-on) means a video call. Returns null when
    there is no self id yet, or no other participant to show as the peer. */
export function rosterInfo(d: RosterEvt): { peer: CallPeer; media: CallMedia; startedAt: number | null } | null {
  const me = useSession.getState().user?.id;
  if (!me) return null;
  const others = d.participants.filter((p) => p.userId !== me);
  const peer = others[0];
  if (!peer) return null;
  const media: CallMedia = others.some((p) => p.videoOn || !!p.tracks?.cam) ? "video" : "audio";
  const startedAt = typeof d.startedAt === "number" ? d.startedAt : d.startedAt ? Date.parse(d.startedAt) || null : null;
  return { peer: { id: peer.userId, name: peer.username, avatar: peer.avatarUrl ?? null }, media, startedAt };
}
