import { useMeet, type MeetParticipant } from "./meet-store";
import type { RosterParticipant } from "./signaling/types";

/** Names and avatars for the meet's remote participants, by userId, so a tile
    can be labelled before (or without) their media. */
const names = new Map<string, { name: string; avatar: string | null }>();

/** Fold a roster (from the join ack, a reconnect, or a single join) into the
    store: record names and show everyone, with their last known mic/camera. */
export function applyRoster(ps: RosterParticipant[], myId: string) {
  for (const p of ps) {
    if (p.userId === myId) continue;
    names.set(p.userId, { name: p.username, avatar: p.avatarUrl ?? null });
    putRemote(p.userId, { micOn: p.audioOn ?? true, camOn: p.videoOn ?? !!p.tracks?.cam });
  }
}

/** Merge a change into a remote participant, keeping their existing stream. */
export function putRemote(userId: string, patch: Partial<MeetParticipant>) {
  const prev = useMeet.getState().remotes.find((r) => r.id === userId);
  const known = names.get(userId);
  useMeet.getState().upsertRemote({
    id: userId,
    name: patch.name ?? prev?.name ?? known?.name ?? "",
    avatar: patch.avatar ?? prev?.avatar ?? known?.avatar ?? null,
    stream: patch.stream !== undefined ? patch.stream : prev?.stream ?? null,
    micOn: patch.micOn ?? prev?.micOn ?? true,
    camOn: patch.camOn ?? prev?.camOn ?? false,
  });
}

export function dropRemote(userId: string) {
  names.delete(userId);
  useMeet.getState().removeRemote(userId);
}

export function clearRoster() {
  names.clear();
}
