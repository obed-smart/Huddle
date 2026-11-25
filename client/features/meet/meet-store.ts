import { create } from "zustand";

/** One remote person in the meet. The local participant is not here: their
    stream and flags live at the top level so toggles are a single write. */
export type MeetParticipant = {
  id: string;
  name: string;
  avatar: string | null;
  stream: MediaStream | null;
  micOn: boolean;
  camOn: boolean;
};

/** A reaction in flight: it floats up from the controls and removes itself. */
export type MeetReaction = { id: string; emoji: string; by: string };

type Panel = "none" | "people" | "chat";

type MeetState = {
  /** The lobby is the pre-join screen; joined is the live room. */
  phase: "lobby" | "joined";
  title: string;
  mic: boolean;
  cam: boolean;
  sharing: boolean;
  panel: Panel;
  /** A participant tapped to fill the stage, or null for the default pick. */
  pinnedId: string | null;
  /** Epoch ms we joined the room, for the header timer. */
  joinedAt: number | null;
  local: MediaStream | null;
  remotes: MeetParticipant[];
  reactions: MeetReaction[];
  setTitle: (title: string) => void;
  join: () => void;
  setLocal: (stream: MediaStream | null) => void;
  setMic: (on: boolean) => void;
  setCam: (on: boolean) => void;
  setSharing: (on: boolean) => void;
  togglePanel: (panel: Exclude<Panel, "none">) => void;
  setPanel: (panel: Panel) => void;
  setPinned: (id: string | null) => void;
  upsertRemote: (p: MeetParticipant) => void;
  removeRemote: (id: string) => void;
  react: (emoji: string, by?: string) => void;
  dropReaction: (id: string) => void;
  reset: () => void;
};

const base = {
  phase: "lobby" as const,
  title: "Meeting",
  mic: true,
  cam: true,
  sharing: false,
  panel: "none" as Panel,
  pinnedId: null,
  joinedAt: null,
  local: null,
  remotes: [] as MeetParticipant[],
  reactions: [] as MeetReaction[],
};

export const useMeet = create<MeetState>((set) => ({
  ...base,
  setTitle: (title) => set({ title }),
  join: () => set({ phase: "joined", joinedAt: Date.now() }),
  setLocal: (local) => set({ local }),
  setMic: (mic) => set({ mic }),
  setCam: (cam) => set({ cam }),
  setSharing: (sharing) => set({ sharing }),
  togglePanel: (panel) => set((s) => ({ panel: s.panel === panel ? "none" : panel })),
  setPanel: (panel) => set({ panel }),
  setPinned: (pinnedId) => set({ pinnedId }),
  upsertRemote: (p) =>
    set((s) => ({ remotes: [...s.remotes.filter((r) => r.id !== p.id), p] })),
  removeRemote: (id) =>
    set((s) => ({ remotes: s.remotes.filter((r) => r.id !== id), pinnedId: s.pinnedId === id ? null : s.pinnedId })),
  react: (emoji, by = "You") =>
    set((s) => ({ reactions: [...s.reactions, { id: `${Date.now()}-${Math.random()}`, emoji, by }] })),
  dropReaction: (id) => set((s) => ({ reactions: s.reactions.filter((r) => r.id !== id) })),
  reset: () => set(base),
}));
