import { useSession } from "@/stores/session";
import { usePeople } from "@/stores/people";
import { useCall } from "./call-store";
import { useCallStreams } from "./call-streams";
import { useCallParticipants } from "./call-participants";

/** One rectangle in the call: a person, their camera stream if we have one, and
    enough state to label it. `id` is "local" for ourselves, else their user id. */
export type Tile = {
  id: string;
  name: string;
  avatar: string | null;
  isLocal: boolean;
  stream: MediaStream | null;
  muted: boolean;
};

export const LOCAL_ID = "local";

/** Every participant the screen should draw, remotes first then ourselves. The
    remote set is the union of who the roster lists, who is sending video, and
    the original call peer, so a person shows up the moment any source knows
    them, not only once their media arrives. */
export function useCallTiles(): Tile[] {
  const me = useSession((s) => s.user);
  const call = useCall((s) => s.call);
  const local = useCallStreams((s) => s.local);
  const remotes = useCallStreams((s) => s.remotes);
  const byId = useCallParticipants((s) => s.byId);
  const present = useCallParticipants((s) => s.present);
  const directory = usePeople((s) => s.byId);
  if (!call) return [];

  const myId = me?.id;
  const peer = call.peer;
  const ids = new Set<string>();
  for (const id of present) if (id !== myId) ids.add(id);
  for (const r of remotes) if (r.kind === "cam" && r.userId !== myId) ids.add(r.userId);
  // In a group the "peer" is the conversation itself, not a participant, so it
  // only stands in for the other person on a one to one call.
  if (peer.id && peer.id !== myId && peer.id !== call.conversationId) ids.add(peer.id);

  const camOf = (id: string) => remotes.find((r) => r.kind === "cam" && r.userId === id)?.stream ?? null;
  const remoteTiles: Tile[] = [...ids]
    .sort()
    .map((id) => {
      const meta = byId[id];
      const person = directory[id];
      const isPeer = id === peer.id;
      return {
        id,
        name: meta?.name || person?.displayName || person?.username || (isPeer ? peer.name : ""),
        avatar: meta?.avatar ?? person?.avatarUrl ?? (isPeer ? peer.avatar ?? null : null),
        isLocal: false,
        stream: camOf(id),
        muted: meta ? !meta.audioOn : false,
      };
    });

  // Only show our own feed when it actually carries a camera: on an audio call
  // the local stream is mic-only, and a video element bound to it is just black.
  const haveCam = !!local && local.getVideoTracks().length > 0;
  const localTile: Tile = {
    id: LOCAL_ID,
    name: me?.displayName || me?.username || "You",
    avatar: me?.avatarUrl ?? null,
    isLocal: true,
    stream: call.camOn && haveCam ? local : null,
    muted: call.muted,
  };

  return [...remoteTiles, localTile];
}

/** True once a call has two or more other people on it: the point where the
    grid replaces the one to one stage, for audio and video alike. */
export function useIsGroup(): boolean {
  return useCallTiles().filter((t) => !t.isLocal).length >= 2;
}
