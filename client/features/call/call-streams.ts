import { create } from "zustand";

/** A remote track as a playable stream, tagged with who and what it is. */
export type RemoteStream = { userId: string; kind: string; stream: MediaStream };

/**
 * The live MediaStreams of the current call, kept out of the call snapshot
 * because they are heavy objects that change for reasons the snapshot does not
 * care about. The call session writes them; the video screen reads them.
 */
type StreamsStore = {
  local: MediaStream | null;
  remotes: RemoteStream[];
  setLocal: (stream: MediaStream | null) => void;
  upsertRemote: (remote: RemoteStream) => void;
  removeRemote: (userId: string, kind: string) => void;
  clear: () => void;
};

const keyOf = (userId: string, kind: string) => `${userId}:${kind}`;

export const useCallStreams = create<StreamsStore>((set) => ({
  local: null,
  remotes: [],
  setLocal: (local) => set({ local }),
  upsertRemote: (remote) =>
    set((s) => {
      const key = keyOf(remote.userId, remote.kind);
      const rest = s.remotes.filter((r) => keyOf(r.userId, r.kind) !== key);
      return { remotes: [...rest, remote] };
    }),
  removeRemote: (userId, kind) =>
    set((s) => ({ remotes: s.remotes.filter((r) => keyOf(r.userId, r.kind) !== keyOf(userId, kind)) })),
  clear: () => set({ local: null, remotes: [] }),
}));
